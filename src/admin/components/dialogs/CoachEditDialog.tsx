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
import { COACHES_DETAIL, type CoachDetail, type CoachSummary } from "@/lib/coachData";

import {
  getCoachDetailOverlay,
  updateCoachOverlay,
  type CoachDetailOverlayFields,
} from "../../lib/adminCoachesOverlay";
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
  coach: CoachSummary | CoachDetail;
}

const LEVEL_OPTIONS = ["S級", "A級", "B級", "C級"];

const dedupe = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};

const CoachEditDialog = ({ open, onOpenChange, coach }: Props) => {
  const [name, setName] = useState(coach.name);
  const [level, setLevel] = useState(coach.level);
  const [specialty, setSpecialty] = useState(coach.specialty.join(", "));
  const [area, setArea] = useState(coach.area);
  const [pricePerHour, setPricePerHour] = useState(String(coach.pricePerHour));
  const [onlineAvailable, setOnlineAvailable] = useState(coach.onlineAvailable);
  const [reviewAvailable, setReviewAvailable] = useState(coach.reviewAvailable);
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
      setName(coach.name);
      setLevel(coach.level);
      setSpecialty(coach.specialty.join(", "));
      setArea(coach.area);
      setPricePerHour(String(coach.pricePerHour));
      setOnlineAvailable(coach.onlineAvailable);
      setReviewAvailable(coach.reviewAvailable);

      // 既存 detail or overlay から初期値を pre-fill
      const baseDetail: CoachDetail | undefined = COACHES_DETAIL[coach.id];
      const overlay = getCoachDetailOverlay(coach.id);

      setAvatarUrl(overlay?.avatarUrl ?? "");
      setAvatarError(false);
      setBio(overlay?.bio ?? baseDetail?.bio ?? "");
      setExperience(overlay?.experience ?? baseDetail?.experience ?? "");
      setLocation(overlay?.location ?? baseDetail?.location ?? "");
      setCertifications(
        dedupe([
          ...(baseDetail?.certifications ?? []),
          ...(overlay?.certifications ?? []),
        ]),
      );
      setCertInput("");
      setSubmitting(false);
    }
  }, [open, coach]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const priceNum = Number.parseInt(pricePerHour, 10);
  const canSubmit =
    name.trim().length > 0 &&
    area.trim().length > 0 &&
    !Number.isNaN(priceNum) &&
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
    trimmedAvatarUrl.length > 0 && !avatarError ? trimmedAvatarUrl : coach.avatar;
  const showFallback = trimmedAvatarUrl.length > 0 && avatarError;
  const nameInitial = name.trim().slice(0, 1) || "—";

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const summaryPatch: Partial<CoachSummary> = {
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
    };
    // avatar も summary に反映（list で URL がそのまま使われるように）
    if (trimmedAvatarUrl.length > 0) {
      summaryPatch.avatar = trimmedAvatarUrl;
    }

    const detailPatch: CoachDetailOverlayFields = {
      avatarUrl: trimmedAvatarUrl.length > 0 ? trimmedAvatarUrl : undefined,
      bio: bio.trim().length > 0 ? bio.trim() : undefined,
      experience: experience.trim().length > 0 ? experience.trim() : undefined,
      location: location.trim().length > 0 ? location.trim() : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
    };

    updateCoachOverlay(coach.id, summaryPatch, detailPatch);
    toast.success("コーチを更新しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>コーチを編集</AdminDialogTitle>
          <AdminDialogDescription>{coach.name} を更新します。</AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ce-name">名前</Label>
            <Input id="ce-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-avatar">アバターURL</Label>
            <div className="flex items-center gap-3">
              {showFallback ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-medium text-slate-500">
                  {nameInitial}
                </div>
              ) : (
                <img
                  src={previewSrc}
                  alt="avatar preview"
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                  onError={() => setAvatarError(true)}
                />
              )}
              <Input
                id="ce-avatar"
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
              <Label htmlFor="ce-level">レベル</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="ce-level">
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
              <Label htmlFor="ce-area">エリア</Label>
              <Input id="ce-area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-specialty">専門（カンマ区切り）</Label>
            <Input
              id="ce-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-price">料金（円 / h）</Label>
            <Input
              id="ce-price"
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-location">拠点</Label>
            <Input
              id="ce-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="広島県広島市中区"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-bio">経歴</Label>
            <Textarea
              id="ce-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="パデル歴10年。初心者から中級者まで..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-experience">経験</Label>
            <Textarea
              id="ce-experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              placeholder="指導歴8年・JPA公認コーチ"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ce-cert">資格・認定</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ce-cert"
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
            <Label htmlFor="ce-online" className="cursor-pointer">
              オンライン対応
            </Label>
            <Switch
              id="ce-online"
              checked={onlineAvailable}
              onCheckedChange={setOnlineAvailable}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="ce-review" className="cursor-pointer">
              振り返り対応
            </Label>
            <Switch
              id="ce-review"
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
            更新する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default CoachEditDialog;
