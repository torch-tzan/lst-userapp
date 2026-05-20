import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminAdjustRating, getPlayer, getRankTier } from "@/lib/tournamentStore";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface RatingAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const MIN_RATING = 1000;
const MAX_RATING = 3000;

const RatingAdjustDialog = ({ open, onOpenChange, userId }: RatingAdjustDialogProps) => {
  const player = getPlayer(userId);
  const currentRating = player?.rating ?? 1400;

  const [ratingInput, setRatingInput] = useState<string>(String(currentRating));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRatingInput(String(currentRating));
      setReason("");
      setSubmitting(false);
    }
  }, [open, currentRating]);

  const parsedRating = useMemo(() => {
    const n = Number(ratingInput);
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }, [ratingInput]);

  const isRatingValid =
    parsedRating !== null && parsedRating >= MIN_RATING && parsedRating <= MAX_RATING;
  const trimmedReason = reason.trim();
  const canConfirm = isRatingValid && trimmedReason.length > 0 && !submitting && parsedRating !== currentRating;

  const previewTier = isRatingValid && parsedRating !== null ? getRankTier(parsedRating) : null;

  const handleConfirm = () => {
    if (!canConfirm || parsedRating === null) return;
    setSubmitting(true);
    const ok = adminAdjustRating(userId, parsedRating, trimmedReason);
    setSubmitting(false);
    if (ok) {
      toast.success(`レーティングを更新しました（${currentRating} → ${parsedRating}）`);
      onOpenChange(false);
    } else {
      toast.error("更新に失敗しました");
    }
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>レーティング調整 - {player?.name ?? userId}</AdminDialogTitle>
          <AdminDialogDescription>
            このプレイヤーのレーティングを手動で上書きします。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>レーティング変更は即座にプレイヤーに反映されます。</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500">現在のレーティング</span>
              <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {currentRating}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500" htmlFor="new-rating">
                新レーティング（{MIN_RATING}〜{MAX_RATING}）
              </label>
              <Input
                id="new-rating"
                type="number"
                min={MIN_RATING}
                max={MAX_RATING}
                value={ratingInput}
                onChange={(e) => setRatingInput(e.target.value)}
              />
            </div>
          </div>

          {previewTier ? (
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
              <span className="text-xs text-slate-500">新ティア</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base">{previewTier.emoji}</span>
                <span className="font-medium text-slate-800">{previewTier.label}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {MIN_RATING} 〜 {MAX_RATING} の整数を入力してください
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="adjust-reason">
              調整理由（必須）
            </label>
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：他リーグ実績考慮による初期値再設定"
              rows={3}
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            確定
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default RatingAdjustDialog;
