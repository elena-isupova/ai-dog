import type { OnboardingData } from '../../types';
import { Button, Card } from '../../components/ui';
import { clsx } from 'clsx';

interface PreviewStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const BASELINE_LABELS: Record<string, string> = {
  never_tried: 'Never tried',
  under_1_min: 'Under 1 minute',
  '1_5_min': '1–5 minutes',
  '5_15_min': '5–15 minutes',
  '15_30_min': '15–30 minutes',
  '30_60_min': '30–60 minutes',
  '60_plus_min': '1+ hour',
};

export function PreviewStep({ data, onNext, onBack }: PreviewStepProps) {
  const initialDuration = data.hasShownDistress ? '30 seconds' : '30 seconds';

  return (
    <div className="space-y-7">
      <div className="mb-2 text-center">
        <h1 className="text-display text-[var(--text-primary)] leading-tight">
          Here's how a practice works
        </h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">
          Simple, consistent, and always at your dog's pace.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {[
          { num: '1', title: 'We suggest a time', desc: 'During your training window, you\'ll get an invitation' },
          { num: '2', title: 'You start the timer', desc: 'Give a food toy, step out briefly, tap Start' },
          { num: '3', title: 'Step out briefly', desc: 'The timer runs while you\'re away' },
          { num: '4', title: 'Record how it went', desc: 'Tap calm/difficult/distress — takes 10 seconds' },
          { num: '5', title: 'The plan adapts', desc: 'Next session adjusts based on your dog\'s behavior' },
        ].map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-caption font-medium',
              i === 0 ? 'bg-[var(--accent)] text-[var(--text-inverse)]' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            )}>
              {step.num}
            </div>
            <div className="pt-1">
              <p className="text-body font-medium text-[var(--text-primary)]">{step.title}</p>
              <p className="text-body-sm text-[var(--text-secondary)]">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <Card variant="outlined" padding="lg">
        <h3 className="text-h3 text-[var(--text-primary)] mb-4">Your plan summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Dog</span>
            <span className="text-body font-medium text-[var(--text-primary)]">{data.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Starting duration</span>
            <span className="text-body font-medium text-[var(--accent)]">{initialDuration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Training window</span>
            <span className="text-body font-medium text-[var(--text-primary)]">
              {data.trainingWindow?.startTime}–{data.trainingWindow?.endTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Days</span>
            <span className="text-body font-medium text-[var(--text-primary)]">
              {data.trainingWindow?.daysOfWeek.length || 5} days/week
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Reminders</span>
            <span className="text-body font-medium text-[var(--text-primary)]">
              {data.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </Card>

      {/* Key reminders */}
      <div className="space-y-3">
        <p className="text-caption text-[var(--text-muted)] text-center">A few things to remember:</p>
        {[
          'Exercise and toilet your dog before each session',
          'Use a high-value food toy (frozen Kong, puzzle feeder)',
          'Keep departures and returns calm and low-key',
          'End the session early if you see distress signals',
          'Video recording helps catch subtle signals',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--success)] flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <p className="text-body-sm text-[var(--text-primary)]">{item}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-body text-[var(--text-secondary)] pt-2">
        Ready for your first 30-second practice?
      </p>
    </div>
  );
}