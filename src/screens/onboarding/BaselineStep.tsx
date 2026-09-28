import type { OnboardingData, BaselineOption } from '../../types';
import { clsx } from 'clsx';

interface BaselineStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const BASELINE_OPTIONS: { value: BaselineOption; label: string; description: string }[] = [
  { value: 'never_tried', label: 'Never tried', description: 'We haven\'t practiced alone time yet' },
  { value: 'under_1_min', label: 'Under 1 minute', description: 'Can handle very brief absences' },
  { value: '1_5_min', label: '1–5 minutes', description: 'Comfortable with short absences' },
  { value: '5_15_min', label: '5–15 minutes', description: 'Handles brief errands well' },
  { value: '15_30_min', label: '15–30 minutes', description: 'Good for coffee runs' },
  { value: '30_60_min', label: '30–60 minutes', description: 'Can manage longer absences' },
  { value: '60_plus_min', label: '1+ hour', description: 'Comfortable with extended time alone' },
];

export function BaselineStep({ data, onChange, onBack }: BaselineStepProps) {
  const showDistress = data.hasShownDistress;

  return (
    <div className="space-y-7">
      <div className="mb-2 text-center">
        <h1 className="text-display text-[var(--text-primary)] leading-tight">
          Current alone time
        </h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">
          How long can your dog stay alone calmly right now?
        </p>
      </div>

      <div className="space-y-2.5">
        {BASELINE_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ baselineOption: option.value })}
            aria-pressed={data.baselineOption === option.value}
            className={clsx(
              'w-full p-3.5 text-left rounded-[var(--radius-xl)] border-2 transition-all',
              data.baselineOption === option.value
                ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={clsx('font-medium', data.baselineOption === option.value ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                  {option.label}
                </p>
                <p className="text-body-sm text-[var(--text-muted)] mt-0.5">{option.description}</p>
              </div>
              {data.baselineOption === option.value && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-[var(--accent)]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Distress screening */}
      <div className="pt-4 border-t border-[var(--divider)]">
        <p className="text-caption text-[var(--text-muted)] mb-4">
          Has your dog shown distress when left alone?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'No', value: false }, { label: 'Yes', value: true }].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                onChange({ hasShownDistress: value });
              }}
              aria-pressed={data.hasShownDistress === value}
              className={clsx(
                'w-full p-3.5 text-left rounded-[var(--radius-lg)] border-2 transition-all',
                data.hasShownDistress === value
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
              )}
            >
              <p className={clsx('font-medium', data.hasShownDistress === (label === 'Yes') ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                {label}
              </p>
            </button>
          ))}
        </div>

        {showDistress && data.hasShownDistress && (
          <div className="mt-4 p-5 bg-[var(--distress-subtle)] border border-[var(--distress-muted)] rounded-[var(--radius-xl)] animate-slide-up">
            <p className="text-body-sm text-[var(--distress)] mb-3">
              Please describe what you've seen (destruction, barking, accidents, panic, etc.)
            </p>
            <textarea
              rows={3}
              placeholder="My dog..."
              value={data.distressDetails || ''}
              onChange={(e) => onChange({ distressDetails: e.target.value })}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] px-4 py-3 text-body-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] resize-none"
            />
          </div>
        )}
      </div>

      {data.hasShownDistress && data.baselineOption !== 'never_tried' && data.baselineOption !== 'under_1_min' && (
        <div className="p-5 bg-[var(--warning-subtle)] border border-[var(--warning-muted)] rounded-[var(--radius-xl)] animate-slide-up">
          <p className="text-body-sm text-[var(--warning)]">
            Since your dog has shown distress, we'll start conservatively at 30 seconds to ensure comfort.
          </p>
        </div>
      )}
    </div>
  );
}
