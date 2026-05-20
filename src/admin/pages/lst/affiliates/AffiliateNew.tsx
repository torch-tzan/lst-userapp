import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AdminLayout from "../../../components/AdminLayout";
import AdminPageHeader from "../../../components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { addAffiliate } from "../../../lib/adminAffiliatesStore";
import { PREFECTURES } from "../../../lib/lstLabels";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const AffiliateNew = () => {
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [prefecture, setPrefecture] = useState<string>(PREFECTURES[0]);
  const [openedAt, setOpenedAt] = useState("");
  const [contractStartAt, setContractStartAt] = useState("");
  const [feeRate, setFeeRate] = useState<string>("10");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const feeNum = Number.parseFloat(feeRate);
  const canSubmit =
    storeName.trim() !== "" &&
    ownerName.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    address.trim() !== "" &&
    openedAt !== "" &&
    contractStartAt !== "" &&
    !Number.isNaN(feeNum) &&
    feeNum >= 0 &&
    feeNum <= 30 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    addAffiliate({
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      prefecture,
      openedAt,
      contractStartAt,
      feeRateOverride: feeNum,
      avatarUrl: avatarUrl.trim() || undefined,
    });
    toast.success("加盟店を追加しました");
    setSubmitting(false);
    navigate("/admin/lst/affiliates");
  };

  return (
    <AdminLayout role="lst">
      <AdminPageHeader
        title="新規加盟店追加"
        description="加盟店オンボーディング情報を入力します"
        breadcrumbs={[
          { label: "LST HQ" },
          { label: "加盟店管理", to: "/admin/lst/affiliates" },
          { label: "新規追加" },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/lst/affiliates")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            一覧へ戻る
          </Button>
        }
      />

      <div className="mx-auto max-w-[800px] space-y-6">
        <div className={cardCls}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">店舗基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="storeName">店舗名 *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="パデルコート◯◯"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ownerName">代表者 *</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="山田 太郎"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">メール *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.jp"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">電話 *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefecture">都道府県 *</Label>
              <Select value={prefecture} onValueChange={setPrefecture}>
                <SelectTrigger id="prefecture">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="address">住所 *</Label>
              <Textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="◯◯県◯◯市◯◯町1-2-3"
              />
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">契約情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="openedAt">開業日 *</Label>
              <Input
                id="openedAt"
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractStartAt">契約開始日 *</Label>
              <Input
                id="contractStartAt"
                type="date"
                value={contractStartAt}
                onChange={(e) => setContractStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feeRate">初期手数料率（%）*</Label>
              <Input
                id="feeRate"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={feeRate}
                onChange={(e) => setFeeRate(e.target.value)}
              />
              <p className="text-xs text-slate-500">既定値 10%。0–30% の範囲で設定してください。</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">アバター URL（任意）</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/lst/affiliates")}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            加盟店を追加
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AffiliateNew;
