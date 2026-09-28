import type { OnboardingData } from '../../types';

interface WelcomeStepProps {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function WelcomeStep({ isFirstStep }: WelcomeStepProps) {
  return (
    <div className="mx-auto max-w-[920px] text-center">
      <div className="mb-5 flex justify-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--text-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] md:h-20 md:w-20">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-current md:h-[42px] md:w-[42px]">
            <path d="M12 2.75a9.25 9.25 0 1 1 0 18.5a9.25 9.25 0 0 1 0-18.5Z" />
            <path d="M12 7.5v5.2l3.5 2.1" />
          </svg>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        <h1 className="mx-auto max-w-[880px] text-[clamp(2.75rem,4vw,5.5rem)] leading-[0.92] tracking-[-0.06em] text-[var(--text-primary)]">
          Help your dog feel safe alone
        </h1>
        <p className="mx-auto max-w-[820px] text-[1rem] leading-[1.55] text-[var(--text-secondary)] md:text-[1.2rem]">
          One small step at a time. This app uses gradual, evidence-based practice. No pressure. No judgment. Just consistent progress.
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-[760px] space-y-3 md:mt-8 md:space-y-3.5">
        <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 text-left shadow-[var(--shadow-sm)] animate-slide-up md:gap-4 md:p-4" style={{ animationDelay: '50ms' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--success-subtle)] text-[var(--success)] md:h-11 md:w-11">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-[1rem] font-medium text-[var(--text-primary)] md:text-[1.05rem]">Below threshold</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">Every session ends with your dog relaxed</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 text-left shadow-[var(--shadow-sm)] animate-slide-up md:gap-4 md:p-4" style={{ animationDelay: '100ms' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-subtle)] text-[var(--accent)] md:h-11 md:w-11">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <div>
            <h3 className="text-[1rem] font-medium text-[var(--text-primary)] md:text-[1.05rem]">Gradual progression</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">Increase duration only when your dog is ready</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 text-left shadow-[var(--shadow-sm)] animate-slide-up md:gap-4 md:p-4" style={{ animationDelay: '150ms' }}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--warning-subtle)] text-[var(--warning)] md:h-11 md:w-11">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v20M17 5H9.5A3.5 3.5 0 0 0 9.5 12h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-[1rem] font-medium text-[var(--text-primary)] md:text-[1.05rem]">Consistent practice</h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">Short daily sessions beat occasional long ones</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[0.68rem] font-medium tracking-[0.2em] text-[var(--text-muted)] uppercase animate-fade-in md:mt-7" style={{ animationDelay: '200ms' }}>
        Ready to begin?
      </p>
    </div>
  );
}