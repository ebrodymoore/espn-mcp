import type { Registry } from "./sports.js";

export interface ResolvedTeam {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  league: string;
}

export interface ResolvedParams {
  sport: string;
  league: string;
}

export class Resolver {
  private registry: Registry;
  private leagueAliasMap: Map<string, string>;

  constructor(registry: Registry) {
    this.registry = registry;
    this.leagueAliasMap = new Map();
    this.buildLeagueAliasMap();
  }

  private buildLeagueAliasMap(): void {
    for (const [slug, entry] of Object.entries(this.registry)) {
      this.leagueAliasMap.set(slug.toLowerCase(), slug);
      this.leagueAliasMap.set(entry.name.toLowerCase(), slug);
      for (const alias of entry.aliases) {
        this.leagueAliasMap.set(alias.toLowerCase(), slug);
      }
    }
  }

  resolveSport(league: string): string | undefined {
    const slug = this.resolveLeague(league);
    if (!slug) return undefined;
    return this.registry[slug]?.sport;
  }

  resolveLeague(input: string): string | undefined {
    return this.leagueAliasMap.get(input.toLowerCase());
  }

  resolveTeam(input: string, league?: string): ResolvedTeam | undefined {
    const normalized = input.toLowerCase();

    if (league) {
      const leagueSlug = this.resolveLeague(league) ?? league;
      const entry = this.registry[leagueSlug];
      if (!entry) return undefined;
      return this.findTeamInLeague(normalized, leagueSlug, entry);
    }

    for (const [slug, entry] of Object.entries(this.registry)) {
      const result = this.findTeamInLeague(normalized, slug, entry);
      if (result) return result;
    }

    return undefined;
  }

  private findTeamInLeague(
    normalized: string,
    leagueSlug: string,
    leagueEntry: Registry[string]
  ): ResolvedTeam | undefined {
    for (const [abbr, team] of Object.entries(leagueEntry.teams)) {
      if (
        abbr.toLowerCase() === normalized ||
        team.abbreviation.toLowerCase() === normalized ||
        team.name.toLowerCase() === normalized ||
        team.aliases.some((a) => a.toLowerCase() === normalized)
      ) {
        return {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          sport: leagueEntry.sport,
          league: leagueSlug,
        };
      }
    }
    return undefined;
  }

  resolveParams(params: {
    sport?: string;
    league?: string;
  }): ResolvedParams {
    if (!params.league) {
      throw new Error("League is required. Provide a league slug (e.g., 'nfl', 'nba', 'nhl', 'mlb').");
    }

    const leagueSlug = this.resolveLeague(params.league) ?? params.league;
    const sport = this.registry[leagueSlug]?.sport ?? params.sport;

    if (!sport) {
      throw new Error(
        `Unknown league '${params.league}'. Use the lookup tool to find the correct league slug.`
      );
    }

    return { sport, league: leagueSlug };
  }
}
