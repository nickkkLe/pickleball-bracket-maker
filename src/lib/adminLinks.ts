const STORAGE_KEY = "pbb:admin-events";

export interface RememberedEvent {
  id: string;
  name: string;
  adminToken: string;
  lastVisited: number;
}

type Listener = () => void;

const EMPTY: RememberedEvent[] = [];

let cache: RememberedEvent[] = EMPTY;
let loaded = false;
const listeners = new Set<Listener>();

function load(): RememberedEvent[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as RememberedEvent[]).sort((a, b) => b.lastVisited - a.lastVisited) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  loaded = true;
  return cache;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently skip
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): RememberedEvent[] {
  if (!loaded) load();
  return cache;
}

export function getServerSnapshot(): RememberedEvent[] {
  return EMPTY;
}

export function rememberEvent(entry: Omit<RememberedEvent, "lastVisited">) {
  if (!loaded) load();
  cache = [{ ...entry, lastVisited: Date.now() }, ...cache.filter((e) => e.id !== entry.id)];
  persist();
  notify();
}

export function forgetEvent(id: string) {
  if (!loaded) load();
  cache = cache.filter((e) => e.id !== id);
  persist();
  notify();
}
