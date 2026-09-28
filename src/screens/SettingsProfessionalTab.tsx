import { useState } from 'react';
import { Card, Button, Modal, Toggle } from '../components/ui';
import { TrainingSettings } from '../types';

export function ProfessionalTab({ settings, actions }: { settings: TrainingSettings; actions: any }) {
  const [override, setOverride] = useState(settings.professionalOverride);
  const [showOverride, setShowOverride] = useState(false);

  const handleTogglePro = (enabled: boolean) => {
    if (enabled) {
      const newOverride = { enabled: true, professionalId: '', override: {} };
      setOverride(newOverride);
      actions.updateSettings({ professionalOverride: newOverride });
    } else {
      setOverride(undefined);
      actions.updateSettings({ professionalOverride: undefined });
    }
    setShowOverride(enabled);
  };

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-4">Professional Mode</h2>
        <p className="text-body text-[var(--text-secondary)] mb-6">
          Allow a veterinary behaviorist or certified trainer to configure training parameters remotely.
          They'll receive a secure link to set custom increments, pauses, and progression rules.
        </p>

        <Toggle
          label="Enable professional management"
          description="Your professional can adjust training engine parameters"
          checked={!!override?.enabled}
          onChange={handleTogglePro}
        />

        {override?.enabled && (
          <div className="pt-5 border-t border-[var(--divider)] space-y-4">
            <div className="p-4 bg-[var(--success-subtle)] border border-[var(--success-muted)] rounded-[var(--radius-xl)]">
              <p className="text-body-sm text-[var(--success)] font-medium">
                ✓ Professional mode active
              </p>
              {override.professionalId && (
                <p className="text-body-sm text-[var(--text-secondary)] mt-1">
                  Managed by: {override.professionalId}
                </p>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShowOverride(true)}>
              View current overrides
            </Button>

            <Button variant="secondary" size="sm" onClick={() => handleTogglePro(false)}>
              Disconnect professional
            </Button>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-4">When to Seek Professional Help</h2>
        <p className="text-body text-[var(--text-secondary)] mb-4">
          The app will automatically suggest professional support if it detects:
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--distress-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--distress)] text-sm">!</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">Significant distress</p>
              <p className="text-body-sm text-[var(--text-secondary)]">Destruction, elimination, panic, self-injury, or persistent vocalization</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--warning)] text-sm">!</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">No progress</p>
              <p className="text-body-sm text-[var(--text-secondary)]">No duration increase after 3 weeks of consistent practice</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--warning-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--warning)] text-sm">!</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">Regression</p>
              <p className="text-body-sm text-[var(--text-secondary)]">Distress at previously mastered durations</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--distress-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--distress)] text-sm">!</span>
            </div>
            <div>
              <p className="text-body font-medium text-[var(--text-primary)]">Baseline distress</p>
              <p className="text-body-sm text-[var(--text-secondary)]">Distress at very short durations (&lt; 30 seconds) despite correct protocol</p>
            </div>
          </li>
        </ul>
      </Card>

      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-4">Professional Types</h2>
        <div className="space-y-3">
          <ProfessionalTypeCard
            title="Veterinary Behaviorist (Dip ACVB)"
            description="Board-certified veterinarian with specialty in behavior. Can prescribe medication."
            icon="🏥"
          />
          <ProfessionalTypeCard
            title="CAAB / ACAAB"
            description="Certified Applied Animal Behaviorist. Graduate-level training in animal behavior."
            icon="🎓"
          />
          <ProfessionalTypeCard
            title="CPDT-KA / CPDT-KSA (SA experience)"
            description="Certified Professional Dog Trainer with separation anxiety specialization."
            icon="🐾"
          />
        </div>
      </Card>

      {/* Override Details Modal */}
      {showOverride && override && (
        <Modal
          isOpen={true}
          onClose={() => setShowOverride(false)}
          title="Current Overrides"
          size="md"
        >
          <div className="space-y-4">
            {override.override?.customIncrements && (
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-2">Custom Increments</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(override.override.customIncrements).map(([band, val]) => (
                    <div key={band} className="p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
                      <span className="text-[var(--text-muted)]">{band}</span>: {val}s
                    </div>
                  ))}
                </div>
              </div>
            )}
            {override.override?.customMinRepeats && (
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-2">Custom Repeats</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(override.override.customMinRepeats).map(([band, val]) => (
                    <div key={band} className="p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
                      <span className="text-[var(--text-muted)]">{band}</span>: {val}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {override.override?.customPauseHours && (
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-2">Custom Pause Hours</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(override.override.customPauseHours).map(([key, val]) => (
                    <div key={key} className="p-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
                      <span className="text-[var(--text-muted)]">{key}</span>: {val}h
                    </div>
                  ))}
                </div>
              </div>
            )}
            {override.override?.notes && (
              <div>
                <p className="text-caption text-[var(--text-secondary)] mb-2">Notes</p>
                <p className="text-body-sm text-[var(--text-secondary)]">{override.override.notes}</p>
              </div>
            )}
            {!override.override || (Object.keys(override.override || {}).length === 0 && !override.override?.notes) && (
              <p className="text-body text-[var(--text-muted)] text-center py-4">No custom overrides set</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfessionalTypeCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-body font-medium text-[var(--text-primary)]">{title}</p>
          <p className="text-body-sm text-[var(--text-secondary)] mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}