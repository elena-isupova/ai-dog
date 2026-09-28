import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Square, Video, VideoOff, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Modal, ProgressRing, BottomSheet, Chip } from '../components/ui';
import { clsx, formatDuration, formatDurationShort } from '../utils/helpers';
import { classifyEarlyTermination } from '../engine/trainingEngine';
import type { SessionOutcome, SessionOutcomeInput, GreenObservation, YellowObservation, RedObservation } from '../types';

type TrainingRoute = 'active' | 'complete' | 'feedback' | 'saved';

export function TrainingScreen() {
  const params = useParams();
  const route = (params['*'] as TrainingRoute) || 'active';

  switch (route) {
    case 'active':
      return <ActiveTrainingScreen />;
    case 'complete':
      return <SessionCompleteScreen />;
    case 'feedback':
      return <SessionFeedbackScreen />;
    case 'saved':
      return <SessionSavedScreen />;
    default:
      return <ActiveTrainingScreen />;
  }
}

// ============================================
// ACTIVE TRAINING SCREEN - The Meditative Core
// ============================================

function ActiveTrainingScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [ambientPhase, setAmbientPhase] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const wasRunningBeforeBackground = useRef(false);
  const ambientIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plannedDuration = state.trainingLevel?.nextTargetDuration || 30;
  const ringSize = viewportHeight < 720 ? 192 : 240;
  const progress = Math.min(100, (elapsed / plannedDuration) * 100);
  const remaining = Math.max(0, plannedDuration - elapsed);

  const startSession = useCallback(() => {
    setIsRunning(true);
    if (!state.currentSession) {
      navigate('/');
    }
  }, [state.currentSession, navigate]);

  const completeSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    navigate('/training/complete', {
      state: { plannedDuration, actualDuration: plannedDuration, endedEarly: false },
    });
  }, [plannedDuration, navigate]);

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  // Handle app backgrounding - pause timer when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        wasRunningBeforeBackground.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
      } else if (!document.hidden && wasRunningBeforeBackground.current) {
        wasRunningBeforeBackground.current = false;
        setIsRunning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  // Ambient breathing animation - very subtle
  useEffect(() => {
    ambientIntervalRef.current = setInterval(() => {
      setAmbientPhase(p => (p + 1) % 360);
    }, 8000); // Very slow - 8 second cycle
    return () => {
      if (ambientIntervalRef.current) clearInterval(ambientIntervalRef.current);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (state.currentSession) {
      startTimeRef.current = state.currentSession.actualStart;
      const alreadyElapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      setElapsed(alreadyElapsed);
      setCountdown(0);
      setIsRunning(true);
    } else {
      // Pre-start countdown
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownInterval);
            startSession();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [startSession, state.currentSession]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    
    intervalRef.current = setInterval(() => {
      setElapsed(e => Math.min(plannedDuration, e + 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, plannedDuration]);

  useEffect(() => {
    if (isRunning && elapsed >= plannedDuration) completeSession();
  }, [completeSession, elapsed, isRunning, plannedDuration]);

  const handleEndEarly = useCallback(() => {
    setShowEndConfirm(true);
  }, []);

  const confirmEndEarly = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setShowEndConfirm(false);
    
    const actualDuration = elapsed;
    navigate('/training/complete', {
      state: { plannedDuration, actualDuration, endedEarly: true },
    });
  }, [elapsed, plannedDuration, navigate]);

  const cancelEndEarly = useCallback(() => {
    setShowEndConfirm(false);
  }, []);

  const toggleRecording = useCallback(() => setIsRecording(recording => !recording), []);

  return (
    <div className="training-screen min-h-screen bg-[var(--bg)] relative flex flex-col">
      {/* Ambient Background - extremely subtle */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Breathing orb - extremely subtle */}
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/5 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(ambientPhase * Math.PI / 180) * 0.02})`,
            opacity: 0.08 + Math.sin(ambientPhase * Math.PI / 180) * 0.03,
          }}
          aria-hidden="true"
        />
        {/* Secondary ambient element */}
        <div 
          className="fixed top-20 right-10 w-[120px] h-[120px] rounded-full bg-[var(--accent)]/5 pointer-events-none"
          style={{
            transform: `scale(${1 + Math.sin((ambientPhase + 120) * Math.PI / 180) * 0.015})`,
            opacity: 0.05 + Math.sin((ambientPhase + 120) * Math.PI / 180) * 0.02,
          }}
          aria-hidden="true"
        />
        <div 
          className="fixed bottom-20 left-10 w-[80px] h-[80px] rounded-full bg-[var(--accent)]/5 pointer-events-none"
          style={{
            transform: `scale(${1 + Math.sin((ambientPhase + 240) * Math.PI / 180) * 0.01})`,
            opacity: 0.04 + Math.sin((ambientPhase + 240) * Math.PI / 180) * 0.015,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="fixed inset-0 flex items-center justify-center z-20 bg-[var(--bg)] animate-fade-in">
            <div className="text-center">
              {countdown === 3 && (
                <p className="text-body text-[var(--text-secondary)] mb-6 animate-fade-in">
                  Get {state.dog?.name} settled with their toy
                </p>
              )}
              <span className={clsx('text-timer animate-scale-in', countdown === 3 ? 'text-7xl' : '')}>
                {countdown > 0 ? countdown : 'Go'}
              </span>
            </div>
          </div>
        )}

        {/* Timer Display - The Hero Element */}
        {!countdown && (
          <div className="flex flex-col items-center flex-1 justify-center w-full max-w-lg">
            {/* Dog name & practice number - subtle */}
            <div className="text-center mb-8 animate-fade-in">
              <p className="text-body-sm text-[var(--text-muted)] mb-2">
                {state.dog?.name} · Practice {state.trainingProgress ? state.trainingProgress.totalSessions + 1 : 1}
              </p>
            </div>

            {/* Timer Ring + Display */}
            <div
              className="relative mx-auto mb-4 animate-scale-in"
              style={{ width: ringSize, height: ringSize }}
            >
              <ProgressRing
                value={progress}
                size={ringSize}
                strokeWidth={6}
                variant="default"
                showValue={false}
                showTimeRemaining
                remainingSeconds={remaining}
              />
            </div>

            {/* Remaining label */}
            <p className="text-timer-label text-[var(--text-muted)] mb-2 animate-fade-in">
              remaining
            </p>
          </div>
        )}

        {/* Bottom Controls - Centered, thumb-friendly */}
        <div className="fixed bottom-6 left-6 right-6 z-10 flex flex-col items-center gap-3 animate-slide-up">
          {/* Record Button - Left side */}
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Record video'}
            aria-pressed={isRecording}
          >
            {isRecording
              ? <VideoOff size={24} strokeWidth={2} className="text-[var(--accent)]" />
              : <Video size={24} strokeWidth={2} />}
          </Button>

          {/* End Early Button - Large, centered, thumb-friendly */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleEndEarly}
            className={clsx(
              'training-end-button h-24 w-24 rounded-full',
              'flex flex-col items-center justify-center gap-2',
              'shadow-[var(--shadow-lg)] border border-[var(--border)]'
            )}
            aria-label="End session early"
          >
            <Square size={24} strokeWidth={2} className="text-[var(--text-secondary)]" />
            <span className="whitespace-nowrap text-[12px] leading-none text-[var(--text-secondary)]">End early</span>
            <span className="text-[11px] leading-none text-[var(--text-muted)]">{formatDurationShort(elapsed)}</span>
          </Button>
        </div>

        {/* End Early Confirmation Modal */}
        <Modal
          isOpen={showEndConfirm}
          onClose={cancelEndEarly}
          title="End session early?"
          description="Ending early may reduce your dog's training duration for the next session. Progress up to now will be recorded."
          size="sm"
        >
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={cancelEndEarly}>Continue training</Button>
            <Button variant="destructive" onClick={confirmEndEarly}>End session</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

// ============================================
// SESSION COMPLETE SCREEN
// ============================================

function SessionCompleteScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const completion = location.state as {
    plannedDuration?: number;
    actualDuration?: number;
    endedEarly?: boolean;
  } | null;
  const plannedDuration = completion?.plannedDuration ?? state.currentSession?.plannedDuration ?? 30;
  const actualDuration = completion?.actualDuration ?? plannedDuration;
  const wasEarly = completion?.endedEarly ?? actualDuration < plannedDuration;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className={clsx(
          'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center',
          wasEarly ? 'bg-[var(--accent-subtle)]' : 'bg-[var(--success-subtle)]'
        )}>
          <CheckCircle size={48} strokeWidth={1.5} className="text-[var(--success)]" />
        </div>

        <h1 className="text-h1 text-[var(--text-primary)] mb-3 leading-tight">
          {wasEarly ? 'You ended the practice early' : 'Practice timer complete'}
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-2">
          {wasEarly
            ? `${formatDuration(actualDuration)} practiced, with ${state.dog?.name}'s comfort first.`
            : `${state.dog?.name} stayed with the plan for ${formatDuration(actualDuration)}.`}
        </p>
        <div className="mt-8 space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate('/training/feedback', { state: completion })}
          >
            Log how it went
          </Button>
          <p className="text-body-sm text-[var(--text-muted)]">
            Your notes shape the next practice.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SESSION FEEDBACK SCREEN
// ============================================

const GREEN_OBSERVATIONS: { id: GreenObservation; label: string }[] = [
  { id: 'settled_quickly', label: 'Settled quickly' },
  { id: 'ate_toy', label: 'Ate toy' },
  { id: 'rested_slept', label: 'Rested / slept' },
  { id: 'calm_return', label: 'Calm return' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'no_destruction', label: 'No destruction' },
];

const YELLOW_OBSERVATIONS: { id: YellowObservation; label: string }[] = [
  { id: 'brief_whine', label: 'Brief whine' },
  { id: 'paced_then_settled', label: 'Paced then settled' },
  { id: 'stress_signals', label: 'Stress signals' },
  { id: 'did_not_eat_toy', label: "Didn't eat toy" },
  { id: 'watched_door', label: 'Watched door' },
  { id: 'exuberant_greeting', label: 'Exuberant greeting' },
  { id: 'slow_to_settle', label: 'Slow to settle' },
];

const RED_OBSERVATIONS: { id: RedObservation; label: string }[] = [
  { id: 'persistent_vocalization', label: 'Persistent vocalization' },
  { id: 'destruction', label: 'Destruction' },
  { id: 'elimination', label: 'Elimination' },
  { id: 'escape_attempts', label: 'Escape attempts' },
  { id: 'self_injury', label: 'Self-injury' },
  { id: 'panic_signs', label: 'Panic signs' },
  { id: 'shutdown', label: 'Shutdown / frozen' },
  { id: 'physiological_distress', label: 'Physiological distress' },
];

function SessionFeedbackScreen() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const completion = location.state as {
    plannedDuration?: number;
    actualDuration?: number;
    endedEarly?: boolean;
  } | null;
  const [greenSelected, setGreenSelected] = useState<Set<GreenObservation>>(new Set());
  const [yellowSelected, setYellowSelected] = useState<Set<YellowObservation>>(new Set());
  const [redSelected, setRedSelected] = useState<RedObservation | null>(null);
  const [showRedConfirm, setShowRedConfirm] = useState(false);
  const [pendingRed, setPendingRed] = useState<RedObservation | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const handleGreenToggle = useCallback((obs: GreenObservation) => {
    setGreenSelected(prev => {
      const next = new Set(prev);
      if (next.has(obs)) next.delete(obs);
      else next.add(obs);
      return next;
    });
  }, []);

  const handleYellowToggle = useCallback((obs: YellowObservation) => {
    setYellowSelected(prev => {
      const next = new Set(prev);
      if (next.has(obs)) next.delete(obs);
      else next.add(obs);
      return next;
    });
  }, []);

  const handleRedSelect = useCallback((obs: RedObservation) => {
    setPendingRed(obs);
    setShowRedConfirm(true);
  }, []);

  const confirmRed = useCallback(() => {
    if (pendingRed) {
      setRedSelected(pendingRed);
      setPendingRed(null);
    }
    setShowRedConfirm(false);
  }, [pendingRed]);

  const cancelRed = useCallback(() => {
    setPendingRed(null);
    setShowRedConfirm(false);
  }, []);

  const hasAnySelection = greenSelected.size > 0 || yellowSelected.size > 0 || redSelected !== null;

  const handleSave = useCallback(async () => {
    if (!hasAnySelection && !note.trim()) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    setIsSaving(true);

    const actualDuration = completion?.actualDuration ?? state.currentSession?.actualDuration ?? state.trainingLevel?.nextTargetDuration ?? 30;
    const plannedDuration = completion?.plannedDuration ?? state.currentSession?.plannedDuration ?? state.trainingLevel?.nextTargetDuration ?? 30;

    let outcome: SessionOutcome;
    if (completion?.endedEarly) {
      const observations = [...yellowSelected, ...(redSelected ? [redSelected] : [])];
      outcome = {
        type: 'early_termination',
        plannedDuration,
        actualDuration,
        reason: classifyEarlyTermination(plannedDuration, actualDuration, observations),
        observations,
        timestamp: new Date(),
      };
    } else if (redSelected) {
      outcome = {
        type: 'significant_distress',
        actualDuration,
        observations: [redSelected],
        timestamp: new Date(),
      } as any;
    } else if (yellowSelected.size > 0) {
      outcome = {
        type: 'mild_difficulty',
        actualDuration,
        observations: Array.from(yellowSelected),
        timestamp: new Date(),
      } as any;
    } else {
      outcome = {
        type: 'success',
        actualDuration,
        observations: Array.from(greenSelected),
        timestamp: new Date(),
      } as any;
    }

    actions.completeSession(outcome, note);
    setIsSaving(false);
    navigate('/training/saved', {
      state: { outcome, actualDuration, plannedDuration },
    });
  }, [actions, completion, greenSelected, hasAnySelection, navigate, note, redSelected, state, yellowSelected]);

  const handleSkip = useCallback(() => {
    const actualDuration = completion?.actualDuration ?? state.currentSession?.actualDuration ?? state.trainingLevel?.nextTargetDuration ?? 30;
    const plannedDuration = completion?.plannedDuration ?? state.currentSession?.plannedDuration ?? state.trainingLevel?.nextTargetDuration ?? 30;
    const outcome: SessionOutcomeInput = completion?.endedEarly
      ? {
          type: 'early_termination',
          plannedDuration,
          actualDuration,
          reason: classifyEarlyTermination(plannedDuration, actualDuration, []),
          observations: [],
        }
      : { type: 'success', actualDuration, observations: [] };
    actions.completeSession(outcome);
    navigate('/training/saved', { state: { outcome, actualDuration, plannedDuration } });
  }, [actions, completion, navigate, state]);

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleSkip}
      title="How did it go?"
    >
      <div className="space-y-7 pb-8">
        {/* Green Section - Calm */}
        <div className="space-y-4">
          <h3 className="text-caption text-[var(--text-muted)]">Calm</h3>
          <div className="flex flex-wrap gap-2.5">
            {GREEN_OBSERVATIONS.map(obs => (
              <Chip
                key={obs.id}
                variant="success"
                size="sm"
                selected={greenSelected.has(obs.id)}
                onSelect={() => handleGreenToggle(obs.id)}
                aria-pressed={greenSelected.has(obs.id)}
              >
                {obs.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Yellow Section - Some difficulty */}
        <div className="space-y-4">
          <h3 className="text-caption text-[var(--text-muted)]">Some difficulty</h3>
          <div className="flex flex-wrap gap-2.5">
            {YELLOW_OBSERVATIONS.map(obs => (
              <Chip
                key={obs.id}
                variant="warning"
                size="sm"
                selected={yellowSelected.has(obs.id)}
                onSelect={() => handleYellowToggle(obs.id)}
                aria-pressed={yellowSelected.has(obs.id)}
              >
                {obs.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Red Section - Distress */}
        <div className="space-y-4">
          <h3 className="text-caption text-[var(--text-muted)]">Significant distress</h3>
          <p className="text-body-sm text-[var(--text-muted)]">
            Selecting any will pause progression and may suggest professional help.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {RED_OBSERVATIONS.map(obs => (
              <Chip
                key={obs.id}
                variant="distress"
                size="sm"
                selected={redSelected === obs.id}
                onSelect={() => handleRedSelect(obs.id)}
                aria-pressed={redSelected === obs.id}
              >
                {obs.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-3 pt-2 border-t border-[var(--divider)]">
          <label htmlFor="feedback-note" className="block text-caption text-[var(--text-secondary)] mb-2">
            Anything else to remember? (optional)
          </label>
          <textarea
            id="feedback-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (hasAnySelection || note.trim()) handleSave();
              }
            }}
            className="w-full px-4 py-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] text-body-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] resize-none"
            placeholder="Anything else to remember?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-[var(--divider)]">
          <Button variant="ghost" size="lg" className="flex-1" onClick={handleSkip} disabled={isSaving}>
            Finish without notes
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={handleSave} disabled={isSaving || (!hasAnySelection && !note.trim())}>
            {isSaving ? 'Saving…' : 'Save session'}
          </Button>
        </div>

        {showValidationError && (
          <p className="text-body-sm text-[var(--distress)] text-center" role="alert">
            Please select at least one observation or add a note.
          </p>
        )}

        {/* Red Confirmation Modal */}
        <Modal
          isOpen={showRedConfirm}
          onClose={cancelRed}
          title="Confirm distress signal"
          description={`You selected "${pendingRed ? RED_OBSERVATIONS.find(o => o.id === pendingRed)?.label : ''}". This will immediately pause progression, reduce the training duration, and may suggest professional help. Continue?`}
          size="sm"
          hideCloseButton
        >
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={cancelRed}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRed}>Confirm</Button>
          </div>
        </Modal>
      </div>
    </BottomSheet>
  );
}

function SessionSavedScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state as { outcome?: SessionOutcome; actualDuration?: number } | null;
  const outcome = result?.outcome;
  const title = outcome?.type === 'significant_distress'
    ? 'You noticed what mattered'
    : outcome?.type === 'mild_difficulty'
      ? 'A useful step, even on a hard day'
      : outcome?.type === 'early_termination'
        ? 'You put comfort first'
        : 'A calm step forward';
  const message = outcome?.type === 'significant_distress'
    ? 'We’ll pause progression and keep the next practice gentle.'
    : outcome?.type === 'mild_difficulty'
      ? 'We’ll stay close to this duration while confidence grows.'
      : outcome?.type === 'early_termination'
        ? 'This practice is recorded. There is no need to push through discomfort.'
        : `${state.dog?.name ?? 'Your dog'} practiced for ${formatDuration(result?.actualDuration ?? 0)}. Small, comfortable steps add up.`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-6 py-10">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-subtle)] text-[var(--success)]">
          <CheckCircle size={42} strokeWidth={1.7} />
        </div>
        <p className="text-caption text-[var(--accent)]">Practice saved</p>
        <h1 className="mt-2 text-h1 text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 text-body text-[var(--text-secondary)]">{message}</p>

        <div className="mt-7 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 text-left">
          <div className="flex items-center justify-between gap-4">
            <span className="text-body-sm text-[var(--text-secondary)]">Next gentle target</span>
            <span className="text-data text-[var(--accent)]">
              {formatDuration(state.trainingLevel?.nextTargetDuration ?? 30)}
            </span>
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <Button size="lg" className="w-full" onClick={() => navigate('/')}>Back home</Button>
          <Link to="/history" className="inline-flex min-h-11 items-center justify-center text-body-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            View practice history
          </Link>
        </div>
      </div>
    </div>
  );
}
