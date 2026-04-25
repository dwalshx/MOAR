import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider, useAuth } from './lib/auth';
import AppLayout from './components/layout/AppLayout';
import LoginScreen from './components/auth/LoginScreen';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import PRsPage from './pages/PRsPage';

function AuthGate() {
  const { user, loading, cloudEnabled } = useAuth();
  const [skippedLogin, setSkippedLogin] = useState(false);

  // If cloud isn't configured, just show the app (local-only mode)
  if (!cloudEnabled) return <AppRoutes />;

  // Still checking auth state
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-text-secondary text-sm">Loading...</div>
      </div>
    );
  }

  // Not signed in, show login (unless user chose to skip)
  if (!user && !skippedLogin) {
    return <LoginScreen onSkip={() => setSkippedLogin(true)} />;
  }

  return <AppRoutes />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="workout/:id" element={<WorkoutPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<WorkoutDetailPage />} />
          <Route path="exercise/:name" element={<ExerciseDetailPage />} />
          <Route path="prs" element={<PRsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
