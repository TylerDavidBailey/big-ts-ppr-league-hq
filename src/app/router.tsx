import { Navigate, Route, Routes } from 'react-router-dom';

import { LandingPage } from '@/features/landing/LandingPage';
import { SeasonPage } from '@/features/season/SeasonPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/l/:leagueId" element={<SeasonPage />} />
      <Route path="/l/:leagueId/:tab" element={<SeasonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
