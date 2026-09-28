// ============================================
// TRAINING ENGINE - Phase 3 Implementation
// ============================================

import type {
  TrainingLevel,
  SessionOutcome,
  SuccessOutcome,
  MildDifficultyOutcome,
  SignificantDistressOutcome,
  EarlyTerminationOutcome,
  SkippedOutcome,
  TrainingStatus,
  DurationBand,
  EngineConfig,
  TrainingWindow,
  SchedulingConfig,
  ScheduledSlot,
  TrainingSchedule,
  ComputedTrainingState,
  Observation,
  GreenObservation,
  YellowObservation,
  RedObservation,
  PauseReason,
  EarlyTerminationReason,
  SkipReason,
  TrainingSession,
  InvitationResponse,
} from '../types';
import {
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SCHEDULING_CONFIG,
  DEFAULT_TRAINING_WINDOW,
} from '../types';

export { DEFAULT_ENGINE_CONFIG, DEFAULT_NOTIFICATION_CONFIG, DEFAULT_SCHEDULING_CONFIG, DEFAULT_TRAINING_WINDOW } from '../types';

const GREEN_OBSERVATIONS: GreenObservation[] = [
  'settled_quickly', 'ate_toy', 'rested_slept', 'calm_return', 'quiet', 'no_destruction'
];

const YELLOW_OBSERVATIONS: YellowObservation[] = [
  'brief_whine', 'paced_then_settled', 'stress_signals', 'did_not_eat_toy', 'watched_door', 'exuberant_greeting', 'slow_to_settle'
];

const RED_OBSERVATIONS: RedObservation[] = [
  'persistent_vocalization', 'destruction', 'elimination', 'escape_attempts', 'self_injury', 'panic_signs', 'shutdown', 'physiological_distress'
];

const DURATION_BANDS: { band: DurationBand; max: number; increment: number; minRepeats: number }[] = [
  { band: 'seconds_0_30', max: 30, increment: 5, minRepeats: 3 },
  { band: 'seconds_30_120', max: 120, increment: 15, minRepeats: 3 },
  { band: 'minutes_2_5', max: 300, increment: 30, minRepeats: 3 },
  { band: 'minutes_5_15', max: 900, increment: 60, minRepeats: 3 },
  { band: 'minutes_15_40', max: 2400, increment: 120, minRepeats: 2 },
  { band: 'minutes_40_90', max: 5400, increment: 300, minRepeats: 2 },
  { band: 'minutes_90_plus', max: Infinity, increment: 900, minRepeats: 1 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getBandConfig(duration: number): { band: DurationBand; max: number; increment: number; minRepeats: number } {
  return DURATION_BANDS.find(b => duration <= b.max) || DURATION_BANDS[DURATION_BANDS.length - 1];
}

function getIncrementSize(duration: number, config: EngineConfig): number {
  const band = getBandConfig(duration);
  // Allow pro override
  if (config.customIncrements?.[band.band]) {
    return config.customIncrements[band.band]!;
  }
  return band.increment;
}

function getMinRepeats(duration: number, config: EngineConfig): number {
  const band = getBandConfig(duration);
  if (config.customMinRepeats?.[band.band]) {
    return config.customMinRepeats[band.band]!;
  }
  return band.minRepeats;
}

function isGreenObservation(obs: Observation): obs is GreenObservation {
  return GREEN_OBSERVATIONS.includes(obs as GreenObservation);
}

function isYellowObservation(obs: Observation): obs is YellowObservation {
  return YELLOW_OBSERVATIONS.includes(obs as YellowObservation);
}

function isRedObservation(obs: Observation): obs is RedObservation {
  return RED_OBSERVATIONS.includes(obs as RedObservation);
}

// ============================================
// INITIAL DURATION SELECTION
// ============================================

export function selectInitialDuration(baselineOption: string, hasShownDistress: boolean, config: EngineConfig): number {
  const baselineMap: Record<string, number> = {
    'never_tried': 30,
    'under_1_min': 30,
    '1_5_min': 60,
    '5_15_min': 180,
    '15_30_min': 300,
    '30_60_min': 600,
    '60_plus_min': 900,
  };
  
  let duration = baselineMap[baselineOption] || config.initialDuration;
  
  if (hasShownDistress) {
    duration = Math.min(duration, 30);
  }
  
  return Math.max(config.minDuration, duration);
}

// ============================================
// CORE STATE COMPUTATION
// ============================================

export function computeTrainingState(state: TrainingLevel, config: EngineConfig): ComputedTrainingState {
  const increment = getIncrementSize(state.currentMaxDuration, config);
  const minRepeats = getMinRepeats(state.currentMaxDuration, config);
  const isInCriticalZone = state.currentMaxDuration < 2400; // < 40 minutes
  
  const canProgress = state.status === 'active' && 
    state.consecutiveSuccessesAtMax >= minRepeats &&
    !state.pauseUntil;
  
  const requiresStepBack = state.status === 'paused_recovery' || state.status === 're_entry';
  
  let maxDuration = state.currentMaxDuration;
  if (canProgress) {
    maxDuration = state.currentMaxDuration + increment;
  }
  
  return {
    safeDurationRange: [config.minDuration, maxDuration],
    canProgress,
    requiresStepBack,
    requiredRepeatsAtCurrentMax: minRepeats,
    currentIncrement: increment,
    isInCriticalZone,
  };
}

// ============================================
// SESSION OUTCOME PROCESSING
// ============================================

export function processSessionOutcome(
  state: TrainingLevel,
  outcome: SessionOutcome,
  config: EngineConfig
): TrainingLevel {
  switch (outcome.type) {
    case 'success':
      return handleSuccess(state, outcome, config);
    case 'mild_difficulty':
      return handleMildDifficulty(state, outcome, config);
    case 'significant_distress':
      return handleSignificantDistress(state, outcome, config);
    case 'early_termination':
      return handleEarlyTermination(state, outcome, config);
    case 'skipped':
      return handleSkippedSession(state, outcome);
  }
}

function handleSuccess(state: TrainingLevel, outcome: SuccessOutcome, config: EngineConfig): TrainingLevel {
  const { actualDuration } = outcome;
  const computed = computeTrainingState(state, config);
  
  if (actualDuration >= state.currentMaxDuration) {
    let newConsecutive = state.consecutiveSuccessesAtMax + 1;
    const requiredRepeats = computed.requiredRepeatsAtCurrentMax;
    
    let newMax = state.currentMaxDuration;
    let newTarget = state.currentMaxDuration;
    
    if (newConsecutive >= requiredRepeats && computed.canProgress) {
      const increment = computed.currentIncrement;
      const proposedMax = state.currentMaxDuration + increment;
      
      // Controlled randomness: 70% repeat, 30% micro-increase
      const shouldIncrease = Math.random() < config.microIncreaseProbability;
      
      if (shouldIncrease) {
        newMax = proposedMax;
        newTarget = proposedMax;
        newConsecutive = 0;
      } else {
        newTarget = state.currentMaxDuration;
      }
    } else {
      newTarget = state.currentMaxDuration;
    }
    
    return {
      ...state,
      currentMaxDuration: newMax,
      nextTargetDuration: newTarget,
      consecutiveSuccessesAtMax: newConsecutive,
      recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
      daysSinceLastIncrease: newMax > state.currentMaxDuration ? 0 : state.daysSinceLastIncrease + 1,
      sessionsSinceLastIncrease: newMax > state.currentMaxDuration ? 0 : state.sessionsSinceLastIncrease + 1,
      status: state.status === 're_entry' ? 'active' : state.status,
    };
  }
  
  // Success below current max
  return {
    ...state,
    recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
  };
}

function handleMildDifficulty(state: TrainingLevel, outcome: MildDifficultyOutcome, config: EngineConfig): TrainingLevel {
  const increment = getIncrementSize(state.currentMaxDuration, config);
  const stepBackAmount = increment * config.dropBackStepsMild;
  const newMax = Math.max(config.minDuration, state.currentMaxDuration - stepBackAmount);
  const newTarget = newMax;
  
  // Check for consecutive mild difficulty in recent 5 sessions
  const recentMild = state.recentOutcomes
    .slice(0, 5)
    .filter(o => o.type === 'mild_difficulty').length;
  
  let newStatus = state.status;
  let pauseUntil: Date | undefined;
  let pauseReason: PauseReason | undefined;
  
  if (recentMild >= config.consecutiveMildForPause) {
    newStatus = 'paused_recovery';
    pauseUntil = new Date(Date.now() + config.pauseHoursMild * 60 * 60 * 1000);
    pauseReason = 'multiple_mild_difficulty';
  }
  
  return {
    ...state,
    currentMaxDuration: newMax,
    nextTargetDuration: newTarget,
    consecutiveSuccessesAtMax: 0,
    recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
    status: newStatus,
    pauseUntil,
    pauseReason,
  };
}

function handleSignificantDistress(state: TrainingLevel, outcome: SignificantDistressOutcome, config: EngineConfig): TrainingLevel {
  const increment = getIncrementSize(state.currentMaxDuration, config);
  const stepBackAmount = increment * config.dropBackStepsDistress;
  const newMax = Math.max(config.minDuration, state.currentMaxDuration - stepBackAmount);
  
  const pauseHours = config.pauseHoursDistress;
  const pauseUntil = new Date(Date.now() + pauseHours * 60 * 60 * 1000);
  
  return {
    ...state,
    currentMaxDuration: newMax,
    nextTargetDuration: newMax,
    consecutiveSuccessesAtMax: 0,
    recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
    status: 'paused_recovery',
    pauseUntil,
    pauseReason: 'significant_distress',
    daysSinceLastIncrease: 0,
    sessionsSinceLastIncrease: 0,
  };
}

function handleEarlyTermination(state: TrainingLevel, outcome: EarlyTerminationOutcome, config: EngineConfig): TrainingLevel {
  const { actualDuration, reason, observations } = outcome;
  
  const hasRedObservations = observations.some(isRedObservation);
  const hasYellowObservations = observations.some(isYellowObservation);
  
  if (hasRedObservations || reason === 'distress_observed') {
    return handleSignificantDistress(state, {
      type: 'significant_distress',
      actualDuration,
      observations: observations.filter(isRedObservation) as RedObservation[],
      timestamp: outcome.timestamp,
    }, config);
  }
  
  if (hasYellowObservations || reason === 'owner_concern') {
    return handleMildDifficulty(state, {
      type: 'mild_difficulty',
      actualDuration,
      observations: observations.filter(isYellowObservation) as YellowObservation[],
      timestamp: outcome.timestamp,
    }, config);
  }
  
  // Technical/interruption - conservative step back
  const increment = getIncrementSize(state.currentMaxDuration, config);
  const stepBackAmount = increment * config.dropBackStepsMild;
  const newMax = Math.max(config.minDuration, state.currentMaxDuration - stepBackAmount);
  
  return {
    ...state,
    currentMaxDuration: newMax,
    nextTargetDuration: newMax,
    consecutiveSuccessesAtMax: 0,
    recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
  };
}

function handleSkippedSession(state: TrainingLevel, outcome: SkippedOutcome): TrainingLevel {
  return {
    ...state,
    recentOutcomes: [outcome, ...state.recentOutcomes].slice(0, 20),
  };
}

// ============================================
// EXTENDED BREAK & RE-ENTRY
// ============================================

export function handleExtendedBreak(state: TrainingLevel, daysSinceLastSession: number, config: EngineConfig): TrainingLevel {
  if (daysSinceLastSession < config.extendedBreakThresholdDays) {
    return state;
  }
  
  const reEntryBase = Math.round(state.currentMaxDuration * config.reEntryFraction);
  const newMax = Math.max(config.minDuration, reEntryBase);
  
  return {
    ...state,
    currentMaxDuration: newMax,
    nextTargetDuration: newMax,
    consecutiveSuccessesAtMax: 0,
    status: 're_entry',
    isReEntry: true,
    reEntryBaseDuration: newMax,
    daysSinceLastIncrease: 0,
    sessionsSinceLastIncrease: 0,
  };
}

// ============================================
// PLATEAU DETECTION
// ============================================

export function checkPlateau(state: TrainingLevel, config: EngineConfig): TrainingLevel {
  if (state.status !== 'active') return state;
  
  if (state.daysSinceLastIncrease >= config.plateauDays && 
      state.sessionsSinceLastIncrease >= config.plateauMinSessions) {
    return {
      ...state,
      status: 'paused_plateau',
    };
  }
  
  return state;
}

// ============================================
// PAUSE RECOVERY
// ============================================

export function checkPauseRecovery(state: TrainingLevel, now: Date = new Date()): TrainingLevel {
  if (state.status !== 'paused_recovery' || !state.pauseUntil) {
    return state;
  }
  
  if (now >= state.pauseUntil) {
    return {
      ...state,
      status: 'active',
      pauseUntil: undefined,
      pauseReason: undefined,
    };
  }
  
  return state;
}

// ============================================
// NEXT TARGET DURATION WITH RANDOMNESS
// ============================================

export function computeNextTargetDuration(
  state: TrainingLevel, 
  now: Date = new Date(),
  config: EngineConfig
): TrainingLevel {
  // 1. Check pause recovery
  let newState = checkPauseRecovery(state, now);
  
  // 2. Check plateau
  newState = checkPlateau(newState, config);
  
  // 3. Check extended break
  const lastSession = newState.recentOutcomes.find(o => o.type !== 'skipped');
  if (lastSession) {
    const daysSince = (now.getTime() - lastSession.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    newState = handleExtendedBreak(newState, daysSince, config);
  }
  
  // 4. Apply controlled randomness to target (micro-variation)
  const safeRange = computeTrainingState(newState, config).safeDurationRange;
  const randomizedTarget = applyDurationRandomness(newState.nextTargetDuration, safeRange, config);
  
  return {
    ...newState,
    nextTargetDuration: randomizedTarget,
  };
}

function applyDurationRandomness(target: number, range: [number, number], config: EngineConfig): number {
  const variance = target * config.durationRandomnessPercent;
  const min = Math.max(range[0], target - variance);
  const max = Math.min(range[1], target + variance);
  const randomized = target + (Math.random() - 0.5) * 2 * variance;
  return Math.round(Math.max(min, Math.min(max, randomized)));
}

// ============================================
// SCHEDULING ENGINE
// ============================================

function parseTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isInTrainingWindow(date: Date, window: TrainingWindow): boolean {
  const day = date.getDay();
  if (!window.daysOfWeek.includes(day)) return false;
  
  const start = parseTime(date, window.startTime);
  const end = parseTime(date, window.endTime);
  
  return date >= start && date <= end;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function distributeEvenly(start: Date, end: Date, count: number): Date[] {
  if (count <= 1) return [start];
  const interval = (end.getTime() - start.getTime()) / (count - 1);
  return Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * interval));
}

function applyTimeRandomness(baseTime: Date, minIntervalMinutes: number, randomnessPercent: number): Date {
  const maxJitterMinutes = minIntervalMinutes * randomnessPercent;
  const jitterMinutes = (Math.random() - 0.5) * 2 * maxJitterMinutes;
  return new Date(baseTime.getTime() + jitterMinutes * 60 * 1000);
}

function calculateTargetSessionsPerDay(completedToday: number, config: SchedulingConfig): number {
  // Adaptive: base 3, up to max based on completion rate
  const base = 3;
  return Math.min(config.maxSessionsPerDay, base + Math.floor(completedToday / 2));
}

export function generateDailySlots(
  date: Date,
  window: TrainingWindow,
  schedulingConfig: SchedulingConfig,
  targetDuration: number,
  completedSessions: TrainingSession[]
): ScheduledSlot[] {
  const slots: ScheduledSlot[] = [];
  
  const windowStart = parseTime(date, window.startTime);
  const windowEnd = parseTime(date, window.endTime);
  
  // Apply quiet hours buffer (30 min default)
  const effectiveStart = addMinutes(windowStart, 30);
  const effectiveEnd = addMinutes(windowEnd, -30);
  
  const availableMinutes = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60);
  if (availableMinutes < 240) return []; // Min 4 hour window
  
  const maxPossibleBySpacing = Math.floor(availableMinutes / schedulingConfig.minIntervalMinutes) + 1;
  const maxSessions = Math.min(schedulingConfig.maxSessionsPerDay, maxPossibleBySpacing);
  
  const completedToday = completedSessions.filter(s => isSameDay(s.actualStart, date)).length;
  const targetSessions = calculateTargetSessionsPerDay(completedToday, schedulingConfig);
  const sessionsToSchedule = Math.min(targetSessions, maxSessions);
  
  if (sessionsToSchedule <= 0) return [];
  
  const baseSlots = distributeEvenly(effectiveStart, effectiveEnd, sessionsToSchedule);
  
  baseSlots.forEach((baseTime, index) => {
    const randomizedTime = applyTimeRandomness(baseTime, schedulingConfig.minIntervalMinutes, 0.25);
    // Micro-variation on duration (±10%)
    const durationVariance = targetDuration * 0.1;
    const randomizedDuration = Math.round(targetDuration + (Math.random() - 0.5) * 2 * durationVariance);
    
    slots.push({
      id: `slot-${date.toISOString().split('T')[0]}-${index}`,
      startTime: randomizedTime,
      targetDuration: Math.max(5, randomizedDuration),
      isRandomized: true,
      sessionIndex: index,
      status: 'pending',
    });
  });
  
  return slots;
}

export function getNextSession(
  now: Date,
  trainingLevel: TrainingLevel,
  window: TrainingWindow,
  schedulingConfig: SchedulingConfig,
  completedSessions: TrainingSession[],
  todaySchedule?: TrainingSchedule
): ScheduledSlot | null {
  // Check if paused
  if (trainingLevel.status === 'paused_recovery' && trainingLevel.pauseUntil && now < trainingLevel.pauseUntil) {
    return null;
  }
  
  // Check if in training window today
  if (!isInTrainingWindow(now, window)) {
    return getFirstSlotTomorrow(trainingLevel, window, schedulingConfig, completedSessions);
  }
  
  // Get today's completed sessions
  const todaySessions = completedSessions.filter(s => isSameDay(s.actualStart, now));
  const completedCount = todaySessions.length;
  
  if (completedCount >= schedulingConfig.maxSessionsPerDay) {
    return getFirstSlotTomorrow(trainingLevel, window, schedulingConfig, completedSessions);
  }
  
  // Check min interval from last session
  const lastSession = todaySessions
    .sort((a, b) => b.actualStart.getTime() - a.actualStart.getTime())[0];
  
  if (lastSession) {
    const minutesSinceLast = (now.getTime() - lastSession.actualStart.getTime()) / (1000 * 60);
    if (minutesSinceLast < schedulingConfig.minIntervalMinutes) {
      const nextAvailable = addMinutes(lastSession.actualStart, schedulingConfig.minIntervalMinutes);
      if (isInTrainingWindow(nextAvailable, window)) {
        return createSlot(nextAvailable, trainingLevel.nextTargetDuration);
      }
      return getFirstSlotTomorrow(trainingLevel, window, schedulingConfig, completedSessions);
    }
  }
  
  // Use pre-generated schedule if available
  if (todaySchedule) {
    const upcoming = todaySchedule.slots
      .filter(s => s.startTime > now && s.status === 'pending')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    if (upcoming) return upcoming;
  }
  
  // Generate today's remaining slots
  const todaySlots = generateDailySlots(now, window, schedulingConfig, trainingLevel.nextTargetDuration, todaySessions);
  const upcoming = todaySlots
    .filter(s => s.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  
  if (upcoming) return upcoming;
  
  return getFirstSlotTomorrow(trainingLevel, window, schedulingConfig, completedSessions);
}

function getFirstSlotTomorrow(
  trainingLevel: TrainingLevel,
  window: TrainingWindow,
  schedulingConfig: SchedulingConfig,
  completedSessions: TrainingSession[]
): ScheduledSlot | null {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Find next valid training day
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(tomorrow);
    checkDate.setDate(tomorrow.getDate() + i);
    
    if (window.daysOfWeek.includes(checkDate.getDay())) {
      const slots = generateDailySlots(checkDate, window, schedulingConfig, trainingLevel.nextTargetDuration, completedSessions);
      if (slots.length > 0) {
        return slots[0];
      }
    }
  }
  
  return null;
}

function createSlot(startTime: Date, targetDuration: number): ScheduledSlot {
  return {
    id: `slot-${startTime.toISOString()}`,
    startTime,
    targetDuration,
    isRandomized: false,
    sessionIndex: 0,
    status: 'pending',
  };
}

// ============================================
// INVITATION RESPONSE HANDLING
// ============================================

export function handleInvitationResponse(
  response: InvitationResponse,
  currentSlot: ScheduledSlot,
  now: Date,
  window: TrainingWindow,
  schedulingConfig: SchedulingConfig,
  trainingLevel: TrainingLevel,
  completedSessions: TrainingSession[]
): ScheduledSlot | null {
  switch (response) {
    case 'start_now':
      return { ...currentSlot, status: 'in_progress' };
      
    case 'snooze': {
      const snoozeTime = addMinutes(now, schedulingConfig.snoozeMinutes);
      if (isInTrainingWindow(snoozeTime, window)) {
        return { ...currentSlot, startTime: snoozeTime, status: 'pending' };
      }
      return null;
    }
      
    case 'later_today': {
      const todaySlots = generateDailySlots(now, window, schedulingConfig, trainingLevel.nextTargetDuration, 
        completedSessions.filter(s => isSameDay(s.actualStart, now)));
      const later = todaySlots.find(s => s.startTime > now);
      return later || null;
    }
      
    case 'skip_today':
      return null;
  }
}

export function handleMissedNotification(
  missedSlot: ScheduledSlot,
  now: Date,
  window: TrainingWindow,
  schedulingConfig: SchedulingConfig,
  trainingLevel: TrainingLevel,
  completedSessions: TrainingSession[]
): { shouldCheckIn: boolean } {
  const recentSkips = countConsecutiveSkips(completedSessions, now);
  const shouldCheckIn = recentSkips >= DEFAULT_ENGINE_CONFIG.skipCheckInThreshold;
  return { shouldCheckIn };
}

function countConsecutiveSkips(completedSessions: TrainingSession[], now: Date): number {
  let count = 0;
  let checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const daySessions = completedSessions.filter(s => isSameDay(s.actualStart, checkDate));
    const hasCompleted = daySessions.some(s => s.outcome.type !== 'skipped');
    const hasSkipped = daySessions.some(s => s.outcome.type === 'skipped');
    
    if (!hasCompleted && hasSkipped) {
      count++;
    } else if (hasCompleted) {
      break;
    } else {
      break;
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return count;
}

// ============================================
// EARLY TERMINATION CLASSIFICATION
// ============================================

export function classifyEarlyTermination(
  plannedDuration: number,
  actualDuration: number,
  observations: Observation[]
): EarlyTerminationReason {
  const hasRed = observations.some(isRedObservation);
  const hasYellow = observations.some(isYellowObservation);
  
  if (hasRed) return 'distress_observed';
  if (hasYellow) return 'owner_concern';
  
  const ratio = actualDuration / plannedDuration;
  // Only classify as distress if ratio is very low AND there are no observations at all
  // (user didn't report any distress signals)
  if (ratio < 0.1 && observations.length === 0) return 'distress_observed';
  if (ratio < 0.3 && observations.length === 0) return 'owner_concern';
  return 'interruption';
}

// ============================================
// PROFESSIONAL REFERRAL CHECKS
// ============================================

export function checkReferralTriggers(
  trainingLevel: TrainingLevel,
  trainingProgress: { totalSessions: number; milestones: { duration: number; reachedAt: Date }[] },
  config: EngineConfig
): boolean {
  // Any Red observation
  const hasRed = trainingLevel.recentOutcomes.some(o => o.type === 'significant_distress');
  if (hasRed) return true;
  
  // No progress after 21 days
  const firstSession = trainingLevel.recentOutcomes[trainingLevel.recentOutcomes.length - 1];
  if (firstSession) {
    const daysSinceFirst = (Date.now() - firstSession.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFirst >= 21 && trainingLevel.currentMaxDuration < 1800) { // < 30 min
      return true;
    }
  }
  
  // Regression at previously mastered duration
  const maxReached = Math.max(...trainingProgress.milestones.map(m => m.duration), 0);
  if (maxReached > trainingLevel.currentMaxDuration + 300) { // 5+ min regression
    return true;
  }
  
  // Distress at baseline (< 30 sec)
  if (trainingLevel.currentMaxDuration <= 30 && 
      trainingLevel.recentOutcomes.some(o => o.type === 'significant_distress')) {
    return true;
  }
  
  return false;
}