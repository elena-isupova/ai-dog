import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { OnboardingFlow } from './screens/onboarding';
import { HomeScreen } from './screens/HomeScreen';
import { TrainingScreen } from './screens/TrainingScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { HistoryScreen, SessionDetailScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AppShell } from './components/AppShell';

// Route guard for onboarding
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const onboardingComplete = state.dog !== null;

  // If onboarding not complete, redirect to onboarding
  if (!onboardingComplete && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding complete, redirect away from onboarding
  if (onboardingComplete && location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <OnboardingGuard>
      <Routes>
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="training/*" element={<TrainingScreen />} />
          <Route path="progress" element={<ProgressScreen />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="history/:sessionId" element={<SessionDetailScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </OnboardingGuard>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
