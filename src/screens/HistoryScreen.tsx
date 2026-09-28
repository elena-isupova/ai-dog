import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Chip, Button } from '../components/ui';
import { clsx, formatDuration, formatDurationShort, formatDate, formatTime } from '../utils/helpers';
import type { TrainingSession } from '../types';

export function HistoryScreen() {
  const { state } = useApp();
  const [filter, setFilter] = useState<'all' | 'success' | 'mild_difficulty' | 'significant_distress' | 'skipped'>('all');

  const sessions = state.sessions;

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filter !== 'all') {
        const outcome = session.outcome.type;
        if (filter === 'success' && outcome !== 'success') return false;
        if (filter === 'mild_difficulty' && outcome !== 'mild_difficulty') return false;
        if (filter === 'significant_distress' && outcome !== 'significant_distress') return false;
        if (filter === 'skipped' && outcome !== 'skipped') return false;
      }
      return true;
    });
  }, [sessions, filter]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, TrainingSession[]> = {};
    filteredSessions.forEach(session => {
      const dateKey = formatDate(new Date(session.actualStart));
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(session);
    });
    return groups;
  }, [filteredSessions]);

  if (!state.dog) {
    return <LoadingState />;
  }

  return (
    <div className="pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] bg-[var(--bg)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-[var(--header-height)] bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--divider)]">
        <h1 className="text-h3 text-[var(--text-primary)]">History</h1>
        <Button variant="ghost" size="icon" aria-label="Clear filters" onClick={() => setFilter('all')}>
          <Filter size={22} strokeWidth={2} />
        </Button>
      </header>

      <div className="container py-8 space-y-8">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter sessions">
          {[
            { value: 'all' as const, label: 'All', color: 'neutral' as const },
            { value: 'success' as const, label: 'Calm', color: 'success' as const },
            { value: 'mild_difficulty' as const, label: 'Mild', color: 'warning' as const },
            { value: 'significant_distress' as const, label: 'Distress', color: 'distress' as const },
            { value: 'skipped' as const, label: 'Skipped', color: 'neutral' as const },
          ].map(f => (
            <Chip
              key={f.value}
              variant={f.color}
              size="sm"
              selected={filter === f.value}
              onSelect={(selected) => selected && setFilter(f.value)}
              className="px-3 py-2"
            >
              {f.label}
            </Chip>
          ))}
        </div>

        {/* Session list */}
        {Object.keys(groupedSessions).length === 0 ? (
          <EmptyState isFiltered={filter !== 'all'} onClear={() => setFilter('all')} />
        ) : (
          <div className="space-y-7">
            {Object.entries(groupedSessions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, daySessions]) => (
                <section key={dateKey} className="space-y-3">
                  <h2 className="text-caption text-[var(--text-muted)]">{formatDate(new Date(dateKey))}</h2>
                  {daySessions.map(session => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionDetailScreen() {
  const { state } = useApp();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = state.sessions.find(item => item.id === sessionId);

  if (!session) {
    return (
      <div className="container py-10">
        <Button variant="ghost" onClick={() => navigate('/history')}>
          <ArrowLeft size={18} />
          Back to history
        </Button>
        <div className="py-16 text-center">
          <h1 className="text-h2 text-[var(--text-primary)]">Practice not found</h1>
          <p className="mt-2 text-body text-[var(--text-secondary)]">It may have been removed from this device.</p>
        </div>
      </div>
    );
  }

  const { outcome } = session;
  const observations = outcome.type === 'success'
    || outcome.type === 'mild_difficulty'
    || outcome.type === 'significant_distress'
    || outcome.type === 'early_termination'
    ? outcome.observations
    : [];
  const outcomeLabel = outcome.type === 'early_termination'
    ? 'Ended early'
    : outcome.type === 'significant_distress'
      ? 'Distress observed'
      : outcome.type === 'mild_difficulty'
        ? 'Some difficulty'
        : outcome.type === 'success'
          ? 'Calm practice'
          : 'Skipped';

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 flex h-[var(--header-height)] items-center gap-3 border-b border-[var(--divider)] bg-[var(--bg)]/90 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" aria-label="Back to history" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-h3 text-[var(--text-primary)]">Practice details</h1>
      </header>

      <div className="container space-y-5 py-7">
        <Card variant="outlined" padding="lg">
          <p className="text-caption text-[var(--text-muted)]">{formatDate(new Date(session.actualStart))} · {formatTime(new Date(session.actualStart))}</p>
          <h2 className="mt-2 text-h2 text-[var(--text-primary)]">{outcomeLabel}</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--divider)] pt-4">
            <div>
              <p className="text-caption text-[var(--text-muted)]">Practiced</p>
              <p className="mt-1 text-body font-medium text-[var(--text-primary)]">{formatDuration(session.actualDuration)}</p>
            </div>
            <div>
              <p className="text-caption text-[var(--text-muted)]">Planned</p>
              <p className="mt-1 text-body font-medium text-[var(--text-primary)]">{formatDuration(session.plannedDuration)}</p>
            </div>
          </div>
        </Card>

        {observations.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-h3 text-[var(--text-primary)]">What you noticed</h3>
            <div className="flex flex-wrap gap-2">
              {observations.map((observation, index) => (
                <ObservationBadge key={`${observation}-${index}`} tone={getObservationTone(outcome)}>
                  {formatObservation(observation)}
                </ObservationBadge>
              ))}
            </div>
          </section>
        )}

        {session.notes && (
          <Card variant="outlined" padding="default">
            <h3 className="text-body-sm font-medium text-[var(--text-primary)]">Your note</h3>
            <p className="mt-2 whitespace-pre-wrap text-body-sm text-[var(--text-secondary)]">{session.notes}</p>
          </Card>
        )}

        <Button variant="secondary" className="w-full" onClick={() => navigate('/history')}>
          Back to history
        </Button>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: TrainingSession }) {
  const outcome = session.outcome;
  const isEarly = outcome.type === 'early_termination';
  const actualDuration = isEarly 
    ? (outcome as any).actualDuration 
    : outcome.type === 'skipped' 
      ? 0 
      : (outcome as any).actualDuration || session.plannedDuration;

  const outcomeStyles = {
    success: { dot: 'bg-[var(--success)]', text: 'text-[var(--success)]' },
    mild_difficulty: { dot: 'bg-[var(--warning)]', text: 'text-[var(--warning)]' },
    significant_distress: { dot: 'bg-[var(--distress)]', text: 'text-[var(--distress)]' },
    skipped: { dot: 'bg-[var(--text-muted)]', text: 'text-[var(--text-muted)]' },
    early_termination: { dot: 'bg-[var(--warning)]', text: 'text-[var(--warning)]' },
  };

  const style = outcomeStyles[outcome.type] || outcomeStyles.skipped;

  const observations = outcome.type === 'success' 
    ? (outcome as any).observations as string[]
    : outcome.type === 'mild_difficulty'
      ? (outcome as any).observations as string[]
      : outcome.type === 'significant_distress'
        ? (outcome as any).observations as string[]
        : outcome.type === 'early_termination'
          ? (outcome as any).observations as string[]
          : [];

  return (
    <Link to={`/history/${session.id}`} className="block">
      <Card variant="outlined" padding="default" className="transition-all duration-[var(--duration-fast)] hover:border-[var(--border-strong)]">
        <div className="flex items-start gap-4">
          {/* Outcome indicator */}
          <div className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5', style.dot)} />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={clsx('text-body font-medium', style.text)}>
                {outcome.type === 'skipped' 
                  ? 'Skipped' 
                  : isEarly 
                    ? `Ended early · ${formatDurationShort(actualDuration)}`
                    : formatDuration(actualDuration)}
              </p>
              <span className="text-body-sm text-[var(--text-muted)]">
                {formatTime(new Date(session.actualStart))}
              </span>
            </div>

            <p className={clsx('text-body-sm mt-1.5', style.text)}>
              {getOutcomeLabel(outcome.type)}
            </p>

            {observations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {observations.slice(0, 3).map((obs, i) => (
                  <ObservationBadge key={`${obs}-${i}`} tone={getObservationTone(outcome)}>
                    {formatObservation(obs)}
                  </ObservationBadge>
                ))}
                {observations.length > 3 && (
                  <ObservationBadge tone="neutral">
                    +{observations.length - 3} more
                  </ObservationBadge>
                )}
              </div>
            )}

            {(session.enrichmentUsed || session.exitDoor) && (
              <div className="flex items-center gap-3 mt-2 text-body-sm text-[var(--text-muted)]">
                {session.enrichmentUsed && (
                  <span className="flex items-center gap-1">
                    <span>🦴</span> {session.enrichmentUsed.replace('_', ' ')}
                  </span>
                )}
                {session.exitDoor && (
                  <span className="flex items-center gap-1">
                    <span>🚪</span> {session.exitDoor}
                  </span>
                )}
              </div>
            )}
          </div>

          <ChevronRight size={20} strokeWidth={2} className="text-[var(--text-muted)] flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center">
        <Calendar size={28} strokeWidth={1.5} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-h2 text-[var(--text-primary)] mb-2">
        {isFiltered ? 'No matching practices' : 'No sessions yet'}
      </h3>
      <p className="text-body text-[var(--text-secondary)]">
        {isFiltered ? 'Try another filter to see more of your history.' : 'Completed sessions will appear here.'}
      </p>
      {isFiltered && (
        <Button variant="secondary" className="mt-5" onClick={onClear}>Clear filters</Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function getOutcomeLabel(type: TrainingSession['outcome']['type']) {
  switch (type) {
    case 'success': return 'Calm';
    case 'mild_difficulty': return 'Some difficulty';
    case 'significant_distress': return 'Distress observed';
    case 'early_termination': return 'Ended early';
    case 'skipped': return 'Skipped';
  }
}

function formatObservation(observation: string) {
  const label = observation.replaceAll('_', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getObservationTone(outcome: TrainingSession['outcome']) {
  return outcome.type === 'significant_distress'
    || (outcome.type === 'early_termination' && outcome.reason === 'distress_observed')
    ? 'distress'
    : outcome.type === 'mild_difficulty'
      || (outcome.type === 'early_termination' && outcome.reason === 'owner_concern')
      ? 'warning'
      : 'success';
}

function ObservationBadge({ children, tone }: { children: React.ReactNode; tone: 'success' | 'warning' | 'distress' | 'neutral' }) {
  const tones = {
    success: 'border-[var(--success-muted)] bg-[var(--success-subtle)] text-[var(--success)]',
    warning: 'border-[var(--warning-muted)] bg-[var(--warning-subtle)] text-[var(--warning)]',
    distress: 'border-[var(--distress-muted)] bg-[var(--distress-subtle)] text-[var(--distress)]',
    neutral: 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
  };

  return (
    <span className={clsx('inline-flex items-center rounded-[var(--radius-md)] border px-2.5 py-1 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  );
}
