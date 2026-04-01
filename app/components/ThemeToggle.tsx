'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={!mounted}
      className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all duration-300 pointer-events-auto z-50 border border-slate-200 dark:border-zinc-800 ${!mounted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {mounted ? (
          <>
            <Sun className={`absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-500 ${resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            <Moon className={`absolute inset-0 h-5 w-5 text-blue-500 transition-all duration-500 ${resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
          </>
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        )}
      </div>
    </button>
  );
}
