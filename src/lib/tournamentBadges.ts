import type { Tournament } from "@/lib/tournamentStore";

export type BadgeType = "champion" | "runner_up" | "third_place" | "first_entry";

export interface Badge {
  type: BadgeType;
  label: string;
  emoji: string;
  count: number;
  description: string;
}

const LABEL: Record<BadgeType, { label: string; emoji: string; description: string }> = {
  champion: { label: "優勝", emoji: "🥇", description: "1位" },
  runner_up: { label: "準優勝", emoji: "🥈", description: "2位入賞" },
  third_place: { label: "第3位", emoji: "🥉", description: "3位入賞" },
  first_entry: { label: "初出場", emoji: "🎯", description: "初めての参加" },
};

export function deriveUserBadges(userId: string, tournaments: Tournament[]): Badge[] {
  const completed = tournaments.filter((t) => t.status === "completed" && t.results);
  const counts: Record<BadgeType, number> = {
    champion: 0,
    runner_up: 0,
    third_place: 0,
    first_entry: 0,
  };

  let participated = 0;
  for (const t of completed) {
    const isMine = t.entries.some(
      (e) => e.status === "confirmed" && (e.registrantUserId === userId || e.partnerUserId === userId)
    );
    if (!isMine) continue;
    participated++;
    const myRank = t.results!.rankings.find((r) => r.userId === userId || r.partnerId === userId);
    if (myRank?.rank === 1) counts.champion++;
    else if (myRank?.rank === 2) counts.runner_up++;
    else if (myRank?.rank === 3) counts.third_place++;
  }

  if (participated >= 1) counts.first_entry = 1;

  const result: Badge[] = [];
  (Object.keys(counts) as BadgeType[]).forEach((type) => {
    if (counts[type] > 0) {
      result.push({
        type,
        label: LABEL[type].label,
        emoji: LABEL[type].emoji,
        count: counts[type],
        description: LABEL[type].description,
      });
    }
  });
  return result;
}
