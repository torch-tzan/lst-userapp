import { Ban, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import AffiliateEditDialog from "../../../components/dialogs/AffiliateEditDialog";
import AffiliateTerminateDialog from "../../../components/dialogs/AffiliateTerminateDialog";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAffiliate } from "../../../lib/adminAffiliatesStore";
import { adminCourtStoreLink, useAdminCourts } from "../../../lib/adminCourtOverlay";
import { useRevenueTransactions } from "../../../lib/adminRevenueStore";
import {
  AFFILIATE_STATUS_BADGE_CLS,
  AFFILIATE_STATUS_JP,
  REVENUE_TX_KIND_JP,
  REVENUE_TX_STATUS_BADGE_CLS,
  REVENUE_TX_STATUS_JP,
} from "../../../lib/lstLabels";

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

// 加盟店ごとのモックスタッフ
const MOCK_STAFF = [
  { id: "STF-A01", name: "山田 翔", role: "オーナー", employment: "正社員" },
  { id: "STF-A02", name: "鈴木 千尋", role: "スタッフ", employment: "アルバイト" },
  { id: "STF-A03", name: "佐藤 健一", role: "受付", employment: "アルバイト" },
];

// 加盟店ごとのモック予約
const MOCK_BOOKINGS = Array.from({ length: 10 }, (_, i) => ({
  id: `BK-${String(20260000 + i).padStart(8, "0")}`,
  date: `2026-05-${String(21 - i).padStart(2, "0")}`,
  customer: ["田中", "鈴木", "佐藤", "高橋", "中村"][i % 5] + " 様",
  amount: 2000 + i * 350,
}));

const AffiliateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const affiliate = useAffiliate(id);
  const allCourts = useAdminCourts();
  const allTx = useRevenueTransactions();
  const [editOpen, setEditOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);

  const linkedCourts = useMemo(() => {
    if (!affiliate) return [];
    return allCourts.filter((c) => (adminCourtStoreLink[c.id] ?? "AFF-001") === affiliate.id);
  }, [allCourts, affiliate]);

  const recentBookings = useMemo(() => {
    if (!affiliate) return [];
    return allTx.filter((t) => t.affiliateId === affiliate.id).slice(0, 10);
  }, [allTx, affiliate]);

  if (!affiliate) {
    return (
      <AdminLayout role="lst">
        <AdminPageHeader
          title="加盟店が見つかりません"
          breadcrumbs={[
            { label: "LST HQ" },
            { label: "加盟店管理", to: "/admin/lst/affiliates" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定された加盟店 ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/lst/affiliates")}>
            一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const avgMonthly = affiliate.totalRevenue > 0
    ? Math.round(affiliate.totalRevenue / 12)
    : 0;
  const csatScore = (3.8 + ((affiliate.id.charCodeAt(4) % 10) / 10)).toFixed(1);

  const courtColumns: DataTableColumn<(typeof linkedCourts)[number]>[] = [
    { key: "name", header: "コート", width: "40%", render: (c) => <span className="text-sm font-medium text-slate-800">{c.name} / {c.courtName}</span> },
    { key: "type", header: "種別", width: "20%", render: (c) => <span className="text-sm text-slate-700">{c.courtType}</span> },
    { key: "price", header: "料金/h", width: "20%", className: "text-right", render: (c) => <span className="text-sm text-slate-700">¥{c.price.toLocaleString("ja-JP")}</span> },
    { key: "status", header: "状態", width: "20%", render: (c) => (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", c.available ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200")}>
        {c.available ? "公開中" : "非公開"}
      </span>
    ) },
  ];

  const staffColumns: DataTableColumn<(typeof MOCK_STAFF)[number]>[] = [
    { key: "id", header: "ID", width: "20%", render: (s) => <span className="font-mono text-xs text-slate-600">{s.id}</span> },
    { key: "name", header: "名前", width: "30%", render: (s) => <span className="text-sm font-medium text-slate-800">{s.name}</span> },
    { key: "role", header: "役割", width: "25%", render: (s) => <span className="text-sm text-slate-700">{s.role}</span> },
    { key: "emp", header: "雇用形態", width: "25%", render: (s) => <span className="text-sm text-slate-700">{s.employment}</span> },
  ];

  const bookingColumns: DataTableColumn<(typeof recentBookings)[number]>[] = [
    { key: "id", header: "取引ID", width: "25%", render: (t) => <span className="font-mono text-xs text-slate-600">{t.id}</span> },
    { key: "date", header: "日付", width: "15%", render: (t) => <span className="text-sm text-slate-700">{t.date}</span> },
    { key: "kind", header: "種別", width: "20%", render: (t) => <span className="text-sm text-slate-700">{REVENUE_TX_KIND_JP[t.kind]}</span> },
    { key: "amount", header: "金額", width: "20%", className: "text-right", render: (t) => <span className="text-sm font-medium text-slate-800">¥{t.amount.toLocaleString("ja-JP")}</span> },
    { key: "status", header: "状態", width: "20%", render: (t) => (
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", REVENUE_TX_STATUS_BADGE_CLS[t.status])}>
        {REVENUE_TX_STATUS_JP[t.status]}
      </span>
    ) },
  ];

  // Fallback bookings if no revenue tx for this affiliate
  const bookingRowsForTable = recentBookings.length > 0 ? recentBookings : MOCK_BOOKINGS.map((b) => ({
    id: b.id,
    date: b.date,
    affiliateId: affiliate.id,
    affiliateName: affiliate.storeName,
    kind: "court" as const,
    amount: b.amount,
    fee: Math.round(b.amount * 0.1),
    status: "confirmed" as const,
  }));

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title={affiliate.storeName}
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "加盟店管理", to: "/admin/lst/affiliates" },
          { label: affiliate.storeName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              編集
            </Button>
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setTermOpen(true)}
            >
              <Ban className="mr-1.5 h-4 w-4" />
              契約解約
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* 基本情報 */}
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="加盟店ID">
              <span className="font-mono">{affiliate.id}</span>
            </InfoRow>
            <InfoRow label="状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  AFFILIATE_STATUS_BADGE_CLS[affiliate.status],
                )}
              >
                {AFFILIATE_STATUS_JP[affiliate.status]}
              </span>
            </InfoRow>
            <InfoRow label="店舗名">{affiliate.storeName}</InfoRow>
            <InfoRow label="代表者">{affiliate.ownerName}</InfoRow>
            <InfoRow label="メール">{affiliate.email}</InfoRow>
            <InfoRow label="電話">{affiliate.phone}</InfoRow>
            <InfoRow label="都道府県">{affiliate.prefecture}</InfoRow>
            <InfoRow label="住所">{affiliate.address}</InfoRow>
            <InfoRow label="開業日">{affiliate.openedAt}</InfoRow>
            <InfoRow label="契約開始日">{affiliate.contractStartAt}</InfoRow>
            {affiliate.terminationDate ? (
              <>
                <InfoRow label="解約日">{affiliate.terminationDate}</InfoRow>
                <InfoRow label="解約理由">{affiliate.terminationReason ?? "—"}</InfoRow>
              </>
            ) : null}
          </div>
        </div>

        {/* 統計 */}
        <div className={cardCls}>
          <SectionHeader title="統計" />
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">累計売上</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                ¥{affiliate.totalRevenue.toLocaleString("ja-JP")}
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">平均月売上</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                ¥{avgMonthly.toLocaleString("ja-JP")}
              </div>
            </div>
            <div className="rounded-md border bg-slate-50 p-4">
              <div className="text-xs font-medium text-slate-500">顧客満足度</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{csatScore} / 5.0</div>
            </div>
          </div>
        </div>

        {/* 紐付くコート */}
        <div className={cardCls}>
          <SectionHeader title="紐付くコート" description={`この加盟店に紐付いているコート（${linkedCourts.length} 件）`} />
          <DataTable
            columns={courtColumns}
            data={linkedCourts}
            rowKey={(c) => c.id}
            onRowClick={(c) => navigate(`/admin/lst/courts/${c.id}`)}
            emptyTitle="紐付くコートはありません"
          />
        </div>

        {/* 紐付くスタッフ */}
        <div className={cardCls}>
          <SectionHeader title="紐付くスタッフ" description="この加盟店に所属するスタッフ" />
          <DataTable
            columns={staffColumns}
            data={MOCK_STAFF}
            rowKey={(s) => s.id}
            emptyTitle="スタッフはいません"
          />
        </div>

        {/* 直近の予約 */}
        <div className={cardCls}>
          <SectionHeader title="直近の予約" description="この加盟店の最新取引（最大 10 件）" />
          <DataTable
            columns={bookingColumns}
            data={bookingRowsForTable}
            rowKey={(t) => t.id}
            emptyTitle="取引はまだありません"
          />
        </div>
      </div>

      <AffiliateEditDialog open={editOpen} onOpenChange={setEditOpen} affiliate={affiliate} />
      <AffiliateTerminateDialog open={termOpen} onOpenChange={setTermOpen} affiliate={affiliate} />
    </AdminLayout>
  );
};

export default AffiliateDetail;
