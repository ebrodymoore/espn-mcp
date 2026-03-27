import { z } from "zod";
import type { EspnClient } from "../espn/client.js";
import type { Resolver } from "../registry/resolver.js";
import { playerUrl, searchUrl } from "../espn/endpoints.js";
import { trimPlayerOverview, trimPlayerStats, trimPlayerGamelog } from "../trimmer/player.js";

export const playerInfoSchema = z.object({
  sport: z.string().optional().describe("Sport (optional if league is provided)"),
  league: z.string().describe("League slug (e.g., 'nfl')"),
  player: z.string().describe("Player name or ESPN athlete ID"),
  aspect: z.enum(["overview", "stats", "gamelog", "splits", "bio"]).describe("What information to retrieve"),
});

export type PlayerInfoParams = z.infer<typeof playerInfoSchema>;

export async function getPlayerInfo(params: PlayerInfoParams, resolver: Resolver, client: EspnClient): Promise<unknown> {
  const { sport, league } = resolver.resolveParams({ sport: params.sport, league: params.league });

  let playerId = params.player;
  if (!/^\d+$/.test(playerId)) {
    const searchResult = await client.get<Record<string, unknown>>(searchUrl(params.player), 600_000);
    const results = (searchResult?.results as unknown[]) ?? [];
    const playerSection = results.find((r: unknown) => {
      const type = (r as Record<string, unknown>).type;
      return type === "player" || type === "athlete";
    }) as Record<string, unknown> | undefined;
    const items = (playerSection?.contents as unknown[]) ?? (playerSection?.items as unknown[]) ?? [];
    const match = items[0] as Record<string, unknown> | undefined;
    if (!match) return { error: `Could not find a player matching '${params.player}'. Try their full name.` };
    // The search API returns the ESPN ID in the link URL or uid, extract numeric ID
    const linkWeb = (match.link as Record<string, unknown>)?.web as string | undefined;
    const uidStr = (match.uid as string) ?? "";
    const idFromLink = linkWeb?.match(/\/id\/(\d+)/)?.[1];
    const idFromUid = uidStr.match(/a:(\d+)/)?.[1];
    playerId = idFromLink ?? idFromUid ?? (match.id as string) ?? "";
  }

  const url = playerUrl(sport, league, playerId, params.aspect);
  const raw = await client.get<Record<string, unknown>>(url, 900_000);

  switch (params.aspect) {
    case "overview": return trimPlayerOverview(raw);
    case "stats": return trimPlayerStats(raw);
    case "gamelog": return trimPlayerGamelog(raw);
    default: return raw;
  }
}
