import { useState } from 'react';
import type { OnboardingData } from '../../types';
import { Input, Select } from '../../components/ui';
import { clsx } from 'clsx';

interface DogProfileStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const BREEDS = [
  'Mixed breed', 'Labrador Retriever', 'Golden Retriever', 'German Shepherd',
  'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler',
  'Yorkshire Terrier', 'Boxer', 'Dachshund', 'Siberian Husky',
  'Border Collie', 'Australian Shepherd', 'Cavalier King Charles Spaniel',
  'Shih Tzu', 'Boston Terrier', 'Pembroke Welsh Corgi', 'Other'
];

export function DogProfileStep({ data, onChange, onBack }: DogProfileStepProps) {
  const [ageYears, setAgeYears] = useState(data.ageYears ?? 1);
  const [ageMonths, setAgeMonths] = useState(data.ageMonths ?? 0);

  const handleAgeChange = (field: 'years' | 'months', value: number) => {
    if (field === 'years') {
      setAgeYears(Math.max(0, Math.min(30, value)));
      onChange({ ageYears: Math.max(0, Math.min(30, value)) });
    } else {
      setAgeMonths(Math.max(0, Math.min(11, value)));
      onChange({ ageMonths: Math.max(0, Math.min(11, value)) });
    }
  };

  return (
    <div className="space-y-7">
      <div className="mb-2 text-center">
        <h1 className="text-display text-[var(--text-primary)] leading-tight">
          Tell us about your dog
        </h1>
        <p className="mt-2 text-body text-[var(--text-secondary)]">
          Name, age, and a little history help us tailor the plan.
        </p>
      </div>

      <div className="space-y-5">
        <Input
          label="Name"
          placeholder="Luna"
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          autoFocus
        />

        <div>
          <label className="block text-caption text-[var(--text-secondary)] mb-2">Age</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="age-years" className="sr-only">Years</label>
              <Input
                id="age-years"
                type="number"
                min={0}
                max={30}
                value={ageYears}
                onChange={(e) => handleAgeChange('years', parseInt(e.target.value) || 0)}
                placeholder="Years"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="age-months" className="sr-only">Months</label>
              <Input
                id="age-months"
                type="number"
                min={0}
                max={11}
                value={ageMonths}
                onChange={(e) => handleAgeChange('months', parseInt(e.target.value) || 0)}
                placeholder="Months"
              />
            </div>
          </div>
        </div>

        <Select
          label="Breed"
          placeholder="Select breed"
          value={data.breed || ''}
          onChange={(e) => onChange({ breed: e.target.value })}
          options={BREEDS.map(b => ({ value: b, label: b }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Sex"
            placeholder="Select"
            value={data.sex || 'unknown'}
            onChange={(e) => onChange({ sex: e.target.value as any })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'unknown', label: 'Unknown' },
            ]}
          />
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="neutered"
              checked={data.neutered || false}
              onChange={(e) => onChange({ neutered: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--focus-ring)] focus:ring-offset-2"
            />
            <label htmlFor="neutered" className="text-body text-[var(--text-primary)] cursor-pointer">
              Neutered / Spayed
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--divider)]">
          <label className="block text-caption text-[var(--text-secondary)] mb-2">
            When did you get your dog?
          </label>
          <Input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={data.acquiredDate ? new Date(data.acquiredDate).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ acquiredDate: e.target.value ? new Date(e.target.value) : undefined })}
          />
        </div>
      </div>
    </div>
  );
}
