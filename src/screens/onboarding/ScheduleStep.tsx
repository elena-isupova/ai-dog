import { useState } from 'react';
import type { OnboardingData, TrainingWindow } from '../../types';
import { Input, Toggle } from '../../components/ui';
import { formatDuration } from '../../utils/helpers';
import { selectInitialDuration } from '../../engine/trainingEngine';
import { DEFAULT_ENGINE_CONFIG } from '../../types';
import { clsx } from 'clsx';

interface ScheduleStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const DAYS = [
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'Tu' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'Th' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'Sa' },
  { value: 0, label: 'Sun', short: 'Su' },
];

const DEFAULT_WINDOW: TrainingWindow = {
  startTime: '09:00',
  endTime: '17:00',
  daysOfWeek: [1, 2, 3, 4, 5],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function ScheduleStep({ data, onChange }: ScheduleStepProps) {
  const [window, setWindow] = useState<TrainingWindow>(data.trainingWindow || DEFAULT_WINDOW);

  const toggleDay = (day: number) => {
    const newDays = window.daysOfWeek.includes(day)
      ? window.daysOfWeek.filter(d => d !== day)
      : [...window.daysOfWeek, day].sort((a, b) => a - b);
    setWindow(prev => ({ ...prev, daysOfWeek: newDays }));
    onChange({ trainingWindow: { ...window, daysOfWeek: newDays } });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setWindow(prev => ({ ...prev, [field]: value }));
    onChange({ trainingWindow: { ...window, [field]: value } });
  };

  return (
    <div className="space-y-7">
      <div className="mb-2 text-center">
        <h1 className="text-display text-[var(--text-primary)] leading-tight">
          Make room for small steps
        </h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">
          Choose a gentle practice window. You can change it whenever life does.
        </p>
      </div>

      {/* Days of week */}
      <div className="space-y-3">
          <label className="block text-caption text-[var(--text-secondary)] mb-3">Practice days</label>
        <div className="flex gap-2" role="group" aria-label="Training days">
          {DAYS.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={clsx(
                'flex-1 min-w-0 py-3 px-1 rounded-[var(--radius-lg)] text-caption font-medium transition-all',
                window.daysOfWeek.includes(day.value)
                  ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              )}
              aria-pressed={window.daysOfWeek.includes(day.value)}
            >
              {day.short}
            </button>
          ))}
        </div>
        {window.daysOfWeek.length === 0 && (
          <p className="text-body-sm text-[var(--distress)] mt-2" role="alert">
            Please select at least one day
          </p>
        )}
      </div>

      {/* Time window */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start time"
          type="time"
          value={window.startTime}
          onChange={(e) => handleTimeChange('startTime', e.target.value)}
        />
        <Input
          label="End time"
          type="time"
          value={window.endTime}
          onChange={(e) => handleTimeChange('endTime', e.target.value)}
        />
      </div>
      {window.startTime >= window.endTime && (
        <p className="-mt-4 text-body-sm text-[var(--distress)]" role="alert">
          End time must be later than start time.
        </p>
      )}

      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <Toggle
          label="Practice reminders"
          description="A gentle nudge when it's time to train"
          checked={data.notificationsEnabled}
          onChange={(notificationsEnabled) => onChange({ notificationsEnabled })}
        />
      </div>

      <div className="rounded-[var(--radius-xl)] bg-[var(--accent-subtle)] p-5">
        <p className="text-caption text-[var(--accent)]">Your starting plan</p>
        <p className="mt-1 text-body font-medium text-[var(--text-primary)]">
          {data.name || 'Your dog'} begins with {formatDuration(selectInitialDuration(data.baselineOption, data.hasShownDistress, DEFAULT_ENGINE_CONFIG))} alone.
        </p>
        <p className="mt-1 text-body-sm text-[var(--text-secondary)]">
          We'll only add time when they are comfortable.
        </p>
      </div>
    </div>
  );
}
