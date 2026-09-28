import { Card } from '../components/ui';
import { formatDuration } from '../utils/helpers';
import { BaselineOption } from '../types';

export function ProfileTab({ dog }: { dog: any }) {
  return (
    <div className="space-y-5">
      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Dog Profile</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center">
              <span className="text-2xl font-medium text-[var(--accent)]">
                {dog.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-h2 text-[var(--text-primary)]">{dog.name}</p>
              <p className="text-body-sm text-[var(--text-muted)]">
                {dog.breed} · {dog.ageYears}y {dog.ageMonths}m
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--divider)] grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)]">
              <p className="text-h3 text-[var(--text-primary)] tabular-nums">{dog.sex === 'male' ? '♂' : dog.sex === 'female' ? '♀' : '?'}</p>
              <p className="text-caption text-[var(--text-muted)]">Sex</p>
            </div>
            <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)]">
              <p className="text-h3 text-[var(--text-primary)] tabular-nums">{dog.neutered ? 'Yes' : 'No'}</p>
              <p className="text-caption text-[var(--text-muted)]">Neutered</p>
            </div>
            <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)]">
              <p className="text-h3 text-[var(--text-primary)] tabular-nums">{dog.ageYears}</p>
              <p className="text-caption text-[var(--text-muted)]">Years</p>
            </div>
            <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)]">
              <p className="text-h3 text-[var(--text-primary)] tabular-nums">{dog.ageMonths}</p>
              <p className="text-caption text-[var(--text-muted)]">Months</p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-h3 text-[var(--text-primary)] mb-5">Baseline Assessment</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Starting baseline</span>
            <span className="text-body font-medium text-[var(--text-primary)]">
              {formatBaselineOption(dog.baselineAssessment?.option)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-[var(--text-secondary)]">Distress reported</span>
            <span className="text-body font-medium text-[var(--text-primary)]">
              {dog.baselineAssessment?.hasShownDistress ? 'Yes' : 'No'}
            </span>
          </div>
          {dog.baselineAssessment?.hasShownDistress && dog.baselineAssessment?.distressDetails && (
            <div className="pt-4 border-t border-[var(--divider)]">
              <p className="text-body-sm text-[var(--text-secondary)]">{dog.baselineAssessment.distressDetails}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function formatBaselineOption(option: BaselineOption): string {
  const labels: Record<BaselineOption, string> = {
    never_tried: 'Never tried',
    under_1_min: 'Under 1 minute',
    '1_5_min': '1–5 minutes',
    '5_15_min': '5–15 minutes',
    '15_30_min': '15–30 minutes',
    '30_60_min': '30–60 minutes',
    '60_plus_min': '1+ hour',
  };
  return labels[option] || option;
}