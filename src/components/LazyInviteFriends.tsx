
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const InviteFriends = lazy(() => import('../pages/InviteFriends'));

const LazyInviteFriends = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <InviteFriends />
    </Suspense>
  );
};

export default LazyInviteFriends;
