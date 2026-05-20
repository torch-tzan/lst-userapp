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
  adminUpdateBooking,
  type BookingMode,
  type BookingStatus,
  type StoredBooking,
} from "@/lib/bookingStore";
import { getAllPlayers, getRankTier } from "@/lib/tournamentStore";
import { cn } from "@/lib/utils";

import { BOOKING_STATUS_JP } from "../../lib/bookingLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: StoredBooking;
}

const EDITABLE_STATUSES: BookingStatus[] = [
  "upcoming",
  "pending_confirmation",
  "change_pending",
  "in_progress",
  "completed",
  "cancelled",
  "failed",
];

const BookingEditDialog = ({ open, onOpenChange, booking }: BookingEditDialogProps) => {
  const allPlayers = useMemo(() => getAllPlayers(), []);

  const [date, setDate] = useState(booking.date);
  const [startTime, setStartTime] = useState(booking.startTime);
  const [endTime, setEndTime] = useState(booking.endTime);
  const [price, setPrice] = useState(String(booking.totalPrice ?? 0));
  const [mode, setMode] = useState<BookingMode>(booking.mode ?? "standard");
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [userId, setUserId] = useState<string | undefined>(booking.userId);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(booking.date);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setPrice(String(booking.totalPrice ?? 0));
      setMode(booking.mode ?? "standard");
      setStatus(booking.status);
      setUserId(booking.userId);
      setMemberPopoverOpen(false);
      setSubmitting(false);
    }
  }, [open, booking]);

  const selectedMember = useMemo(
    () => (userId ? allPlayers.find((p) => p.userId === userId) : undefined),
    [userId, allPlayers],
  );

  const priceNumber = Number.parseInt(price, 10);
  const canSubmit =
    !!date && !!startTime && !!endTime && !Number.isNaN(priceNumber) && priceNumber >= 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const updates: Partial<StoredBooking> = {
      date,
      startTime,
      endTime,
      totalPrice: priceNumber,
      status,
      userId,
    };
    if (booking.type === "court") {
      updates.mode = mode;
      updates.courtFee = priceNumber - (booking.equipmentTotal ?? 0);
    }
    const ok = adminUpdateBooking(booking.id, updates);
    setSubmitting(false);
    if (ok) {
      toast.success("予約を更新しました");
      onOpenChange(false);
    } else {
      toast.error("更新できませんでした");
    }
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>予約を編集</AdminDialogTitle>
          <AdminDialogDescription>
            予約 ID: <span className="font-mono">{booking.id}</span>
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="rounded-md border bg-slate-50 p-3 text-sm">
            <div className="grid grid-cols-[80px_1fr] gap-y-1 gap-x-3">
              <span className="text-slate-500">種別</span>
              <span className="text-slate-800">
                {booking.type === "court" ? "コート" : "コーチング"}
              </span>
              <span className="text-slate-500">対象</span>
              <span className="text-slate-800">
                {booking.type === "court"
                  ? `${booking.courtName ?? "—"}${booking.courtSubName ? " / " + booking.courtSubName : ""}`
                  : booking.coachName ?? "—"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="be-date">日付</Label>
            <Input id="be-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="be-start">開始</Label>
              <Input
                id="be-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="be-end">終了</Label>
              <Input
                id="be-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="be-price">料金合計（円）</Label>
            <Input
              id="be-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

          <div className="space-y-1.5">
            <Label htmlFor="be-status">ステータス</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
              <SelectTrigger id="be-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {BOOKING_STATUS_JP[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {booking.type === "court" ? (
            <div className="space-y-1.5">
              <Label>モード</Label>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as BookingMode)}
                className="flex gap-4"
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="standard" id="be-mode-standard" />
                  <span>スタンダード</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="solo" id="be-mode-solo" />
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
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default BookingEditDialog;
