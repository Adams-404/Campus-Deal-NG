import React, { useState, useEffect, useRef } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ShoppingBag, Briefcase, Lock, Newspaper, BookOpen, Search, Home, CalendarDays } from 'lucide-react';

const MODES = [
  { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag, color: 'text-blue-500 bg-blue-100', available: true },
  { key: 'gigs', label: 'Gigs', icon: Briefcase, color: 'text-green-500 bg-green-100', available: true },
  { key: 'events', label: 'Events', icon: CalendarDays, color: 'text-yellow-500 bg-yellow-100', available: false },
  { key: 'news', label: 'News', icon: Newspaper, color: 'text-red-500 bg-red-100', available: false },
  { key: 'study', label: 'Study Resources', icon: BookOpen, color: 'text-indigo-500 bg-indigo-100', available: false },
  { key: 'lostfound', label: 'Lost & Found', icon: Search, color: 'text-orange-500 bg-orange-100', available: false },
  { key: 'accommodation', label: 'Accommodation', icon: Home, color: 'text-teal-500 bg-teal-100', available: false },
];

function ModeSwitcherMobile() {
  const { currentMode, setCurrentMode } = useAppMode();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div 
          ref={menuRef}
          className="absolute left-0 mt-2.5 w-64 p-2 bg-background/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-50"
          style={{
            '--tw-backdrop-blur': 'blur(16px)',
            '--tw-bg-opacity': '0.95',
          } as React.CSSProperties}
        >
          <div className="grid grid-cols-2 gap-2">
            {otherModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg',
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
                  <span className={cn('rounded-full p-2', mode.color)}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-medium text-center">
                    {mode.label}
                  </span>
                  {!mode.available && <Lock className="h-3 w-3 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeSwitcherMobile;