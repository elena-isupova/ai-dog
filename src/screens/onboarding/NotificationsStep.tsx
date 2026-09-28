import { useEffect, useState } from 'react';
import type { OnboardingData } from '../../types';
import { Button, Toggle } from '../../components/ui';

interface NotificationsStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function NotificationsStep({ data, onChange, onNext }: NotificationsStepProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(data.notificationsEnabled ?? true);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const perm = await Notification.requestPermission();
    setPermission(perm);
    setEnabled(perm === 'granted');
    onChange({ notificationsEnabled: perm === 'granted' });
  };

  const handleToggle = (value: boolean) => {
    if (value && permission !== 'granted') {
      requestPermission();
    } else {
      setEnabled(value);
      onChange({ notificationsEnabled: value });
    }
  };

  return (
    <div className="space-y-7">
      <div className="mb-2 text-center">
        <h1 className="text-display text-[var(--text-primary)] leading-tight">
          Practice reminders
        </h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">
          May we nudge you when it's time to practice?
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
          <Toggle
            label="Practice reminders"
            description="Get a gentle notification when a session is ready"
            checked={enabled}
            onChange={handleToggle}
            disabled={permission === 'denied'}
          />
          
          {permission === 'denied' && (
            <p className="text-body-sm text-[var(--text-muted)] mt-2">
              Notifications blocked. Enable in system settings to use this feature.
            </p>
          )}
        </div>

        {enabled && (
          <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] space-y-4">
            <p className="text-caption text-[var(--text-muted)]">What you'll receive:</p>
            <ul className="space-y-3 text-body-sm text-[var(--text-primary)]">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--accent)]">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">"Time for a practice"</p>
                  <p className="text-body-sm text-[var(--text-muted)]">Sent when a session is ready during your training window</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0">
                  <span>⚠️</span>
                </span>
                <div>
                  <p className="font-medium">Safety alerts</p>
                  <p className="text-body-sm text-[var(--text-muted)]">If we detect distress signals or training pauses</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--success-subtle)] flex items-center justify-center flex-shrink-0">
                  <span>📊</span>
                </span>
                <div>
                  <p className="font-medium">Weekly progress</p>
                  <p className="text-body-sm text-[var(--text-muted)]">Summary of sessions, milestones, and consistency</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        <div className="p-5 bg-[var(--accent-subtle)] border border-[var(--accent-muted)] rounded-[var(--radius-xl)]">
          <p className="text-body-sm text-[var(--text-primary)]">
            You can always snooze, skip, or adjust timing from the invitation. No pressure.
          </p>
        </div>
      </div>

      {permission === 'default' && (
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full"
          onClick={requestPermission}
        >
          Enable notifications
        </Button>
      )}
    </div>
  );
}