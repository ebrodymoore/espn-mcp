import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { leadersUrl } from "../espn/endpoints.js";
import { trimLeaders } from "../trimmer/leaders.js";

export const leadersSchema = z.object({
  sport: z.string().optional().describe("Sport (optional if league is provided)"),
  league: z.string().describe("League slug (e.g., 'nfl')"),
  category: z.string().optional().describe("Stat category to filter by (e.g., 'passing', 'scoring')"),
});

export type LeadersParams = z.infer<typeof leadersSchema>;

export async function getLeaders(params: LeadersParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  let sport: string, league: string;
  try {
    ({ sport, league } = resolver.resolveParams({ sport: params.sport, league: params.league }));
  } catch (err) {
    return { error: (err as Error).message };
  }
  const url = leadersUrl(sport, league);
  const raw = await client.get<Record<string, unknown>>(url, 900_000);
  const result = trimLeaders(raw);

  if (params.category) {
    const filtered = result.categories.filter((c) => c.name.toLowerCase().includes(params.category!.toLowerCase()));
    if (filtered.length === 0) {
      return { error: `No leader category matching '${params.category}' found. Available categories: ${result.categories.map((c) => c.name).join(", ")}` };
    }
    return { categories: filtered };
  }

  return result;
}
