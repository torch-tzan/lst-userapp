import { CheckCircle2, DollarSign, MapPin, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import NewCourtDialog from "../../../components/dialogs/NewCourtDialog";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CourtSummary } from "@/lib/courtData";

import { useAffiliates } from "../../../lib/adminAffiliatesStore";
import { getCourtAffiliateId, useAdminCourts } from "../../../lib/adminCourtOverlay";

interface CourtWithAffiliate extends CourtSummary {
  affiliateId: string;
  affiliateName: string;
}

type StatusFilter = "available" | "hidden" | undefined;

const STATUS_OPTIONS: { value: "available" | "hidden"; label: string }[] = [
  { value: "available", label: "公開中" },
  { value: "hidden", label: "非公開" },
];

const LstCourtList = () => {
  const navigate = useNavigate();
  const courts = useAdminCourts();
  const affiliates = useAffiliates();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [affFilter, setAffFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const affiliateMap = useMemo(() => {
    const m: Record<string, string> = {};
    affiliates.forEach((a) => {
      m[a.id] = a.storeName;
    });
    return m;
  }, [affiliates]);

  const withAffiliate: CourtWithAffiliate[] = useMemo(() => {
    return courts.map((c) => {
      const affId = getCourtAffiliateId(c.id);
      return {
        ...c,
        affiliateId: affId,
        affiliateName: affiliateMap[affId] ?? "—",
      };
    });
  }, [courts, affiliateMap]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    courts.forEach((c) => set.add(c.courtType));
    return Array.from(set).map((t) => ({ value: t, label: t }));
  }, [courts]);

  const affOptions = useMemo(
    () => affiliates.map((a) => ({ value: a.id, label: a.storeName })),
    [affiliates],
  );

  const stats = useMemo(() => {
    const total = courts.length;
    const available = courts.filter((c) => c.available).length;
    const totalPrice = courts.reduce((s, c) => s + c.price, 0);
    const avg = total === 0 ? 0 : Math.round(totalPrice / total);
    return { total, available, avg };
  }, [courts]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withAffiliate.filter((c) => {
      if (typeFilter && c.courtType !== typeFilter) return false;
      if (statusFilter === "available" && !c.available) return false;
      if (statusFilter === "hidden" && c.available) return false;
      if (affFilter && c.affiliateId !== affFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.courtName.toLowerCase().includes(q) ||
        c.affiliateName.toLowerCase().includes(q)
      );
    });
  }, [withAffiliate, search, typeFilter, statusFilter, affFilter]);

  const columns: DataTableColumn<CourtWithAffiliate>[] = [
    {
      key: "id",
      header: "ID",
      width: "6%",
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.id}</span>,
    },
    {
      key: "name",
      header: "名前",
      width: "20%",
      render: (c) => <span className="text-sm font-medium text-slate-800">{c.name}</span>,
    },
    {
      key: "courtName",
      header: "コート名",
      width: "10%",
      render: (c) => <span className="text-sm text-slate-700">{c.courtName}</span>,
    },
    {
      key: "type",
      header: "種別",
      width: "10%",
      render: (c) => <span className="text-sm text-slate-700">{c.courtType}</span>,
    },
    {
      key: "price",
      header: "料金/h",
      width: "10%",
      className: "text-right",
      render: (c) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{c.price.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "affiliate",
      header: "所属加盟店",
      width: "22%",
      render: (c) => (
        <div>
          <div className="text-sm text-slate-800">{c.affiliateName}</div>
          <div className="font-mono text-xs text-slate-500">{c.affiliateId}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "状態",
      width: "12%",
      render: (c) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            c.available
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200",
          )}
        >
          {c.available ? "公開中" : "非公開"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="コート管理"
        description="LST 本部から見た全コート（加盟店横断）"
        breadcrumbs={[{ label: "LST HQ" }, { label: "コート管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            コート追加
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="全コート数" value={stats.total.toLocaleString("ja-JP")} icon={<MapPin className="h-4 w-4" />} />
        <StatCard label="公開中" value={stats.available.toLocaleString("ja-JP")} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="平均料金" value={`¥${stats.avg.toLocaleString("ja-JP")}/h`} icon={<DollarSign className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <DataTable<CourtWithAffiliate>
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
          searchPlaceholder="施設名 / コート名 / 加盟店で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="種別"
                value={typeFilter}
                options={typeOptions}
                onChange={setTypeFilter}
              />
              <FilterChip
                label="状態"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
              />
              <FilterChip
                label="所属加盟店"
                value={affFilter}
                options={affOptions}
                onChange={setAffFilter}
              />
            </>
          }
          onRowClick={(c) => navigate(`/admin/lst/courts/${c.id}`)}
          emptyTitle="該当するコートはありません"
          emptyDescription="フィルタ条件を変更してください。"
          pageSize={15}
        />
      </div>

      <NewCourtDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => navigate(`/admin/lst/courts/${id}`)}
      />
    </AdminLayout>
  );
};

export default LstCourtList;
