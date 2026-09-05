import { AppRoutes } from './app/router';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <AppRoutes />
      <SiteFooter />
    </div>
  );
}
