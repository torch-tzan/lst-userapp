import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, findPlayerByName, PREMIUM_USERS, CURRENT_USER } from "@/lib/tournamentStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { Check, X, AlertCircle, Diamond } from "lucide-react";

const TournamentEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament, registerForTournament } = useTournamentStore();
  const { profile } = useUserProfile();

  const t = id ? getTournament(id) : undefined;
  const [partnerName, setPartnerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!t) {
    return (
      <InnerPageLayout title="エントリー">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isDoubles = t.format === "doubles";
  const partner = partnerName.trim() ? findPlayerByName(partnerName.trim()) : undefined;
  const partnerIsPremium = partner ? PREMIUM_USERS.has(partner.userId) : undefined;
  const partnerIsSelf = partner?.userId === CURRENT_USER;
  const canSubmit = !isDoubles || (!!partner && partnerIsPremium && !partnerIsSelf);

  const submit = () => {
    setError(null);
    const result = registerForTournament(t.id, isDoubles ? partner?.userId : undefined);
    if (!result.ok) {
      setError(result.error ?? "エントリーに失敗しました");
      return;
    }
    navigate(`/game/tournament/${t.id}`);
  };

  return (
    <InnerPageLayout
      title="エントリー確認"
      ctaLabel="エントリーを確定する"
      ctaDisabled={!canSubmit}
      onCtaClick={submit}
    >
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4">
        <p className="text-sm font-bold text-foreground">{t.title}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {t.format === "singles" ? "シングルス" : "ダブルス"} / {t.capacity}枠
        </p>
      </div>

      <p className="text-sm font-bold text-foreground mb-2">代表者</p>
      <div className="bg-card border border-border rounded-[8px] p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Diamond className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{profile.name}</p>
          <p className="text-[11px] text-primary font-bold">プレミアム会員</p>
        </div>
      </div>

      {isDoubles && (
        <>
          <p className="text-sm font-bold text-foreground mb-2">パートナー</p>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="パートナーの氏名を入力（例：佐藤 花子）"
            className="w-full bg-card border border-border rounded-[8px] p-3 text-sm text-foreground mb-2"
          />

          {partner && partnerIsSelf && (
            <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-destructive" />
              <p className="text-xs text-destructive">自分自身は指定できません</p>
            </div>
          )}

          {partner && !partnerIsSelf && partnerIsPremium && (
            <div className="bg-primary/5 border border-primary/30 rounded-[8px] p-3 flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">{partner.name}</p>
                <p className="text-[11px] text-primary">プレミアム会員 / エントリー可能</p>
              </div>
            </div>
          )}

          {partner && !partnerIsSelf && !partnerIsPremium && (
            <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-accent-yellow flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {partner.name} さんはプレミアム会員ではありません
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  パートナーがプレミアム会員でないとエントリーできません。<br />
                  相手にプレミアム登録を依頼してください。
                </p>
              </div>
            </div>
          )}

          {partnerName.trim() && !partner && (
            <div className="bg-muted border border-border rounded-[8px] p-3 text-xs text-muted-foreground mb-2">
              該当するユーザーが見つかりません
            </div>
          )}
        </>
      )}

      {error && (
        <div className="bg-destructive/5 border border-destructive/30 rounded-[8px] p-3 text-xs text-destructive mt-2">
          {error}
        </div>
      )}
    </InnerPageLayout>
  );
};

export default TournamentEntry;
