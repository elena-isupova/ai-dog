import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, BarChart2, Settings, Clock3 } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp as useAppContext } from '../context/AppContext';

const TABS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/history', label: 'History', icon: Clock3 },
  { path: '/progress', label: 'Progress', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppShell() {
  const location = useLocation();
  const isTraining = location.pathname.startsWith('/training');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Professional referral banner - shown conditionally via context */}
      <ProfessionalReferralBanner />

      {/* Main content */}
      <div className={clsx('flex-1', !isTraining && 'pt-2 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]')}>
        <Outlet />
      </div>

      {/* Tab Bar */}
      {!isTraining && (
        <nav className="tab-bar" aria-label="Main navigation">
          {TABS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => clsx(
                'tab-item flex flex-col items-center gap-1.5 px-3 py-2',
                'transition-colors duration-[var(--duration-fast)]',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                  <span className="text-caption">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
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
      <div className="p-5 bg-[var(--distress-subtle)] border border-[var(--distress-muted)] rounded-xl">
        <div className="flex items-start gap-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--distress)] flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-body font-medium text-[var(--text-primary)]">
              Consider professional support
            </p>
            <p className="text-body-sm text-[var(--text-secondary)] mt-1.5">
              Based on recent sessions, a veterinary behaviorist or certified separation anxiety trainer could help.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <Link to="/settings?tab=professional" className="inline-flex h-[42px] items-center rounded-[var(--radius-md)] border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 text-body-sm font-medium text-[var(--text-inverse)]">
            Find a professional
          </Link>
        </div>
      </div>
    </div>
  );
}
