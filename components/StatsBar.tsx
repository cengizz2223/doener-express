'use client';

import { useState, useEffect } from 'react';
import { OrderStats } from '@/types';

const DEFAULT_STATS: OrderStats = {
  open: 0,
  inProgress: 0,
  done: 0,
  totalRevenue: 0,
  avgProcessingTime: 0,
};

export default function StatsBar() {
  const [stats, setStats] = useState<OrderStats>(DEFAULT_STATS);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // Stille Fehlerbehandlung
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: 'Offen',
      value: stats.open,
      icon: '🆕',
      color: 'text-blue-400',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-500',
    },
    {
      label: 'In Arbeit',
      value: stats.inProgress,
      icon: '🔄',
      color: 'text-orange-400',
      ring: 'ring-orange-500/20',
      dot: 'bg-orange-500',
    },
    {
      label: 'Fertig / Abgeholt',
      value: stats.done,
      icon: '✅',
      color: 'text-green-400',
      ring: 'ring-green-500/20',
      dot: 'bg-green-500',
    },
    {
      label: 'Umsatz heute',
      value: `${stats.totalRevenue.toFixed(2)} €`,
      icon: '💰',
      color: 'text-yellow-400',
      ring: 'ring-yellow-500/20',
      dot: 'bg-yellow-500',
    },
    {
      label: 'Ø Bearbeitung',
      value: `${stats.avgProcessingTime} min`,
      icon: '⏱️',
      color: 'text-purple-400',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-500',
    },
  ];

  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-2.5 bg-zinc-800/60 ring-1 ${card.ring} rounded-xl px-3 py-2.5`}
          >
            <span className="text-lg leading-none">{card.icon}</span>
            <div className="min-w-0">
              <div className={`text-lg font-bold leading-none ${card.color}`}>
                {card.value}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5 leading-none truncate">
                {card.label}
              </div>
            </div>
            {typeof card.value === 'number' && card.value > 0 && (
              <div className={`w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0 ${card.dot} animate-pulse`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
