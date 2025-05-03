
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Homepage from './Homepage';

const LazyHomepage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <Homepage />
    </Suspense>
  );
};

export default LazyHomepage;
