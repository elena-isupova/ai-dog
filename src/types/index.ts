// ============================================
// CORE TYPES - From Phase 3 Training Engine
// ============================================

export type BaselineOption = 
  | 'never_tried' 
  | 'under_1_min' 
  | '1_5_min' 
  | '5_15_min' 
  | '15_30_min' 
  | '30_60_min' 
  | '60_plus_min';

export interface BaselineAssessment {
  option: BaselineOption;
  hasShownDistress: boolean;
  distressDetails?: string;
  assessedAt: Date;
}

export type GreenObservation = 
  | 'settled_quickly'
  | 'ate_toy'
  | 'rested_slept'
  | 'calm_return'
  | 'quiet'
  | 'no_destruction';

export type YellowObservation = 
  | 'brief_whine'
  | 'paced_then_settled'
  | 'stress_signals'
  | 'did_not_eat_toy'
  | 'watched_door'
  | 'exuberant_greeting'
  | 'slow_to_settle';

export type RedObservation = 
  | 'persistent_vocalization'
  | 'destruction'
  | 'elimination'
  | 'escape_attempts'
  | 'self_injury'
  | 'panic_signs'
  | 'shutdown'
  | 'physiological_distress';

export type Observation = GreenObservation | YellowObservation | RedObservation;

export type EarlyTerminationReason = 
  | 'distress_observed' 
  | 'owner_concern' 
  | 'technical' 
  | 'interruption';

export type SkipReason = 
  | 'snoozed' 
  | 'later_today' 
  | 'skip_today' 
  | 'notification_ignored' 
  | 'busy';

export type PauseReason = 'significant_distress' | 'multiple_mild_difficulty' | 'manual';

export type TrainingStatus = 
  | 'initializing'
  | 'active'
  | 'paused_recovery'
  | 'paused_plateau'
  | 're_entry'
  | 'referral_pending';

export type DurationBand = 
  | 'seconds_0_30'
  | 'seconds_30_120'
  | 'minutes_2_5'
  | 'minutes_5_15'
  | 'minutes_15_40'
  | 'minutes_40_90'
  | 'minutes_90_plus';

export interface SessionOutcomeBase {
  timestamp: Date;
}

export interface SuccessOutcome extends SessionOutcomeBase {
  type: 'success';
  actualDuration: number;
  observations: GreenObservation[];
}

export interface MildDifficultyOutcome extends SessionOutcomeBase {
  type: 'mild_difficulty';
  actualDuration: number;
  observations: YellowObservation[];
}

export interface SignificantDistressOutcome extends SessionOutcomeBase {
  type: 'significant_distress';
  actualDuration: number;
  observations: RedObservation[];
}

export interface EarlyTerminationOutcome extends SessionOutcomeBase {
  type: 'early_termination';
  plannedDuration: number;
  actualDuration: number;
  reason: EarlyTerminationReason;
  observations: (YellowObservation | RedObservation)[];
}

export interface SkippedOutcome extends SessionOutcomeBase {
  type: 'skipped';
  reason: SkipReason;
}

export type SessionOutcome = 
  | SuccessOutcome 
  | MildDifficultyOutcome 
  | SignificantDistressOutcome 
  | EarlyTerminationOutcome 
  | SkippedOutcome;

type WithoutOutcomeTimestamp<T> = T extends { timestamp: Date } ? Omit<T, 'timestamp'> : never;
export type SessionOutcomeInput = WithoutOutcomeTimestamp<SessionOutcome>;

export interface TrainingLevel {
  currentMaxDuration: number;
  nextTargetDuration: number;
  durationBand: DurationBand;
  consecutiveSuccessesAtMax: number;
  recentOutcomes: SessionOutcome[];
  status: TrainingStatus;
  pauseUntil?: Date;
  pauseReason?: PauseReason;
  daysSinceLastIncrease: number;
  sessionsSinceLastIncrease: number;
  isReEntry: boolean;
  reEntryBaseDuration?: number;
}

export interface ComputedTrainingState {
  safeDurationRange: [number, number];
  canProgress: boolean;
  requiresStepBack: boolean;
  requiredRepeatsAtCurrentMax: number;
  currentIncrement: number;
  isInCriticalZone: boolean;
}

// ============================================
// DATA MODELS - From Phase 3
// ============================================

export interface Dog {
  id: string;
  name: string;
  ageYears: number;
  ageMonths: number;
  breed: string;
  sex: 'male' | 'female' | 'unknown';
  neutered: boolean;
  acquiredDate: Date;
  baselineAssessment: BaselineAssessment;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSession {
  id: string;
  dogId: string;
  scheduledStart: Date;
  actualStart: Date;
  plannedDuration: number;
  actualDuration: number;
  outcome: SessionOutcome;
  notes?: string;
  enrichmentUsed?: string;
  exitDoor?: string;
  preDepartureCues?: string[];
  videoPath?: string;
  videoDuration?: number;
  appVersion: string;
  timezone: string;
  createdAt: Date;
  syncedAt?: Date;
}

export interface Milestone {
  duration: number;
  reachedAt: Date;
  sessionsToReach: number;
}

export interface TrainingProgress {
  dogId: string;
  currentMaxDuration: number;
  nextTargetDuration: number;
  consecutiveSuccessesAtMax: number;
  status: TrainingStatus;
  pauseUntil?: Date;
  pauseReason?: PauseReason;
  isReEntry: boolean;
  reEntryBaseDuration?: number;
  daysSinceLastIncrease: number;
  sessionsSinceLastIncrease: number;
  totalSessions: number;
  successfulSessions: number;
  mildDifficultySessions: number;
  significantDistressSessions: number;
  skippedSessions: number;
  earlyTerminationSessions: number;
  milestones: Milestone[];
  lastIncreaseDate?: Date;
  lastIncreaseDuration?: number;
  updatedAt: Date;
}

export type SlotStatus = 
  | 'pending'
  | 'available'
  | 'invited'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'missed';

export interface ScheduledSlot {
  id: string;
  startTime: Date;
  targetDuration: number;
  sessionIndex: number;
  status: SlotStatus;
  sessionId?: string;
  isRandomized?: boolean;
}

export interface TrainingSchedule {
  dogId: string;
  date: string; // YYYY-MM-DD
  slots: ScheduledSlot[];
  generatedAt: Date;
  version: number;
}

// ============================================
// SETTINGS & CONFIGURATION
// ============================================

export interface TrainingWindow {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  daysOfWeek: number[]; // 0-6, 0 = Sunday
  timezone: string;
}

export interface EngineConfig {
  minDuration: number;
  initialDuration: number;
  dropBackStepsMild: number;
  dropBackStepsDistress: number;
  pauseHoursMild: number;
  pauseHoursDistress: number;
  consecutiveMildForPause: number;
  plateauDays: number;
  plateauMinSessions: number;
  reEntryFraction: number;
  extendedBreakThresholdDays: number;
  skipCheckInThreshold: number;
  microIncreaseProbability: number;
  durationRandomnessPercent: number;
  timeRandomnessPercent: number;
  videoEncouragedThreshold: number;
  customIncrements?: Partial<Record<DurationBand, number>>;
  customMinRepeats?: Partial<Record<DurationBand, number>>;
}

export interface NotificationConfig {
  enabled: boolean;
  invitationSound: string;
  safetyAlertSound: string;
  dailyReminder: boolean;
  weeklyProgress: boolean;
  snoozeMinutes: number;
}

export interface SchedulingConfig {
  minIntervalMinutes: number;
  maxSessionsPerDay: number;
  snoozeMinutes: number;
}

export interface ProOverride {
  enabled?: boolean;
  professionalId?: string;
  customIncrements?: Partial<Record<DurationBand, number>>;
  customMinRepeats?: Partial<Record<DurationBand, number>>;
  customPauseHours?: { mild: number; distress: number };
  forcedStatus?: TrainingStatus;
  notes?: string;
  override?: {
    customIncrements?: Partial<Record<DurationBand, number>>;
    customMinRepeats?: Partial<Record<DurationBand, number>>;
    customPauseHours?: { mild: number; distress: number };
    notes?: string;
  };
}

export interface TrainingSettings {
  dogId: string;
  trainingWindow: TrainingWindow;
  engine: EngineConfig;
  notifications: NotificationConfig;
  scheduling: SchedulingConfig;
  professionalOverride?: ProOverride;
  updatedAt: Date;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  minDuration: 5,
  initialDuration: 30,
  dropBackStepsMild: 1,
  dropBackStepsDistress: 2,
  pauseHoursMild: 24,
  pauseHoursDistress: 48,
  consecutiveMildForPause: 2,
  plateauDays: 14,
  plateauMinSessions: 6,
  reEntryFraction: 0.5,
  extendedBreakThresholdDays: 7,
  skipCheckInThreshold: 3,
  microIncreaseProbability: 0.3,
  durationRandomnessPercent: 0.15,
  timeRandomnessPercent: 0.25,
  videoEncouragedThreshold: 5,
  customIncrements: {},
  customMinRepeats: {},
};

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  invitationSound: 'gentle_chime',
  safetyAlertSound: 'soft_alert',
  dailyReminder: true,
  weeklyProgress: true,
  snoozeMinutes: 15,
};

export const DEFAULT_SCHEDULING_CONFIG: SchedulingConfig = {
  minIntervalMinutes: 60,
  maxSessionsPerDay: 4,
  snoozeMinutes: 15,
};

export const DEFAULT_TRAINING_WINDOW: TrainingWindow = {
  startTime: '09:00',
  endTime: '17:00',
  daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// ============================================
// UI STATE TYPES
// ============================================

export type InvitationResponse = 'start_now' | 'snooze' | 'later_today' | 'skip_today';

export type OnboardingStep = 
  | 'welcome'
  | 'dog-profile'
  | 'baseline'
  | 'schedule'
  | 'celebration'
  | 'complete';

export interface AppState {
  dog: Dog | null;
  trainingLevel: TrainingLevel | null;
  trainingProgress: TrainingProgress | null;
  settings: TrainingSettings | null;
  todaySchedule: TrainingSchedule | null;
  currentSession: TrainingSession | null;
  sessions: TrainingSession[];
  onboardingStep: OnboardingStep;
  onboardingData: Partial<OnboardingData>;
  isLoading: boolean;
  error: string | null;
}

export interface OnboardingData {
  name: string;
  ageYears: number;
  ageMonths: number;
  breed: string;
  sex: 'male' | 'female' | 'unknown';
  neutered: boolean;
  acquiredDate: Date;
  baselineOption: BaselineOption;
  hasShownDistress: boolean;
  distressDetails: string;
  trainingWindow: TrainingWindow;
  notificationsEnabled: boolean;
}

// ============================================
// EXPORT TYPES
// ============================================

export interface ExportData {
  dog: Dog;
  sessions: TrainingSession[];
  progress: TrainingProgress;
  settings: TrainingSettings;
  exportedAt: Date;
  appVersion: string;
}
