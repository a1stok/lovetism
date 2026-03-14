/**
 * Promise-based delay utility.
 * Used for rate limiting between API calls.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
