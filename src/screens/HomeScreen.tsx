import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card, ProgressLinear, BottomSheet } from '../components/ui';
import { formatDuration, formatTime, getTimeOfDay } from '../utils/helpers';
import type { TrainingSchedule, ScheduledSlot, TrainingSession } from '../types';

export function HomeScreen() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [invitationSlot, setInvitationSlot] = useState<ScheduledSlot | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);

  // Update clock every minute (not every second - saves battery)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for active invitation
  useEffect(() => {
    if (!state.todaySchedule || !state.trainingLevel) return;
    
    const slot = state.todaySchedule.slots.find(
      s => s.status === 'available' || s.status === 'invited'
    );
    
    if (slot && slot.startTime <= now) {
      setInvitationSlot(slot);
      setShowInvitation(true);
    }
  }, [state.todaySchedule, state.trainingLevel, now]);

  const handleStartNow = () => {
    if (invitationSlot) {
      actions.startSession(invitationSlot);
      setShowInvitation(false);
      navigate('/training/active');
    }
  };

  const handleSnooze = () => {
    if (invitationSlot) {
      const newSlot = actions.handleInvitationResponse('snooze', invitationSlot);
      if (newSlot) {
        setInvitationSlot(newSlot);
      } else {
        setShowInvitation(false);
      }
    }
  };

  const handleLater = () => {
    if (invitationSlot) {
      const newSlot = actions.handleInvitationResponse('later_today', invitationSlot);
      if (newSlot) {
        setInvitationSlot(newSlot);
      } else {
        setShowInvitation(false);
      }
    }
  };

  const handleSkip = () => {
    if (invitationSlot) {
      actions.handleInvitationResponse('skip_today', invitationSlot);
      setShowInvitation(false);
    }
  };

  const handleStartPracticeNow = () => {
    if (state.trainingLevel) {
      const immediateSlot: ScheduledSlot = {
        id: `immediate-${Date.now()}`,
        startTime: new Date(),
        targetDuration: state.trainingLevel.nextTargetDuration,
        isRandomized: false,
        sessionIndex: 0,
        status: 'available',
      };
      actions.startSession(immediateSlot);
      navigate('/training/active');
    }
  };

  const nextSlot = useMemo(() => getNextUpcomingSlot(state.todaySchedule, now), [state.todaySchedule, now]);
  const progressStats = useMemo(
    () => calculateProgressStats(state.trainingProgress, state.sessions),
    [state.trainingProgress, state.sessions]
  );

  if (!state.dog || !state.trainingLevel) {
    return <OnboardingRedirect />;
  }

  const timeOfDay = getTimeOfDay(now);
  const greeting = getGreeting(timeOfDay);
  const contextualMessage = getContextualMessage(state.trainingLevel, state.dog.name);

  return (
    <div className="min-h-screen pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] bg-[var(--bg)]">
      {/* Top Bar - minimal */}
      <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--divider)]">
        <div className="container h-[var(--header-height)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
              <span className="text-lg font-medium text-[var(--accent)]">
                {state.dog.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-h3 text-[var(--text-primary)]">{state.dog.name}</h1>
              <p className="text-caption text-[var(--text-muted)]">
                {formatDuration(state.trainingLevel.currentMaxDuration)} · {getStatusText(state.trainingLevel.status)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/settings" className="touch-target-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-md)]" aria-label="Settings">
              <Settings size={20} strokeWidth={2} />
            </Link>
            <Link to="/settings?tab=professional" className="touch-target-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-md)]" aria-label="Professional support">
              <HelpCircle size={20} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-10 space-y-10">
          {/* Greeting Section - Calm Daily Companion */}
          <section className="pt-5" aria-labelledby="greeting-heading">
            <h2 id="greeting-heading" className="sr-only">Greeting</h2>
            <div className="space-y-4">
              <p className="text-display text-[var(--text-primary)] leading-tight">
                {greeting}
              </p>
              <p className="text-body-lg text-[var(--text-secondary)] leading-relaxed">
                {contextualMessage}
              </p>
            </div>
          </section>

          {/* Today's Practice - Primary Focus */}
          <section aria-labelledby="practice-heading">
            <h2 id="practice-heading" className="sr-only">Today's practice</h2>
            
            {showInvitation && invitationSlot ? (
              <InvitationCard
                slot={invitationSlot}
                onStart={handleStartNow}
                onSnooze={handleSnooze}
                onLater={handleLater}
                onSkip={handleSkip}
              />
            ) : nextSlot ? (
              <NextPracticeCard slot={nextSlot} now={now} onStartNow={handleStartPracticeNow} />
            ) : (
              <EmptyStateCard onStartNow={handleStartPracticeNow} />
            )}
          </section>

          {/* Progress Snapshot - Quiet, not dashboard */}
          <section aria-labelledby="progress-heading" className="pt-5">
            <h2 id="progress-heading" className="sr-only">Progress</h2>
            <ProgressSnapshot stats={progressStats} />
          </section>

          {/* Gentle CTA - only if no active practice */}
          {!showInvitation && !nextSlot && (
            <div className="pt-5" role="region" aria-label="Quick actions">
              <Button variant="primary" size="lg" onClick={handleStartPracticeNow} className="w-full">
                Start a practice
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Active Invitation Bottom Sheet */}
      {showInvitation && invitationSlot && (
        <BottomSheet
          isOpen={showInvitation}
          onClose={() => setShowInvitation(false)}
          title="Practice ready"
        >
          <InvitationCardContent
            slot={invitationSlot}
            onStart={handleStartNow}
            onSnooze={handleSnooze}
            onLater={handleLater}
            onSkip={handleSkip}
          />
        </BottomSheet>
      )}
    </div>
  );
}

// ===== Sub-components =====

function InvitationCard({ 
  slot, 
  onStart, 
  onSnooze, 
  onLater, 
  onSkip 
}: { 
  slot: ScheduledSlot; 
  onStart: () => void; 
  onSnooze: () => void; 
  onLater: () => void; 
  onSkip: () => void; 
}) {
  return (
    <div className="space-y-4">
      <InvitationCardContent
        slot={slot}
        onStart={onStart}
        onSnooze={onSnooze}
        onLater={onLater}
        onSkip={onSkip}
      />
    </div>
  );
}

function InvitationCardContent({ 
  slot, 
  onStart, 
  onSnooze, 
  onLater, 
  onSkip 
}: { 
  slot: ScheduledSlot; 
  onStart: () => void; 
  onSnooze: () => void; 
  onLater: () => void; 
  onSkip: () => void; 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-caption text-[var(--accent)]">Practice ready</span>
        <span className="text-data text-[var(--accent)]">{formatDuration(slot.targetDuration)}</span>
      </div>
      
      <p className="text-body text-[var(--text-secondary)]">
        A short practice fits naturally right now. Give a frozen Kong, step out briefly.
      </p>
      
      <div className="flex flex-col gap-3.5 pt-3">
        <Button variant="primary" size="lg" onClick={onStart} className="w-full h-[56px]">
          Start now
        </Button>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="ghost" size="sm" onClick={onSnooze} className="h-[44px]">
            Snooze 15 min
          </Button>
          <Button variant="ghost" size="sm" onClick={onLater} className="h-[44px]">
            Ask me later
          </Button>
          <Button variant="ghost" size="sm" onClick={onSkip} className="h-[44px]">
            Skip today
          </Button>
        </div>
      </div>
    </div>
  );
}

function NextPracticeCard({ slot, now, onStartNow }: { slot: ScheduledSlot; now: Date; onStartNow: () => void }) {
  const timeUntil = slot.startTime.getTime() - now.getTime();
  const minutesUntil = Math.max(0, Math.ceil(timeUntil / 60000));

  return (
    <Card padding="default" variant="outlined">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption text-[var(--text-muted)] mb-1">Next practice</p>
          <p className="text-h2 text-[var(--text-primary)]">
            {minutesUntil < 60 ? `in ~${minutesUntil} min` : `at ${formatTime(slot.startTime)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-caption text-[var(--text-muted)]">Target</p>
          <p className="text-data text-[var(--accent)]">{formatDuration(slot.targetDuration)}</p>
        </div>
      </div>
      
      <Button variant="primary" size="lg" onClick={onStartNow} className="w-full mt-5">
        Start practice now
      </Button>
    </Card>
  );
}

function EmptyStateCard({ onStartNow }: { onStartNow: () => void }) {
  return (
    <Card padding="lg" className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-5 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-[var(--text-muted)]">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h3 className="text-h2 text-[var(--text-primary)] mb-2.5">Ready when you are</h3>
      <p className="text-body text-[var(--text-secondary)] mb-7 max-w-xs mx-auto">
        Your first practice is just a tap away. We'll start with 30 seconds.
      </p>
      <Button variant="primary" size="lg" onClick={onStartNow} className="w-full max-w-xs">
        Start a practice
      </Button>
    </Card>
  );
}

function ProgressSnapshot({ stats }: { stats: ReturnType<typeof calculateProgressStats> }) {
  return (
    <Card padding="default" variant="outlined">
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="text-center">
          <p className="text-h1 text-[var(--accent)] tabular-nums">{stats.currentMax}</p>
          <p className="text-caption text-[var(--text-muted)] mt-1.5">Current max</p>
        </div>
        <div className="text-center">
          <p className="text-h1 text-[var(--text-primary)] tabular-nums">{stats.thisWeek}</p>
          <p className="text-caption text-[var(--text-muted)] mt-1.5">This week</p>
        </div>
      </div>
      
      <div className="space-y-3.5">
        <ProgressLinear value={stats.consistency} height={6} />
        <p className="text-caption text-[var(--text-muted)] text-center">
          {stats.daysActive} of last 21 days with practice
        </p>
      </div>
    </Card>
  );
}

function OnboardingRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-body text-[var(--text-secondary)]">Loading…</p>
      </div>
    </div>
  );
}

// Helpers
function getNextUpcomingSlot(schedule: TrainingSchedule | null, now: Date): ScheduledSlot | null {
  if (!schedule) return null;
  return schedule.slots
    .filter(s => s.startTime > now && (s.status === 'pending' || s.status === 'available'))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] || null;
}

function calculateProgressStats(progress: any, sessions: TrainingSession[]) {
  if (!progress) {
    return { thisWeek: '0m', currentMax: '0s', consistency: 0, daysActive: 0 };
  }
  
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentWeek = sessions.filter(session =>
    new Date(session.actualStart).getTime() >= weekAgo && session.outcome.type !== 'skipped'
  );
  const activeDays = new Set(
    sessions
      .filter(session => session.outcome.type !== 'skipped')
      .map(session => new Date(session.actualStart).toDateString())
  ).size;
  const thisWeekDuration = recentWeek.reduce((total, session) => total + session.actualDuration, 0);
  
  return {
    thisWeek: formatDuration(thisWeekDuration),
    currentMax: formatDuration(progress.currentMaxDuration),
    consistency: Math.min(100, (activeDays / 21) * 100),
    daysActive: Math.min(21, activeDays),
  };
}

function getGreeting(timeOfDay: 'morning' | 'afternoon' | 'evening'): string {
  switch (timeOfDay) {
    case 'morning':
      return `Good morning`;
    case 'afternoon':
      return `Good afternoon`;
    case 'evening':
      return `Good evening`;
  }
}

function getContextualMessage(trainingLevel: any, dogName: string): string {
  const maxDuration = trainingLevel.currentMaxDuration;
  const nextTarget = trainingLevel.nextTargetDuration;
  
  if (maxDuration < 60) {
    return `We're building up from ${formatDuration(nextTarget)} today. Small steps.`;
  }
  
  if (maxDuration < 300) {
    return `${dogName} is comfortable at ${formatDuration(maxDuration)}. Next: ${formatDuration(nextTarget)}.`;
  }
  
  return `${dogName} is doing well at ${formatDuration(maxDuration)}. Keep the rhythm.`;
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'paused_recovery': return 'Paused — recovery';
    case 'paused_plateau': return 'Paused — plateau';
    case 're_entry': return 'Re-entry';
    case 'referral_pending': return 'Professional suggested';
    default: return status;
  }
}
