import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage } from "node:http";
import { BearerAuth, extractBearer, loadBearerAuth, parseTokens } from "../src/auth.js";

function req(authorization?: string): IncomingMessage {
  return { headers: authorization ? { authorization } : {} } as IncomingMessage;
}

describe("extractBearer", () => {
  it("extracts the token, case-insensitive scheme", () => {
    expect(extractBearer("Bearer abc123")).toBe("abc123");
    expect(extractBearer("bearer abc123")).toBe("abc123");
  });

  it("rejects other schemes and malformed headers", () => {
    expect(extractBearer(undefined)).toBeUndefined();
    expect(extractBearer("Basic abc123")).toBeUndefined();
    expect(extractBearer("Bearer")).toBeUndefined();
    expect(extractBearer("Bearer a b")).toBeUndefined();
  });
});

describe("parseTokens", () => {
  it("splits on commas and newlines and drops blanks", () => {
    expect(parseTokens(" a, b ,,\nc\n")).toEqual(["a", "b", "c"]);
    expect(parseTokens(undefined)).toEqual([]);
  });
});

describe("BearerAuth", () => {
  it("allows everything when no tokens are configured", () => {
    const auth = new BearerAuth([]);
    expect(auth.enabled).toBe(false);
    expect(auth.check(req())).toBe(true);
  });

  it("accepts any configured token and rejects others", () => {
    const auth = new BearerAuth(["first", "second"]);
    expect(auth.check(req("Bearer first"))).toBe(true);
    expect(auth.check(req("Bearer second"))).toBe(true);
    expect(auth.check(req("Bearer wrong"))).toBe(false);
    expect(auth.check(req("Bearer firs"))).toBe(false);
    expect(auth.check(req())).toBe(false);
  });
});

describe("loadBearerAuth", () => {
  it("combines MCP_AUTH_TOKENS and MCP_AUTH_TOKEN_FILE", () => {
    const file = join(mkdtempSync(join(tmpdir(), "espn-mcp-")), "tokens");
    writeFileSync(file, "from-file\n");
    const auth = loadBearerAuth({ MCP_AUTH_TOKENS: "from-env", MCP_AUTH_TOKEN_FILE: file });
    expect(auth.check(req("Bearer from-env"))).toBe(true);
    expect(auth.check(req("Bearer from-file"))).toBe(true);
  });

  it("is disabled when nothing is set", () => {
    expect(loadBearerAuth({}).enabled).toBe(false);
  });
});
