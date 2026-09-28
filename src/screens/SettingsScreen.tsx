import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Calendar, Bell, Download, Trash2, AlertTriangle, Shield, HelpCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Button, Input, Toggle, SegmentedControl } from '../components/ui';
import { clsx, formatDuration } from '../utils/helpers';
import { TrainingSettings, TrainingWindow, EngineConfig, NotificationConfig, SchedulingConfig, DurationBand, BaselineOption } from '../types';
import { ProfileTab } from './SettingsProfileTab';
import { ScheduleTab } from './SettingsScheduleTab';
import { EngineTab } from './SettingsEngineTab';
import { NotificationsTab } from './SettingsNotificationsTab';
import { DataTab } from './SettingsDataTab';
import { ProfessionalTab } from './SettingsProfessionalTab';

type SettingsTab = 'profile' | 'schedule' | 'engine' | 'notifications' | 'data' | 'professional';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={20} strokeWidth={2} /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar size={20} strokeWidth={2} /> },
  { id: 'engine', label: 'Training', icon: <Shield size={20} strokeWidth={2} /> },
  { id: 'notifications', label: 'Reminders', icon: <Bell size={20} strokeWidth={2} /> },
  { id: 'data', label: 'Data', icon: <Download size={20} strokeWidth={2} /> },
  { id: 'professional', label: 'Professional', icon: <HelpCircle size={20} strokeWidth={2} /> },
];

export function SettingsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const { state, actions } = useApp();

  if (!state.dog || !state.settings) {
    return <LoadingState />;
  }

  const dog = state.dog;
  const settings = state.settings;

  return (
    <div className="pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] bg-[var(--bg)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-[var(--header-height)] bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--divider)]">
        <h1 className="text-h3 text-[var(--text-primary)]">Settings</h1>
      </header>

      <div className="container py-8 space-y-8">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 -mx-6 px-6" role="tablist">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setSearchParams({ tab: id })}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-body-sm font-medium whitespace-nowrap',
                'transition-all duration-[var(--duration-fast)]',
                tab === id
                  ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'profile' && <ProfileTab dog={dog} />}
        {tab === 'schedule' && <ScheduleTab settings={settings} actions={actions} />}
        {tab === 'engine' && <EngineTab settings={settings} actions={actions} />}
        {tab === 'notifications' && <NotificationsTab settings={settings} actions={actions} />}
        {tab === 'data' && <DataTab dog={dog} actions={actions} />}
        {tab === 'professional' && <ProfessionalTab settings={settings} actions={actions} />}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}