import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { OnboardingStep, OnboardingData, BaselineOption } from '../../types';
import { WelcomeStep } from './WelcomeStep';
import { DogProfileStep } from './DogProfileStep';
import { BaselineStep } from './BaselineStep';
import { ScheduleStep } from './ScheduleStep';
import { NotificationsStep } from './NotificationsStep';
import { PreviewStep } from './PreviewStep';
import { CelebrationStep } from './CelebrationStep';
import { Button } from '../../components/ui';
import { Stepper } from '../../components/ui/Progress';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'dog-profile', label: 'Your dog' },
  { id: 'baseline', label: 'Baseline' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'notifications', label: 'Reminders' },
  { id: 'preview', label: 'Preview' },
];

const createDefaultOnboardingData = (): OnboardingData => ({
  name: '',
  ageYears: 1,
  ageMonths: 0,
  breed: '',
  sex: 'unknown',
  neutered: false,
  acquiredDate: new Date(),
  baselineOption: 'never_tried',
  hasShownDistress: false,
  distressDetails: '',
  trainingWindow: {
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  notificationsEnabled: true,
});

export function OnboardingFlow() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [localData, setLocalData] = useState<OnboardingData>(() => ({
    ...createDefaultOnboardingData(),
    ...(state.onboardingData as Partial<OnboardingData>),
  }));

  const currentStepIndex = STEPS.findIndex(s => s.id === state.onboardingStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    actions.updateOnboardingData(localData);
    
    if (isLastStep) {
      actions.completeOnboarding(localData);
    } else {
      actions.setOnboardingStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    actions.updateOnboardingData(localData);
    if (currentStepIndex > 0) {
      actions.setOnboardingStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleDataChange = (data: Partial<OnboardingData>) => {
    setLocalData(prev => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (state.onboardingStep) {
      case 'welcome':
        return true;
      case 'dog-profile': {
        const trimmedName = (localData.name ?? '').trim();
        const ageYears = Number(localData.ageYears ?? 1);
        const ageMonths = Number(localData.ageMonths ?? 0);
        const hasValidAge = Number.isFinite(ageYears) && Number.isFinite(ageMonths) && ageYears >= 0 && ageMonths >= 0 && ageMonths <= 11;

        return trimmedName.length > 0 && hasValidAge;
      }
      case 'baseline':
        return !!localData.baselineOption;
      case 'schedule':
        return (localData.trainingWindow?.daysOfWeek?.length ?? 0) > 0;
      case 'notifications':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: localData,
      onChange: handleDataChange,
      onNext: handleNext,
      onBack: currentStepIndex > 0 ? handleBack : undefined,
      isFirstStep: currentStepIndex === 0,
      isLastStep,
    };

    switch (state.onboardingStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'dog-profile':
        return <DogProfileStep {...stepProps} />;
      case 'baseline':
        return <BaselineStep {...stepProps} />;
      case 'schedule':
        return <ScheduleStep {...stepProps} />;
      case 'notifications':
        return <NotificationsStep {...stepProps} />;
      case 'preview':
        return <PreviewStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-[var(--divider)]">
        <div className="max-w-5xl mx-auto">
          <Stepper
            steps={STEPS.map(s => s.label)}
            currentStep={currentStepIndex}
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto w-full max-w-[760px] animate-fade-in">
          {renderStep()}
        </div>
      </main>

      <div className="px-4 pb-6 pt-3 md:px-6 md:pb-8 border-t border-[var(--divider)] bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBack}
              className="flex-1 max-w-[180px]"
            >
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            className={clsx('flex-1', currentStepIndex === 0 && 'w-full')}
            disabled={!canProceed()}
          >
            {isLastStep ? 'Begin' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Celebration screen - shown after completion
export function CelebrationScreen() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-6">
      <div className="text-center animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 bg-[var(--success-subtle)] rounded-full flex items-center justify-center animate-scale-in">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--success)]">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-display text-[var(--text-primary)] mb-3">You're all set</h1>
        <p className="text-body-lg text-[var(--text-secondary)] mb-8 max-w-xs mx-auto">
          Your first practice is ready when you are.
        </p>
        <Button size="lg" onClick={() => navigate('/')} className="w-[280px]">
          Start first practice
        </Button>
      </div>
    </div>
  );
}