import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Chip, Button } from '../components/ui';
import { clsx, formatDuration, formatDurationShort, formatDate, formatTime } from '../utils/helpers';
import type { TrainingSession } from '../types';

export function HistoryScreen() {
  const { state } = useApp();
  const [filter, setFilter] = useState<'all' | 'success' | 'mild_difficulty' | 'significant_distress' | 'skipped'>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const sessions = state.sessions || [];

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filter !== 'all') {
        const outcome = session.outcome.type;
        if (filter === 'success' && outcome !== 'success') return false;
        if (filter === 'mild_difficulty' && outcome !== 'mild_difficulty') return false;
        if (filter === 'significant_distress' && outcome !== 'significant_distress') return false;
        if (filter === 'skipped' && outcome !== 'skipped') return false;
      }
      if (dateRange) {
        const sessionDate = new Date(session.actualStart);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate < dateRange.start || sessionDate > dateRange.end) return false;
      }
      return true;
    });
  }, [sessions, filter, dateRange]);

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
        <Button variant="ghost" size="icon" onClick={() => setFilter('all')}>
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
          <EmptyState />
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

            <p className={clsx('text-capitalize text-body-sm mt-1.5', style.text)}>
              {outcome.type.replace('_', ' ')}
            </p>

            {observations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {observations.slice(0, 3).map((obs, i) => (
                  <Chip 
                    key={`${obs}-${i}`} 
                    variant={outcome.type === 'significant_distress' ? 'distress' : outcome.type === 'mild_difficulty' ? 'warning' : 'success'}
                    size="sm"
                    disabled
                    className="px-2.5 py-1 text-[11px]"
                  >
                    {obs.replace('_', ' ')}
                  </Chip>
                ))}
                {observations.length > 3 && (
                  <Chip variant="neutral" size="sm" disabled className="px-2.5 py-1 text-[11px]">
                    +{observations.length - 3} more
                  </Chip>
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

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center">
        <Calendar size={28} strokeWidth={1.5} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-h2 text-[var(--text-primary)] mb-2">No sessions yet</h3>
      <p className="text-body text-[var(--text-secondary)]">
        Completed sessions will appear here.
      </p>
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

