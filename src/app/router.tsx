import { Navigate, Route, Routes } from 'react-router-dom';

import { AllTimeRoute } from '@/features/allTime/AllTimeRoute';
import { LeaguePage } from '@/features/league/LeaguePage';
import { SeasonRoute } from '@/features/season/SeasonRoute';

/**
 * `/` is the newest season, so the link people share never goes stale. A year
 * reaches any season; `all-time` reads them all.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LeaguePage />}>
        <Route index element={<SeasonRoute tab="awards" />} />
        <Route path="all-time" element={<AllTimeRoute tab="standings" />} />
        <Route path="all-time/records" element={<AllTimeRoute tab="records" />} />
        <Route path=":season" element={<SeasonRoute tab="awards" />} />
        <Route path=":season/standings" element={<SeasonRoute tab="standings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
