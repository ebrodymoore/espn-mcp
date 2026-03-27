import { safe } from "./common.js";

export function trimPlayerOverview(raw: Record<string, unknown>): Record<string, unknown> {
  const athlete = (raw?.athlete as Record<string, unknown>) ?? {};
  const team = (athlete.team as Record<string, unknown>) ?? {};
  return {
    id: (athlete.id as string) ?? "",
    name: (athlete.displayName as string) ?? "Unknown",
    position: safe(() => (athlete.position as Record<string, unknown>).abbreviation as string) ?? "",
    age: (athlete.age as number) ?? null,
    height: (athlete.displayHeight as string) ?? null,
    weight: (athlete.displayWeight as string) ?? null,
    team: (team.displayName as string) ?? null,
    teamAbbreviation: (team.abbreviation as string) ?? null,
  };
}

export function trimPlayerStats(raw: Record<string, unknown>): { seasons: Record<string, unknown>[] } {
  const statistics = (raw?.statistics as unknown[]) ?? [];

  const seasons = statistics.map((s: unknown) => {
    const season = s as Record<string, unknown>;
    const labels = (season.labels as string[]) ?? [];
    const statsArr = (season.stats as string[]) ?? [];
    const stats: Record<string, string> = {};
    labels.forEach((label, i) => {
      stats[label] = statsArr[i] ?? "";
    });
    return {
      season: (season.displayName as string) ?? "",
      stats,
    };
  });

  return { seasons };
}

export function trimPlayerGamelog(raw: Record<string, unknown>): { games: Record<string, unknown>[] } {
  const seasonTypes = (raw?.seasonTypes as unknown[]) ?? [];
  const games: Record<string, unknown>[] = [];

  for (const st of seasonTypes) {
    const categories = ((st as Record<string, unknown>).categories as unknown[]) ?? [];
    for (const cat of categories) {
      const category = cat as Record<string, unknown>;
      const labels = (category.labels as string[]) ?? [];
      const events = (category.events as unknown[]) ?? [];

      for (const event of events) {
        const e = event as Record<string, unknown>;
        const statsArr = (e.stats as string[]) ?? [];
        const stats: Record<string, string> = {};
        labels.forEach((label, i) => {
          stats[label] = statsArr[i] ?? "";
        });

        games.push({
          gameId: (e.id as string) ?? "",
          atVs: (e.atVs as string) ?? "",
          opponent: safe(() => (e.opponent as Record<string, unknown>).abbreviation as string) ?? "",
          result: (e.gameResult as string) ?? "",
          stats,
        });
      }
    }
  }

  return { games };
}
