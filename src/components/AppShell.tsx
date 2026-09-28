import { Outlet, useLocation } from 'react-router-dom';
import { Home, BarChart2, Settings, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp as useAppContext } from '../context/AppContext';
import { Button } from './ui';

const TABS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/progress', label: 'Progress', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-neutral-50)]">
      {/* Professional referral banner - shown conditionally via context */}
      <ProfessionalReferralBanner />

      {/* Main content */}
      <main className="flex-1 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] pt-2">
        <Outlet />
      </main>

      {/* Tab Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 tab-bar"
        role="tablist"
        aria-label="Main navigation"
      >
        {TABS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => window.location.href = path}
              className={clsx(
                'tab-item flex flex-col items-center gap-1.5 px-3 py-2',
                'transition-colors duration-[var(--duration-fast)]',
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-neutral-400)]'
              )}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={clsx('transition-all duration-[var(--duration-fast)]', isActive && 'scale-110')}
                aria-hidden="true"
              />
              <span className="text-caption">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Professional Referral Banner Component
function ProfessionalReferralBanner() {
  const { state } = useAppContext();
  
  if (!state.trainingLevel || state.trainingLevel.status !== 'referral_pending') {
    return null;
  }

  return (
    <div className="mx-[var(--space-page)] mt-6 animate-slide-down" role="alert">
      <div className="p-5 bg-[var(--color-distress-subtle)] border border-[var(--color-distress-muted)] rounded-xl">
        <div className="flex items-start gap-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--color-distress)] flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-body font-medium text-[var(--color-neutral-900)]">
              Consider professional support
            </p>
            <p className="text-body-sm text-[var(--color-neutral-700)] mt-1.5">
              Based on recent sessions, a veterinary behaviorist or certified separation anxiety trainer could help.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button variant="primary" size="sm" onClick={() => window.location.href = '/settings?tab=professional'}>
            Find a professional
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {}}>
            Learn why
          </Button>
        </div>
      </div>
    </div>
  );
}