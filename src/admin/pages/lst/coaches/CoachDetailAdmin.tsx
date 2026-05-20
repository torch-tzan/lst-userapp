import { ArrowLeft, ArrowUpRight, ArrowDownRight, Mail, Pencil, Phone, Power, Star, Trash2, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
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
import { getAdminCoachProfile, type AdminCoachSession } from "../../../lib/adminCoachProfile";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const LEVEL_TEXT: Record<string, string> = {
  "S級": "text-emerald-600",
  "A級": "text-blue-600",
  "B級": "text-sky-600",
  "C級": "text-slate-500",
};

const LESSON_TYPE_JP: Record<string, string> = {
  onsite: "対面",
  online: "オンライン",
  review: "動画レビュー",
};

const LESSON_TYPE_BADGE: Record<string, string> = {
  onsite: "bg-slate-100 text-slate-700",
  online: "bg-blue-50 text-blue-700",
  review: "bg-amber-50 text-amber-700",
};

const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  active: { dot: "bg-emerald-500", text: "text-emerald-600" },
  suspended: { dot: "bg-rose-500", text: "text-rose-600" },
};

const fmtYen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const fmtSignedPct = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const CoachDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = useAdminCoachDetail(id);
  const status = useCoachStatus(id);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const adminProfile = useMemo(() => getAdminCoachProfile(detail), [detail]);

  if (!detail) {
    return (
      <AdminLayout role="lst">
        <div className="mx-auto max-w-[1200px]">
          <button
            onClick={() => navigate("/admin/lst/coaches")}
            className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> コーチ管理
          </button>
          <h1 className="mb-4 text-2xl font-semibold text-slate-900">
            コーチが見つかりません
          </h1>
          <div className={cardCls}>
            <p className="text-sm text-slate-600">
              指定されたコーチ ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
            </p>
            <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/lst/coaches")}>
              一覧へ戻る
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const topReviews: CoachReview[] = detail.reviews.slice(0, 3);
  const ratingDelta = adminProfile?.monthlySessionsDeltaPct ?? 0;
  const ratingDir: "up" | "down" | "flat" =
    ratingDelta > 0 ? "up" : ratingDelta < 0 ? "down" : "flat";

  // セッション履歴 columns（DataTable は full-bleed なのでここでは簡易 table）
  const sessionRows: AdminCoachSession[] = adminProfile?.sessionHistory ?? [];

  return (
    <AdminLayout role="lst">
      <div className="mx-auto max-w-[1200px] space-y-6">
        {/* Title bar with back link */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/lst/coaches")}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> コーチ管理
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">コーチ詳細</h1>
        </div>

        {/* Top section: profile (left) + stats & history (right) */}
        <div className="grid grid-cols-[420px_1fr] gap-6">
          {/* === Profile Card === */}
          <div className={cn(cardCls, "flex flex-col gap-4")}>
            <div className="flex items-start gap-4">
              <img
                src={detail.avatar}
                alt={detail.name}
                className="h-20 w-20 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xl font-semibold text-slate-900">{detail.name}</div>
                <div className={cn("mt-0.5 text-sm font-medium", LEVEL_TEXT[detail.level] ?? "text-slate-600")}>
                  {detail.level}コーチ
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {detail.specialty.slice(0, 2).join("・")}
                  {detail.experience ? ` | ${detail.experience}` : null}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 border-t pt-4 text-sm">
              <ProfileRow icon={<Phone className="h-3.5 w-3.5" />} label="電話番号">
                {adminProfile?.phone ?? "—"}
              </ProfileRow>
              <ProfileRow icon={<Mail className="h-3.5 w-3.5" />} label="メール">
                {adminProfile?.email ?? "—"}
              </ProfileRow>
              <ProfileRow label="対応可能時間">{adminProfile?.availabilityText ?? "—"}</ProfileRow>
              <ProfileRow label="次回来店予定">{adminProfile?.nextBookingAt ?? "—"}</ProfileRow>
              <ProfileRow label="契約開始日">{adminProfile?.contractStartDate ?? "—"}</ProfileRow>
              <ProfileRow label="LST手数料率">{adminProfile ? `${adminProfile.feeRatePct}%` : "—"}</ProfileRow>
              <ProfileRow label="所在地">{detail.location}</ProfileRow>
              <ProfileRow label="エリア">{detail.area}</ProfileRow>
              <ProfileRow label="基本料金">{fmtYen(detail.pricePerHour)}/h</ProfileRow>
              <ProfileRow label="オンライン対応">
                {detail.onlineAvailable ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Video className="h-3 w-3" /> 対応
                  </span>
                ) : (
                  <span className="text-slate-500">非対応</span>
                )}
              </ProfileRow>
              <ProfileRow label="動画レビュー">
                {detail.reviewAvailable ? "対応" : "非対応"}
              </ProfileRow>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => setEditOpen(true)} className="flex-1">
                <Pencil className="mr-1.5 h-4 w-4" />
                編集
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1",
                  status === "suspended"
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    : "border-rose-300 text-rose-700 hover:bg-rose-50",
                )}
                onClick={() => setSuspendOpen(true)}
              >
                <Power className="mr-1.5 h-4 w-4" />
                {status === "suspended" ? "再有効化" : "一時停止"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                受入解除
              </Button>
            </div>
          </div>

          {/* === Right column: stats + session history === */}
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <MiniStat
                label="今月セッション"
                value={`${adminProfile?.monthlySessions ?? 0}件`}
                deltaLabel={adminProfile ? `前月比 ${fmtSignedPct(adminProfile.monthlySessionsDeltaPct)}` : undefined}
                deltaDirection={ratingDir}
                tone="emerald"
              />
              <MiniStat
                label="今月売上"
                value={fmtYen(adminProfile?.monthlySalesYen ?? 0)}
                subLabel={adminProfile ? `LST手数料 ${fmtYen(adminProfile.monthlyFeeYen)}` : undefined}
                tone="amber"
              />
              <MiniStat
                label="平均評価"
                value={detail.rating > 0 ? detail.rating.toFixed(1) : "—"}
                subLabel={`★★★★★ レビュー ${detail.reviewCount}件`}
                tone="amber"
              />
            </div>

            {/* セッション履歴 */}
            <div className={cardCls}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">セッション履歴</h2>
              </div>
              {sessionRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  セッション履歴はまだありません。
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-slate-500">
                      <th className="pb-2 text-left font-medium">日時</th>
                      <th className="pb-2 text-left font-medium">利用者</th>
                      <th className="pb-2 text-left font-medium">内容</th>
                      <th className="pb-2 text-left font-medium">時間</th>
                      <th className="pb-2 text-right font-medium">料金</th>
                      <th className="pb-2 text-right font-medium">評価</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRows.map((s) => (
                      <tr key={s.id} className="border-b last:border-b-0">
                        <td className="py-2.5 text-slate-700">{s.datetime}</td>
                        <td className="py-2.5 text-slate-700">{s.memberName}</td>
                        <td className="py-2.5 text-slate-700">{s.menuName}</td>
                        <td className="py-2.5 text-slate-700">{s.durationMin}分</td>
                        <td className="py-2.5 text-right text-slate-800">{fmtYen(s.priceYen)}</td>
                        <td className="py-2.5 text-right">
                          {s.rating != null ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {s.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-3 text-right">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  全履歴を表示 →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 最近のレビュー（full width） */}
        {topReviews.length > 0 ? (
          <div className={cardCls}>
            <h2 className="mb-4 text-base font-semibold text-slate-900">最近のレビュー</h2>
            <div className="space-y-4">
              {topReviews.map((r) => (
                <div key={r.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-400">{r.date}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">{r.comment}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700">
                全レビューを表示 →
              </button>
            </div>
          </div>
        ) : null}

        {/* レッスンメニュー */}
        <div className={cardCls}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">レッスンメニュー</h2>
          {detail.lessonMenus.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">メニューはありません。</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="pb-2 text-left font-medium">メニュー名</th>
                  <th className="pb-2 text-left font-medium">種別</th>
                  <th className="pb-2 text-left font-medium">時間</th>
                  <th className="pb-2 text-right font-medium">料金</th>
                  <th className="pb-2 text-left font-medium">説明</th>
                </tr>
              </thead>
              <tbody>
                {detail.lessonMenus.map((m: LessonMenu) => (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="py-2.5 font-medium text-slate-800">{m.name}</td>
                    <td className="py-2.5">
                      <span className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px]",
                        LESSON_TYPE_BADGE[m.type] ?? "bg-slate-100 text-slate-700",
                      )}>
                        {LESSON_TYPE_JP[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700">
                      {m.duration > 0 ? `${m.duration}分` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-800">{fmtYen(m.price)}</td>
                    <td className="py-2.5 text-xs text-slate-600">{m.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 対応会場 */}
        <div className={cardCls}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">対応会場</h2>
          {detail.venues.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">対応会場はありません。</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="pb-2 text-left font-medium">会場名</th>
                  <th className="pb-2 text-left font-medium">住所</th>
                  <th className="pb-2 text-right font-medium">コート料金/h</th>
                </tr>
              </thead>
              <tbody>
                {detail.venues.map((v: CoachVenue) => (
                  <tr key={v.id} className="border-b last:border-b-0">
                    <td className="py-2.5 font-medium text-slate-800">{v.name}</td>
                    <td className="py-2.5 text-slate-700">{v.address}</td>
                    <td className="py-2.5 text-right text-slate-800">{fmtYen(v.courtFeePerHour)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 専門 / 資格 / 紹介 / 対応可能スロット */}
        <div className={cardCls}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">プロフィール詳細</h2>

          <div className="mb-4">
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
            <div className="mb-4 border-t pt-4">
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
            <div className="mb-4 border-t pt-4">
              <div className="mb-2 text-sm font-medium text-slate-700">紹介</div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{detail.bio}</p>
            </div>
          ) : null}

          {detail.availableSlots.length > 0 ? (
            <div className="border-t pt-4">
              <div className="mb-2 text-sm font-medium text-slate-700">
                予約可能スロット（参考）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detail.availableSlots.map((s) => (
                  <span
                    key={s.time}
                    className={cn(
                      "inline-flex items-center rounded border px-2 py-0.5 text-xs",
                      s.available
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-400 line-through",
                    )}
                  >
                    {s.time}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* 補助 stats（user-app と整合） */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-center">
            <SmallStat label="累計セッション" value={`${detail.stats.sessions}回`} />
            <SmallStat label="リピート率" value={`${detail.stats.repeatRate}%`} />
            <SmallStat label="満足度" value={`${detail.stats.satisfaction}%`} />
          </div>
        </div>

        {/* Footer status bar */}
        <div className={cn(
          "flex items-center gap-6 rounded-lg border bg-white px-6 py-4 shadow-sm",
          status === "suspended" ? "bg-rose-50/40" : "bg-emerald-50/40",
        )}>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_TONE[status].dot)} />
            <span className="text-slate-500">ステータス:</span>
            <span className={cn("font-medium", STATUS_TONE[status].text)}>
              {status === "active" ? "アクティブ" : "一時停止"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">累計セッション: </span>
            <span className="font-medium text-slate-800">{detail.stats.sessions}回</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">累計売上: </span>
            <span className="font-medium text-slate-800">
              {adminProfile ? fmtYen(adminProfile.cumulativeSalesYen) : "—"}
            </span>
          </div>
        </div>
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

// ── サブコンポーネント ─────────────────────────────────────

interface ProfileRowProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ProfileRow = ({ label, icon, children }: ProfileRowProps) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-3">
    <div className="flex items-center gap-1.5 text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-slate-800">{children}</div>
  </div>
);

interface MiniStatProps {
  label: string;
  value: string;
  subLabel?: string;
  deltaLabel?: string;
  deltaDirection?: "up" | "down" | "flat";
  tone: "emerald" | "amber" | "blue";
}

const TONE_DOT: Record<MiniStatProps["tone"], string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};

const MiniStat = ({ label, value, subLabel, deltaLabel, deltaDirection, tone }: MiniStatProps) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
    <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    {deltaLabel ? (
      <div
        className={cn(
          "mt-1 inline-flex items-center gap-0.5 text-xs",
          deltaDirection === "up" && "text-emerald-600",
          deltaDirection === "down" && "text-rose-600",
          deltaDirection === "flat" && "text-slate-500",
        )}
      >
        {deltaDirection === "up" ? <ArrowUpRight className="h-3 w-3" /> : null}
        {deltaDirection === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
        <span>{deltaLabel}</span>
      </div>
    ) : null}
    {subLabel ? (
      <div className="mt-1 text-[11px] text-slate-500">{subLabel}</div>
    ) : null}
  </div>
);

const SmallStat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-semibold text-slate-800">{value}</div>
  </div>
);

export default CoachDetailAdmin;
