import { safe, warnMissing } from "./common.js";

interface TrimmedGame {
  gameId: string;
  name: string;
  status: string;
  completed: boolean;
  clock: string | null;
  period: number | null;
  home: { abbreviation: string; name: string; score: string | null };
  away: { abbreviation: string; name: string; score: string | null };
  odds: { spread: string; overUnder: number } | null;
  broadcast: string | null;
}

export interface TrimmedScoreboard {
  games: TrimmedGame[];
}

export function trimScoreboard(raw: Record<string, unknown>): TrimmedScoreboard {
  const events = (raw?.events as unknown[]) ?? [];

  const games: TrimmedGame[] = events.map((event: unknown) => {
    const e = event as Record<string, unknown>;
    const comp = safe(() => (e.competitions as unknown[])?.[0]) as
      | Record<string, unknown>
      | undefined;
    const competitors = (comp?.competitors as unknown[]) ?? [];

    const home = competitors.find(
      (c: unknown) => (c as Record<string, unknown>).homeAway === "home"
    ) as Record<string, unknown> | undefined;
    const away = competitors.find(
      (c: unknown) => (c as Record<string, unknown>).homeAway === "away"
    ) as Record<string, unknown> | undefined;

    const status = comp?.status as Record<string, unknown> | undefined;
    const statusType = status?.type as Record<string, unknown> | undefined;

    const oddsArr = comp?.odds as unknown[] | undefined;
    const firstOdds = oddsArr?.[0] as Record<string, unknown> | undefined;

    const broadcasts = comp?.broadcasts as unknown[] | undefined;
    const firstBroadcast = broadcasts?.[0] as Record<string, unknown> | undefined;
    const broadcastNames = firstBroadcast?.names as string[] | undefined;

    const extractTeam = (c: Record<string, unknown> | undefined) => {
      const team = c?.team as Record<string, unknown> | undefined;
      return {
        abbreviation: (team?.abbreviation as string) ?? "???",
        name: (team?.displayName as string) ?? "Unknown",
        score: (c?.score as string) ?? null,
      };
    };

    if (!comp) warnMissing("scoreboard", "competitions[0]");

    return {
      gameId: (e.id as string) ?? "",
      name: (e.shortName as string) ?? (e.name as string) ?? "",
      status: (statusType?.name as string) ?? "UNKNOWN",
      completed: (statusType?.completed as boolean) ?? false,
      clock: (status?.displayClock as string) ?? null,
      period: (status?.period as number) ?? null,
      home: extractTeam(home),
      away: extractTeam(away),
      odds: firstOdds
        ? {
            spread: (firstOdds.details as string) ?? "",
            overUnder: (firstOdds.overUnder as number) ?? 0,
          }
        : null,
      broadcast: broadcastNames?.[0] ?? null,
    };
  });

  return { games };
}
