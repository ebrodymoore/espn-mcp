import { safe } from "./common.js";

interface TrimmedPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  age: number | null;
  status: string;
}

export function trimRoster(raw: Record<string, unknown>): { players: TrimmedPlayer[] } {
  const athleteGroups = (raw?.athletes as unknown[]) ?? [];
  const players: TrimmedPlayer[] = [];

  for (const group of athleteGroups) {
    const items = ((group as Record<string, unknown>).items as unknown[]) ?? [];
    for (const item of items) {
      const p = item as Record<string, unknown>;
      players.push({
        id: (p.id as string) ?? "",
        name: (p.displayName as string) ?? "Unknown",
        jersey: (p.jersey as string) ?? "",
        position: safe(() => (p.position as Record<string, unknown>).abbreviation as string) ?? "",
        age: (p.age as number) ?? null,
        status: safe(() => ((p.status as Record<string, unknown>).type as Record<string, unknown>).name as string) ?? "Unknown",
      });
    }
  }

  return { players };
}

export function trimSchedule(raw: Record<string, unknown>): { games: Record<string, unknown>[] } {
  const events = (raw?.events as unknown[]) ?? [];

  const games = events.map((e: unknown) => {
    const event = e as Record<string, unknown>;
    const comp = safe(() => (event.competitions as unknown[])[0]) as Record<string, unknown> | undefined;
    const competitors = (comp?.competitors as unknown[]) ?? [];
    const status = safe(() => (comp?.status as Record<string, unknown>).type as Record<string, unknown>);

    const home = competitors.find((c: unknown) => (c as Record<string, unknown>).homeAway === "home") as Record<string, unknown> | undefined;
    const away = competitors.find((c: unknown) => (c as Record<string, unknown>).homeAway === "away") as Record<string, unknown> | undefined;

    const homeAbbr = safe(() => (home?.team as Record<string, unknown>).abbreviation as string) ?? "";
    const awayAbbr = safe(() => (away?.team as Record<string, unknown>).abbreviation as string) ?? "";
    const homeScore = safe(() => (home?.score as Record<string, unknown>).displayValue as string) ?? null;
    const awayScore = safe(() => (away?.score as Record<string, unknown>).displayValue as string) ?? null;

    return {
      gameId: (event.id as string) ?? "",
      name: (event.name as string) ?? "",
      date: (event.date as string) ?? "",
      opponent: awayAbbr,
      homeTeam: homeAbbr,
      awayTeam: awayAbbr,
      homeScore,
      awayScore,
      completed: (status?.completed as boolean) ?? false,
    };
  });

  return { games };
}

export function trimTeamOverview(raw: Record<string, unknown>): Record<string, unknown> {
  const team = (raw?.team as Record<string, unknown>) ?? {};
  return {
    id: (team.id as string) ?? "",
    name: (team.displayName as string) ?? "Unknown",
    abbreviation: (team.abbreviation as string) ?? "",
    record: safe(() => ((team.record as Record<string, unknown>).items as unknown[])?.[0] as Record<string, unknown>)?.summary ?? null,
    standingSummary: (team.standingSummary as string) ?? null,
  };
}
