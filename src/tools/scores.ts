import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { scoreboardUrl } from "../espn/endpoints.js";
import { trimScoreboard } from "../trimmer/scores.js";

export const scoresSchema = z.object({
  sport: z.string().optional().describe("Sport (e.g., 'football'). Optional if league is provided."),
  league: z.string().optional().describe("League slug (e.g., 'nfl', 'nba', 'eng.1')"),
  team: z.string().optional().describe("Filter to games involving this team"),
  date: z.string().optional().describe("Date in YYYY-MM-DD format, or 'yesterday', 'today', 'tomorrow'"),
});

export type ScoresParams = z.infer<typeof scoresSchema>;

const DEFAULT_LEAGUES = ["nfl", "nba", "mlb", "nhl"];

export async function getScores(params: ScoresParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  const dateStr = resolveDate(params.date);

  if (params.league) {
    const { sport, league } = resolver.resolveParams({ sport: params.sport, league: params.league });
    const url = scoreboardUrl(sport, league, dateStr);
    const raw = await client.get<Record<string, unknown>>(url, 30_000);
    const result = trimScoreboard(raw);
    return filterByTeam(result, params.team, resolver, league);
  }

  if (params.sport && !params.league) {
    return { error: "Please specify a league (e.g., 'nfl', 'nba'). Sport alone is not enough to fetch scores." };
  }

  const allGames: unknown[] = [];
  for (const league of DEFAULT_LEAGUES) {
    const { sport } = resolver.resolveParams({ league });
    const url = scoreboardUrl(sport, league, dateStr);
    try {
      const raw = await client.get<Record<string, unknown>>(url, 30_000);
      const result = trimScoreboard(raw);
      allGames.push(...result.games.map((g) => ({ ...g, league })));
    } catch { /* skip leagues that error */ }
  }

  if (allGames.length === 0) {
    return { message: "No games found for today across major leagues.", games: [] };
  }

  return { games: allGames };
}

function resolveDate(input?: string): string | undefined {
  if (!input) return undefined;
  const lower = input.toLowerCase();
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));

  if (lower === "today") return formatDate(now);
  if (lower === "yesterday") { now.setDate(now.getDate() - 1); return formatDate(now); }
  if (lower === "tomorrow") { now.setDate(now.getDate() + 1); return formatDate(now); }

  return input.replace(/-/g, "");
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function filterByTeam(result: { games: Record<string, unknown>[] }, team: string | undefined, resolver: Resolver, league: string): unknown {
  if (!team) return result;
  const resolved = resolver.resolveTeam(team, league);
  if (!resolved) return result;

  const abbr = resolved.abbreviation.toUpperCase();
  const filtered = result.games.filter((g) => {
    const home = g.home as Record<string, unknown>;
    const away = g.away as Record<string, unknown>;
    return (home.abbreviation as string)?.toUpperCase() === abbr || (away.abbreviation as string)?.toUpperCase() === abbr;
  });

  if (filtered.length === 0) return { message: `No games found for ${resolved.name} on this date.`, games: [] };
  return { games: filtered };
}
