
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Homepage from './Homepage';
import { SearchProvider } from '@/contexts/SearchContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

const LazyHomepage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <SettingsProvider>
        <SearchProvider>
          <Homepage />
        </SearchProvider>
      </SettingsProvider>
    </Suspense>
  );
};

export default LazyHomepage;
