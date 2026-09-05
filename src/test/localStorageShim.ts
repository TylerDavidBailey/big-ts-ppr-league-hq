/**
 * Install a working `localStorage` for tests.
 *
 * Node 26 defines a native `localStorage` global that is disabled unless the
 * process was started with `--localstorage-file`. That disabled global masks
 * the one jsdom would otherwise provide, leaving `localStorage` undefined while
 * `sessionStorage` works. The shim is therefore about the Node runtime, not
 * about jsdom and not about the app.
 *
 * Real browsers are unaffected; this file is only loaded by the Vitest setup.
 */
class MemoryStorage implements Storage {
  #entries = new Map<string, string>();

  get length(): number {
    return this.#entries.size;
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.#entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#entries.set(key, value);
  }

  removeItem(key: string): void {
    this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
  }
}

export function installLocalStorage(): Storage {
  const existing = globalThis.localStorage as Storage | undefined;
  if (existing) return existing;

  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  return storage;
}
