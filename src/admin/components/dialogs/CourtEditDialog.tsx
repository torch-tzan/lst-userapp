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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import courtPlaceholder from "@/assets/court-outdoor.webp";
import { COURTS_DETAIL } from "@/lib/courtData";

import {
  AMENITY_OPTIONS,
  upsertCourtOverride,
  type AdminCourtRecord,
} from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface CourtEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: AdminCourtRecord;
  /**
   * 詳細ページ側で解決済みの「現在の表示住所」。
   * overlay.address があればそれ、無ければ CourtDetail.address。
   * 編集ダイアログの初期値として使う。
   */
  currentAddress?: string;
}

const COURT_TYPES = ["屋外ハード", "室内", "室内ハード", "クレー"] as const;

const CourtEditDialog = ({ open, onOpenChange, court, currentAddress }: CourtEditDialogProps) => {
  const [name, setName] = useState(court.name);
  const [courtName, setCourtName] = useState(court.courtName);
  const [courtType, setCourtType] = useState<string>(court.courtType);
  const [price, setPrice] = useState<string>(String(court.price));
  const [available, setAvailable] = useState(court.available);
  const [address, setAddress] = useState(currentAddress ?? "");
  const [imageUrl, setImageUrl] = useState(court.imageUrl ?? "");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [description, setDescription] = useState(
    court.description ?? COURTS_DETAIL[court.id]?.description ?? "",
  );
  const [amenities, setAmenities] = useState<string[]>(
    court.amenities ?? COURTS_DETAIL[court.id]?.amenities ?? [],
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(court.name);
      setCourtName(court.courtName);
      setCourtType(court.courtType);
      setPrice(String(court.price));
      setAvailable(court.available);
      setAddress(currentAddress ?? "");
      setImageUrl(court.imageUrl ?? "");
      setImagePreviewError(false);
      setDescription(court.description ?? COURTS_DETAIL[court.id]?.description ?? "");
      setAmenities(court.amenities ?? COURTS_DETAIL[court.id]?.amenities ?? []);
      setSubmitting(false);
    }
  }, [open, court, currentAddress]);

  useEffect(() => {
    setImagePreviewError(false);
  }, [imageUrl]);

  const priceNumber = Number.parseInt(price, 10);
  const canSubmit =
    name.trim().length > 0 &&
    courtName.trim().length > 0 &&
    !Number.isNaN(priceNumber) &&
    priceNumber >= 0 &&
    !submitting;

  const toggleAmenity = (a: string) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const trimmedImageUrl = imageUrl.trim();
    const trimmedAddress = address.trim();
    const trimmedDescription = description.trim();
    upsertCourtOverride(court.id, {
      name: name.trim(),
      courtName: courtName.trim(),
      courtType,
      price: priceNumber,
      available,
      // overlay extras — 空文字は undefined にして「クリア」を表現
      imageUrl: trimmedImageUrl.length > 0 ? trimmedImageUrl : undefined,
      address: trimmedAddress.length > 0 ? trimmedAddress : undefined,
      description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
    });
    toast.success("コートを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  const previewSrc =
    !imagePreviewError && imageUrl.trim().length > 0
      ? imageUrl.trim()
      : // overlay imageUrl 未入力時は base image（COURTS の imported asset）を表示
        (court.image ?? courtPlaceholder);

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>コートを編集</AdminDialogTitle>
          <AdminDialogDescription>{court.name} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="court-edit-name">名前（施設名）</Label>
            <Input
              id="court-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-edit-sub">コート名</Label>
            <Input
              id="court-edit-sub"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="court-edit-type">種別</Label>
              <Select value={courtType} onValueChange={setCourtType}>
                <SelectTrigger id="court-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  {/* If incoming court has unusual type, keep it as option */}
                  {COURT_TYPES.includes(court.courtType as (typeof COURT_TYPES)[number])
                    ? null
                    : (
                      <SelectItem value={court.courtType}>{court.courtType}</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="court-edit-price">料金 / 時間（円）</Label>
              <Input
                id="court-edit-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="court-edit-available" className="text-sm font-medium">
                公開状態
              </Label>
              <p className="text-xs text-slate-500">
                {available ? "ユーザーアプリで予約可能" : "非公開（予約不可）"}
              </p>
            </div>
            <Switch
              id="court-edit-available"
              checked={available}
              onCheckedChange={setAvailable}
            />
          </div>

          {/* 画像 URL */}
          <div className="space-y-1.5">
            <Label htmlFor="court-edit-image">画像URL（任意）</Label>
            <Input
              id="court-edit-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or /assets/court-x.webp"
            />
            <div className="flex items-center gap-2 pt-1">
              <img
                src={previewSrc}
                alt="プレビュー"
                onError={() => setImagePreviewError(true)}
                className="h-16 w-16 rounded-md border object-cover"
              />
              <span className="text-xs text-slate-500">
                {imageUrl.trim().length === 0
                  ? "未入力時は既存画像を使用"
                  : imagePreviewError
                    ? "画像を読み込めません — 既存画像を使用します"
                    : "プレビュー"}
              </span>
            </div>
          </div>

          {/* 住所 */}
          <div className="space-y-1.5">
            <Label htmlFor="court-edit-address">住所（任意）</Label>
            <Textarea
              id="court-edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* 説明 */}
          <div className="space-y-1.5">
            <Label htmlFor="court-edit-description">説明（任意）</Label>
            <Textarea
              id="court-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="施設の特徴・利用案内など"
            />
          </div>

          {/* 設備 */}
          <div className="space-y-2">
            <Label>設備（任意）</Label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((a) => {
                const selected = amenities.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      selected
                        ? "border-blue-300 bg-blue-100 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CourtEditDialog;
