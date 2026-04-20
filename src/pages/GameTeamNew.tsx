import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InnerPageLayout from "@/components/InnerPageLayout";
import BottomNav from "@/components/BottomNav";
import { useGameStore, getPlayerPool } from "@/lib/gameStore";
import { Users, UserPlus, Check, Search } from "lucide-react";
import { useUserProfile } from "@/lib/userProfileStore";

const GameTeamNew = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { sendInvite, getSentInvitesByUser, replacePartner } = useGameStore();
  const pool = getPlayerPool();
  const sent = getSentInvitesByUser();
  const location = useLocation();
  const replacingTeamId = (location.state as { replacingTeamId?: string } | null)?.replacingTeamId;

  const [query, setQuery] = useState("");
  const [teamName, setTeamName] = useState(`チーム${profile.name.split(" ")[0]}`);

  // Multi-team allowed — no redirect when user already has a team

  const filtered = pool.filter((p) => !query || p.name.includes(query) || p.level.includes(query));
  const sentUserIds = new Set(sent.map((s) => s.toUserId));

  const handleInvite = (userId: string, name: string) => {
    if (!teamName.trim()) return;
    if (replacingTeamId) {
      replacePartner(replacingTeamId, userId, name);
      navigate("/game", { replace: true });
    } else {
      sendInvite(userId, name, teamName.trim());
    }
  };

  return (
    <InnerPageLayout title={replacingTeamId ? "メンバーを変更" : "チームを組む"} onBack={() => navigate(-1)} bottomNav={<BottomNav active={2} />}>
      <div className="space-y-4 pb-6">
        {/* Team name input */}
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1.5">チーム名</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-[6px] border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="パートナーを検索"
            className="w-full h-10 pl-9 pr-3 text-sm rounded-[6px] border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Sent invites */}
        {sent.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2">招待中</p>
            <div className="space-y-1.5">
              {sent.map((s) => (
                <div key={s.id} className="bg-muted/30 border border-border rounded-[8px] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.toUserName}</p>
                    <p className="text-[11px] text-muted-foreground">「{s.teamName}」— 承諾待ち</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player list */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">プレイヤー</p>
          <div className="space-y-1.5">
            {filtered.map((p) => {
              const alreadyInvited = sentUserIds.has(p.userId);
              return (
                <div key={p.userId} className="bg-card border border-border rounded-[8px] p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.level} · {p.wins}勝 {p.losses}敗</p>
                  </div>
                  {alreadyInvited ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5" />
                      送信済み
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInvite(p.userId, p.name)}
                      disabled={!teamName.trim()}
                      className="flex items-center gap-1 text-primary text-xs font-bold px-3 py-1.5 rounded-[4px] border border-primary/30 disabled:opacity-40 hover:bg-primary/5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      誘う
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </InnerPageLayout>
  );
};

export default GameTeamNew;
