import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronRight, Flag, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, ProgressLinear, Button } from '../components/ui';
import { clsx, formatDuration, formatDate } from '../utils/helpers';
import type { Milestone } from '../types';

const MILESTONES = [30, 60, 120, 180, 300, 600, 900, 1800, 2400, 3600, 5400];

function generateChartData(sessions: any[], progress: any) {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.actualStart);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === date.getTime() && 
             (s.outcome.type === 'success' || s.outcome.type === 'mild_difficulty');
    });
    
    const maxDuration = daySessions.length > 0 
      ? Math.max(...daySessions.map(s => s.actualDuration))
      : 0;
    
    data.push({ date, value: maxDuration });
  }
  return data;
}

export function ProgressScreen() {
  const { state } = useApp();

  if (!state.dog || !state.trainingProgress) {
    return <LoadingState />;
  }

  const progress = state.trainingProgress;
  const sessions = state.sessions || [];
  const maxDuration = progress.currentMaxDuration;
  const reachedMilestones = progress.milestones.map(m => m.duration);
  const nextMilestone = MILESTONES.find(m => !reachedMilestones.includes(m));

  // Generate chart data from actual sessions (last 30 days)
  const chartData = useMemo(() => generateChartData(sessions, progress), [sessions, progress]);

  // Empty state for new users with no sessions yet
  if (progress.totalSessions === 0) {
    return (
      <div className="pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-40 flex items-center justify-between h-[var(--header-height)] bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--divider)]">
          <h1 className="text-h3 text-[var(--text-primary)]">Progress</h1>
        </header>
        <div className="container py-12">
          <EmptyProgressState />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] bg-[var(--bg)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-[var(--header-height)] bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--divider)]">
        <h1 className="text-h3 text-[var(--text-primary)]">Progress</h1>
        <Button variant="ghost" size="icon" onClick={() => exportData()}>
          <Download size={22} strokeWidth={2} />
        </Button>
      </header>

      <div className="container py-10 space-y-10">
        {/* Duration Timeline Chart */}
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="sr-only">Duration timeline</h2>
          <Card padding="lg">
            <TimelineChart 
              data={chartData} 
              maxDuration={Math.max(maxDuration, nextMilestone || maxDuration)}
              milestones={MILESTONES}
              reachedMilestones={reachedMilestones}
            />
          </Card>
        </section>

        {/* Milestones */}
        <section aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="text-h2 text-[var(--text-primary)] mb-5">Milestones</h2>
          <div className="space-y-4">
            {MILESTONES.map(duration => {
              const milestone = progress.milestones.find(m => m.duration === duration);
              const isReached = !!milestone;
              const isNext = nextMilestone === duration && !isReached;
              
              return (
                <div 
                  key={duration} 
                  className="flex items-center gap-4 p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] transition-all duration-[var(--duration-fast)]"
                  style={{ borderColor: isNext ? 'var(--accent)' : 'var(--border)', backgroundColor: isNext ? 'var(--accent-subtle)' : 'transparent' }}
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    isReached 
                      ? 'bg-[var(--success)] text-[var(--text-inverse)]'
                      : isNext
                      ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  )}>
                    {isReached ? (
                      <Star size={18} strokeWidth={2.5} fill="currentColor" />
                    ) : (
                      <Flag size={18} strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-h3 font-medium truncate', isNext ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                      {formatDuration(duration)}
                    </p>
                    {isReached && milestone && (
                      <p className="text-body-sm text-[var(--text-muted)] mt-1">
                        Reached {formatDate(milestone.reachedAt)} · {milestone.sessionsToReach} sessions
                      </p>
                    )}
                    {!isReached && isNext && (
                      <p className="text-body-sm text-[var(--accent)] mt-1">Next milestone</p>
                    )}
                    {!isReached && !isNext && (
                      <p className="text-body-sm text-[var(--text-muted)] mt-1">Not reached yet</p>
                    )}
                  </div>
                  {isReached && (
                    <div className="text-right">
                      <p className="text-data text-[var(--success)]">{milestone!.sessionsToReach}</p>
                      <p className="text-caption text-[var(--text-muted)]">sessions</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Consistency */}
        <section aria-labelledby="consistency-heading">
          <h2 id="consistency-heading" className="text-h2 text-[var(--text-primary)] mb-5">Consistency</h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="text-center p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
              <p className="text-display text-[var(--text-primary)] tabular-nums">{progress.totalSessions}</p>
              <p className="text-caption text-[var(--text-muted)] mt-1">Total sessions</p>
            </div>
            <div className="text-center p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
              <p className="text-display text-[var(--accent)] tabular-nums">{Math.min(21, progress.totalSessions)}</p>
              <p className="text-caption text-[var(--text-muted)] mt-1">of 21 days</p>
            </div>
          </div>
          <ProgressLinear value={Math.min(100, (progress.totalSessions / 21) * 100)} height={8} />
          <p className="text-caption text-[var(--text-muted)] mt-2 text-center">
            {Math.min(21, progress.totalSessions)} of last 21 days with practice
          </p>
        </section>

        {/* Session breakdown */}
        <section aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-h2 text-[var(--text-primary)] mb-5">Session outcomes</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard 
              label="Calm" 
              value={progress.successfulSessions} 
              color="success" 
              icon={<Star size={22} strokeWidth={2.5} fill="currentColor" />} 
            />
            <StatCard 
              label="Mild difficulty" 
              value={progress.mildDifficultySessions} 
              color="warning" 
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} 
            />
            <StatCard 
              label="Distress" 
              value={progress.significantDistressSessions} 
              color="distress" 
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// Sub-components

function TimelineChart({ 
  data, 
  maxDuration, 
  milestones, 
  reachedMilestones 
}: { 
  data: { date: Date; value: number }[];
  maxDuration: number;
  milestones: number[];
  reachedMilestones: number[];
}) {
  const chartHeight = 200;
  const padding = 24;
  const stepX = (100 - padding * 2) / Math.max(1, data.length - 1);

  const getY = (value: number) => {
    const max = Math.max(maxDuration, 300);
    return padding + (chartHeight - padding * 2) * (1 - value / max);
  };

  const getX = (index: number) => padding + index * stepX;

  return (
    <div className="relative" style={{ height: chartHeight }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between pr-2 pointer-events-none">
        {[maxDuration, maxDuration / 2, 0].map(v => (
          <span key={v} className="text-caption text-[var(--text-muted)] text-right" style={{ transform: 'translateY(-50%)' }}>
            {formatDuration(v)}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <svg 
        className="absolute left-16 right-0 top-0 bottom-0" 
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        {/* Gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(ratio => (
          <line
            key={ratio}
            x1="0" y1={ratio * 100 + '%'}
            x2="100%" y2={ratio * 100 + '%'}
            stroke="var(--divider)"
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />
        ))}
        
        {/* Area fill */}
        {data.length > 1 && (
          <path
            d={getAreaPath(data, getX, getY)}
            fill="url(#progressGradient)"
          />
        )}

        {/* Line */}
        {data.length > 1 && (
          <path
            d={getLinePath(data, getX, getY)}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* Milestone markers */}
        {milestones.filter(m => m <= maxDuration * 1.2).map(m => (
          <line
            key={m}
            x1="0" y1={getY(m)}
            x2="100%" y2={getY(m)}
            stroke="var(--divider)"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.5"
          />
        ))}

        {/* Data points */}
        {data.map((point, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(point.value)}
            r={reachedMilestones.includes(point.value) ? 7 : 5}
            fill={reachedMilestones.includes(point.value) ? 'var(--success)' : 'var(--accent)'}
            stroke="var(--bg)"
            strokeWidth={2}
            className="transition-all duration-200 hover:r-8"
          />
        ))}

        {/* Current max indicator */}
        {maxDuration > 0 && (
          <line
            x1="0" y1={getY(maxDuration)}
            x2="100%" y2={getY(maxDuration)}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.7"
          />
        )}
      </svg>
    </div>
  );
}

function getLinePath(data: { date: Date; value: number }[], getX: (i: number) => number, getY: (v: number) => number): string {
  if (data.length < 2) return '';
  return `M${data.map((_, i) => `${getX(i)},${getY(data[i].value)}`).join(' L')}`;
}

function getAreaPath(data: { date: Date; value: number }[], getX: (i: number) => number, getY: (v: number) => number): string {
  if (data.length < 2) return '';
  const linePath = getLinePath(data, getX, getY);
  const lastX = getX(data.length - 1);
  const firstX = getX(0);
  const bottomY = 180;
  return `${linePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: 'success' | 'warning' | 'distress'; icon: React.ReactNode }) {
  const colors = {
    success: 'bg-[var(--success-subtle)] text-[var(--success)]',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
    distress: 'bg-[var(--distress-subtle)] text-[var(--distress)]',
  };

  return (
    <div className="text-center p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
      <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3', colors[color])}>
        {icon}
      </div>
      <p className="text-h2 text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-caption text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function EmptyProgressState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-[var(--text-muted)]">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      </div>
      <h3 className="text-h2 text-[var(--text-primary)] mb-2">Your progress will appear here</h3>
      <p className="text-body text-[var(--text-secondary)] mb-8 max-w-xs mx-auto">
        Complete your first practice session to see your progress timeline and milestones.
      </p>
      <p className="text-caption text-[var(--text-muted)]">
        Consistency builds confidence — one small step at a time.
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

function exportData() {
  const { state, actions } = useApp();
  actions.exportData();
}