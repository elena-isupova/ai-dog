import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';

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

export const CelebrationStep = CelebrationScreen;