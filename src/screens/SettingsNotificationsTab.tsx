import { useState, useEffect } from 'react';
import { Card, Toggle, Button } from '../components/ui';
import { TrainingSettings } from '../types';

export function NotificationsTab({ settings, actions }: { settings: TrainingSettings; actions: any }) {
  const notifications = settings.notifications;
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(notifications.enabled);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    const nextEnabled = perm === 'granted';
    setEnabled(nextEnabled);
    actions.updateNotifications({ enabled: nextEnabled });
  };

  const handleToggle = (value: boolean) => {
    if (value && permission !== 'granted') {
      requestPermission();
    } else {
      setEnabled(value);
      actions.updateNotifications({ enabled: value });
    }
  };

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Push Notifications</h2>
        
        <div className="space-y-4">
          <Toggle
            label="Practice reminders"
            description="Get a gentle notification when a session is ready"
            checked={enabled}
            onChange={(v: boolean) => {
              if (v && permission !== 'granted') {
                requestPermission();
              } else {
                setEnabled(v);
                actions.updateNotifications({ enabled: v });
              }
            }}
            disabled={permission === 'denied'}
          />
          
          {permission === 'denied' && (
            <p className="text-body-sm text-[var(--text-muted)]">
              Notifications blocked. Enable in system settings to use this feature.
            </p>
          )}

          {notifications.enabled && (
            <div className="pt-5 border-t border-[var(--divider)] space-y-4">
              <Toggle
                label="Daily reminder"
                description="Evening summary of today's practice"
                checked={notifications.dailyReminder}
                onChange={(v: boolean) => actions.updateNotifications({ dailyReminder: v })}
              />
              <Toggle
                label="Weekly progress"
                description="Weekly summary of progress and milestones"
                checked={notifications.weeklyProgress}
                onChange={(v: boolean) => actions.updateNotifications({ weeklyProgress: v })}
              />
              <div>
                <label className="block text-caption text-[var(--text-secondary)] mb-2 flex justify-between">
                  <span>Snooze duration</span>
                  <span className="font-medium text-[var(--text-primary)]">{notifications.snoozeMinutes} minutes</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step={5}
                  value={notifications.snoozeMinutes}
                  onChange={(e) => actions.updateNotifications({ snoozeMinutes: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[var(--border)] rounded-full appearance-none accent-[var(--accent)]"
                />
              </div>
            </div>
          )}

          {permission === 'default' && (
            <Button variant="secondary" size="lg" className="w-full" onClick={requestPermission}>
              Enable notifications
            </Button>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">What You'll Receive</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--accent)]">🔔</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">"Time for a practice"</p>
              <p className="text-body-sm text-[var(--text-muted)] mt-1">Sent when a session is ready during your training window</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0">
              <span>⚠️</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">Safety alerts</p>
              <p className="text-body-sm text-[var(--text-muted)] mt-1">If we detect distress signals or training pauses</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--success-subtle)] flex items-center justify-center flex-shrink-0">
              <span>📊</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">Weekly progress</p>
              <p className="text-body-sm text-[var(--text-muted)] mt-1">Summary of sessions, milestones, and consistency</p>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}