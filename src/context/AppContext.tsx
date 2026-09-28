import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Dog,
  TrainingLevel,
  TrainingProgress,
  TrainingSettings,
  TrainingSession,
  TrainingSchedule,
  ScheduledSlot,
  SessionOutcome,
  SessionOutcomeInput,
  OnboardingData,
  OnboardingStep,
  TrainingWindow,
  EngineConfig,
  NotificationConfig,
  SchedulingConfig,
  BaselineOption,
  InvitationResponse,
  AppState,
  ExportData,
} from '../types';
import type { EarlyTerminationOutcome } from '../types';
import {
  selectInitialDuration,
  processSessionOutcome,
  computeNextTargetDuration,
  handleInvitationResponse,
  checkReferralTriggers,
  classifyEarlyTermination,
  generateDailySlots,
  checkPauseRecovery,
  DEFAULT_ENGINE_CONFIG,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SCHEDULING_CONFIG,
  DEFAULT_TRAINING_WINDOW,
} from '../engine/trainingEngine';
import {
  getDog, saveDog, clearDog,
  getTrainingLevel, saveTrainingLevel, clearTrainingLevel,
  getTrainingProgress, saveTrainingProgress, clearTrainingProgress,
  getSettings, saveSettings, getOrCreateSettings, clearSettings,
  getSessions, saveSession, getRecentSessions, clearSessions,
  getSchedule, saveSchedule, getSchedulesForRange, clearSchedules,
  isOnboardingComplete, setOnboardingComplete,
  exportAllData, importAllData, clearAllData, migrateIfNeeded,
} from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

function generateId(): string {
  return uuidv4();
}

// ============================================
// INITIAL STATE
// ============================================

const createInitialTrainingLevel = (initialDuration: number): TrainingLevel => ({
  currentMaxDuration: initialDuration,
  nextTargetDuration: initialDuration,
  durationBand: 'seconds_0_30',
  consecutiveSuccessesAtMax: 0,
  recentOutcomes: [],
  status: 'active',
  daysSinceLastIncrease: 0,
  sessionsSinceLastIncrease: 0,
  isReEntry: false,
});

const createInitialProgress = (dogId: string): TrainingProgress => ({
  dogId,
  currentMaxDuration: 0,
  nextTargetDuration: 0,
  consecutiveSuccessesAtMax: 0,
  status: 'active',
  isReEntry: false,
  daysSinceLastIncrease: 0,
  sessionsSinceLastIncrease: 0,
  totalSessions: 0,
  successfulSessions: 0,
  mildDifficultySessions: 0,
  significantDistressSessions: 0,
  skippedSessions: 0,
  earlyTerminationSessions: 0,
  milestones: [],
  updatedAt: new Date(),
});

// ============================================
// ACTION TYPES
// ============================================

type Action =
  | { type: 'INIT_APP' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'COMPLETE_ONBOARDING'; payload: OnboardingData }
  | { type: 'SET_ONBOARDING_STEP'; payload: OnboardingStep }
  | { type: 'UPDATE_ONBOARDING_DATA'; payload: Partial<OnboardingData> }
  | { type: 'START_SESSION'; payload: { slot: ScheduledSlot; plannedDuration: number } }
  | { type: 'END_SESSION_EARLY'; payload: { actualDuration: number; reason: 'distress_observed' | 'owner_concern' | 'interruption'; observations: string[] } }
  | { type: 'COMPLETE_SESSION'; payload: { outcome: SessionOutcomeInput; notes?: string } }
  | { type: 'SKIP_SESSION'; payload: { reason: 'snoozed' | 'later_today' | 'skip_today' | 'notification_ignored' | 'busy' } }
  | { type: 'SNOOZE_SESSION'; payload: { minutes: number } }
  | { type: 'REFRESH_SCHEDULE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<TrainingSettings> }
  | { type: 'UPDATE_WINDOW'; payload: TrainingWindow }
  | { type: 'UPDATE_ENGINE_CONFIG'; payload: Partial<EngineConfig> }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<NotificationConfig> }
  | { type: 'UPDATE_SCHEDULING'; payload: Partial<SchedulingConfig> }
  | { type: 'RESET_ALL_DATA' }
  | { type: 'IMPORT_DATA'; payload: ExportData };

// ============================================
// REDUCER
// ============================================

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT_APP': {
      migrateIfNeeded();
      const dog = getDog();
      let trainingLevel = getTrainingLevel();
      const trainingProgress = getTrainingProgress();
      const settings = dog ? getOrCreateSettings(dog.id) : null;
      const sessions = getRecentSessions(50);
      
      // Check pause recovery on app initialization
      if (trainingLevel && settings) {
        const now = new Date();
        const recovered = checkPauseRecovery(trainingLevel, now);
        if (recovered !== trainingLevel) {
          trainingLevel = computeNextTargetDuration(recovered, now, settings.engine);
          saveTrainingLevel(trainingLevel);
        }
      }
      
      const todaySchedule = dog ? getSchedule(new Date()) : null;

      return {
        ...state,
        dog,
        trainingLevel,
        trainingProgress,
        settings,
        sessions,
        todaySchedule,
        isLoading: false,
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.payload };

    case 'UPDATE_ONBOARDING_DATA':
      return { ...state, onboardingData: { ...state.onboardingData, ...action.payload } };

    case 'COMPLETE_ONBOARDING': {
      const data = action.payload;
      const now = new Date();
      
      // Create dog
      const dog: Dog = {
        id: generateId(),
        name: data.name,
        ageYears: data.ageYears,
        ageMonths: data.ageMonths,
        breed: data.breed,
        sex: data.sex,
        neutered: data.neutered,
        acquiredDate: data.acquiredDate,
        baselineAssessment: {
          option: data.baselineOption,
          hasShownDistress: data.hasShownDistress,
          distressDetails: data.distressDetails,
          assessedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };

      // Initial duration
      const initialDuration = selectInitialDuration(
        data.baselineOption,
        data.hasShownDistress,
        DEFAULT_ENGINE_CONFIG
      );

      const trainingLevel = createInitialTrainingLevel(initialDuration);
      const trainingProgress = createInitialProgress(dog.id);
      trainingProgress.currentMaxDuration = initialDuration;
      trainingProgress.nextTargetDuration = initialDuration;

      const settings = getOrCreateSettings(dog.id);
      settings.trainingWindow = data.trainingWindow;
      settings.notifications.enabled = data.notificationsEnabled;

      saveDog(dog);
      saveTrainingLevel(trainingLevel);
      saveTrainingProgress(trainingProgress);
      saveSettings(settings);
      setOnboardingComplete(true);

      // Generate today's schedule
      const recentSessions = getRecentSessions(50);
      const todaySchedule = generateTodaysSchedule(trainingLevel, settings, recentSessions);

      return {
        ...state,
        dog,
        trainingLevel,
        trainingProgress,
        settings,
        todaySchedule,
        onboardingStep: 'complete',
        onboardingData: {},
        isLoading: false,
      };
    }

    case 'START_SESSION': {
      const { slot, plannedDuration } = action.payload;
      const now = new Date();
      
      const session: TrainingSession = {
        id: generateId(),
        dogId: state.dog!.id,
        scheduledStart: slot.startTime,
        actualStart: now,
        plannedDuration,
        actualDuration: 0,
        outcome: { type: 'skipped', reason: 'notification_ignored', timestamp: now }, // placeholder
        appVersion: '1.0.0',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: now,
      };

      // Update slot status
      if (state.todaySchedule) {
        const updatedSlots = state.todaySchedule.slots.map(s =>
          s.id === slot.id ? { ...s, status: 'in_progress' as const, sessionId: session.id } : s
        );
        const updatedSchedule = { ...state.todaySchedule, slots: updatedSlots };
        saveSchedule(updatedSchedule);
      }

      return {
        ...state,
        currentSession: session,
      };
    }

    case 'END_SESSION_EARLY': {
      if (!state.currentSession) return state;
      
      const { actualDuration, reason, observations } = action.payload;
      const now = new Date();

      // Classify early termination
      const classifiedReason = classifyEarlyTermination(
        state.currentSession.plannedDuration,
        actualDuration,
        observations as any
      );

      const outcome: EarlyTerminationOutcome = {
        type: 'early_termination',
        plannedDuration: state.currentSession.plannedDuration,
        actualDuration,
        reason: classifiedReason,
        observations: observations as any,
        timestamp: now,
      };

      return processSessionEnd(state, outcome);
    }

    case 'COMPLETE_SESSION': {
      if (!state.currentSession) return state;
      
      const outcome = {
        ...action.payload.outcome,
        timestamp: new Date(),
      } as unknown as SessionOutcome;

      return processSessionEnd(state, outcome, action.payload.notes);
    }

    case 'SKIP_SESSION': {
      if (!state.currentSession && !state.todaySchedule) return state;
      
      const now = new Date();
      const outcome: SessionOutcome = {
        type: 'skipped',
        reason: action.payload.reason,
        timestamp: now,
      };

      return processSessionEnd(state, outcome);
    }

    case 'SNOOZE_SESSION': {
      // Handled in invitation response
      return state;
    }

    case 'REFRESH_SCHEDULE': {
      if (!state.dog || !state.trainingLevel || !state.settings) return state;
      const sessions = getRecentSessions(50);
      const todaySchedule = generateTodaysSchedule(state.trainingLevel, state.settings, sessions);
      return { ...state, todaySchedule };
    }

    case 'UPDATE_SETTINGS': {
      if (!state.settings) return state;
      const updated = { ...state.settings, ...action.payload, updatedAt: new Date() };
      saveSettings(updated);
      return { ...state, settings: updated };
    }

    case 'UPDATE_WINDOW': {
      if (!state.settings) return state;
      const updated = { 
        ...state.settings, 
        trainingWindow: action.payload, 
        updatedAt: new Date() 
      };
      saveSettings(updated);
      // Regenerate schedule
      const sessions = getRecentSessions(50);
      const todaySchedule = generateTodaysSchedule(state.trainingLevel!, updated, sessions);
      return { ...state, settings: updated, todaySchedule };
    }

    case 'UPDATE_ENGINE_CONFIG': {
      if (!state.settings) return state;
      const updated = { 
        ...state.settings, 
        engine: { ...state.settings.engine, ...action.payload },
        updatedAt: new Date() 
      };
      saveSettings(updated);
      return { ...state, settings: updated };
    }

    case 'UPDATE_NOTIFICATIONS': {
      if (!state.settings) return state;
      const updated = { 
        ...state.settings, 
        notifications: { ...state.settings.notifications, ...action.payload },
        updatedAt: new Date() 
      };
      saveSettings(updated);
      return { ...state, settings: updated };
    }

    case 'UPDATE_SCHEDULING': {
      if (!state.settings) return state;
      const updated = { 
        ...state.settings, 
        scheduling: { ...state.settings.scheduling, ...action.payload },
        updatedAt: new Date() 
      };
      saveSettings(updated);
      return { ...state, settings: updated };
    }

    case 'RESET_ALL_DATA': {
      clearAllData();
      return {
        ...state,
        dog: null,
        trainingLevel: null,
        trainingProgress: null,
        settings: null,
        todaySchedule: null,
        currentSession: null,
        onboardingStep: 'welcome',
        onboardingData: {},
      };
    }

    case 'IMPORT_DATA': {
      importAllData(action.payload);
      const dog = getDog();
      const trainingLevel = getTrainingLevel();
      const trainingProgress = getTrainingProgress();
      const settings = dog ? getOrCreateSettings(dog.id) : null;
      const sessions = getRecentSessions(50);
      const todaySchedule = dog && trainingLevel && settings 
        ? generateTodaysSchedule(trainingLevel, settings, sessions) 
        : null;
      
      return {
        ...state,
        dog,
        trainingLevel,
        trainingProgress,
        settings,
        sessions,
        todaySchedule,
        onboardingStep: 'complete',
      };
    }

    default:
      return state;
  }
}

// ============================================
// HELPER: Process session end
// ============================================

function processSessionEnd(state: AppState, outcome: SessionOutcome, notes?: string): AppState {
  if (!state.dog || !state.trainingLevel || !state.settings || !state.currentSession) {
    return state;
  }

  const now = new Date();
  const actualDuration = outcome.type === 'skipped' ? 0 : outcome.actualDuration;

  // Update session
  const completedSession: TrainingSession = {
    ...state.currentSession,
    actualDuration,
    outcome,
    notes: notes?.trim() || undefined,
    createdAt: now,
  };
  saveSession(completedSession);

  // Process through training engine
  const newTrainingLevel = processSessionOutcome(
    state.trainingLevel,
    outcome,
    state.settings.engine
  );

  // Compute next target with randomness
  const computedLevel = computeNextTargetDuration(newTrainingLevel, now, state.settings.engine);

  // Update progress
  const newProgress = updateProgress(state.trainingProgress!, computedLevel, outcome);

  // Check referral
  const shouldRefer = checkReferralTriggers(computedLevel, newProgress, state.settings.engine);
  if (shouldRefer && computedLevel.status !== 'referral_pending') {
    computedLevel.status = 'referral_pending';
  }

  // Save
  saveTrainingLevel(computedLevel);
  saveTrainingProgress(newProgress);

  // Generate new schedule
  const recentSessions = getRecentSessions(50);
  const todaySchedule = generateTodaysSchedule(computedLevel, state.settings, recentSessions);

  return {
    ...state,
    trainingLevel: computedLevel,
    trainingProgress: newProgress,
    todaySchedule,
    currentSession: null,
    sessions: [completedSession, ...state.sessions].slice(0, 50),
  };
}

function updateProgress(
  progress: TrainingProgress, 
  level: TrainingLevel, 
  outcome: SessionOutcome
): TrainingProgress {
  const newProgress = { ...progress, updatedAt: new Date() };
  
  newProgress.currentMaxDuration = level.currentMaxDuration;
  newProgress.nextTargetDuration = level.nextTargetDuration;
  newProgress.consecutiveSuccessesAtMax = level.consecutiveSuccessesAtMax;
  newProgress.status = level.status;
  newProgress.pauseUntil = level.pauseUntil;
  newProgress.pauseReason = level.pauseReason;
  newProgress.isReEntry = level.isReEntry;
  newProgress.reEntryBaseDuration = level.reEntryBaseDuration;
  newProgress.daysSinceLastIncrease = level.daysSinceLastIncrease;
  newProgress.sessionsSinceLastIncrease = level.sessionsSinceLastIncrease;

  // Increment counters
  newProgress.totalSessions += 1;
  
  switch (outcome.type) {
    case 'success':
      newProgress.successfulSessions += 1;
      break;
    case 'mild_difficulty':
      newProgress.mildDifficultySessions += 1;
      break;
    case 'significant_distress':
      newProgress.significantDistressSessions += 1;
      break;
    case 'skipped':
      newProgress.skippedSessions += 1;
      break;
    case 'early_termination':
      newProgress.earlyTerminationSessions += 1;
      break;
  }

  // Check milestones
  const milestones = [30, 60, 120, 180, 300, 600, 900, 1800, 2400, 3600, 5400];
  const newMax = level.currentMaxDuration;
  milestones.forEach(m => {
    if (newMax >= m && !progress.milestones.some(ms => ms.duration === m)) {
      newProgress.milestones.push({
        duration: m,
        reachedAt: new Date(),
        sessionsToReach: newProgress.totalSessions,
      });
    }
  });

  // Update last increase
  if (newMax > (progress.lastIncreaseDuration || 0)) {
    newProgress.lastIncreaseDate = new Date();
    newProgress.lastIncreaseDuration = newMax;
  }

  return newProgress;
}

// ============================================
// HELPER: Generate today's schedule
// ============================================

function generateTodaysSchedule(
  level: TrainingLevel,
  settings: TrainingSettings,
  sessions: TrainingSession[]
): TrainingSchedule {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const slots = generateDailySlots(today, settings.trainingWindow, settings.scheduling, level.nextTargetDuration, sessions);
  
  return {
    dogId: settings.dogId,
    date: dateStr,
    slots,
    generatedAt: new Date(),
    version: 1,
  };
}

// ============================================
// CONTEXT & PROVIDER
// ============================================

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience actions
  actions: {
    setOnboardingStep: (step: OnboardingStep) => void;
    updateOnboardingData: (data: Partial<OnboardingData>) => void;
    completeOnboarding: (data: OnboardingData) => void;
    startSession: (slot: ScheduledSlot) => void;
    endSessionEarly: (actualDuration: number, reason: 'distress_observed' | 'owner_concern' | 'interruption', observations: string[]) => void;
    completeSession: (outcome: SessionOutcomeInput, notes?: string) => void;
    skipSession: (reason: 'snoozed' | 'later_today' | 'skip_today' | 'notification_ignored' | 'busy') => void;
    snoozeSession: (minutes: number) => void;
    handleInvitationResponse: (response: InvitationResponse, slot: ScheduledSlot) => ScheduledSlot | null;
    refreshSchedule: () => void;
    updateSettings: (settings: Partial<TrainingSettings>) => void;
    updateWindow: (window: TrainingWindow) => void;
    updateEngineConfig: (config: Partial<EngineConfig>) => void;
    updateNotifications: (config: Partial<NotificationConfig>) => void;
    updateScheduling: (config: Partial<SchedulingConfig>) => void;
    resetAllData: () => void;
    exportData: () => ExportData;
    importData: (data: ExportData) => void;
  };
} | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    dog: null,
    trainingLevel: null,
    trainingProgress: null,
    settings: null,
    todaySchedule: null,
    currentSession: null,
    sessions: [],
    onboardingStep: 'welcome',
    onboardingData: {},
    isLoading: true,
    error: null,
  } as AppState);

  // Initialize on mount
  useEffect(() => {
    dispatch({ type: 'INIT_APP' });
  }, []);

  // Convenience actions
  const actions = {
    setOnboardingStep: useCallback((step: OnboardingStep) => 
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: step }), []),
    
    updateOnboardingData: useCallback((data: Partial<OnboardingData>) => 
      dispatch({ type: 'UPDATE_ONBOARDING_DATA', payload: data }), []),
    
    completeOnboarding: useCallback((data: OnboardingData) => 
      dispatch({ type: 'COMPLETE_ONBOARDING', payload: data }), []),

    startSession: useCallback((slot: ScheduledSlot) => {
      const level = state.trainingLevel;
      if (!level) return;
      dispatch({ type: 'START_SESSION', payload: { slot, plannedDuration: level.nextTargetDuration } });
    }, [state.trainingLevel]),

    endSessionEarly: useCallback((actualDuration: number, reason: 'distress_observed' | 'owner_concern' | 'interruption', observations: string[]) => 
      dispatch({ type: 'END_SESSION_EARLY', payload: { actualDuration, reason, observations } }), []),

    completeSession: useCallback((outcome: SessionOutcomeInput, notes?: string) =>
      dispatch({ type: 'COMPLETE_SESSION', payload: { outcome, notes } }), []),

    skipSession: useCallback((reason: 'snoozed' | 'later_today' | 'skip_today' | 'notification_ignored' | 'busy') => 
      dispatch({ type: 'SKIP_SESSION', payload: { reason } }), []),

    snoozeSession: useCallback((minutes: number) => 
      dispatch({ type: 'SNOOZE_SESSION', payload: { minutes } }), []),

    handleInvitationResponse: useCallback((
      response: InvitationResponse, 
      slot: ScheduledSlot
    ): ScheduledSlot | null => {
      if (!state.trainingLevel || !state.settings || !state.dog) return null;
      const sessions = getRecentSessions(50);
      return handleInvitationResponse(
        response,
        slot,
        new Date(),
        state.settings.trainingWindow,
        state.settings.scheduling,
        state.trainingLevel,
        sessions
      );
    }, [state.trainingLevel, state.settings, state.dog]),

    refreshSchedule: useCallback(() => 
      dispatch({ type: 'REFRESH_SCHEDULE' }), []),

    updateSettings: useCallback((settings: Partial<TrainingSettings>) => 
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings }), []),

    updateWindow: useCallback((window: TrainingWindow) => 
      dispatch({ type: 'UPDATE_WINDOW', payload: window }), []),

    updateEngineConfig: useCallback((config: Partial<EngineConfig>) => 
      dispatch({ type: 'UPDATE_ENGINE_CONFIG', payload: config }), []),

    updateNotifications: useCallback((config: Partial<NotificationConfig>) => 
      dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: config }), []),

    updateScheduling: useCallback((config: Partial<SchedulingConfig>) => 
      dispatch({ type: 'UPDATE_SCHEDULING', payload: config }), []),

    resetAllData: useCallback(() => 
      dispatch({ type: 'RESET_ALL_DATA' }), []),

    exportData: useCallback(() => exportAllData(), []),

    importData: useCallback((data: ExportData) => 
      dispatch({ type: 'IMPORT_DATA', payload: data }), []),
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
