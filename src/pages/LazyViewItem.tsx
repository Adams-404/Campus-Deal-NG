
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const ViewItemComponent = lazy(() => import('./ViewItem'));

const LazyViewItem = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ViewItemComponent />
    </Suspense>
  );
};

export default LazyViewItem;
