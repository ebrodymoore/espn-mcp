import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { gameSummaryUrl } from "../espn/endpoints.js";
import { trimBoxscore, trimPlayByPlay, trimOdds, trimWinProbability, trimGameSummary } from "../trimmer/game.js";

export const gameSchema = z.object({
  gameId: z.string().describe("ESPN event ID (from get_scores results)"),
  sport: z.string().optional().describe("Sport (optional, helps build correct URL)"),
  league: z.string().optional().describe("League (optional, helps build correct URL)"),
  detail: z.enum(["summary", "boxscore", "playbyplay", "odds", "winprobability"]).describe("What detail to retrieve"),
  playTypes: z.enum(["key", "scoring", "all"]).optional().describe("For playbyplay: 'key' (default) = goals, penalties, period boundaries, challenges; 'scoring' = goals only; 'all' = every play"),
});

export type GameParams = z.infer<typeof gameSchema>;

export async function getGame(params: GameParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  let sport = params.sport;
  let league = params.league;

  if (league) {
    const resolved = resolver.resolveParams({ sport, league });
    sport = resolved.sport;
    league = resolved.league;
  }

  if (!sport || !league) {
    const leagues = [
      { sport: "football", league: "nfl" },
      { sport: "basketball", league: "nba" },
      { sport: "baseball", league: "mlb" },
      { sport: "hockey", league: "nhl" },
    ];
    for (const l of leagues) {
      try {
        const url = gameSummaryUrl(l.sport, l.league, params.gameId);
        const raw = await client.get<Record<string, unknown>>(url, 3_600_000);
        return extractDetail(raw, params.detail, params.playTypes);
      } catch { continue; }
    }
    return { error: "Could not find game. Please provide sport and league, or verify the game ID." };
  }

  const url = gameSummaryUrl(sport, league, params.gameId);
  const raw = await client.get<Record<string, unknown>>(url, 3_600_000);
  return extractDetail(raw, params.detail, params.playTypes);
}

function extractDetail(raw: Record<string, unknown>, detail: string, playTypes?: string): unknown {
  switch (detail) {
    case "summary": return trimGameSummary(raw);
    case "boxscore": return trimBoxscore(raw);
    case "playbyplay": return trimPlayByPlay(raw, playTypes ?? "key");
    case "odds": return trimOdds(raw);
    case "winprobability": return trimWinProbability(raw);
    default: return { error: `Unknown detail type: ${detail}` };
  }
}
