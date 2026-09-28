import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Square, Video, VideoOff, CheckCircle, X, AlertTriangle, Sun, Moon, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Modal, ProgressRing, BottomSheet, Chip } from '../components/ui';
import { clsx, formatDuration, formatDurationShort } from '../utils/helpers';
import type { TrainingLevel, TrainingSession, SessionOutcome, GreenObservation, YellowObservation, RedObservation, EarlyTerminationReason } from '../types';

type TrainingRoute = 'active' | 'complete' | 'feedback';

export function TrainingScreen() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const params = useParams();
  const route = (params['*'] as TrainingRoute) || 'active';

  switch (route) {
    case 'active':
      return <ActiveTrainingScreen />;
    case 'complete':
      return <SessionCompleteScreen />;
    case 'feedback':
      return <SessionFeedbackScreen />;
    default:
      return <ActiveTrainingScreen />;
  }
}

// ============================================
// ACTIVE TRAINING SCREEN - The Meditative Core
// ============================================

function ActiveTrainingScreen() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [ambientPhase, setAmbientPhase] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const wasRunningBeforeBackground = useRef(false);
  const ambientIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plannedDuration = state.trainingLevel?.nextTargetDuration || 30;
  const progress = Math.min(100, (elapsed / plannedDuration) * 100);
  const remaining = Math.max(0, plannedDuration - elapsed);

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
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const newElapsed = e + 1;
        if (newElapsed >= plannedDuration) {
          completeSession();
          return plannedDuration;
        }
        return newElapsed;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, plannedDuration]);

  const startSession = useCallback(() => {
    setIsRunning(true);
    if (!state.currentSession) {
      navigate('/');
    }
  }, [state.currentSession, navigate]);

  const completeSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    actions.completeSession({
      type: 'success',
      actualDuration: plannedDuration,
      observations: ['settled_quickly', 'ate_toy', 'rested_slept', 'calm_return', 'quiet'],
    } as any);
    navigate('/training/complete');
  }, [actions, plannedDuration, navigate]);

  const handleEndEarly = useCallback(() => {
    setShowEndConfirm(true);
  }, []);

  const confirmEndEarly = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setShowEndConfirm(false);
    
    const actualDuration = elapsed;
    const observations: (GreenObservation | YellowObservation | RedObservation)[] = [];
    
    let reason: EarlyTerminationReason = 'interruption';
    if (progress >= 50) reason = 'owner_concern';
    if (progress < 25) reason = 'distress_observed';
    
    actions.endSessionEarly(actualDuration, reason, observations);
    navigate('/training/complete');
  }, [actions, elapsed, progress, navigate]);

  const cancelEndEarly = useCallback(() => {
    setShowEndConfirm(false);
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
  }, []);

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
            <div className="relative w-[280px] h-[280px] mx-auto mb-8 animate-scale-in">
              <ProgressRing
                value={progress}
                size={280}
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
        <div className="fixed bottom-8 left-6 right-6 flex flex-col items-center gap-4 z-10 animate-slide-up">
          {/* Record Button - Left side */}
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Record video'}
            aria-pressed={isRecording}
          >
            <Video size={24} strokeWidth={2} className={clsx(isRecording && 'text-[var(--distress)] animate-timer-pulse')} />
          </Button>

          {/* End Early Button - Large, centered, thumb-friendly */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleEndEarly}
            className={clsx(
              'w-36 h-36 rounded-full',
              'flex flex-col items-center justify-center gap-2',
              'shadow-[var(--shadow-lg)] border border-[var(--border)]',
              'animate-slide-up'
            )}
            aria-label="End session early"
          >
            <Square size={30} strokeWidth={2} className="text-[var(--text-secondary)]" />
            <span className="text-body-sm text-[var(--text-secondary)]">End early</span>
            <span className="text-data text-[var(--text-muted)]">{formatDurationShort(elapsed)}</span>
          </Button>

          {/* Spacer for symmetry */}
          <div className="w-16 h-16" />
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
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [showCheckmark, setShowCheckmark] = useState(false);
  const plannedDuration = state.currentSession?.plannedDuration || 30;
  const actualDuration = state.currentSession?.actualDuration || plannedDuration;
  const wasEarly = actualDuration < plannedDuration;

  useEffect(() => {
    setShowCheckmark(true);
    const timer = setTimeout(() => {
      navigate('/training/feedback');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg)]">
      <div className="text-center animate-fade-in">
        <div className={clsx(
          'w-24 h-24 mx-auto mb-6 bg-[var(--success-subtle)] rounded-full flex items-center justify-center',
          showCheckmark ? 'animate-scale-in' : 'opacity-0 scale-90'
        )}>
          <CheckCircle size={48} strokeWidth={1.5} className="text-[var(--success)]" />
        </div>

        <h1 className="text-display text-[var(--text-primary)] mb-3 leading-tight">
          {wasEarly 
            ? `Practice complete`
            : `Practice complete`}
        </h1>

        {wasEarly && (
          <p className="text-body text-[var(--text-secondary)] mt-2">
            You completed {formatDuration(actualDuration)} of {formatDuration(plannedDuration)}
          </p>
        )}

        {!wasEarly && (
          <p className="text-body-lg text-[var(--text-secondary)] mt-4">
            {state.dog?.name} settled quickly. Nice work.
          </p>
        )}

        <p className="text-caption text-[var(--text-muted)] mt-8">
          Continuing to feedback…
        </p>
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

    const actualDuration = state.currentSession?.actualDuration || state.trainingLevel?.nextTargetDuration || 30;

    let outcome: SessionOutcome;
    if (redSelected) {
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

    actions.completeSession(outcome);
    setIsSaving(false);
    navigate('/');
  }, [actions, greenSelected, hasAnySelection, navigate, note, redSelected, state, yellowSelected]);

  const handleSkip = useCallback(() => {
    const actualDuration = state.currentSession?.actualDuration || state.trainingLevel?.nextTargetDuration || 30;
    actions.completeSession({
      type: 'success',
      actualDuration,
      observations: [],
    } as any);
    navigate('/');
  }, [actions, navigate, state]);

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
            Skip feedback
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={handleSave} disabled={isSaving || !hasAnySelection}>
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