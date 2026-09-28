// ============================================
// STORAGE LAYER - localStorage persistence
// ============================================

import {
  Dog,
  TrainingSession,
  TrainingProgress,
  TrainingSchedule,
  TrainingSettings,
  TrainingLevel,
  TrainingWindow,
  EngineConfig,
  NotificationConfig,
  SchedulingConfig,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SCHEDULING_CONFIG,
  DEFAULT_TRAINING_WINDOW,
  ExportData,
} from '../types';

const STORAGE_KEYS = {
  DOG: 'ai_dog_dog',
  TRAINING_LEVEL: 'ai_dog_training_level',
  TRAINING_PROGRESS: 'ai_dog_training_progress',
  SETTINGS: 'ai_dog_settings',
  SESSIONS: 'ai_dog_sessions',
  SCHEDULES: 'ai_dog_schedules',
  ONBOARDING_COMPLETE: 'ai_dog_onboarding_complete',
  APP_VERSION: 'ai_dog_app_version',
} as const;

const CURRENT_APP_VERSION = '1.0.0';

// ============================================
// GENERIC STORAGE HELPERS
// ============================================

function get<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item, dateReviver) as T;
  } catch {
    return defaultValue;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value, dateReplacer));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

function remove(key: string): void {
  localStorage.removeItem(key);
}

function dateReviver(_key: string, value: any): any {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}

function dateReplacer(_key: string, value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

// ============================================
// DOG
// ============================================

export function getDog(): Dog | null {
  return get<Dog | null>(STORAGE_KEYS.DOG, null);
}

export function saveDog(dog: Dog): void {
  set(STORAGE_KEYS.DOG, dog);
}

export function clearDog(): void {
  remove(STORAGE_KEYS.DOG);
}

// ============================================
// TRAINING LEVEL
// ============================================

export function getTrainingLevel(): TrainingLevel | null {
  return get<TrainingLevel | null>(STORAGE_KEYS.TRAINING_LEVEL, null);
}

export function saveTrainingLevel(level: TrainingLevel): void {
  set(STORAGE_KEYS.TRAINING_LEVEL, level);
}

export function clearTrainingLevel(): void {
  remove(STORAGE_KEYS.TRAINING_LEVEL);
}

// ============================================
// TRAINING PROGRESS
// ============================================

export function getTrainingProgress(): TrainingProgress | null {
  return get<TrainingProgress | null>(STORAGE_KEYS.TRAINING_PROGRESS, null);
}

export function saveTrainingProgress(progress: TrainingProgress): void {
  set(STORAGE_KEYS.TRAINING_PROGRESS, progress);
}

export function clearTrainingProgress(): void {
  remove(STORAGE_KEYS.TRAINING_PROGRESS);
}

// ============================================
// SESSIONS
// ============================================

export function getSessions(): TrainingSession[] {
  return get<TrainingSession[]>(STORAGE_KEYS.SESSIONS, []);
}

export function saveSession(session: TrainingSession): void {
  const sessions = getSessions();
  if (sessions.some(existing => existing.id === session.id)) return;
  sessions.unshift(session); // Most recent first
  // Keep last 1000 sessions
  if (sessions.length > 1000) sessions.length = 1000;
  set(STORAGE_KEYS.SESSIONS, sessions);
}

export function getRecentSessions(limit: number = 20): TrainingSession[] {
  return getSessions().slice(0, limit);
}

export function clearSessions(): void {
  remove(STORAGE_KEYS.SESSIONS);
}

// ============================================
// SCHEDULES
// ============================================

export function getSchedule(date: Date): TrainingSchedule | null {
  const schedules = get<TrainingSchedule[]>(STORAGE_KEYS.SCHEDULES, []);
  const dateStr = date.toISOString().split('T')[0];
  return schedules.find(s => s.date === dateStr) || null;
}

export function saveSchedule(schedule: TrainingSchedule): void {
  const schedules = get<TrainingSchedule[]>(STORAGE_KEYS.SCHEDULES, []);
  const existingIndex = schedules.findIndex(s => s.date === schedule.date);
  if (existingIndex >= 0) {
    schedules[existingIndex] = schedule;
  } else {
    schedules.push(schedule);
  }
  // Keep last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const filtered = schedules.filter(s => new Date(s.date) >= cutoff);
  set(STORAGE_KEYS.SCHEDULES, filtered);
}

export function getSchedulesForRange(start: Date, end: Date): TrainingSchedule[] {
  const schedules = get<TrainingSchedule[]>(STORAGE_KEYS.SCHEDULES, []);
  return schedules.filter(s => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });
}

export function clearSchedules(): void {
  remove(STORAGE_KEYS.SCHEDULES);
}

// ============================================
// SETTINGS
// ============================================

export function getSettings(): TrainingSettings | null {
  return get<TrainingSettings | null>(STORAGE_KEYS.SETTINGS, null);
}

export function saveSettings(settings: TrainingSettings): void {
  set(STORAGE_KEYS.SETTINGS, settings);
}

export function getOrCreateSettings(dogId: string): TrainingSettings {
  const existing = getSettings();
  if (existing) return existing;
  
  const defaults: TrainingSettings = {
    dogId,
    trainingWindow: { ...DEFAULT_TRAINING_WINDOW },
    engine: { ...DEFAULT_ENGINE_CONFIG },
    notifications: { ...DEFAULT_NOTIFICATION_CONFIG },
    scheduling: { ...DEFAULT_SCHEDULING_CONFIG },
    updatedAt: new Date(),
  };
  
  saveSettings(defaults);
  return defaults;
}

export function clearSettings(): void {
  remove(STORAGE_KEYS.SETTINGS);
}

// ============================================
// ONBOARDING
// ============================================

export function isOnboardingComplete(): boolean {
  return get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
}

export function setOnboardingComplete(complete: boolean): void {
  set(STORAGE_KEYS.ONBOARDING_COMPLETE, complete);
}

// ============================================
// APP VERSION
// ============================================

export function getAppVersion(): string {
  return get<string>(STORAGE_KEYS.APP_VERSION, CURRENT_APP_VERSION);
}

export function setAppVersion(version: string): void {
  set(STORAGE_KEYS.APP_VERSION, version);
}

// ============================================
// CLEAR ALL DATA
// ============================================

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => remove(key));
}

// ============================================
// EXPORT / IMPORT
// ============================================

export function exportAllData(): ExportData {
  const dog = getDog();
  const sessions = getSessions();
  const progress = getTrainingProgress();
  const settings = getSettings();
  
  if (!dog || !progress || !settings) {
    throw new Error('No data to export');
  }
  
  return {
    dog,
    sessions,
    progress,
    settings,
    exportedAt: new Date(),
    appVersion: CURRENT_APP_VERSION,
  };
}

export function importAllData(data: ExportData): void {
  saveDog(data.dog);
  data.sessions.forEach(saveSession);
  saveTrainingProgress(data.progress);
  saveSettings(data.settings);
  setOnboardingComplete(true);
}

// ============================================
// MIGRATION HELPERS (for future versions)
// ============================================

export function migrateIfNeeded(): void {
  const storedVersion = getAppVersion();
  if (storedVersion !== CURRENT_APP_VERSION) {
    // Future migrations would go here
    console.log(`Migrating from ${storedVersion} to ${CURRENT_APP_VERSION}`);
    setAppVersion(CURRENT_APP_VERSION);
  }
}
