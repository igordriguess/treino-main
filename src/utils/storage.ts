import { WorkoutRoutine, WorkoutSessionLog, StudentAccount, AuthUser, Exercise } from '../types/workout';
import { INITIAL_ROUTINES, INITIAL_SESSIONS, INITIAL_STUDENTS } from '../data/defaultData';

const STORAGE_KEYS = {
  ROUTINES: 'irontrack_routines_v2',
  SESSIONS: 'irontrack_sessions_v2',
  STUDENTS: 'irontrack_students_v2',
  EXERCISES: 'irontrack_exercises_v2',
  CURRENT_USER: 'irontrack_current_user_v2',
};

export function loadRoutines(): WorkoutRoutine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    if (!raw) {
      saveRoutines(INITIAL_ROUTINES);
      return INITIAL_ROUTINES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_ROUTINES;
  } catch (e) {
    console.error('Failed to load routines from storage', e);
    return INITIAL_ROUTINES;
  }
}

export function saveRoutines(routines: WorkoutRoutine[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  } catch (e) {
    console.error('Failed to save routines to storage', e);
  }
}

export function loadSessions(): WorkoutSessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      saveSessions(INITIAL_SESSIONS);
      return INITIAL_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load sessions from storage', e);
    return [];
  }
}

export function saveSessions(sessions: WorkoutSessionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to storage', e);
  }
}

export function loadStudents(): StudentAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_STUDENTS;
  } catch (e) {
    console.error('Failed to load students from storage', e);
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: StudentAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to storage', e);
  }
}

export function loadExercises(): Exercise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to load exercises from storage', e);
    return [];
  }
}

export function saveExercises(exercises: Exercise[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
  } catch (e) {
    console.error('Failed to save exercises to storage', e);
  }
}

export function loadCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveCurrentUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Failed to save current user', e);
  }
}
