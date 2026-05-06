import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import {
  useTournamentStore,
  searchPlayersByName,
  findPlayerByEmail,
  findPlayerByPhone,
  PREMIUM_USERS,
  CURRENT_USER,
  type PlayerRef,
} from "@/lib/tournamentStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, AlertCircle, Diamond } from "lucide-react";

type SearchMode = "name" | "email" | "phone";

const TournamentEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament, registerForTournament } = useTournamentStore();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const t = id ? getTournament(id) : undefined;

  const [mode, setMode] = useState<SearchMode>("name");
  const [query, setQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<PlayerRef | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  if (!t) {
    return (
      <InnerPageLayout title="エントリー">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const isDoubles = t.format === "doubles";

  // Search results per mode
  const trimmed = query.trim();
  const nameMatches = mode === "name" && trimmed && !selectedPartner ? searchPlayersByName(trimmed) : [];
  const emailMatch = mode === "email" && trimmed ? findPlayerByEmail(trimmed) : undefined;
  const phoneMatch = mode === "phone" && trimmed ? findPlayerByPhone(trimmed) : undefined;

  const partner: PlayerRef | undefined =
    selectedPartner ?? (mode === "email" ? emailMatch : mode === "phone" ? phoneMatch : undefined);

  const partnerIsPremium = partner ? PREMIUM_USERS.has(partner.userId) : undefined;
  const partnerIsSelf = partner?.userId === CURRENT_USER;
  const canSubmit = !isDoubles || (!!partner && partnerIsPremium && !partnerIsSelf);

  const switchMode = (m: SearchMode) => {
    setMode(m);
    setQuery("");
    setSelectedPartner(undefined);
    setError(null);
  };

  const submit = () => {
    setError(null);
    const result = registerForTournament(t.id, isDoubles ? partner?.userId : undefined);
    if (!result.ok) {
      setError(result.error ?? "エントリーに失敗しました");
      return;
    }
    toast({
      title: isDoubles ? "パートナーに招待を送信しました" : "エントリーが完了しました",
      description: isDoubles ? "72時間以内にパートナーが承諾すると確定します" : undefined,
    });
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

          {/* Mode toggle */}
          <div className="inline-flex bg-muted rounded-full p-1 mb-3">
            {(["name", "email", "phone"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  mode === m ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "name" ? "姓名" : m === "email" ? "メール" : "電話"}
              </button>
            ))}
          </div>

          <input
            type={mode === "email" ? "email" : mode === "phone" ? "tel" : "text"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPartner(undefined);
            }}
            placeholder={
              mode === "name" ? "パートナーの氏名を入力（例：佐藤 花子）"
              : mode === "email" ? "パートナーのメールアドレス"
              : "パートナーの電話番号（例：090-1234-5678）"
            }
            className="w-full bg-card border border-border rounded-[8px] p-3 text-sm text-foreground mb-2"
          />

          {/* Name autocomplete dropdown */}
          {mode === "name" && nameMatches.length > 0 && (
            <div className="bg-card border border-border rounded-[8px] mb-2 divide-y divide-border overflow-hidden">
              {nameMatches.map((p) => {
                const isPrem = PREMIUM_USERS.has(p.userId);
                return (
                  <button
                    key={p.userId}
                    onClick={() => {
                      setSelectedPartner(p);
                      setQuery(p.name);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 text-left"
                  >
                    <span className="text-sm text-foreground">{p.name}</span>
                    {isPrem ? (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                        プレミアム
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">一般</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Verification card — shown when a partner is determined */}
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

          {/* Not found — only for email/phone modes (name mode uses dropdown) */}
          {(mode === "email" || mode === "phone") && trimmed && !partner && (
            <div className="bg-muted border border-border rounded-[8px] p-3 text-xs text-muted-foreground mb-2">
              該当するユーザーが見つかりません
            </div>
          )}

          {/* Name mode: no match found */}
          {mode === "name" && trimmed && !selectedPartner && nameMatches.length === 0 && (
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
