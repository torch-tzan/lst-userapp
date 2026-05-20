import { Crown, Plus, UserMinus, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FilterChip from "../../../components/FilterChip";
import NewMemberDialog from "../../../components/dialogs/NewMemberDialog";
import StatCard from "../../../components/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminMembers, type MemberRecord } from "../../../lib/adminMembersOverlay";
import { SKILL_LEVEL_JP } from "../../../lib/leagueLabels";
import {
  MEMBER_PREMIUM_STATUS_BADGE_CLS,
  MEMBER_PREMIUM_STATUS_JP,
  type MemberPremiumStatus,
} from "../../../lib/lstLabels";
import { getRankTier, type SkillLevel } from "@/lib/tournamentStore";

const SKILL_OPTIONS = (Object.keys(SKILL_LEVEL_JP) as SkillLevel[]).map((s) => ({
  value: s,
  label: SKILL_LEVEL_JP[s],
}));

const PREMIUM_OPTIONS = (Object.keys(MEMBER_PREMIUM_STATUS_JP) as MemberPremiumStatus[]).map((s) => ({
  value: s,
  label: MEMBER_PREMIUM_STATUS_JP[s],
}));

const TIER_OPTIONS = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "master", label: "Master" },
];

const MemberList = () => {
  const navigate = useNavigate();
  const members = useAdminMembers();

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string | undefined>(undefined);
  const [premiumFilter, setPremiumFilter] = useState<string | undefined>(undefined);
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
  const [newOpen, setNewOpen] = useState(false);

  const stats = useMemo(() => {
    const total = members.length;
    const premium = members.filter((m) => m.extra.premiumStatus === "active").length;
    // 「今月新規」は registeredAt が 2026-05 のもの。
    const thisMonthNew = members.filter((m) => m.extra.registeredAt.startsWith("2026-05")).length;
    // 「退会者」mock — premiumStatus = expired を簡易代用
    const churned = members.filter((m) => m.extra.premiumStatus === "expired").length;
    return { total, premium, thisMonthNew, churned };
  }, [members]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (skillFilter && m.skillLevel !== skillFilter) return false;
      if (premiumFilter && m.extra.premiumStatus !== premiumFilter) return false;
      if (tierFilter) {
        const tier = getRankTier(m.rating).tier;
        if (tier !== tierFilter) return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.displayId.toLowerCase().includes(q)
      );
    });
  }, [members, search, skillFilter, premiumFilter, tierFilter]);

  const columns: DataTableColumn<MemberRecord>[] = [
    {
      key: "id",
      header: "会員ID",
      width: "12%",
      render: (m) => <span className="font-mono text-xs text-slate-600">{m.displayId}</span>,
    },
    {
      key: "name",
      header: "名前",
      width: "14%",
      render: (m) => <span className="text-sm font-medium text-slate-800">{m.name}</span>,
    },
    {
      key: "email",
      header: "メール",
      width: "18%",
      render: (m) => <span className="text-sm text-slate-700">{m.email}</span>,
    },
    {
      key: "phone",
      header: "電話",
      width: "12%",
      render: (m) => <span className="text-xs text-slate-700">{m.phone}</span>,
    },
    {
      key: "skill",
      header: "スキル",
      width: "8%",
      render: (m) => <span className="text-sm text-slate-700">{SKILL_LEVEL_JP[m.skillLevel]}</span>,
    },
    {
      key: "rating",
      header: "レーティング / ティア",
      width: "14%",
      render: (m) => {
        const tier = getRankTier(m.rating);
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
            <span className="font-medium tabular-nums text-slate-800">{m.rating}</span>
            <span className="text-base leading-none">{tier.emoji}</span>
            <span className="text-xs text-slate-500">{tier.label}</span>
          </span>
        );
      },
    },
    {
      key: "premium",
      header: "Premium",
      width: "10%",
      render: (m) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            MEMBER_PREMIUM_STATUS_BADGE_CLS[m.extra.premiumStatus],
          )}
        >
          {MEMBER_PREMIUM_STATUS_JP[m.extra.premiumStatus]}
        </span>
      ),
    },
    {
      key: "points",
      header: "ポイント",
      width: "12%",
      className: "text-right",
      render: (m) => (
        <span className="text-sm text-slate-700">{m.extra.points.toLocaleString("ja-JP")} pt</span>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="会員管理"
        description="LST 全会員の一覧"
        breadcrumbs={[{ label: "LST HQ" }, { label: "会員管理" }]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新規会員追加
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="総会員数" value={stats.total.toLocaleString("ja-JP")} icon={<Users className="h-4 w-4" />} />
        <StatCard label="プレミアム会員" value={stats.premium.toLocaleString("ja-JP")} icon={<Crown className="h-4 w-4" />} />
        <StatCard label="今月新規" value={stats.thisMonthNew.toLocaleString("ja-JP")} icon={<UserPlus className="h-4 w-4" />} />
        <StatCard label="退会者" value={stats.churned.toLocaleString("ja-JP")} icon={<UserMinus className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <DataTable<MemberRecord>
          columns={columns}
          data={rows}
          rowKey={(m) => m.userId}
          searchPlaceholder="名前 / メール / 電話 / 会員IDで検索"
          onSearch={setSearch}
          searchValue={search}
          filters={
            <>
              <FilterChip
                label="スキル"
                value={skillFilter}
                options={SKILL_OPTIONS}
                onChange={setSkillFilter}
              />
              <FilterChip
                label="Premium"
                value={premiumFilter}
                options={PREMIUM_OPTIONS}
                onChange={setPremiumFilter}
              />
              <FilterChip
                label="ティア"
                value={tierFilter}
                options={TIER_OPTIONS}
                onChange={setTierFilter}
              />
            </>
          }
          onRowClick={(m) => navigate(`/admin/lst/members/${m.userId}`)}
          emptyTitle="該当する会員はいません"
          emptyDescription="フィルタ条件を変更するか、新規追加してください。"
          pageSize={15}
        />
      </div>

      <NewMemberDialog open={newOpen} onOpenChange={setNewOpen} />
    </AdminLayout>
  );
};

export default MemberList;
