import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { teamUrl, teamAspectUrl } from "../espn/endpoints.js";
import { trimTeamOverview, trimRoster, trimSchedule } from "../trimmer/team.js";

export const teamInfoSchema = z.object({
  sport: z.string().optional().describe("Sport (optional if league is provided)"),
  league: z.string().describe("League slug (e.g., 'nfl')"),
  team: z.string().describe("Team name, abbreviation, or ID"),
  aspect: z.enum(["overview", "roster", "schedule", "injuries", "depth_chart", "transactions", "history"]).describe("What information to retrieve"),
});

export type TeamInfoParams = z.infer<typeof teamInfoSchema>;

const ASPECT_TTL: Record<string, number> = {
  overview: 3_600_000, roster: 3_600_000, schedule: 1_800_000,
  injuries: 600_000, depth_chart: 3_600_000, transactions: 1_800_000, history: 3_600_000,
};

export async function getTeamInfo(params: TeamInfoParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  let sport: string, league: string;
  try {
    ({ sport, league } = resolver.resolveParams({ sport: params.sport, league: params.league }));
  } catch (err) {
    return { error: (err as Error).message };
  }
  const resolved = resolver.resolveTeam(params.team, league);
  const teamId = resolved?.id ?? params.team;
  const ttl = ASPECT_TTL[params.aspect] ?? 3_600_000;

  if (params.aspect === "overview") {
    const url = teamUrl(sport, league, teamId);
    const raw = await client.get<Record<string, unknown>>(url, ttl);
    return trimTeamOverview(raw);
  }

  const url = teamAspectUrl(sport, league, teamId, params.aspect);
  const raw = await client.get<Record<string, unknown>>(url, ttl);

  switch (params.aspect) {
    case "roster": return trimRoster(raw);
    case "schedule": return trimSchedule(raw);
    default: return raw;
  }
}
