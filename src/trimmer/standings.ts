import { safe } from "./common.js";

export function trimStandings(raw: Record<string, unknown>): { groups: Record<string, unknown>[] } {
  const children = (raw?.children as unknown[]) ?? [];

  const groups = children.map((child: unknown) => {
    const group = child as Record<string, unknown>;
    const entries = safe(() =>
      ((group.standings as Record<string, unknown>).entries as unknown[])
    ) ?? [];

    const teams = entries.map((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      const team = (e.team as Record<string, unknown>) ?? {};
      const statsArr = (e.stats as unknown[]) ?? [];
      const stats: Record<string, string> = {};
      for (const s of statsArr) {
        const stat = s as Record<string, unknown>;
        stats[stat.name as string] = (stat.displayValue as string) ?? "";
      }
      return {
        abbreviation: (team.abbreviation as string) ?? "",
        name: (team.displayName as string) ?? "Unknown",
        stats,
      };
    });

    return {
      name: (group.name as string) ?? "",
      teams,
    };
  });

  return { groups };
}

export function trimRankings(raw: Record<string, unknown>): { polls: Record<string, unknown>[] } {
  const rankings = (raw?.rankings as unknown[]) ?? [];

  const polls = rankings.map((r: unknown) => {
    const ranking = r as Record<string, unknown>;
    const ranksArr = (ranking.ranks as unknown[]) ?? [];

    const ranks = ranksArr.map((rank: unknown) => {
      const rk = rank as Record<string, unknown>;
      const team = (rk.team as Record<string, unknown>) ?? {};
      return {
        rank: (rk.current as number) ?? 0,
        team: (team.displayName as string) ?? "Unknown",
        abbreviation: (team.abbreviation as string) ?? "",
        record: (rk.recordSummary as string) ?? "",
        points: (rk.points as number) ?? 0,
      };
    });

    return {
      name: (ranking.name as string) ?? "",
      ranks,
    };
  });

  return { polls };
}
