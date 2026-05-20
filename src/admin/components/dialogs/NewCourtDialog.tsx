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

import {
  AMENITY_OPTIONS,
  addCourtToOverlay,
  generateNextCourtId,
} from "../../lib/adminCourtOverlay";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface NewCourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (courtId: string) => void;
}

const COURT_TYPES = ["屋外ハード", "室内", "室内ハード", "クレー"] as const;

const NewCourtDialog = ({ open, onOpenChange, onCreated }: NewCourtDialogProps) => {
  const [name, setName] = useState("");
  const [courtName, setCourtName] = useState("");
  const [courtType, setCourtType] = useState<string>(COURT_TYPES[0]);
  const [price, setPrice] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open transitions
  useEffect(() => {
    if (open) {
      setName("");
      setCourtName("");
      setCourtType(COURT_TYPES[0]);
      setPrice("");
      setAvailable(true);
      setAddress("");
      setImageUrl("");
      setImagePreviewError(false);
      setDescription("");
      setAmenities([]);
      setSubmitting(false);
    }
  }, [open]);

  // image URL が変わったら error state をリセット（onError で再評価）
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
    const newId = generateNextCourtId();
    const trimmedImageUrl = imageUrl.trim();
    const trimmedAddress = address.trim();
    const trimmedDescription = description.trim();
    addCourtToOverlay({
      id: newId,
      name: name.trim(),
      courtName: courtName.trim(),
      courtType,
      price: priceNumber,
      // base image：URL があれば URL、無ければ placeholder asset。
      // image field は src で必須なのでここで決定する。
      image: trimmedImageUrl.length > 0 ? trimmedImageUrl : courtPlaceholder,
      available,
      imageUrl: trimmedImageUrl.length > 0 ? trimmedImageUrl : undefined,
      address: trimmedAddress.length > 0 ? trimmedAddress : undefined,
      description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
    });
    toast.success("コートを作成しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(newId);
  };

  const previewSrc =
    !imagePreviewError && imageUrl.trim().length > 0 ? imageUrl.trim() : courtPlaceholder;

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>新規コート</AdminDialogTitle>
          <AdminDialogDescription>店舗で管理するコートを追加します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="court-name">名前（施設名）</Label>
            <Input
              id="court-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="パデルコート広島"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="court-sub">コート名</Label>
            <Input
              id="court-sub"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="コートA"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="court-type">種別</Label>
              <Select value={courtType} onValueChange={setCourtType}>
                <SelectTrigger id="court-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="court-price">料金 / 時間（円）</Label>
              <Input
                id="court-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="court-available" className="text-sm font-medium">
                公開状態
              </Label>
              <p className="text-xs text-slate-500">
                {available ? "ユーザーアプリで予約可能" : "非公開（予約不可）"}
              </p>
            </div>
            <Switch id="court-available" checked={available} onCheckedChange={setAvailable} />
          </div>

          {/* 画像 URL */}
          <div className="space-y-1.5">
            <Label htmlFor="court-image">画像URL（任意）</Label>
            <Input
              id="court-image"
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
                  ? "未入力時は標準画像を使用"
                  : imagePreviewError
                    ? "画像を読み込めません — 標準画像を使用します"
                    : "プレビュー"}
              </span>
            </div>
          </div>

          {/* 住所 */}
          <div className="space-y-1.5">
            <Label htmlFor="court-address">住所（任意）</Label>
            <Textarea
              id="court-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="広島県広島市中区..."
            />
          </div>

          {/* 説明 */}
          <div className="space-y-1.5">
            <Label htmlFor="court-description">説明（任意）</Label>
            <Textarea
              id="court-description"
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
            作成する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default NewCourtDialog;
