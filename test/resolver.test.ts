import { describe, it, expect } from "vitest";
import { Resolver } from "../src/registry/resolver.js";
import type { Registry } from "../src/registry/sports.js";

const testRegistry: Registry = {
  nhl: {
    sport: "hockey",
    league: "nhl",
    name: "National Hockey League",
    aliases: ["hockey"],
    teams: {
      DET: {
        id: "5",
        name: "Detroit Red Wings",
        abbreviation: "DET",
        aliases: ["red wings", "wings"],
      },
      NYR: {
        id: "13",
        name: "New York Rangers",
        abbreviation: "NYR",
        aliases: ["rangers"],
      },
    },
  },
  nfl: {
    sport: "football",
    league: "nfl",
    name: "National Football League",
    aliases: ["football"],
    teams: {
      DET: {
        id: "8",
        name: "Detroit Lions",
        abbreviation: "DET",
        aliases: ["lions"],
      },
    },
  },
};

describe("Resolver", () => {
  const resolver = new Resolver(testRegistry);

  describe("resolveLeague", () => {
    it("resolves by slug", () => {
      expect(resolver.resolveLeague("nhl")).toBe("nhl");
    });

    it("resolves by name", () => {
      expect(resolver.resolveLeague("national hockey league")).toBe("nhl");
    });

    it("resolves by alias", () => {
      expect(resolver.resolveLeague("hockey")).toBe("nhl");
    });

    it("returns undefined for unknown league", () => {
      expect(resolver.resolveLeague("cricket")).toBeUndefined();
    });
  });

  describe("resolveSport", () => {
    it("resolves sport from league", () => {
      expect(resolver.resolveSport("nhl")).toBe("hockey");
    });

    it("returns undefined for unknown", () => {
      expect(resolver.resolveSport("cricket")).toBeUndefined();
    });
  });

  describe("resolveTeam", () => {
    it("resolves by abbreviation", () => {
      const team = resolver.resolveTeam("DET", "nhl");
      expect(team).toBeDefined();
      expect(team!.name).toBe("Detroit Red Wings");
      expect(team!.id).toBe("5");
    });

    it("resolves by full name", () => {
      const team = resolver.resolveTeam("Detroit Red Wings", "nhl");
      expect(team).toBeDefined();
      expect(team!.abbreviation).toBe("DET");
    });

    it("resolves by alias", () => {
      const team = resolver.resolveTeam("red wings", "nhl");
      expect(team).toBeDefined();
      expect(team!.id).toBe("5");
    });

    it("searches all leagues without league param", () => {
      const team = resolver.resolveTeam("rangers");
      expect(team).toBeDefined();
      expect(team!.league).toBe("nhl");
    });

    it("returns undefined for unknown team", () => {
      expect(resolver.resolveTeam("fake team", "nhl")).toBeUndefined();
    });
  });

  describe("resolveParams", () => {
    it("resolves sport from league", () => {
      const result = resolver.resolveParams({ league: "nhl" });
      expect(result.sport).toBe("hockey");
      expect(result.league).toBe("nhl");
    });

    it("throws for unknown league", () => {
      expect(() => resolver.resolveParams({ league: "cricket" })).toThrow();
    });

    it("throws when no league provided", () => {
      expect(() => resolver.resolveParams({})).toThrow();
    });
  });
});
