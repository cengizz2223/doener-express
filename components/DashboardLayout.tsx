'use client';

import { useState } from 'react';
import Header from './Header';
import OrderForm from './OrderForm';
import KitchenMonitor from './KitchenMonitor';

export default function DashboardLayout() {
  const [tab, setTab] = useState<'bestellen' | 'kueche'>('bestellen');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <Header />

      {/* ── Desktop: zwei Panels nebeneinander ── */}
      <div className="mt-14 sm:mt-16 flex-1 overflow-hidden hidden lg:flex flex-row">
        <div className="w-[430px] xl:w-[490px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto">
          <OrderForm />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <KitchenMonitor />
        </div>
      </div>

      {/* ── Mobil/Tablet: Tab-Inhalt ── */}
      <div className="mt-14 sm:mt-16 flex-1 overflow-hidden flex flex-col lg:hidden pb-14">
        {tab === 'bestellen' ? (
          <div className="flex-1 overflow-y-auto">
            <OrderForm />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <KitchenMonitor />
          </div>
        )}
      </div>

      {/* ── Mobil Bottom-Navigation ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 flex h-14">
        <button
          onClick={() => setTab('bestellen')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
            tab === 'bestellen'
              ? 'text-orange-400 bg-orange-500/5'
              : 'text-zinc-500 active:text-zinc-300'
          }`}
        >
          {tab === 'bestellen' && (
            <span className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
          )}
          <span className="text-lg leading-none">📝</span>
          <span className="text-[11px] font-semibold">Bestellen</span>
        </button>

        <button
          onClick={() => setTab('kueche')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
            tab === 'kueche'
              ? 'text-orange-400 bg-orange-500/5'
              : 'text-zinc-500 active:text-zinc-300'
          }`}
        >
          {tab === 'kueche' && (
            <span className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
          )}
          <span className="text-lg leading-none">🍳</span>
          <span className="text-[11px] font-semibold">Küche</span>
        </button>
      </div>
    </div>
  );
}
