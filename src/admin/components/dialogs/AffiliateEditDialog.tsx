import { useEffect, useState } from "react";
import { toast } from "sonner";

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

import { updateAffiliate, type Affiliate } from "../../lib/adminAffiliatesStore";
import { AFFILIATE_STATUS_JP, PREFECTURES, type AffiliateStatus } from "../../lib/lstLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate;
}

const AffiliateEditDialog = ({ open, onOpenChange, affiliate }: Props) => {
  const [storeName, setStoreName] = useState(affiliate.storeName);
  const [ownerName, setOwnerName] = useState(affiliate.ownerName);
  const [email, setEmail] = useState(affiliate.email);
  const [phone, setPhone] = useState(affiliate.phone);
  const [address, setAddress] = useState(affiliate.address);
  const [prefecture, setPrefecture] = useState(affiliate.prefecture);
  const [status, setStatus] = useState<AffiliateStatus>(affiliate.status);

  useEffect(() => {
    if (open) {
      setStoreName(affiliate.storeName);
      setOwnerName(affiliate.ownerName);
      setEmail(affiliate.email);
      setPhone(affiliate.phone);
      setAddress(affiliate.address);
      setPrefecture(affiliate.prefecture);
      setStatus(affiliate.status);
    }
  }, [open, affiliate]);

  const canSubmit =
    storeName.trim() !== "" &&
    ownerName.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    address.trim() !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    updateAffiliate(affiliate.id, {
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      prefecture,
      status,
    });
    toast.success("加盟店情報を更新しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-lg">
        <AdminDialogHeader>
          <AdminDialogTitle>加盟店情報を編集</AdminDialogTitle>
          <AdminDialogDescription>{affiliate.id}</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-storeName">店舗名</Label>
            <Input id="edit-storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-ownerName">代表者</Label>
              <Input id="edit-ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AffiliateStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AFFILIATE_STATUS_JP) as AffiliateStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {AFFILIATE_STATUS_JP[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">メール</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">電話</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-pref">都道府県</Label>
            <Select value={prefecture} onValueChange={setPrefecture}>
              <SelectTrigger id="edit-pref">
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
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">住所</Label>
            <Textarea id="edit-address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            保存
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default AffiliateEditDialog;
