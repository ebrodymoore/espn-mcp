import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { standingsUrl, rankingsUrl } from "../espn/endpoints.js";
import { trimStandings, trimRankings } from "../trimmer/standings.js";

export const standingsSchema = z.object({
  sport: z.string().optional().describe("Sport (optional if league is provided)"),
  league: z.string().describe("League slug (e.g., 'nfl')"),
  type: z.enum(["standings", "rankings"]).default("standings").describe("'standings' for W-L records, 'rankings' for poll rankings (college only)"),
});

export type StandingsParams = z.infer<typeof standingsSchema>;

const RANKINGS_LEAGUES = new Set(["college-football", "mens-college-basketball", "womens-college-basketball", "college-baseball", "mens-college-hockey", "womens-college-hockey"]);

export async function getStandings(params: StandingsParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  let sport: string, league: string;
  try {
    ({ sport, league } = resolver.resolveParams({ sport: params.sport, league: params.league }));
  } catch (err) {
    return { error: (err as Error).message };
  }

  if (params.type === "rankings") {
    if (!RANKINGS_LEAGUES.has(league)) {
      return { error: `Rankings are not available for ${league}. Rankings are supported for college sports. Try type='standings' instead.` };
    }
    const url = rankingsUrl(sport, league);
    const raw = await client.get<Record<string, unknown>>(url, 300_000);
    return trimRankings(raw);
  }

  const url = standingsUrl(sport, league);
  const raw = await client.get<Record<string, unknown>>(url, 300_000);
  return trimStandings(raw);
}
