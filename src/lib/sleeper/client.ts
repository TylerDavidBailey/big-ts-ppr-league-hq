/**
 * Thin fetch wrapper for the Sleeper read-only API.
 *
 * The API is public, CORS-open (`access-control-allow-origin: *`) and needs no
 * key, so the browser talks to it directly with no proxy in between.
 */

export const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

/** Sleeper asks callers to stay under 1000 requests/minute. */
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 400;

export class SleeperApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = 'SleeperApiError';
  }
}

/** Thrown when a league, user, or draft id does not exist. */
export class NotFoundError extends SleeperApiError {
  constructor(path: string) {
    super(`Sleeper has no record at ${path}`, 404, path);
    this.name = 'NotFoundError';
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

interface FetchOptions {
  signal?: AbortSignal;
}

/**
 * GET a Sleeper endpoint and parse it as JSON.
 *
 * Retries 429s and 5xxs with exponential backoff. A 404 throws `NotFoundError`
 * so callers can distinguish "bad league id" from "network is down"; note that
 * Sleeper also answers a missing league with the JSON body `null` under a 404,
 * and a *valid* league with no data yet (an unplayed week) with `[]` under a
 * 200. Never conflate those two cases.
 */
export async function fetchSleeper<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${SLEEPER_API_BASE}${path}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: options.signal ?? null,
        headers: { Accept: 'application/json' },
      });

      if (response.status === 404) {
        throw new NotFoundError(path);
      }

      if (!response.ok) {
        const error = new SleeperApiError(
          `Sleeper responded ${response.status} for ${path}`,
          response.status,
          path,
        );
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          lastError = error;
          await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        throw error;
      }

      return (await response.json()) as T;
    } catch (error) {
      // A missing resource and a caller-cancelled request are both final.
      if (error instanceof NotFoundError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      if (error instanceof SleeperApiError && !isRetryableStatus(error.status)) throw error;

      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SleeperApiError(`Request to ${path} failed`, 0, path);
}
