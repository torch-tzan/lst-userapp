import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCancelMatch,
  type PostedMatch,
} from "@/lib/leagueMatchBoardStore";
import { getPlayer } from "@/lib/tournamentStore";
import { cn } from "@/lib/utils";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";
import {
  POSTED_MATCH_STATUS_BADGE_CLS,
  POSTED_MATCH_STATUS_JP,
} from "../../lib/leagueLabels";

interface LeagueCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: PostedMatch;
}

const LeagueCancelDialog = ({ open, onOpenChange, match }: LeagueCancelDialogProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on open transitions
  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const host = getPlayer(match.hostUserId);
  const trimmedReason = reason.trim();
  const canConfirm = trimmedReason.length > 0 && !submitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setSubmitting(true);
    const ok = adminCancelMatch(match.id, trimmedReason);
    setSubmitting(false);
    if (ok) {
      toast.success("試合をキャンセルしました");
      onOpenChange(false);
    } else {
      toast.error("キャンセルできませんでした");
    }
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>この試合をキャンセルしますか？</AdminDialogTitle>
          <AdminDialogDescription>
            管理者操作として記録され、参加者に通知されます。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="rounded-md border bg-slate-50 p-3 text-sm">
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
            <span className="text-slate-500">ID</span>
            <span className="font-mono text-xs text-slate-700">{match.id}</span>
            <span className="text-slate-500">主催者</span>
            <span className="text-slate-800">{host?.name ?? "—"}</span>
            <span className="text-slate-500">希望日時</span>
            <span className="text-slate-800">{format(new Date(match.desiredDate), "yyyy/M/d HH:mm")}</span>
            <span className="text-slate-500">会場</span>
            <span className="text-slate-800">{match.preferredVenue}</span>
            <span className="text-slate-500">ステータス</span>
            <span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  POSTED_MATCH_STATUS_BADGE_CLS[match.status],
                )}
              >
                {POSTED_MATCH_STATUS_JP[match.status]}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="cancel-reason">
            キャンセル理由（必須）
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例：会場側のトラブルにより中止"
            rows={3}
          />
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button variant="destructive" disabled={!canConfirm} onClick={handleConfirm}>
            キャンセルする
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default LeagueCancelDialog;
