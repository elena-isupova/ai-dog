import { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui';
import { clsx } from '../utils/helpers';
import { EngineConfig, DurationBand, TrainingSettings } from '../types';
import { Trash2 } from 'lucide-react';

export function EngineTab({ settings, actions }: { settings: TrainingSettings; actions: any }) {
  const engine = settings.engine;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateEngine = (key: keyof EngineConfig, value: number) => {
    actions.updateEngineConfig({ [key]: value });
  };

  const DURATION_BANDS: DurationBand[] = [
    'seconds_0_30', 'seconds_30_120', 'minutes_2_5', 
    'minutes_5_15', 'minutes_15_40', 'minutes_40_90', 'minutes_90_plus'
  ];

  return (
    <div className="space-y-5">
      {/* Core Settings */}
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Core Parameters</h2>
        <div className="space-y-5">
          <SliderSetting
            label="Minimum duration"
            value={engine.minDuration}
            min={5}
            max={60}
            step={5}
            unit="seconds"
            onChange={(v) => updateEngine('minDuration', v)}
          />
          <SliderSetting
            label="Initial duration"
            value={engine.initialDuration}
            min={5}
            max={300}
            step={5}
            unit="seconds"
            onChange={(v) => updateEngine('initialDuration', v)}
          />
          <SliderSetting
            label="Mild difficulty step-back"
            value={engine.dropBackStepsMild}
            min={1}
            max={2}
            step={1}
            unit="increments"
            onChange={(v) => updateEngine('dropBackStepsMild', v)}
          />
          <SliderSetting
            label="Distress step-back"
            value={engine.dropBackStepsDistress}
            min={2}
            max={3}
            step={1}
            unit="increments"
            onChange={(v) => updateEngine('dropBackStepsDistress', v)}
          />
          <SliderSetting
            label="Pause after mild (hours)"
            value={engine.pauseHoursMild}
            min={12}
            max={72}
            step={12}
            unit="hours"
            onChange={(v) => updateEngine('pauseHoursMild', v)}
          />
          <SliderSetting
            label="Pause after distress (hours)"
            value={engine.pauseHoursDistress}
            min={24}
            max={168}
            step={12}
            unit="hours"
            onChange={(v) => updateEngine('pauseHoursDistress', v)}
          />
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-h3 text-[var(--text-primary)]">Advanced Parameters</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} advanced
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-5 animate-slide-up">
            <SliderSetting
              label="Consecutive mild for pause"
              value={engine.consecutiveMildForPause}
              min={1}
              max={3}
              step={1}
              unit="sessions"
              onChange={(v) => updateEngine('consecutiveMildForPause', v)}
            />
            <SliderSetting
              label="Plateau detection (days)"
              value={engine.plateauDays}
              min={7}
              max={28}
              step={1}
              unit="days"
              onChange={(v) => updateEngine('plateauDays', v)}
            />
            <SliderSetting
              label="Plateau min sessions"
              value={engine.plateauMinSessions}
              min={4}
              max={10}
              step={1}
              unit="sessions"
              onChange={(v) => updateEngine('plateauMinSessions', v)}
            />
            <SliderSetting
              label="Re-entry fraction"
              value={Math.round(engine.reEntryFraction * 100)}
              min={30}
              max={70}
              step={5}
              unit="%"
              onChange={(v) => updateEngine('reEntryFraction', v / 100)}
            />
            <SliderSetting
              label="Extended break threshold (days)"
              value={engine.extendedBreakThresholdDays}
              min={3}
              max={14}
              step={1}
              unit="days"
              onChange={(v) => updateEngine('extendedBreakThresholdDays', v)}
            />
            <SliderSetting
              label="Skip check-in threshold"
              value={engine.skipCheckInThreshold}
              min={1}
              max={7}
              step={1}
              unit="days"
              onChange={(v) => updateEngine('skipCheckInThreshold', v)}
            />
            <SliderSetting
              label="Micro-increase probability"
              value={Math.round(engine.microIncreaseProbability * 100)}
              min={10}
              max={50}
              step={5}
              unit="%"
              onChange={(v) => updateEngine('microIncreaseProbability', v / 100)}
            />
            <SliderSetting
              label="Duration randomness"
              value={Math.round(engine.durationRandomnessPercent * 100)}
              min={5}
              max={30}
              step={5}
              unit="%"
              onChange={(v) => updateEngine('durationRandomnessPercent', v / 100)}
            />
            <SliderSetting
              label="Time randomness"
              value={Math.round(engine.timeRandomnessPercent * 100)}
              min={10}
              max={40}
              step={5}
              unit="%"
              onChange={(v) => updateEngine('timeRandomnessPercent', v / 100)}
            />
            <SliderSetting
              label="Video encouraged threshold"
              value={engine.videoEncouragedThreshold}
              min={3}
              max={10}
              step={1}
              unit="sessions"
              onChange={(v) => updateEngine('videoEncouragedThreshold', v)}
            />
          </div>
        )}
      </Card>

      {/* Duration Band Configuration */}
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Duration Bands</h2>
        <p className="text-body-sm text-[var(--text-secondary)] mb-5">
          Configure increment sizes and repeat requirements for each duration range.
        </p>
        <div className="space-y-3">
          {DURATION_BANDS.map(band => (
            <BandConfigRow
              key={band}
              band={band}
              engine={engine}
              onChange={(increments, repeats) => {
                actions.updateEngineConfig({
                  customIncrements: { ...engine.customIncrements, [band]: increments },
                  customMinRepeats: { ...engine.customMinRepeats, [band]: repeats },
                });
              }}
            />
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" variant="outlined">
        <h2 className="text-h3 text-[var(--text-primary)] mb-3 text-[var(--distress)]">Danger Zone</h2>
        <Button variant="destructive" onClick={() => actions.resetAllData()}>
          <Trash2 size={18} strokeWidth={2.5} className="mr-2" />
          Reset All Data
        </Button>
        <p className="text-body-sm text-[var(--text-muted)] mt-3">
          This will permanently delete your dog's profile, all sessions, and progress.
        </p>
      </Card>
    </div>
  );
}

function SliderSetting({ 
  label, value, min, max, step, unit, onChange 
}: { 
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void 
}) {
  return (
    <div>
      <label className="block text-caption text-[var(--text-secondary)] mb-2 flex justify-between">
        <span>{label}</span>
        <span className="font-medium text-[var(--text-primary)] tabular-nums">{value} {unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-[var(--border)] rounded-full appearance-none accent-[var(--accent)]"
      />
    </div>
  );
}

function BandConfigRow({ band, engine, onChange }: { band: DurationBand; engine: EngineConfig; onChange: (inc: number, rep: number) => void }) {
  const [localInc, setLocalInc] = useState(engine.customIncrements?.[band] || getDefaultIncrement(band));
  const [localRep, setLocalRep] = useState(engine.customMinRepeats?.[band] || getDefaultRepeats(band));
  const [incError, setIncError] = useState(false);
  const [repError, setRepError] = useState(false);

  useEffect(() => {
    onChange(localInc, localRep);
  }, [localInc, localRep, band, onChange]);

  const handleIncChange = (value: number) => {
    const clamped = Math.max(1, Math.min(3600, value));
    setLocalInc(clamped);
    setIncError(value !== clamped);
  };

  const handleRepChange = (value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    setLocalRep(clamped);
    setRepError(value !== clamped);
  };

  const handleIncBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    handleIncChange(value);
  };

  const handleRepBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    handleRepChange(value);
  };

  const bandLabels: Record<DurationBand, string> = {
    seconds_0_30: '0–30 seconds',
    seconds_30_120: '30s–2 min',
    minutes_2_5: '2–5 min',
    minutes_5_15: '5–15 min',
    minutes_15_40: '15–40 min',
    minutes_40_90: '40–90 min',
    minutes_90_plus: '90+ min',
  };

  return (
    <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)]">
      <p className="text-caption text-[var(--text-secondary)] mb-2">{bandLabels[band]}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-caption text-[var(--text-muted)] mb-1">Increment (seconds)</label>
          <Input
            type="number"
            min={1}
            max={3600}
            value={localInc}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalInc(parseInt(e.target.value) || 1)}
            onBlur={handleIncBlur}
            error={incError ? 'Value clamped to valid range' : undefined}
          />
        </div>
        <div>
          <label className="block text-caption text-[var(--text-muted)] mb-1">Repeats required</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={localRep}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalRep(parseInt(e.target.value) || 1)}
            onBlur={handleRepBlur}
            error={repError ? 'Value clamped to valid range' : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function getDefaultIncrement(band: DurationBand): number {
  const defaults: Record<DurationBand, number> = {
    seconds_0_30: 5,
    seconds_30_120: 15,
    minutes_2_5: 30,
    minutes_5_15: 60,
    minutes_15_40: 120,
    minutes_40_90: 300,
    minutes_90_plus: 900,
  };
  return defaults[band];
}

function getDefaultRepeats(band: DurationBand): number {
  const defaults: Record<DurationBand, number> = {
    seconds_0_30: 3,
    seconds_30_120: 3,
    minutes_2_5: 3,
    minutes_5_15: 3,
    minutes_15_40: 2,
    minutes_40_90: 2,
    minutes_90_plus: 1,
  };
  return defaults[band];
}
