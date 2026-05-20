import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminAddBooking,
  type BookingMode,
  type BookingType,
  type StoredBooking,
} from "@/lib/bookingStore";
import { COACHES } from "@/lib/coachData";
import { getAllPlayers, getRankTier } from "@/lib/tournamentStore";
import { cn } from "@/lib/utils";

import { useAdminCourts } from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (bookingId: string) => void;
}

const generateBookingId = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `bk_${ts}${rand}`;
};

const NewBookingDialog = ({ open, onOpenChange, onCreated }: NewBookingDialogProps) => {
  const courts = useAdminCourts();
  const allPlayers = useMemo(() => getAllPlayers(), []);

  const [type, setType] = useState<BookingType>("court");
  const [targetId, setTargetId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [mode, setMode] = useState<BookingMode>("standard");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setType("court");
      setTargetId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setPrice("");
      setUserId(undefined);
      setMemberPopoverOpen(false);
      setMode("standard");
      setSubmitting(false);
    }
  }, [open]);

  // Auto-suggest price when target + type change
  useEffect(() => {
    if (!targetId) return;
    if (type === "court") {
      const c = courts.find((x) => x.id === targetId);
      if (c) setPrice(String(c.price));
    } else {
      const co = COACHES.find((x) => x.id === targetId);
      if (co) setPrice(String(co.pricePerHour));
    }
  }, [targetId, type, courts]);

  const targetOptions = useMemo(() => {
    if (type === "court") {
      return courts.map((c) => ({ value: c.id, label: `${c.name} / ${c.courtName}` }));
    }
    return COACHES.map((c) => ({ value: c.id, label: `${c.name} (${c.level})` }));
  }, [type, courts]);

  const selectedMember = useMemo(
    () => (userId ? allPlayers.find((p) => p.userId === userId) : undefined),
    [userId, allPlayers],
  );

  const priceNumber = Number.parseInt(price, 10);
  const canSubmit =
    !!targetId &&
    !!date &&
    !!startTime &&
    !!endTime &&
    !Number.isNaN(priceNumber) &&
    priceNumber >= 0 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const id = generateBookingId();
    const base: StoredBooking = {
      id,
      type,
      userId,
      date,
      startTime,
      endTime,
      status: "upcoming",
      totalPrice: priceNumber,
      createdAt: new Date().toISOString(),
    };

    if (type === "court") {
      const c = courts.find((x) => x.id === targetId);
      if (c) {
        base.courtName = c.name;
        base.courtSubName = c.courtName;
        base.image = c.image;
        base.location = c.name;
        base.pricePerHour = c.price;
        base.courtFee = priceNumber;
        base.mode = mode;
      }
    } else {
      const co = COACHES.find((x) => x.id === targetId);
      if (co) {
        base.coachName = co.name;
        base.coachAvatar = co.avatar;
        base.coachLevel = co.level;
        base.coachSpecialty = co.specialty.join(" / ");
        base.pricePerHour = co.pricePerHour;
        base.duration = co.duration;
      }
    }

    adminAddBooking(base);
    toast.success("予約を作成しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規予約</AdminDialogTitle>
          <AdminDialogDescription>
            店舗側で新たな予約を作成します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>種別</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => {
                setType(v as BookingType);
                setTargetId("");
              }}
              className="flex gap-4"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="court" id="type-court" />
                <span>コート</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="coach" id="type-coach" />
                <span>コーチング</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-target">対象</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id="booking-target">
                <SelectValue placeholder={type === "court" ? "コートを選択" : "コーチを選択"} />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-date">日付</Label>
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="booking-start">開始</Label>
              <Input
                id="booking-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-end">終了</Label>
              <Input
                id="booking-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booking-price">料金合計（円）</Label>
            <Input
              id="booking-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="自動計算（対象選択時）"
            />
          </div>

          <div className="space-y-1.5">
            <Label>会員</Label>
            <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={memberPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedMember ? (
                    <span className="flex items-center gap-2 truncate">
                      <span>{getRankTier(selectedMember.rating).emoji}</span>
                      <span className="truncate">{selectedMember.name}</span>
                      <span className="font-mono text-xs text-slate-500">
                        {selectedMember.displayId}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-500">会員を選択（任意）</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="名前 / LST-ID で検索" />
                  <CommandList>
                    <CommandEmpty>会員が見つかりません</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => {
                          setUserId(undefined);
                          setMemberPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !userId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="text-slate-500">未指定</span>
                      </CommandItem>
                      {allPlayers.map((p) => {
                        const tier = getRankTier(p.rating);
                        return (
                          <CommandItem
                            key={p.userId}
                            value={`${p.name} ${p.displayId}`}
                            onSelect={() => {
                              setUserId(p.userId);
                              setMemberPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                userId === p.userId ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="mr-2">{tier.emoji}</span>
                            <span className="flex-1">{p.name}</span>
                            <span className="ml-2 font-mono text-xs text-slate-500">
                              {p.displayId}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {type === "court" ? (
            <div className="space-y-1.5">
              <Label>モード</Label>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as BookingMode)}
                className="flex gap-4"
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="standard" id="mode-standard" />
                  <span>スタンダード</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="solo" id="mode-solo" />
                  <span>1人練習（ソロ）</span>
                </label>
              </RadioGroup>
            </div>
          ) : null}
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            作成する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewBookingDialog;
