import { describe, it, expect, beforeAll } from "vitest";
import { Resolver } from "../../src/registry/resolver.js";
import { setRegistry, type Registry } from "../../src/registry/sports.js";

const TEST_REGISTRY: Registry = {
  nfl: {
    sport: "football",
    league: "nfl",
    name: "National Football League",
    aliases: ["pro football"],
    teams: {
      sf: {
        id: "25",
        name: "San Francisco 49ers",
        abbreviation: "SF",
        aliases: ["niners", "9ers", "49ers", "san francisco"],
      },
      kc: {
        id: "12",
        name: "Kansas City Chiefs",
        abbreviation: "KC",
        aliases: ["chiefs", "kansas city"],
      },
    },
  },
  nba: {
    sport: "basketball",
    league: "nba",
    name: "National Basketball Association",
    aliases: [],
    teams: {
      lal: {
        id: "13",
        name: "Los Angeles Lakers",
        abbreviation: "LAL",
        aliases: ["lakers", "los angeles lakers", "la lakers"],
      },
    },
  },
  "eng.1": {
    sport: "soccer",
    league: "eng.1",
    name: "English Premier League",
    aliases: ["premier league", "epl", "prem"],
    teams: {},
  },
};

describe("Resolver", () => {
  let resolver: Resolver;

  beforeAll(() => {
    setRegistry(TEST_REGISTRY);
    resolver = new Resolver(TEST_REGISTRY);
  });

  describe("resolveSport", () => {
    it("resolves league to sport", () => {
      expect(resolver.resolveSport("nfl")).toBe("football");
    });

    it("returns undefined for unknown league", () => {
      expect(resolver.resolveSport("xyz")).toBeUndefined();
    });
  });

  describe("resolveLeague", () => {
    it("resolves league alias to league slug", () => {
      expect(resolver.resolveLeague("premier league")).toBe("eng.1");
    });

    it("resolves direct league slug", () => {
      expect(resolver.resolveLeague("nfl")).toBe("nfl");
    });

    it("is case insensitive", () => {
      expect(resolver.resolveLeague("NFL")).toBe("nfl");
      expect(resolver.resolveLeague("Premier League")).toBe("eng.1");
    });

    it("returns undefined for unknown alias", () => {
      expect(resolver.resolveLeague("curling")).toBeUndefined();
    });
  });

  describe("resolveTeam", () => {
    it("resolves team by abbreviation", () => {
      const result = resolver.resolveTeam("SF", "nfl");
      expect(result).toEqual({
        id: "25",
        name: "San Francisco 49ers",
        abbreviation: "SF",
        sport: "football",
        league: "nfl",
      });
    });

    it("resolves team by alias", () => {
      const result = resolver.resolveTeam("niners", "nfl");
      expect(result?.id).toBe("25");
    });

    it("resolves team by full name", () => {
      const result = resolver.resolveTeam("San Francisco 49ers", "nfl");
      expect(result?.id).toBe("25");
    });

    it("is case insensitive", () => {
      const result = resolver.resolveTeam("LAKERS", "nba");
      expect(result?.id).toBe("13");
    });

    it("searches across all leagues when league not specified", () => {
      const results = resolver.resolveTeam("lakers");
      expect(results?.id).toBe("13");
      expect(results?.league).toBe("nba");
    });

    it("returns undefined for unknown team", () => {
      expect(resolver.resolveTeam("unknown team", "nfl")).toBeUndefined();
    });
  });

  describe("resolveParams", () => {
    it("fills in sport from league", () => {
      const result = resolver.resolveParams({ league: "nfl" });
      expect(result).toEqual({ sport: "football", league: "nfl" });
    });

    it("league wins over conflicting sport", () => {
      const result = resolver.resolveParams({
        sport: "basketball",
        league: "nfl",
      });
      expect(result.sport).toBe("football");
    });

    it("passes through when both match", () => {
      const result = resolver.resolveParams({
        sport: "football",
        league: "nfl",
      });
      expect(result).toEqual({ sport: "football", league: "nfl" });
    });

    it("resolves league alias first", () => {
      const result = resolver.resolveParams({ league: "epl" });
      expect(result).toEqual({ sport: "soccer", league: "eng.1" });
    });
  });
});
