import React, { useState } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODES = [
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'gigs', label: 'Gigs' },
];

function ModeSwitcherMobile() {
  const { currentMode, setCurrentMode } = useAppMode();
  const [open, setOpen] = useState(false);

  // Only show the other mode for now
  const availableModes = MODES.filter(m => m.key !== currentMode);

  return (
    <div className="relative mr-2">
      <button
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center border-2',
          'bg-primary/10 border-primary/20 hover:bg-primary/20',
          'transition-colors duration-150',
        )}
        aria-label="Switch mode"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4 text-primary" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-32 rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-primary/10 z-50">
          {availableModes.map((mode) => (
            <button
              key={mode.key}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-primary/10 dark:hover:bg-primary/20',
                'transition-colors duration-100',
              )}
              onClick={() => {
                setCurrentMode(mode.key as any);
                setOpen(false);
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModeSwitcherMobile;