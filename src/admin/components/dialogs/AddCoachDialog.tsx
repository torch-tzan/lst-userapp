import { Plus, X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
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

import coachDefaultAvatar from "@/assets/coach-1.webp";

import { addCoachToOverlay } from "../../lib/adminCoachesOverlay";
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
  onCreated?: (id: string) => void;
}

const LEVEL_OPTIONS = ["S級", "A級", "B級", "C級"];

const AddCoachDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("A級");
  const [specialty, setSpecialty] = useState("");
  const [area, setArea] = useState("");
  const [pricePerHour, setPricePerHour] = useState("4000");
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setLevel("A級");
      setSpecialty("");
      setArea("");
      setPricePerHour("4000");
      setOnlineAvailable(false);
      setReviewAvailable(false);
      setAvatarUrl("");
      setAvatarError(false);
      setBio("");
      setExperience("");
      setLocation("");
      setCertifications([]);
      setCertInput("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const priceNum = Number.parseInt(pricePerHour, 10);
  const canSubmit =
    name.trim().length > 0 &&
    area.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
    priceNum > 0 &&
    !submitting;

  const addCertification = () => {
    const v = certInput.trim();
    if (v.length === 0) return;
    if (certifications.includes(v)) {
      setCertInput("");
      return;
    }
    setCertifications([...certifications, v]);
    setCertInput("");
  };

  const removeCertification = (v: string) => {
    setCertifications(certifications.filter((c) => c !== v));
  };

  const handleCertKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCertification();
    }
  };

  const trimmedAvatarUrl = avatarUrl.trim();
  const previewSrc =
    trimmedAvatarUrl.length > 0 && !avatarError ? trimmedAvatarUrl : null;
  const nameInitial = name.trim().slice(0, 1) || "—";

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const id = addCoachToOverlay({
      name: name.trim(),
      level,
      specialty: specialty
        .split(/[,、，]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      area: area.trim(),
      pricePerHour: priceNum,
      onlineAvailable,
      reviewAvailable,
      avatar: coachDefaultAvatar,
      avatarUrl: trimmedAvatarUrl.length > 0 ? trimmedAvatarUrl : undefined,
      bio: bio.trim().length > 0 ? bio.trim() : undefined,
      experience: experience.trim().length > 0 ? experience.trim() : undefined,
      location: location.trim().length > 0 ? location.trim() : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
    });
    toast.success("コーチを追加しました");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-md">
        <AdminDialogHeader>
          <AdminDialogTitle>コーチ追加</AdminDialogTitle>
          <AdminDialogDescription>新しいコーチを登録します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="coach-name">名前</Label>
            <Input id="coach-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-avatar">アバターURL</Label>
            <div className="flex items-center gap-3">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="avatar preview"
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-medium text-slate-500">
                  {nameInitial}
                </div>
              )}
              <Input
                id="coach-avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
            </div>
            {avatarError && trimmedAvatarUrl.length > 0 ? (
              <p className="text-xs text-rose-600">画像を読み込めませんでした</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="coach-level">レベル</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="coach-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      {lv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-area">エリア</Label>
              <Input
                id="coach-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="例: 広島市中区"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-specialty">専門（カンマ区切り）</Label>
            <Input
              id="coach-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="初心者指導, フォーム改善, 体力強化"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-price">料金（円 / h）</Label>
            <Input
              id="coach-price"
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-location">拠点</Label>
            <Input
              id="coach-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="広島県広島市中区"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-bio">経歴</Label>
            <Textarea
              id="coach-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="パデル歴10年。初心者から中級者まで..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-experience">経験</Label>
            <Textarea
              id="coach-experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              placeholder="指導歴8年・JPA公認コーチ"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-cert">資格・認定</Label>
            <div className="flex items-center gap-2">
              <Input
                id="coach-cert"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={handleCertKey}
                placeholder="例: JPA公認A級"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertification}
                disabled={certInput.trim().length === 0}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                追加
              </Button>
            </div>
            {certifications.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCertification(c)}
                      className="rounded-full text-slate-500 hover:text-slate-800"
                      aria-label={`${c} を削除`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="coach-online" className="cursor-pointer">
              オンライン対応
            </Label>
            <Switch
              id="coach-online"
              checked={onlineAvailable}
              onCheckedChange={setOnlineAvailable}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="coach-review" className="cursor-pointer">
              振り返り（動画レビュー）対応
            </Label>
            <Switch
              id="coach-review"
              checked={reviewAvailable}
              onCheckedChange={setReviewAvailable}
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            追加する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default AddCoachDialog;
