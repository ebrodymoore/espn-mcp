import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";

// Tokens are compared as SHA-256 digests so every comparison is the same
// length and runs in constant time, regardless of the presented token.
function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export class BearerAuth {
  private readonly digests: Buffer[];

  constructor(tokens: string[]) {
    this.digests = tokens.map(digest);
  }

  get enabled(): boolean {
    return this.digests.length > 0;
  }

  /** True when auth is disabled or the request carries a valid bearer token. */
  check(req: IncomingMessage): boolean {
    if (!this.enabled) return true;
    const presented = extractBearer(req.headers.authorization);
    if (!presented) return false;
    const candidate = digest(presented);
    // Check every token (no early exit) so timing doesn't reveal which matched.
    let ok = false;
    for (const d of this.digests) ok = timingSafeEqual(candidate, d) || ok;
    return ok;
  }
}

export function extractBearer(header: string | undefined): string | undefined {
  const match = header?.match(/^Bearer\s+(\S+)\s*$/i);
  return match?.[1];
}

/** Splits a comma- or newline-separated token list, dropping blanks. */
export function parseTokens(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Builds the auth config from MCP_AUTH_TOKENS (comma-separated) and/or
 * MCP_AUTH_TOKEN_FILE (one token per line, e.g. a Docker secret).
 */
export function loadBearerAuth(env: NodeJS.ProcessEnv = process.env): BearerAuth {
  const tokens = parseTokens(env.MCP_AUTH_TOKENS);
  if (env.MCP_AUTH_TOKEN_FILE) {
    tokens.push(...parseTokens(readFileSync(env.MCP_AUTH_TOKEN_FILE, "utf8")));
  }
  return new BearerAuth(tokens);
}
