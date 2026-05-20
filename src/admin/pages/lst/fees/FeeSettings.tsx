import { History, Plus, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import DataTable, { type DataTableColumn } from "../../../components/DataTable";
import FeeOverrideDialog from "../../../components/dialogs/FeeOverrideDialog";
import FeeRateChangeDialog from "../../../components/dialogs/FeeRateChangeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

import { useAffiliates, type Affiliate } from "../../../lib/adminAffiliatesStore";
import {
  removeFeeOverride,
  updateGlobalFeeSettings,
  useFeeHistory,
  useFeeSettings,
  type FeeCalcMethod,
} from "../../../lib/adminFeeSettingsStore";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const SectionHeader = ({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) => (
  <div className="mb-4 flex items-start justify-between">
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
    </div>
    {icon ? <div className="text-slate-400">{icon}</div> : null}
  </div>
);

const FeeSettings = () => {
  const settings = useFeeSettings();
  const history = useFeeHistory();
  const affiliates = useAffiliates();

  const [rateDraft, setRateDraft] = useState<number>(settings.defaultRate);
  const [minAmountDraft, setMinAmountDraft] = useState<string>(String(settings.minAmount));
  const [methodDraft, setMethodDraft] = useState<FeeCalcMethod>(settings.calcMethod);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // override 一覧 — affiliate に feeRateOverride がある店舗だけ
  const overrideRows = useMemo(
    () => affiliates.filter((a) => a.feeRateOverride !== undefined),
    [affiliates],
  );

  const isRateChanged = rateDraft !== settings.defaultRate;
  const minNum = Number.parseInt(minAmountDraft, 10);
  const isMinChanged = !Number.isNaN(minNum) && minNum !== settings.minAmount;
  const isMethodChanged = methodDraft !== settings.calcMethod;
  const isDirty = isRateChanged || isMinChanged || isMethodChanged;

  const handleSaveGlobal = () => {
    if (isRateChanged) {
      // 大きな変更（fee rate）は確認ダイアログ経由
      setConfirmOpen(true);
      return;
    }
    if (isMinChanged || isMethodChanged) {
      updateGlobalFeeSettings({
        minAmount: isMinChanged ? minNum : undefined,
        calcMethod: isMethodChanged ? methodDraft : undefined,
      });
      toast.success("設定を保存しました");
    }
  };

  const overrideColumns: DataTableColumn<Affiliate>[] = [
    {
      key: "affiliate",
      header: "加盟店",
      width: "44%",
      render: (a) => (
        <div>
          <div className="text-sm font-medium text-slate-800">{a.storeName}</div>
          <div className="font-mono text-xs text-slate-500">{a.id}</div>
        </div>
      ),
    },
    {
      key: "rate",
      header: "カスタム手数料率",
      width: "20%",
      className: "text-right",
      render: (a) => (
        <span className="text-sm font-medium text-slate-800">{a.feeRateOverride}%</span>
      ),
    },
    {
      key: "from",
      header: "適用開始日",
      width: "20%",
      render: (a) => <span className="text-sm text-slate-700">{a.contractStartAt}</span>,
    },
    {
      key: "actions",
      header: "操作",
      width: "16%",
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-rose-300 px-2 text-xs text-rose-700 hover:bg-rose-50"
          onClick={(e) => {
            e.stopPropagation();
            removeFeeOverride(a.id);
            toast.success("override を解除しました");
          }}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          解除
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="手数料設定"
        description="LST 全体の手数料ポリシー設定"
        breadcrumbs={[{ label: "LST HQ" }, { label: "手数料設定" }]}
      />

      <div className="mx-auto max-w-[1100px] space-y-6">
        {/* グローバル設定 */}
        <div className={cardCls}>
          <SectionHeader
            title="グローバル設定"
            description="全加盟店に適用される既定のポリシー"
            icon={<Settings className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm">既定の手数料率</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Slider
                    min={0}
                    max={30}
                    step={0.5}
                    value={[rateDraft]}
                    onValueChange={(v) => setRateDraft(v[0])}
                  />
                </div>
                <div className="w-[80px] rounded-md border bg-slate-50 px-3 py-1 text-right text-sm font-medium tabular-nums text-slate-800">
                  {rateDraft}%
                </div>
              </div>
              <div className="text-xs text-slate-500">
                現在の設定: <span className="font-medium text-slate-700">{settings.defaultRate}%</span>
                （override が未設定の加盟店に適用）
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="min-amount" className="text-sm">最低取引金額（円）</Label>
              <Input
                id="min-amount"
                type="number"
                min={0}
                value={minAmountDraft}
                onChange={(e) => setMinAmountDraft(e.target.value)}
              />
              <div className="text-xs text-slate-500">
                現在の設定: ¥{settings.minAmount.toLocaleString("ja-JP")}
              </div>
            </div>

            <div className="col-span-2 space-y-3">
              <Label className="text-sm">計算方式</Label>
              <RadioGroup
                value={methodDraft}
                onValueChange={(v) => setMethodDraft(v as FeeCalcMethod)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="flat" id="calc-flat" />
                  <Label htmlFor="calc-flat" className="cursor-pointer text-sm font-normal">
                    固定率（全取引に同一の料率を適用）
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="tiered" id="calc-tiered" />
                  <Label htmlFor="calc-tiered" className="cursor-pointer text-sm font-normal">
                    段階制（取引額に応じて料率を変動）
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={!isDirty}
              onClick={() => {
                setRateDraft(settings.defaultRate);
                setMinAmountDraft(String(settings.minAmount));
                setMethodDraft(settings.calcMethod);
              }}
            >
              リセット
            </Button>
            <Button disabled={!isDirty} onClick={handleSaveGlobal}>
              設定を保存
            </Button>
          </div>
        </div>

        {/* 加盟店別オーバーライド */}
        <div className={cardCls}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">加盟店別オーバーライド</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                個別に手数料率を設定している加盟店（{overrideRows.length} 件）
              </p>
            </div>
            <Button onClick={() => setOverrideOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              オーバーライド追加
            </Button>
          </div>
          <DataTable<Affiliate>
            columns={overrideColumns}
            data={overrideRows}
            rowKey={(a) => a.id}
            emptyTitle="オーバーライドはまだ設定されていません"
            emptyDescription="「+ オーバーライド追加」で、特定の加盟店に異なる手数料率を適用できます。"
          />
        </div>

        {/* 変更履歴 */}
        <div className={cardCls}>
          <SectionHeader
            title="変更履歴"
            description="手数料設定の変更ログ（最新順）"
            icon={<History className="h-4 w-4" />}
          />
          <ul className="divide-y">
            {history.slice(0, 8).map((log) => (
              <li key={log.id} className="flex items-start gap-4 py-3">
                <span className="w-[150px] flex-shrink-0 font-mono text-xs text-slate-500">
                  {log.changedAt}
                </span>
                <span className="w-[80px] flex-shrink-0 text-xs text-slate-500">{log.changedBy}</span>
                <span className="text-sm text-slate-800">{log.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FeeOverrideDialog open={overrideOpen} onOpenChange={setOverrideOpen} />
      <FeeRateChangeDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) {
            // 確認 close — もしまだ rate が反映されていなければ draft を維持
          }
        }}
        newRate={rateDraft}
        oldRate={settings.defaultRate}
      />
    </AdminLayout>
  );
};

export default FeeSettings;
