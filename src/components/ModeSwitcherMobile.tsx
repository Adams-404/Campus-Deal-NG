import React, { useState } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ShoppingBag, Briefcase, Lock } from 'lucide-react';

const MODES = [
  { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag, available: true },
  { key: 'gigs', label: 'Gigs', icon: Briefcase, available: true },
  { key: 'services', label: 'Services', icon: Briefcase, available: false },
  { key: 'events', label: 'Events', icon: Briefcase, available: false },
];

function ModeSwitcherMobile() {
  const { currentMode, setCurrentMode } = useAppMode();
  const [open, setOpen] = useState(false);

  // Show all modes, but lock unavailable ones
  const otherModes = MODES.filter(m => m.key !== currentMode);

  return (
    <div className="relative mr-2">
      <button
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center border-2',
          'bg-primary/10 border-primary/20 hover:bg-primary/20',
          'transition-colors duration-150',
        )}
        aria-label="Switch mode"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Show current mode icon */}
        {(() => {
          const mode = MODES.find(m => m.key === currentMode);
          if (!mode) return null;
          const Icon = mode.icon;
          return <Icon className="h-5 w-5 text-primary" />;
        })()}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-40 rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-primary/10 z-50">
          {otherModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg',
                  mode.available
                    ? 'hover:bg-primary/10 dark:hover:bg-primary/20 text-gray-900 dark:text-white'
                    : 'opacity-50 cursor-not-allowed text-gray-400',
                  'transition-colors duration-100',
                )}
                onClick={() => {
                  if (mode.available) {
                    setCurrentMode(mode.key as any);
                    setOpen(false);
                  }
                }}
                disabled={!mode.available}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
                {!mode.available && <Lock className="h-3 w-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModeSwitcherMobile;