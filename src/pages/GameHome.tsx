import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import BottomNav from "@/components/BottomNav";
import AnimatedTabs from "@/components/AnimatedTabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGameStore, getISOWeekKey, getPreviousWeekKey, formatWeekLabel, formatWeekRange, CURRENT_USER } from "@/lib/gameStore";
import { useUserProfile } from "@/lib/userProfileStore";
import { UserPlus, Swords, Trophy, Clock, Check, X, AlertCircle, Bell, Sparkles, MapPin, ChevronRight, Users } from "lucide-react";

const GameHome = () => {
  const navigate = useNavigate();
  const thisWeek = getISOWeekKey();
  const { profile } = useUserProfile();
  const {
    getUserTeam,
    getUserTeams,
    getUserMatches,
    getPendingInvitesForUser,
    getSentInvitesByUser,
    getActiveTeams,
    getTeam,
    acceptInvite,
    declineInvite,
    cancelSentInvite,
    getWeeklyRanking,
    getMatchedBookingForMatch,
  } = useGameStore();
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);

  const myTeams = getUserTeams();
  const myTeam = getUserTeam(); // primary for hero stats
  const myMatches = getUserMatches(thisWeek);
  const invites = getPendingInvitesForUser();
  const sentInvites = getSentInvitesByUser();
  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const otherTeams = getActiveTeams().filter((t) => !myTeamIds.has(t.id));

  // Hero shows current week's progress (aggregated across my teams)
  const currentWeekRanking = getWeeklyRanking(thisWeek);
  const myCurrentWeekStats = myTeams.reduce(
    (acc, t) => {
      const r = currentWeekRanking.find((r) => r.teamId === t.id);
      return r ? { wins: acc.wins + r.wins, losses: acc.losses + r.losses, xp: acc.xp + r.xp } : acc;
    },
    { wins: 0, losses: 0, xp: 0 }
  );

  // Last week's ranking (Duolingo-style — final, not in-progress)
  const prevWeek = getPreviousWeekKey(thisWeek);
  const lastWeekRanking = getWeeklyRanking(prevWeek);
  const myLastWeekRank = myTeam ? lastWeekRanking.findIndex((r) => myTeamIds.has(r.teamId)) : -1;

  const isCarriedOver = !!myTeam && myTeam.weekKey !== thisWeek;

  const statusLabel = (m: { status: string; proposedBy: string }) => {
    if (m.status === "proposed") return m.proposedBy === CURRENT_USER ? "相手の承諾待ち" : "自チーム承諾待ち";
    if (m.status === "scheduled") return "対戦予定";
    if (m.status === "pending_confirmation") return "結果確認待ち";
    if (m.status === "completed") return "完了";
    if (m.status === "cancelled") return "キャンセル";
    if (m.status === "declined") return "辞退";
    return m.status;
  };
  const statusCls = (status: string) => {
    if (status === "proposed" || status === "pending_confirmation") return "text-accent-yellow bg-accent-yellow/10";
    if (status === "scheduled") return "text-primary bg-primary/10";
    if (status === "cancelled") return "text-destructive bg-destructive/10";
    return "text-muted-foreground bg-muted";
  };

  // ── Action center items (match-related) ──
  type ActionItem = { icon: typeof Bell; text: string; onClick: () => void };
  const actionItems: ActionItem[] = [];
  myMatches.forEach((m) => {
    const opp = getTeam(m.team1Id === myTeam?.id ? m.team2Id : m.team1Id);
    if (m.status === "proposed" && m.proposedBy !== CURRENT_USER) {
      actionItems.push({
        icon: Swords,
        text: `${opp?.name ?? "相手"}から挑戦が来ています`,
        onClick: () => navigate(`/game/match/${m.id}`),
      });
    }
    if (m.status === "pending_confirmation" && !(m.confirmedBy ?? []).includes(CURRENT_USER)) {
      actionItems.push({
        icon: AlertCircle,
        text: `${opp?.name ?? "相手"}との試合結果を確認してください`,
        onClick: () => navigate(`/game/match/${m.id}`),
      });
    }
    if (m.status === "scheduled" && m.scheduledAt) {
      const hoursTo = (new Date(m.scheduledAt).getTime() - Date.now()) / 3600000;
      const booking = getMatchedBookingForMatch(m);
      if (!booking && hoursTo > 0 && hoursTo < 24) {
        actionItems.push({
          icon: MapPin,
          text: `対戦まで${Math.ceil(hoursTo)}時間、場地予約がまだです`,
          onClick: () => navigate(`/game/match/${m.id}`),
        });
      }
    }
  });

  const formatAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}時間前`;
    return `${Math.floor(hrs / 24)}日前`;
  };

  // Tab badges
  const teamBadge = invites.length;
  const matchBadge = actionItems.length;

  const TABS = [
    { key: "team", label: "組隊", badge: teamBadge || undefined },
    { key: "match", label: "対戦申請", badge: matchBadge || undefined },
    { key: "ranking", label: "ランキング" },
  ];
  const [tab, setTab] = useState<string>("team");

  return (
    <PhoneMockup bottomNav={<BottomNav active={2} />}>
      <div className="bg-background pb-4">
        {/* Dark Header */}
        <header className="bg-gray-5 py-3 pb-[120px]">
          <div className="flex items-center justify-center px-[20px]">
            <h1 className="text-lg font-bold text-primary-foreground">ゲーム</h1>
          </div>
        </header>

        {/* Orange hero card (overlaps header) */}
        <div className="-mt-[100px] relative z-10 px-[20px]">
          <div className="rounded-[12px] overflow-hidden shadow-lg bg-primary text-primary-foreground">
            <div className="px-5 py-4">
              <div>
                <p className="text-[11px] font-medium opacity-80">{formatWeekLabel(thisWeek)}</p>
                <p className="text-[11px] opacity-70">{formatWeekRange(thisWeek)}</p>
              </div>

              {myTeam ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-sm font-bold">{myTeam.name}</p>
                    {isCarriedOver && (
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">先週から継続中</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                      <p className="text-[9px] text-muted-foreground">先週順位</p>
                      <p className="text-base font-bold text-primary">{myLastWeekRank >= 0 ? `${myLastWeekRank + 1}位` : "—"}</p>
                      {myLastWeekRank < 0 && <p className="text-[8px] text-muted-foreground leading-tight">記録なし</p>}
                    </div>
                    <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                      <p className="text-[9px] text-muted-foreground">今週XP</p>
                      <p className="text-base font-bold text-primary">{myCurrentWeekStats.xp}</p>
                    </div>
                    <div className="bg-background rounded-[8px] px-2 py-2 text-center text-foreground">
                      <p className="text-[9px] text-muted-foreground">今週戦績</p>
                      <p className="text-base font-bold text-foreground">{myCurrentWeekStats.wins}勝{myCurrentWeekStats.losses}敗</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-base font-bold">今週のゲームに参加しよう</p>
                  <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                    パートナーを見つけてチームを組むと<br />ランキング対戦が始まります
                  </p>
                  <button
                    onClick={() => navigate("/game/team/new")}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-white text-primary py-2.5 rounded-[8px] text-sm font-bold"
                  >
                    <UserPlus className="w-4 h-4" />
                    パートナーを探す
                  </button>
                </div>
              )}
            </div>

            <div className="bg-foreground px-5 py-2.5 flex items-center justify-between text-[11px] text-primary-foreground">
              <span>累計</span>
              <span className="font-bold">{profile.xp.toLocaleString()} XP / {profile.points.toLocaleString()} pt</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5">
          <AnimatedTabs tabs={TABS} activeKey={tab} onChange={setTab} className="px-[20px]" />
        </div>

        {/* Tab content */}
        <div className="px-[20px] mt-4 space-y-5">
          {tab === "team" && (
            <>
              {/* Demoted: low-key entry row */}
              <button
                onClick={() => navigate("/game/team/new")}
                className="w-full bg-card border border-border rounded-[8px] p-3 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">新しいチームを組む</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Pending invites — only header that exists when there are incoming invites */}
              {invites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">
                    チーム招待 <span className="text-primary ml-1">({invites.length})</span>
                  </p>
                  {invites.map((inv) => (
                    <div key={inv.id} className="bg-primary/5 border border-primary/30 rounded-[8px] p-3 space-y-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{inv.teamName}</p>
                        <p className="text-xs text-muted-foreground">{inv.fromUserName}さんから招待されました</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptInvite(inv.id)}
                          className="flex-1 h-9 rounded-[6px] bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          承諾
                        </button>
                        <button
                          onClick={() => declineInvite(inv.id)}
                          className="flex-1 h-9 rounded-[6px] border border-border text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          辞退
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* My teams — absorbs sent invites as ghost rows */}
              {(myTeams.length > 0 || sentInvites.length > 0) && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">
                    マイチーム ({myTeams.length + sentInvites.length})
                  </p>
                  <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                    {myTeams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/game/team/${t.id}`)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {t.members.map((m) => m.name).join(" × ")}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                    {sentInvites.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => setCancelInviteId(inv.id)}
                        className="w-full p-3 flex items-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-muted-foreground truncate">{inv.teamName}</p>
                            <span className="text-[9px] font-bold text-accent-yellow bg-accent-yellow/10 px-1.5 py-0.5 rounded">
                              招待中
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {inv.toUserName}さんに招待中 · {formatAgo(inv.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "match" && (
            <>
              {/* Action center */}
              {actionItems.length > 0 && (
                <div className="bg-accent-yellow/10 border border-accent-yellow/40 rounded-[8px] p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-accent-yellow" />
                    要対応 ({actionItems.length}件)
                  </p>
                  <div className="space-y-1">
                    {actionItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={item.onClick}
                        className="w-full flex items-center justify-between text-left px-2 py-1.5 hover:bg-white/50 rounded"
                      >
                        <span className="flex items-center gap-2 text-xs text-foreground">
                          <item.icon className="w-3.5 h-3.5 text-accent-yellow flex-shrink-0" />
                          {item.text}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!myTeam && (
                <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                  <Swords className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">チームを組むと対戦申請ができます</p>
                  <button
                    onClick={() => setTab("team")}
                    className="text-xs text-primary font-bold"
                  >
                    組隊タブへ →
                  </button>
                </div>
              )}

              {/* My matches */}
              {myTeam && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground">今週の試合</p>
                    <button
                      onClick={() => navigate("/game/match/new")}
                      className="flex items-center gap-1 text-xs text-primary font-bold"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      試合を申込む
                    </button>
                  </div>
                  {myMatches.length === 0 ? (
                    <div className="bg-muted/30 border border-border rounded-[8px] p-4 text-center">
                      <p className="text-xs text-muted-foreground">試合はまだありません</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myMatches.map((match) => {
                        const opponent = getTeam(match.team1Id === myTeam.id ? match.team2Id : match.team1Id);
                        const myScore = match.team1Id === myTeam.id ? match.score1 : match.score2;
                        const oppScore = match.team1Id === myTeam.id ? match.score2 : match.score1;
                        const needsAction =
                          (match.status === "proposed" && match.proposedBy !== CURRENT_USER) ||
                          (match.status === "pending_confirmation" &&
                            !(match.confirmedBy ?? []).includes(CURRENT_USER));
                        return (
                          <button
                            key={match.id}
                            onClick={() => navigate(`/game/match/${match.id}`)}
                            className="w-full bg-card border border-border rounded-[8px] p-3 text-left hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusCls(match.status)}`}>
                                {statusLabel(match)}
                              </span>
                              {needsAction && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-accent-yellow">
                                  <AlertCircle className="w-3 h-3" />
                                  要対応
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-foreground">vs {opponent?.name ?? "?"}</p>
                              {match.status === "completed" || match.status === "pending_confirmation" ? (
                                <p className="text-sm font-bold text-foreground">
                                  {myScore} - {oppScore}
                                </p>
                              ) : match.scheduledAt ? (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(match.scheduledAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Other active teams */}
              {myTeam && otherTeams.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">対戦できるチーム</p>
                  <div className="space-y-2">
                    {otherTeams.map((t) => (
                      <div key={t.id} className="bg-card border border-border rounded-[8px] p-3 flex items-center justify-between">
                        <button onClick={() => navigate(`/game/team/${t.id}`)} className="min-w-0 text-left flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {t.members.map((m) => m.name).join(" × ")}
                          </p>
                        </button>
                        <button
                          onClick={() => navigate(`/game/match/new?vs=${t.id}`)}
                          className="text-xs text-primary font-bold flex items-center gap-1 flex-shrink-0 ml-2"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          挑戦
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "ranking" && (() => {
            const podium = lastWeekRanking.slice(0, 3);
            const myIdx = lastWeekRanking.findIndex((r) => myTeamIds.has(r.teamId));
            // Neighbors: aim for 7 rows around me, anchored after podium
            const N = lastWeekRanking.length;
            let fromIdx: number, toIdx: number;
            if (myIdx < 0) {
              fromIdx = 3; toIdx = Math.min(N, 10);
            } else if (myIdx <= 2) {
              fromIdx = 3; toIdx = Math.min(N, 10);
            } else {
              fromIdx = Math.max(3, myIdx - 3);
              toIdx = Math.min(N, myIdx + 4);
              // expand to keep ~7 rows when near edges
              const want = 7;
              const have = toIdx - fromIdx;
              if (have < want) {
                if (toIdx === N) fromIdx = Math.max(3, fromIdx - (want - have));
                else toIdx = Math.min(N, toIdx + (want - have));
              }
            }
            const neighbors = lastWeekRanking.slice(fromIdx, toIdx);

            return (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">先週のランキング</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatWeekLabel(prevWeek)} · {formatWeekRange(prevWeek)}
                  </p>
                </div>

                {lastWeekRanking.length === 0 ? (
                  <div className="bg-muted/30 border border-border rounded-[8px] p-6 text-center space-y-2">
                    <Trophy className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">先週の結果はありません</p>
                    <p className="text-[10px] text-muted-foreground">今週試合に参加して、来週ランキングに登場しよう</p>
                  </div>
                ) : (
                  <>
                    {/* Podium */}
                    {podium.length >= 3 && (() => {
                      const [first, second, third] = podium;
                      const Step = ({ entry, rank, height, color, bg }: { entry: typeof first; rank: number; height: string; color: string; bg: string }) => {
                        const isMine = myTeamIds.has(entry.teamId);
                        return (
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-1.5 relative`}>
                              <Trophy className={`w-6 h-6 ${color}`} />
                              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold ${color}`}>
                                {rank}
                              </span>
                            </div>
                            <p className={`text-xs font-bold text-center truncate w-full ${isMine ? "text-primary" : "text-foreground"}`}>
                              {entry.teamName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{entry.xp} XP</p>
                            <div className={`w-full mt-1.5 ${bg} rounded-t-[6px]`} style={{ height }}>
                              <p className={`text-center text-base font-bold pt-1 ${color}`}>{rank}</p>
                            </div>
                          </div>
                        );
                      };
                      return (
                        <div className="bg-gradient-to-b from-accent-yellow/5 to-transparent rounded-[8px] p-4">
                          <div className="flex items-end gap-2">
                            <Step entry={second} rank={2} height="48px" color="text-gray-500" bg="bg-gray-200" />
                            <Step entry={first} rank={1} height="68px" color="text-yellow-600" bg="bg-yellow-100" />
                            <Step entry={third} rank={3} height="32px" color="text-amber-700" bg="bg-amber-100" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Neighbor list */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground">
                        {myIdx >= 0 ? "あなたの周辺" : "ランキング"}
                      </p>
                      <div className="bg-card border border-border rounded-[8px] divide-y divide-border overflow-hidden">
                        {neighbors.map((r) => {
                          const rank = lastWeekRanking.indexOf(r) + 1;
                          const isMine = myTeamIds.has(r.teamId);
                          return (
                            <div
                              key={r.teamId}
                              className={`p-3 flex items-center gap-3 ${isMine ? "bg-primary/5" : ""}`}
                            >
                              <div className="w-8 text-center font-bold text-sm text-muted-foreground">
                                {rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isMine ? "text-primary" : "text-foreground"}`}>
                                  {r.teamName}
                                  {isMine && <span className="text-[10px] ml-1">（自分）</span>}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{r.wins}勝 {r.losses}敗</p>
                              </div>
                              <p className="text-sm font-bold text-primary">{r.xp} XP</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <AlertDialog open={!!cancelInviteId} onOpenChange={(open) => !open && setCancelInviteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>招待をキャンセルしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const inv = sentInvites.find((i) => i.id === cancelInviteId);
                return inv
                  ? `${inv.toUserName} さんへの「${inv.teamName}」の招待を取り消します。`
                  : "この招待を取り消します。";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelInviteId) cancelSentInvite(cancelInviteId);
                setCancelInviteId(null);
              }}
            >
              招待を取り消す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PhoneMockup>
  );
};

export default GameHome;
