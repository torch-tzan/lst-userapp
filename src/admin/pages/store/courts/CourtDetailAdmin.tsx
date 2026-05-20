import { ExternalLink as ExternalLinkIcon, Globe, List, Map as MapIcon, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import CourtDeleteDialog from "../../../components/dialogs/CourtDeleteDialog";
import CourtEditDialog from "../../../components/dialogs/CourtEditDialog";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COURTS_DETAIL, type EquipmentItem, type ExternalLink } from "@/lib/courtData";

import { useAdminCourt } from "../../../lib/adminCourtOverlay";

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

const linkIconFor = (icon: ExternalLink["icon"]) => {
  switch (icon) {
    case "map":
      return <MapIcon className="h-4 w-4 text-slate-500" />;
    case "globe":
      return <Globe className="h-4 w-4 text-slate-500" />;
    case "list":
    default:
      return <List className="h-4 w-4 text-slate-500" />;
  }
};

const CourtDetailAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const court = useAdminCourt(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!court) {
    return (
      <AdminLayout role="store">
        <AdminPageHeader
          title="コートが見つかりません"
          breadcrumbs={[
            { label: "店舗管理" },
            { label: "コート管理", to: "/admin/store/courts" },
            { label: id ?? "—" },
          ]}
        />
        <div className={cardCls}>
          <p className="text-sm text-slate-600">
            指定されたコート ID（<span className="font-mono">{id}</span>）が見つかりませんでした。
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/store/courts")}>
            コート一覧へ戻る
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // CourtDetail（amenities / equipment / externalLinks / address / rating）は既存 COURTS_DETAIL から取る。
  // overlay で追加されたコートには detail が無いため、fallback の banner を出す。
  const detail = COURTS_DETAIL[court.id];
  const hasDetail = Boolean(detail);

  // detail からの値を court overlay で上書き — name / price / type は overlay 優先
  const displayName = court.name;
  const displayCourtName = court.courtName;
  const displayType = court.courtType;
  const displayPrice = court.price;
  const displayAvailable = court.available;
  const displayAddress = detail?.address;
  const displayRating = detail?.rating;
  const displayReviews = detail?.reviews;
  const amenities = detail?.amenities ?? [];
  const equipment: EquipmentItem[] = detail?.equipment ?? [];
  const externalLinks: ExternalLink[] = detail?.externalLinks ?? [];

  const equipmentColumns: DataTableColumn<EquipmentItem>[] = [
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
      key: "price",
      header: "価格",
      width: "20%",
      className: "text-right",
      render: (e) => (
        <span className="text-sm font-medium text-slate-800">
          ¥{e.price.toLocaleString("ja-JP")}
        </span>
      ),
    },
    {
      key: "maxQty",
      header: "最大数量",
      width: "20%",
      className: "text-right",
      render: (e) => <span className="text-sm text-slate-700">{e.maxQty}</span>,
    },
  ];

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title={displayName}
        breadcrumbs={[
          { label: "店舗管理" },
          { label: "コート管理", to: "/admin/store/courts" },
          { label: displayName },
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
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              削除
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {!hasDetail ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            詳細情報が登録されていません — 装備品・設備・外部リンク等は表示されません。
          </div>
        ) : null}

        {/* Section 1: 基本情報 */}
        <div className={cardCls}>
          <SectionHeader title="基本情報" />
          <div className="grid grid-cols-[120px_1fr_120px_1fr] gap-y-3 gap-x-4">
            <InfoRow label="名前">{displayName}</InfoRow>
            <InfoRow label="コート名">{displayCourtName}</InfoRow>
            <InfoRow label="種別">{displayType}</InfoRow>
            <InfoRow label="料金 / 時間">¥{displayPrice.toLocaleString("ja-JP")}</InfoRow>
            <InfoRow label="住所">
              {displayAddress ?? <span className="text-slate-400">—</span>}
            </InfoRow>
            <InfoRow label="評価">
              {displayRating !== undefined && displayReviews !== undefined ? (
                <span>
                  {displayRating}★ × {displayReviews}件
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </InfoRow>
            <InfoRow label="公開状態">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  displayAvailable
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200",
                )}
              >
                {displayAvailable ? "公開中" : "非公開"}
              </span>
            </InfoRow>
          </div>
        </div>

        {/* Section 2: 設備 */}
        <div className={cardCls}>
          <SectionHeader title="設備" />
          {amenities.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: 装備品 */}
        <div className={cardCls}>
          <SectionHeader title="装備品" />
          <DataTable<EquipmentItem>
            columns={equipmentColumns}
            data={equipment}
            rowKey={(e) => e.id}
            emptyTitle="装備品はありません"
            emptyDescription="この施設には登録済みの装備品がありません。"
          />
        </div>

        {/* Section 4: 外部リンク */}
        <div className={cardCls}>
          <SectionHeader title="外部リンク" />
          {externalLinks.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <ul className="divide-y">
              {externalLinks.map((link, i) => (
                <li key={`${link.title}-${i}`} className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    {linkIconFor(link.icon)}
                    <div>
                      <div className="text-sm font-medium text-slate-800">{link.title}</div>
                      <div className="text-xs text-slate-500">{link.description}</div>
                    </div>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <span className="max-w-[280px] truncate">{link.url}</span>
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 5: 画像 */}
        <div className={cardCls}>
          <SectionHeader title="画像" />
          <div className="overflow-hidden rounded-md border">
            <img
              src={court.image}
              alt={displayName}
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>
      </div>

      <CourtEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        court={court}
        currentAddress={displayAddress}
      />
      <CourtDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        court={court}
        onDeleted={() => navigate("/admin/store/courts")}
      />
    </AdminLayout>
  );
};

export default CourtDetailAdmin;
