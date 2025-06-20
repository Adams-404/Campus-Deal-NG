
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const Settings = lazy(() => import('../pages/Settings'));

const LazySettings = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Settings />
    </Suspense>
  );
};

export default LazySettings;
