import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAddBooking, type BookingMode, type BookingType, type StoredBooking } from "@/lib/bookingStore";
import { COACHES } from "@/lib/coachData";

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

  const [type, setType] = useState<BookingType>("court");
  const [targetId, setTargetId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [memberLabel, setMemberLabel] = useState("");
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
      setMemberLabel("");
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

    // memberLabel は現状ストアに userId field が無いため未保存（hint で告知済み）
    void memberLabel;

    adminAddBooking(base);
    toast.success("予約を作成しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
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
            <Label htmlFor="booking-member">会員</Label>
            <Input
              id="booking-member"
              value={memberLabel}
              onChange={(e) => setMemberLabel(e.target.value)}
              placeholder="会員名 or ID（任意）"
            />
            <p className="text-xs text-blue-600">🔵 会員紐付けは将来対応</p>
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
