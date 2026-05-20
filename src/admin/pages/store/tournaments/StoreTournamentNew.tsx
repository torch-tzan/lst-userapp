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

import { useAdminCourts } from "../../../lib/adminCourtOverlay";
import {
  addStoreTournament,
  TOURNAMENT_FORMAT_JP,
  type TournamentFormat,
} from "../../../lib/adminStoreTournamentsStore";

const cardCls = "rounded-lg border bg-white p-6 shadow-sm";

const CAPACITY_OPTIONS = [8, 16, 32];

const defaultHeldAt = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};
const defaultDeadline = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 11);
  return d.toISOString().slice(0, 10);
};

const StoreTournamentNew = () => {
  const navigate = useNavigate();
  const courts = useAdminCourts();

  const [title, setTitle] = useState("");
  const [heldAt, setHeldAt] = useState(defaultHeldAt());
  const [format, setFormat] = useState<TournamentFormat>("singles");
  const [capacity, setCapacity] = useState<number>(16);
  const [venue, setVenue] = useState<string>("");
  const [registrationDeadline, setRegistrationDeadline] = useState(defaultDeadline());
  const [description, setDescription] = useState("");

  const canSubmit =
    title.trim() !== "" && heldAt !== "" && venue !== "" && registrationDeadline !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    addStoreTournament({
      title: title.trim(),
      heldAt,
      format,
      capacity,
      venue,
      registrationDeadline,
      description: description.trim() || undefined,
    });
    toast.success("大会を作成しました");
    navigate("/admin/store/tournaments");
  };

  return (
    <AdminLayout role="store">
      <AdminPageHeader
        title="新規大会"
        breadcrumbs={[
          { label: "店舗" },
          { label: "大会管理", to: "/admin/store/tournaments" },
          { label: "新規" },
        ]}
      />

      <div className="mx-auto max-w-[800px]">
        <div className={cardCls}>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-title">タイトル</Label>
              <Input
                id="t-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="6月度 シングルス大会"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-held">開催日</Label>
                <Input
                  id="t-held"
                  type="date"
                  value={heldAt}
                  onChange={(e) => setHeldAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-deadline">登録締切</Label>
                <Input
                  id="t-deadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-format">種別</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as TournamentFormat)}
                >
                  <SelectTrigger id="t-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TOURNAMENT_FORMAT_JP) as TournamentFormat[]).map((f) => (
                      <SelectItem key={f} value={f}>
                        {TOURNAMENT_FORMAT_JP[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-capacity">定員</Label>
                <Select
                  value={String(capacity)}
                  onValueChange={(v) => setCapacity(Number.parseInt(v, 10))}
                >
                  <SelectTrigger id="t-capacity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        {c} 名
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-venue">会場</Label>
              <Select value={venue} onValueChange={setVenue}>
                <SelectTrigger id="t-venue">
                  <SelectValue placeholder="会場を選択" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="全コート">全コート</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-desc">説明（任意）</Label>
              <Textarea
                id="t-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="大会の概要、参加条件など"
                rows={4}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/store/tournaments")}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              作成
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StoreTournamentNew;
