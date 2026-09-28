import { WorkoutRoutine, WorkoutSessionLog, StudentAccount, AuthUser, Exercise } from '../types/workout';

// Data is persisted by the server as JSON files (see server.ts).
// Only the logged-in user of this device stays in localStorage.

export interface AppData {
  routines: WorkoutRoutine[];
  exercises: Exercise[];
  students: StudentAccount[];
  sessions: WorkoutSessionLog[];
}

export type CollectionName = keyof AppData;

const CURRENT_USER_KEY = 'irontrack_current_user_v2';

// Keys used before the data moved to the server; imported once, then removed.
const LEGACY_KEYS: Record<CollectionName, string> = {
  routines: 'irontrack_routines_v2',
  exercises: 'irontrack_exercises_v2',
  students: 'irontrack_students_v2',
  sessions: 'irontrack_sessions_v2',
};

// Routines used to hold a single `studentId` ('all' meant no specific student).
function migrateRoutine(raw: any): WorkoutRoutine {
  if (Array.isArray(raw.studentIds)) return raw;
  const { studentId, ...rest } = raw;
  return { ...rest, studentIds: studentId && studentId !== 'all' ? [studentId] : [] };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function readLegacy(): Partial<AppData> {
  const found: Partial<AppData> = {};
  (Object.keys(LEGACY_KEYS) as CollectionName[]).forEach((name) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEGACY_KEYS[name]) || 'null');
      if (Array.isArray(parsed) && parsed.length > 0) (found as any)[name] = parsed;
    } catch {
      // ignore unreadable legacy data
    }
  });
  return found;
}

export async function loadAppData(): Promise<AppData> {
  const data = await request<AppData>('/api/data');

  // One-time import of data saved in this browser before the JSON storage existed
  const serverIsEmpty = Object.values(data).every((list) => list.length === 0);
  const legacy = serverIsEmpty ? readLegacy() : {};
  const legacyNames = Object.keys(legacy) as CollectionName[];
  if (legacyNames.length > 0) {
    for (const name of legacyNames) {
      (data as any)[name] = legacy[name];
      await saveCollection(name, legacy[name] as any[]);
    }
    legacyNames.forEach((name) => {
      try {
        localStorage.removeItem(LEGACY_KEYS[name]);
      } catch {
        // storage not available
      }
    });
  }

  return { ...data, routines: data.routines.map(migrateRoutine) };
}

// Saves are chained per collection so an older write can never land after a newer one.
const saveQueues: Partial<Record<CollectionName, Promise<unknown>>> = {};

export function saveCollection<K extends CollectionName>(name: K, items: AppData[K]): Promise<void> {
  const previous = saveQueues[name] ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => request(`/api/data/${name}`, { method: 'PUT', body: JSON.stringify(items) }))
    .then(() => undefined);
  saveQueues[name] = next;
  return next;
}

export async function login(username: string, password: string): Promise<AuthUser | null> {
  try {
    return await request<AuthUser>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    if (err instanceof Error && /incorretos/i.test(err.message)) return null;
    throw err;
  }
}

export function loadCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save current user', e);
  }
}
