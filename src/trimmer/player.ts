import { safe } from "./common.js";

export function trimPlayerOverview(raw: Record<string, unknown>): Record<string, unknown> {
  const statistics = (raw?.statistics as Record<string, unknown>) ?? {};
  const labels = (statistics.labels as string[]) ?? [];
  const splits = (statistics.splits as unknown[]) ?? [];

  const statSplits = splits.map((s: unknown) => {
    const split = s as Record<string, unknown>;
    const statsArr = (split.stats as string[]) ?? [];
    const stats: Record<string, string> = {};
    labels.forEach((label, i) => {
      stats[label] = statsArr[i] ?? "";
    });
    return {
      type: (split.displayName as string) ?? "",
      stats,
    };
  });

  const nextGame = safe(() => {
    const ng = raw.nextGame as Record<string, unknown>;
    return {
      displayName: (ng.displayName as string) ?? "",
    };
  });

  const news = ((raw.news as unknown[]) ?? []).slice(0, 5).map((n: unknown) => {
    const article = n as Record<string, unknown>;
    return {
      headline: (article.headline as string) ?? "",
      description: (article.description as string) ?? "",
    };
  });

  const rotowire = safe(() => {
    const rw = raw.rotowire as Record<string, unknown>;
    return {
      headline: (rw.headline as string) ?? "",
      description: (rw.description as string) ?? "",
    };
  });

  return {
    statistics: statSplits,
    ...(nextGame ? { nextGame } : {}),
    ...(news.length > 0 ? { news } : {}),
    ...(rotowire ? { rotowire } : {}),
  };
}

export function trimPlayerStats(raw: Record<string, unknown>): Record<string, unknown> {
  const categories = (raw?.categories as unknown[]) ?? [];
  const teamsMap = (raw?.teams as Record<string, Record<string, unknown>>) ?? {};

  const result = categories.map((c: unknown) => {
    const cat = c as Record<string, unknown>;
    const labels = (cat.labels as string[]) ?? [];
    const statistics = (cat.statistics as unknown[]) ?? [];
    const totalsArr = (cat.totals as string[]) ?? [];

    const seasons = statistics.map((s: unknown) => {
      const entry = s as Record<string, unknown>;
      const seasonObj = (entry.season as Record<string, unknown>) ?? {};
      const statsArr = (entry.stats as string[]) ?? [];
      const stats: Record<string, string> = {};
      labels.forEach((label, i) => {
        stats[label] = statsArr[i] ?? "";
      });

      const teamSlug = (entry.teamSlug as string) ?? "";
      const teamData = teamsMap[teamSlug] as Record<string, unknown> | undefined;
      const teamName = (teamData?.displayName as string) ?? teamSlug;

      return {
        season: (seasonObj.displayName as string) ?? "",
        year: (seasonObj.year as number) ?? null,
        team: teamName,
        position: (entry.position as string) ?? "",
        stats,
      };
    });

    const totals: Record<string, string> = {};
    labels.forEach((label, i) => {
      totals[label] = totalsArr[i] ?? "";
    });

    return {
      position: (cat.name as string) ?? "",
      displayName: (cat.displayName as string) ?? "",
      seasons,
      totals,
    };
  });

  return { categories: result };
}

export function trimPlayerGamelog(raw: Record<string, unknown>): { games: Record<string, unknown>[] } {
  const topLabels = (raw?.labels as string[]) ?? [];
  const eventsMap = (raw?.events as Record<string, Record<string, unknown>>) ?? {};
  const seasonTypes = (raw?.seasonTypes as unknown[]) ?? [];
  const games: Record<string, unknown>[] = [];

  for (const st of seasonTypes) {
    const stObj = st as Record<string, unknown>;
    const categories = (stObj.categories as unknown[]) ?? [];
    for (const cat of categories) {
      const category = cat as Record<string, unknown>;
      const labels = topLabels.length > 0 ? topLabels : (category.labels as string[]) ?? [];
      const events = (category.events as unknown[]) ?? [];

      for (const event of events) {
        const e = event as Record<string, unknown>;
        const eventId = (e.eventId as string) ?? (e.id as string) ?? "";
        const statsArr = (e.stats as string[]) ?? [];
        const stats: Record<string, string> = {};
        labels.forEach((label, i) => {
          stats[label] = statsArr[i] ?? "";
        });

        const eventMeta = eventsMap[eventId] ?? {};
        const links = (eventMeta.links as unknown[]) ?? [];
        const summaryLink = links.find((l: unknown) => {
          const rel = ((l as Record<string, unknown>).rel as string[]) ?? [];
          return rel.includes("summary") && rel.includes("desktop");
        }) as Record<string, unknown> | undefined;

        games.push({
          gameId: eventId,
          link: (summaryLink?.href as string) ?? null,
          stats,
        });
      }
    }
  }

  return { games };
}
