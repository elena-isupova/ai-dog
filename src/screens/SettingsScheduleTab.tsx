import { useState } from 'react';
import { Card, Input, Button } from '../components/ui';
import { clsx } from '../utils/helpers';
import { TrainingSettings } from '../types';

export function ScheduleTab({ settings, actions }: { settings: TrainingSettings; actions: any }) {
  const [window, setWindow] = useState(settings.trainingWindow);

  const DAYS = [
    { value: 1, label: 'Mon', short: 'M' },
    { value: 2, label: 'Tue', short: 'Tu' },
    { value: 3, label: 'Wed', short: 'W' },
    { value: 4, label: 'Thu', short: 'Th' },
    { value: 5, label: 'Fri', short: 'F' },
    { value: 6, label: 'Sat', short: 'Sa' },
    { value: 0, label: 'Sun', short: 'Su' },
  ];

  const handleDayToggle = (day: number) => {
    const newDays = window.daysOfWeek.includes(day)
      ? window.daysOfWeek.filter((d: number) => d !== day)
      : [...window.daysOfWeek, day].sort((a: number, b: number) => a - b);
    setWindow((prev: typeof window) => ({ ...prev, daysOfWeek: newDays }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setWindow((prev: typeof window) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    actions.updateWindow(window);
  };

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Training Window</h2>
        <p className="text-body text-[var(--text-secondary)] mb-6">
          Practices will be suggested during this window. You can adjust anytime.
        </p>

        {/* Days */}
        <div className="mb-6">
          <label className="block text-caption text-[var(--text-secondary)] mb-3">Days</label>
          <div className="flex gap-2" role="group" aria-label="Training days">
            {DAYS.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={clsx(
                  'flex-1 py-4 px-2 rounded-[var(--radius-lg)] text-caption font-medium transition-all',
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
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Input
            label="Start time"
            type="time"
            value={window.startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange('startTime', e.target.value)}
          />
          <Input
            label="End time"
            type="time"
            value={window.endTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange('endTime', e.target.value)}
          />
        </div>

        {/* Timezone */}
        <div className="mb-6 pt-4 border-t border-[var(--divider)]">
          <label className="block text-caption text-[var(--text-secondary)] mb-2">Timezone</label>
          <p className="text-body text-[var(--text-primary)]">{window.timezone}</p>
          <p className="text-body-sm text-[var(--text-muted)] mt-1">
            Detected automatically. Updates when you travel.
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={handleSave} className="w-full">
          Save schedule
        </Button>
      </Card>

      {/* Scheduling Parameters */}
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Session Limits</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-caption text-[var(--text-secondary)] mb-2 flex justify-between">
              <span>Minimum interval between sessions</span>
              <span className="font-medium text-[var(--text-primary)]">{settings.scheduling.minIntervalMinutes} minutes</span>
            </label>
            <input
              type="range"
              min="45"
              max="180"
              step="15"
              value={settings.scheduling.minIntervalMinutes}
              onChange={(e) => actions.updateScheduling({ minIntervalMinutes: parseInt(e.target.value) })}
              className="w-full h-2 bg-[var(--border)] rounded-full appearance-none accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-caption text-[var(--text-secondary)] mb-2 flex justify-between">
              <span>Maximum sessions per day</span>
              <span className="font-medium text-[var(--text-primary)]">{settings.scheduling.maxSessionsPerDay}</span>
            </label>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={settings.scheduling.maxSessionsPerDay}
              onChange={(e) => actions.updateScheduling({ maxSessionsPerDay: parseInt(e.target.value) })}
              className="w-full h-2 bg-[var(--border)] rounded-full appearance-none accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-caption text-[var(--text-secondary)] mb-2 flex justify-between">
              <span>Snooze duration</span>
              <span className="font-medium text-[var(--text-primary)]">{settings.scheduling.snoozeMinutes} minutes</span>
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={settings.scheduling.snoozeMinutes}
              onChange={(e) => actions.updateScheduling({ snoozeMinutes: parseInt(e.target.value) })}
              className="w-full h-2 bg-[var(--border)] rounded-full appearance-none accent-[var(--accent)]"
            />
          </div>
        </div>
      </Card>
    </div>
  );
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