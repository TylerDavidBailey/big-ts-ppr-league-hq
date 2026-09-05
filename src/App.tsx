import { AppRoutes } from './app/router';
import { SiteFooter } from './components/SiteFooter';

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppRoutes />
      <SiteFooter />
    </div>
  );
}
