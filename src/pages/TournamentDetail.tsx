import { useNavigate, useParams } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import { useTournamentStore, CURRENT_USER, getPlayer } from "@/lib/tournamentStore";
import { useSubscription } from "@/lib/subscriptionStore";
import { Calendar, MapPin, Users, Trophy, Diamond, Lock, Phone, Train, Info, Clock } from "lucide-react";

function formatDateTimeJP(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const ROUND_LABEL: Record<number, string> = {
  1: "1回戦",
  2: "準決勝",
  3: "決勝",
  4: "決勝",
};

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTournament } = useTournamentStore();
  const sub = useSubscription();
  const isPremium = sub.isPremium();

  const t = id ? getTournament(id) : undefined;

  if (!t) {
    return (
      <InnerPageLayout title="大会詳細">
        <p className="text-center text-sm text-muted-foreground">大会が見つかりません</p>
      </InnerPageLayout>
    );
  }

  const myEntry = t.entries.find(
    (e) =>
      (e.status === "confirmed" || e.status === "pending_partner_confirmation") &&
      (e.registrantUserId === CURRENT_USER || e.partnerUserId === CURRENT_USER)
  );
  const isOpen = t.status === "registration_open";
  const canRegister = isOpen && !myEntry && t.entries.length < t.capacity;

  const handleEntry = () => {
    if (!isPremium) {
      navigate("/premium/plan");
      return;
    }
    navigate(`/game/tournament/${t.id}/entry`);
  };

  return (
    <InnerPageLayout
      title="大会詳細"
      ctaLabel={
        myEntry
          ? myEntry.status === "pending_partner_confirmation"
            ? "パートナー確認待ち"
            : "エントリー済"
          : !isOpen
          ? undefined
          : !canRegister
          ? "定員に達しました"
          : isPremium
          ? "エントリーする"
          : "プレミアム会員になってエントリー"
      }
      ctaDisabled={!!myEntry || !canRegister}
      onCtaClick={handleEntry}
    >
      {/* Hero image */}
      {t.heroImageUrl && (
        <div className="-mx-[20px] -mt-6 mb-4 aspect-video bg-muted overflow-hidden">
          <img src={t.heroImageUrl} alt={t.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-4">
        <p className="text-base font-bold text-foreground">{t.title}</p>
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateTimeJP(t.scheduledAt)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t.venue}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            {t.format === "singles" ? "シングルス" : "ダブルス"} / 上限 {t.capacity} 枠
          </p>
        </div>
        {isOpen && (
          <div className="bg-muted rounded-[6px] p-2 mt-3 text-[11px] text-foreground">
            エントリー受付中：{t.entries.length} / {t.capacity}
            締切 {formatDateTimeJP(t.registrationDeadline)}
          </div>
        )}
        {myEntry && myEntry.status === "confirmed" && (
          <div className="bg-primary/10 text-primary rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
            <Diamond className="w-3 h-3" />
            エントリー済
            {myEntry.partnerUserId && ` ・ パートナー: ${getPlayer(myEntry.partnerUserId)?.name ?? "—"}`}
          </div>
        )}
        {myEntry && myEntry.status === "pending_partner_confirmation" && (
          <div className="bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 rounded-[6px] p-2 mt-3 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {myEntry.registrantUserId === CURRENT_USER
              ? `パートナー確認待ち (${getPlayer(myEntry.partnerUserId ?? "")?.name ?? "—"})`
              : "あなたの承諾待ち"}
          </div>
        )}
      </div>

      {/* Description */}
      {t.description && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-muted-foreground" />
            大会について
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.description}</p>
        </section>
      )}

      {/* Access */}
      {t.accessInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Train className="w-4 h-4 text-muted-foreground" />
            アクセス
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.accessInfo}</p>
        </section>
      )}

      {/* Contact */}
      {t.contactInfo && (
        <section className="mb-4">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" />
            お問い合わせ
          </p>
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{t.contactInfo}</p>
        </section>
      )}

      {/* Premium gating notice for non-premium */}
      {isOpen && !isPremium && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 flex gap-2 mb-4">
          <Lock className="w-5 h-5 text-accent-yellow flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">プレミアム会員限定</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              月額 ¥500 のプレミアム会員になると大会エントリーが可能になります。
            </p>
          </div>
        </div>
      )}

      {/* Completed: bracket + rankings */}
      {t.status === "completed" && t.results && (
        <>
          <p className="text-sm font-bold text-foreground mt-2 mb-2 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            最終結果
          </p>
          <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden mb-4">
            {t.results.rankings.map((r) => {
              const isMine = r.userId === CURRENT_USER || r.partnerId === CURRENT_USER;
              const player = getPlayer(r.userId);
              const partner = r.partnerId ? getPlayer(r.partnerId) : undefined;
              return (
                <div key={r.rank} className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}>
                  <div className="w-8 text-center font-bold text-sm text-muted-foreground">{r.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                      {player?.name ?? r.userId}
                      {partner && ` × ${partner.name}`}
                      {isMine && <span className="text-[10px] ml-1">（自分）</span>}
                    </p>
                  </div>
                  {r.rank <= 3 && (
                    <Trophy
                      className={`w-4 h-4 ${
                        r.rank === 1 ? "text-yellow-600" : r.rank === 2 ? "text-gray-400" : "text-amber-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm font-bold text-foreground mb-2">対戦記録</p>
          <div className="space-y-1.5 mb-4">
            {t.results.matches.map((m, i) => {
              const p1 = getPlayer(m.p1UserId)?.name ?? m.p1UserId;
              const p2 = getPlayer(m.p2UserId)?.name ?? m.p2UserId;
              const winner = m.winnerSide === 1 ? p1 : p2;
              return (
                <div key={i} className="bg-card border border-border rounded-[6px] p-2.5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground">{ROUND_LABEL[m.round]}</span>
                  <span className="text-foreground flex-1 mx-2 text-center">{p1} vs {p2}</span>
                  <span className="text-foreground font-bold">{m.score}</span>
                  <span className="text-[10px] text-primary ml-2">勝: {winner.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </InnerPageLayout>
  );
};

export default TournamentDetail;
