import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface TeamEntry {
  id: string;
  name: string;
  abbreviation: string;
  aliases: string[];
}

export interface LeagueEntry {
  sport: string;
  league: string;
  name: string;
  aliases: string[];
  teams: Record<string, TeamEntry>;
}

export type Registry = Record<string, LeagueEntry>;

let registryCache: Registry | null = null;

export function loadRegistry(): Registry {
  if (registryCache) return registryCache;
  const dir = dirname(fileURLToPath(import.meta.url));
  const dataPath = join(dir, "..", "..", "data", "registry.json");
  registryCache = JSON.parse(readFileSync(dataPath, "utf-8")) as Registry;
  return registryCache;
}

export function setRegistry(registry: Registry): void {
  registryCache = registry;
}
