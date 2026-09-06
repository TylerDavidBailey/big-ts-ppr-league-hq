import { Route, Routes } from 'react-router-dom';

import { AllTimeRoute } from '@/features/allTime/AllTimeRoute';
import { LeaguePage } from '@/features/league/LeaguePage';
import { SeasonRoute } from '@/features/season/SeasonRoute';
import { NotFound } from '@/features/shared/NotFound';

/**
 * `/` is the newest season, so the link people share never goes stale. A year
 * reaches any season, and each season has one route per section. `all-time`
 * reads every season at once. Anything else is a page that does not exist,
 * and says so, so a stale link is not mistaken for the current season.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LeaguePage />}>
        <Route index element={<SeasonRoute view="overview" />} />
        <Route path="all-time" element={<AllTimeRoute view="standings" />} />
        <Route path="all-time/champions" element={<AllTimeRoute view="champions" />} />
        <Route path="all-time/records" element={<AllTimeRoute view="records" />} />
        <Route path=":season" element={<SeasonRoute view="overview" />} />
        <Route path=":season/awards" element={<SeasonRoute view="awards" />} />
        <Route path=":season/beer-duty" element={<SeasonRoute view="beer-duty" />} />
        <Route path=":season/standings" element={<SeasonRoute view="standings" />} />
        <Route path=":season/stats" element={<SeasonRoute view="stats" />} />
        <Route path=":season/rules" element={<SeasonRoute view="rules" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
