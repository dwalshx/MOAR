import { BrowserRouter, Routes, Route } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import HistoryPage from './pages/HistoryPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="workout/:id" element={<WorkoutPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<WorkoutDetailPage />} />
          <Route path="exercise/:name" element={<ExerciseDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
