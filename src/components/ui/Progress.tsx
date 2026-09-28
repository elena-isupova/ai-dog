import { clsx } from 'clsx';

interface ProgressLinearProps {
  value: number;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressLinear({
  value,
  height = 6,
  showLabel = false,
  className = ''
}: ProgressLinearProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full overflow-hidden rounded-full', className)} role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full bg-[var(--border)] rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-[var(--duration-smooth)] ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-caption text-[var(--text-muted)] mt-1.5 text-right">
          {Math.round(clampedValue)}%
        </p>
      )}
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'default' | 'warning' | 'distress';
  showValue?: boolean;
  showTimeRemaining?: boolean;
  remainingSeconds?: number;
  children?: React.ReactNode;
}

function formatRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}m`;
}

export function ProgressRing({
  value,
  size = 280,
  strokeWidth = 6,
  className = '',
  variant = 'default',
  showValue = true,
  showTimeRemaining = false,
  remainingSeconds,
  children
}: ProgressRingProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedValue / 100);

  const strokeColors = {
    default: 'var(--accent)',
    warning: 'var(--warning)',
    distress: 'var(--distress)',
  };

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
        <circle
          className="text-[var(--border)]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={clsx('transition-all duration-1000 ease-linear', `text-[${strokeColors[variant]}]`)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
        />
      </svg>

      {(showValue || showTimeRemaining) && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {children || (
            <>
              {showTimeRemaining && remainingSeconds !== undefined && (
                <span className="text-timer" style={{ fontSize: size * 0.18 }}>
                  {formatRemaining(remainingSeconds)}
                </span>
              )}
              {showValue && !showTimeRemaining && (
                <span className="text-timer" style={{ fontSize: size * 0.18 }}>
                  {Math.round(clampedValue)}%
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div
      className={clsx('flex w-full items-center gap-3', className)}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
    >
      {steps.map((step, index) => (
        <div key={step} className="flex flex-1 items-center gap-3 min-w-0">
          {index > 0 && (
            <div className="relative z-0 h-px flex-1 bg-[var(--divider)]" />
          )}
          <div className={clsx('relative z-10 flex flex-col items-center gap-2.5', index === currentStep && 'text-[var(--accent)]')}>
            <div className={clsx(
              'w-10 h-10 rounded-full border-2 flex items-center justify-center',
              'text-caption font-medium transition-all duration-[var(--duration-base)]',
              index < currentStep
                ? 'bg-[var(--success)] border-[var(--success)] text-[var(--text-inverse)]'
                : index === currentStep
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--text-inverse)] shadow-[0_8px_18px_rgba(196,123,61,0.18)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]'
            )}>
              {index < currentStep ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={clsx(
                'text-caption text-center whitespace-nowrap px-2 py-1 rounded-full transition-all duration-[var(--duration-base)]',
                index === currentStep
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-medium border border-[var(--accent-muted)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}