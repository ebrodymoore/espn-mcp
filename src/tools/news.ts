import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { newsUrl } from "../espn/endpoints.js";
import { trimNews } from "../trimmer/news.js";

export const newsSchema = z.object({
  sport: z.string().optional().describe("Sport to filter news"),
  league: z.string().optional().describe("League to filter news"),
  team: z.string().optional().describe("Team to filter news"),
});

export type NewsParams = z.infer<typeof newsSchema>;

export async function getNews(params: NewsParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  let sport = params.sport;
  let league = params.league;

  if (league) {
    const resolved = resolver.resolveParams({ sport, league });
    sport = resolved.sport;
    league = resolved.league;
  }

  const url = newsUrl(sport, league);
  const raw = await client.get<Record<string, unknown>>(url, 300_000);
  return trimNews(raw);
}
