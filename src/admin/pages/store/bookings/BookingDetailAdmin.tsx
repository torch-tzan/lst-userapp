import { format } from "date-fns";
import { Pencil, Star, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import BookingCancelDialog from "../../../components/dialogs/BookingCancelDialog";
import BookingEditDialog from "../../../components/dialogs/BookingEditDialog";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingEquipmentLine, BookingStatus } from "@/lib/bookingStore";
import { getPlayer } from "@/lib/tournamentStore";

import {
  BOOKING_STATUS_BADGE_CLS,
  BOOKING_STATUS_JP,
  BOOKING_TYPE_BADGE_CLS,
  BOOKING_TYPE_JP,
} from "../../../lib/bookingLabels";
import { useAdminBooking } from "../../../lib/useAdminBookings";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
  </div>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const EDITABLE_STATUSES: BookingStatus[] = ["upcoming", "pending_confirmation"];
const CANCELLABLE_STATUSES: BookingStatus[] = [
  "upcoming",
  "pending_confirmation",
  "change_pending",
];

const LESSON_TYPE_JP: Record<string, string> = {
  onsite: "対面レッスン",
  online: "オンラインレッスン",
  review: "動画レビュー",
};

const BookingDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const booking = useAdminBooking(id);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!booking) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="予約が見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "予約管理", to: "/admin/store/bookings" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された予約 ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/bookings")}>
            予約一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isEditable = EDITABLE_STATUSES.includes(booking.status);
  const isCancellable = CANCELLABLE_STATUSES.includes(booking.status);

  const target =
    booking.type === "court"
      ? `${booking.courtName ?? "—"}${booking.courtSubName ? " / " + booking.courtSubName : ""}`
      : booking.coachName ?? "—";

  const dateObj = new Date(booking.date);
  const dateFmt = Number.isNaN(dateObj.getTime()) ? booking.date : format(dateObj, "yyyy/M/d");

  const equipmentColumns: DataTableColumn<BookingEquipmentLine>[] = [
    {
      key: "name",
      header: "名前",
      width: "40%",
      render: (e) => <span className="text-sm text-slate-800">{e.name}</span>,
    },
    {
      key: "priceType",
      header: "料金種別",
      width: "20%",
      render: (e) => (
        <span className="text-sm text-slate-700">
          {e.priceType === "hourly" ? "時間" : "都度"}
        </span>
      ),
    },
    {
      key: "qty",
      header: "数量",
      width: "10%",
      className: "text-right",
      render: (e) => <span className="text-sm text-slate-700">{e.qty}</span>,
    },
    {
      key: "unit",
      header: "単価",
      width: "15%",
      className: "text-right",
      render: (e) => (
        <span className="text-sm text-slate-700">
          ¥{e.unitPrice.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "total",
      header: "小計",
      width: "15%",
      className: "text-right",
      render: (e) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{e.lineTotal.toLocaleString("ja-JP")}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={`予約 ${booking.id}`}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "予約管理", to: "/admin/store/bookings" },
          { label: booking.id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isEditable ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                編集
              </Button>
            ) : null}
            {isCancellable ? (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                キャンセル
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* Section 1: 予約情報 */}
        <div className={cardCls}>
          <SectionHeader title="予約情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="予約 ID">
              <span className="font-mono text-xs">{booking.id}</span>
            </InfoRow>
            <InfoRow label="種別">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  BOOKING_TYPE_BADGE_CLS[booking.type],
                )}
              >
                {BOOKING_TYPE_JP[booking.type]}
              </span>
            </InfoRow>
            <InfoRow label="対象">{target}</InfoRow>
            <InfoRow label="日付">{dateFmt}</InfoRow>
            <InfoRow label="時間">
              {booking.startTime}〜{booking.endTime}
            </InfoRow>
            <InfoRow label="料金">
              ¥{(booking.totalPrice ?? 0).toLocaleString("ja-JP")}
            </InfoRow>
            <InfoRow label="モード">
              {booking.type === "court" ? (booking.mode === "solo" ? "1人練習" : "標準") : "—"}
            </InfoRow>
            <InfoRow label="会員">
              {booking.userId ? (
                (() => {
                  const p = getPlayer(booking.userId);
                  return p ? (
                    <span className="inline-flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="font-mono text-xs text-slate-500">{p.displayId}</span>
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-500">{booking.userId}</span>
                  );
                })()
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </InfoRow>
            <InfoRow label="ステータス">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  BOOKING_STATUS_BADGE_CLS[booking.status],
                )}
              >
                {BOOKING_STATUS_JP[booking.status]}
              </span>
            </InfoRow>
            <InfoRow label="作成日">
              {booking.createdAt
                ? format(new Date(booking.createdAt), "yyyy/M/d HH:mm")
                : <span className="text-slate-400">—</span>}
            </InfoRow>
            {booking.status === "cancelled" ? (
              <>
                <InfoRow label="キャンセル日時">
                  {booking.cancelledAt
                    ? format(new Date(booking.cancelledAt), "yyyy/M/d HH:mm")
                    : <span className="text-slate-400">—</span>}
                </InfoRow>
                <InfoRow label="キャンセル理由">
                  {booking.cancelReason ?? <span className="text-slate-400">（理由なし）</span>}
                </InfoRow>
              </>
            ) : null}
          </div>
        </div>

        {/* Section 2: 詳細 (court only) */}
        {booking.type === "court" ? (
          <div className={cardCls}>
            <SectionHeader title="詳細" />
            <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
              <InfoRow label="場所">
                {booking.location ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="コート料金">
                ¥{(booking.courtFee ?? 0).toLocaleString("ja-JP")}
              </InfoRow>
              <InfoRow label="装備品合計">
                ¥{(booking.equipmentTotal ?? 0).toLocaleString("ja-JP")}
              </InfoRow>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-slate-700">装備品</div>
              <DataTable<BookingEquipmentLine>
                columns={equipmentColumns}
                data={booking.equipment ?? []}
                rowKey={(e) => e.id}
                emptyTitle="装備品はありません"
                emptyDescription="この予約には装備品の追加がありません。"
              />
            </div>
          </div>
        ) : null}

        {/* Section 3: コーチング (coach only) */}
        {booking.type === "coach" ? (
          <div className={cardCls}>
            <SectionHeader title="コーチング" />
            <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
              <InfoRow label="コーチ">
                {booking.coachName ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="レベル">
                {booking.coachLevel ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="専門">
                {booking.coachSpecialty ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="レッスン種別">
                {booking.lessonType ? LESSON_TYPE_JP[booking.lessonType] ?? booking.lessonType : <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="会場名">
                {booking.venueName ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="会場住所">
                {booking.venueAddress ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow label="レッスン時間">
                {booking.duration ? `${booking.duration}分` : <span className="text-slate-400">—</span>}
              </InfoRow>
            </div>
          </div>
        ) : null}

        {/* Section 4: イベント連動 */}
        {booking.eventId ? (
          <div className={cardCls}>
            <SectionHeader title="イベント連動" />
            <p className="text-sm text-slate-700">
              大会 <span className="font-mono">#{booking.eventId}</span> に紐付け
              {booking.teamId ? (
                <span className="ml-2 text-slate-500">
                  (チーム <span className="font-mono">{booking.teamId}</span>)
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {/* Section 5: リスケジュール */}
        {booking.rescheduleUsed ||
        booking.pendingChangeDate ||
        booking.pendingChangeStart ||
        booking.pendingChangeEnd ? (
          <div className={cardCls}>
            <SectionHeader title="リスケジュール" />
            <div className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-4 text-sm">
              <InfoRow label="リスケ使用">
                {booking.rescheduleUsed ? "はい" : "いいえ"}
              </InfoRow>
              {booking.pendingChangeDate ? (
                <InfoRow label="変更希望日">{booking.pendingChangeDate}</InfoRow>
              ) : null}
              {booking.pendingChangeStart && booking.pendingChangeEnd ? (
                <InfoRow label="変更希望時間">
                  {booking.pendingChangeStart}〜{booking.pendingChangeEnd}
                </InfoRow>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Section 6: 評価 */}
        {booking.rating ? (
          <div className={cardCls}>
            <SectionHeader title="評価" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < (booking.rating?.stars ?? 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300",
                  )}
                />
              ))}
              <span className="ml-2 text-sm text-slate-600">
                {booking.rating.stars} / 5
              </span>
            </div>
            {booking.rating.comment ? (
              <p className="mt-3 whitespace-pre-wrap rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                {booking.rating.comment}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              評価日：
              {format(new Date(booking.rating.createdAt), "yyyy/M/d HH:mm")}
            </p>
          </div>
        ) : null}
      </div>

      <BookingEditDialog open={editOpen} onOpenChange={setEditOpen} booking={booking} />
      <BookingCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        booking={booking}
        onCancelled={() => navigate("/admin/store/bookings")}
      />
    </AdminLayout>
  );
};

export default BookingDetailAdmin;
