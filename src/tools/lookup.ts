import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { searchUrl } from "../espn/endpoints.js";
import { safe } from "../trimmer/common.js";

export const lookupSchema = z.object({
  query: z.string().describe("Team name, player name, or league to look up"),
});

export type LookupParams = z.infer<typeof lookupSchema>;

export async function lookup(params: LookupParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  const { query } = params;
  const normalized = query.toLowerCase();

  const leagueSlug = resolver.resolveLeague(normalized);
  if (leagueSlug) {
    const sport = resolver.resolveSport(leagueSlug);
    return { type: "league", sport, league: leagueSlug };
  }

  const team = resolver.resolveTeam(normalized);
  if (team) {
    return { type: "team", ...team };
  }

  const url = searchUrl(query);
  const raw = await client.get<Record<string, unknown>>(url, 600_000);
  const results = (raw?.results as unknown[]) ?? [];

  const matches = results.flatMap((section: unknown) => {
    const s = section as Record<string, unknown>;
    const items = (s.items as unknown[]) ?? [];
    return items.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        type: (s.type as string) ?? "unknown",
        id: (i.id as string) ?? "",
        name: (i.displayName as string) ?? (i.name as string) ?? "",
        description: (i.description as string) ?? null,
        league: safe(() => (i.league as Record<string, unknown>).abbreviation as string) ?? null,
        sport: safe(() => (i.sport as Record<string, unknown>).slug as string) ?? null,
      };
    });
  });

  if (matches.length === 0) {
    return { error: `Could not find anything matching '${query}'. Try a team name, player name, city, or abbreviation.` };
  }

  return { matches };
}
