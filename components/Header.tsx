'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl sm:text-2xl leading-none">🥙</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white leading-none whitespace-nowrap">Döner Express</div>
          <div className="text-xs text-zinc-500 mt-0.5 leading-none hidden sm:block">Bestellsystem</div>
        </div>
      </div>

      {/* Live-Indikator */}
      <div className="hidden sm:flex flex-1 justify-center">
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
            Live-System
          </span>
        </div>
      </div>

      {/* Rechts: Uhr + Abmelden */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Uhr: Immer sichtbar, Datum nur ab md */}
        <div className="text-right">
          <div className="text-xs sm:text-sm font-mono font-bold text-orange-400 leading-none">
            {time}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 leading-none hidden md:block">{date}</div>
        </div>

        {/* Abmelden-Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-1.5 bg-zinc-800 hover:bg-red-900/40 border border-zinc-700 hover:border-red-700/50 text-zinc-400 hover:text-red-400 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </div>
    </header>
  );
}
