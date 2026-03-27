/**
 * Safely access a nested property, returning undefined instead of throwing.
 */
export function safe<T>(fn: () => T): T | undefined {
  try {
    const result = fn();
    return result ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Pick specified keys from an object, skipping undefined values.
 */
export function pick<T extends Record<string, unknown>>(
  obj: T | undefined,
  keys: string[]
): Record<string, unknown> {
  if (!obj) return {};
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Log a warning to stderr when an expected field is missing.
 * Does NOT include this in the MCP response.
 */
export function warnMissing(context: string, field: string): void {
  console.error(`[espn-mcp] Warning: missing expected field '${field}' in ${context}`);
}
