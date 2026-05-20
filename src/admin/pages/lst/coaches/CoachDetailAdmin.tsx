import { Pencil, Power, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import CoachDeleteDialog from "../../../components/dialogs/CoachDeleteDialog";
import CoachEditDialog from "../../../components/dialogs/CoachEditDialog";
import CoachSuspendDialog from "../../../components/dialogs/CoachSuspendDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CoachReview, CoachVenue, LessonMenu } from "@/lib/coachData";

import {
  useAdminCoachDetail,
  useCoachStatus,
} from "../../../lib/adminCoachesOverlay";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-800">{children}</span>
  </>
);

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
};

const LESSON_TYPE_JP: Record<string, string> = {
  onsite: "対面",
  online: "オンライン",
  review: "動画レビュー",
};

const CoachDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = useAdminCoachDetail(id);
  const status = useCoachStatus(id);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!detail) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="コーチが見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "コーチ管理", to: "/admin/lst/coaches" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定されたコーチ ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/lst/coaches")}>
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const lessonColumns: DataTableColumn<LessonMenu>[] = [
    {
      key: "name",
      header: "メニュー名",
      width: "35%",
      render: (m) => <span className="text-sm font-medium text-slate-800">{m.name}</span>,
    },
    {
      key: "type",
      header: "種別",
      width: "15%",
      render: (m) => <span className="text-sm text-slate-700">{LESSON_TYPE_JP[m.type] ?? m.type}</span>,
    },
    {
      key: "duration",
      header: "時間",
      width: "15%",
      render: (m) => (
        <span className="text-sm text-slate-700">
          {m.duration > 0 ? `${m.duration}分` : "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "料金",
      width: "15%",
      className: "text-right",
      render: (m) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{m.price.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "desc",
      header: "説明",
      width: "20%",
      render: (m) => (
        <span className="text-xs text-slate-600">{m.description ?? "—"}</span>
      ),
    },
  ];

  const venueColumns: DataTableColumn<CoachVenue>[] = [
    {
      key: "name",
      header: "会場名",
      width: "35%",
      render: (v) => <span className="text-sm font-medium text-slate-800">{v.name}</span>,
    },
    {
      key: "address",
      header: "住所",
      width: "45%",
      render: (v) => <span className="text-sm text-slate-700">{v.address}</span>,
    },
    {
      key: "fee",
      header: "コート料金/h",
      width: "20%",
      className: "text-right",
      render: (v) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{v.courtFeePerHour.toLocaleString("ja-JP")}
        </span>
      ),
    },
  ];

  const topReviews: CoachReview[] = detail.reviews.slice(0, 5);

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={detail.name}
        breadcrumbs={[
          { label: "コーチ管理", to: "/admin/lst/coaches" },
          { label: detail.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            <Button
              variant="outline"
              className={cn(
                status === "suspended"
                  ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  : "border-amber-300 text-amber-700 hover:bg-amber-50",
              )}
              onClick={() => setSuspendOpen(true)}
            >
              <Power className="mr-1.5 h-4 w-4" />
              {status === "suspended" ? "再有効化" : "無効化"}
            </Button>
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              削除
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* 基本情報 */}
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="flex gap-6">
            <img
              src={detail.avatar}
              alt={detail.name}
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="grid flex-1 grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
              <InfoRow label="名前">{detail.name}</InfoRow>
              <InfoRow label="レベル">{detail.level}</InfoRow>
              <InfoRow label="エリア">{detail.area}</InfoRow>
              <InfoRow label="所在地">{detail.location}</InfoRow>
              <InfoRow label="経験">{detail.experience}</InfoRow>
              <InfoRow label="料金/h">
                ¥{detail.pricePerHour.toLocaleString("ja-JP")}
              </InfoRow>
              <InfoRow label="オンライン対応">
                {detail.onlineAvailable ? "対応" : "非対応"}
              </InfoRow>
              <InfoRow label="振り返り対応">
                {detail.reviewAvailable ? "対応" : "非対応"}
              </InfoRow>
              <InfoRow label="状態">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    STATUS_BADGE[status],
                  )}
                >
                  {status === "active" ? "アクティブ" : "無効化"}
                </span>
              </InfoRow>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">専門</div>
            <div className="flex flex-wrap gap-1.5">
              {detail.specialty.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          {detail.certifications.length > 0 ? (
            <div className="mt-4 border-t pt-4">
              <div className="mb-2 text-sm font-medium text-slate-700">資格</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full border bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {detail.bio ? (
            <div className="mt-4 border-t pt-4">
              <div className="mb-2 text-sm font-medium text-slate-700">紹介</div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{detail.bio}</p>
            </div>
          ) : null}
        </div>

        {/* 統計 + 評価 */}
        <div className={cardCls}>
          <SectionHeader title="統計 & 評価サマリー" />
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">セッション数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {detail.stats.sessions}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">リピート率</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {detail.stats.repeatRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">満足度</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {detail.stats.satisfaction}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">評価</div>
              <div className="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold text-slate-900">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                {detail.rating > 0 ? detail.rating : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">レビュー数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {detail.reviewCount}
              </div>
            </div>
          </div>
        </div>

        {/* レッスンメニュー */}
        <div className={cardCls}>
          <SectionHeader title="レッスンメニュー" />
          <DataTable<LessonMenu>
            columns={lessonColumns}
            data={detail.lessonMenus}
            rowKey={(m) => m.id}
            emptyTitle="メニューはありません"
          />
        </div>

        {/* 対応会場 */}
        <div className={cardCls}>
          <SectionHeader title="対応会場" />
          <DataTable<CoachVenue>
            columns={venueColumns}
            data={detail.venues}
            rowKey={(v) => v.id}
            emptyTitle="対応会場はありません"
          />
        </div>

        {/* レビュー */}
        {topReviews.length > 0 ? (
          <div className={cardCls}>
            <SectionHeader title="レビュー（最新 5 件）" />
            <div className="space-y-3">
              {topReviews.map((r) => (
                <div key={r.id} className="rounded-md border bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-500">{r.date}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CoachEditDialog open={editOpen} onOpenChange={setEditOpen} coach={detail} />
      <CoachSuspendDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        coach={detail}
      />
      <CoachDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        coach={detail}
        onDeleted={() => navigate("/admin/lst/coaches")}
      />
    </AdminLayout>
  );
};

export default CoachDetailAdmin;
