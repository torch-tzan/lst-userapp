import { CheckCircle2, DollarSign, EyeOff, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import StatCard from "../../../components/StatCard";
import NewCourtDialog from "../../../components/dialogs/NewCourtDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COURTS_DETAIL } from "@/lib/courtData";
import courtPlaceholder from "@/assets/court-outdoor.webp";

import {
  resolveCourtImage,
  useAdminCourts,
  type AdminCourtRecord,
} from "../../../lib/adminCourtOverlay";

// list 行 image セルは fallback chain (imageUrl → image → placeholder) を持つ
const CourtThumb = ({ court }: { court: AdminCourtRecord }) => {
  const src = resolveCourtImage(court);
  return (
    <img
      src={src}
      alt={court.name}
      onError={(e) => {
        // 壊れた URL 時は placeholder にフォールバック
        const target = e.currentTarget;
        if (target.src !== courtPlaceholder) target.src = courtPlaceholder;
      }}
      className="h-10 w-10 rounded-md border object-cover"
    />
  );
};

type TypeFilter = string | undefined;
type StatusFilter = "available" | "hidden" | undefined;

const STATUS_OPTIONS: { value: "available" | "hidden"; label: string }[] = [
  { value: "available", label: "公開中" },
  { value: "hidden", label: "非公開" },
];

const CourtList = () => {
  const navigate = useNavigate();
  const courts = useAdminCourts();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    courts.forEach((c) => set.add(c.courtType));
    return Array.from(set).map((t) => ({ value: t, label: t }));
  }, [courts]);

  // ── Stat cards ──
  const stats = useMemo(() => {
    const available = courts.filter((c) => c.available).length;
    const hidden = courts.length - available;
    const totalPrice = courts.reduce((sum, c) => sum + c.price, 0);
    const avg = courts.length === 0 ? 0 : Math.round(totalPrice / courts.length);
    return { available, hidden, avg };
  }, [courts]);

  // ── Filtered rows ──
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courts.filter((c) => {
      if (typeFilter && c.courtType !== typeFilter) return false;
      if (statusFilter === "available" && !c.available) return false;
      if (statusFilter === "hidden" && c.available) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.courtName.toLowerCase().includes(q)
      );
    });
  }, [courts, search, typeFilter, statusFilter]);

  const columns: DataTableColumn<AdminCourtRecord>[] = [
    {
      key: "thumb",
      header: "",
      width: "6%",
      render: (c) => <CourtThumb court={c} />,
    },
    {
      key: "id",
      header: "ID",
      width: "6%",
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.id}</span>,
    },
    {
      key: "name",
      header: "名前",
      width: "24%",
      render: (c) => <span className="text-sm font-medium text-slate-800">{c.name}</span>,
    },
    {
      key: "courtName",
      header: "コート名",
      width: "12%",
      render: (c) => <span className="text-sm text-slate-700">{c.courtName}</span>,
    },
    {
      key: "type",
      header: "種別",
      width: "12%",
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
      key: "status",
      header: "状態",
      width: "10%",
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
    {
      key: "amenities",
      header: "設備数",
      width: "10%",
      className: "text-right",
      render: (c) => {
        // overlay amenities ∪ COURTS_DETAIL amenities
        const fromDetail = COURTS_DETAIL[c.id]?.amenities ?? [];
        const fromOverlay = c.amenities ?? [];
        const merged = new Set([...fromDetail, ...fromOverlay]);
        return (
          <span className="text-xs text-slate-500">
            {merged.size > 0 ? `${merged.size}件` : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="コート管理"
        description="登録コート一覧"
        breadcrumbs={[{ label: "店舗管理" }, { label: "コート管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規コート
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="公開中"
          value={stats.available.toLocaleString("ja-JP")}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="非公開"
          value={stats.hidden.toLocaleString("ja-JP")}
          icon={<EyeOff className="h-4 w-4" />}
        />
        <StatCard
          label="平均料金"
          value={`¥${stats.avg.toLocaleString("ja-JP")}/h`}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <DataTable<AdminCourtRecord>
          columns={columns}
          data={rows}
          rowKey={(c) => c.id}
          searchPlaceholder="施設名 / コート名で検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="種別"
                value={typeFilter}
                options={typeOptions}
                onChange={(v) => setTypeFilter(v as TypeFilter)}
              />
              <FilterChip
                label="状態"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
              />
            </>
          }
          onRowClick={(c) => navigate(`/admin/store/courts/${c.id}`)}
          emptyTitle="該当するコートはありません"
          emptyDescription="フィルタ条件を変更するか、新規追加してください。"
        />
      </div>

      <NewCourtDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => navigate(`/admin/store/courts/${id}`)}
      />
    </AdminLayout>
  );
};

export default CourtList;
