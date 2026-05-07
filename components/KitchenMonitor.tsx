'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus, Employee, EmployeeData } from '@/types';
import OrderCard from './OrderCard';
import WorkerAvatar from './WorkerAvatar';

type FilterValue = 'alle' | Exclude<OrderStatus, 'abgeholt'>;

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: 'alle',      label: 'Alle'       },
  { value: 'neu',       label: 'Neu'        },
  { value: 'in-arbeit', label: 'In Arbeit'  },
  { value: 'fertig',    label: 'Fertig'     },
];

function playNotificationSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx() as AudioContext;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.55);
  } catch { /* Audio braucht Benutzer-Interaktion */ }
}

export default function KitchenMonitor() {
  const [orders,          setOrders]          = useState<Order[]>([]);
  const [employees,       setEmployees]        = useState<EmployeeData[]>([]);
  const [filter,          setFilter]           = useState<FilterValue>('alle');
  const [search,          setSearch]           = useState('');
  const [draggingWorker,  setDraggingWorker]   = useState<Employee | null>(null);
  const [cardDraggingId,  setCardDraggingId]   = useState<string | null>(null);

  // Mitarbeiter hinzufügen UI
  const [addingEmp,       setAddingEmp]        = useState(false);
  const [newEmpName,      setNewEmpName]        = useState('');
  const [empError,        setEmpError]          = useState('');

  // Mobil: ausgewählter Mitarbeiter für Tippen-Zuweisung
  const [selectedWorker,  setSelectedWorker]   = useState<Employee | null>(null);

  const knownIds     = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);

  // ── Mitarbeiter laden ──
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch {}
  }, []);

  // ── Bestellungen laden (ohne abgeholt) ──
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json();
      const newOrders: Order[] = (data.orders ?? []).filter((o: Order) => o.status !== 'abgeholt');

      if (!isFirstFetch.current) {
        const hasNew = newOrders.some((o) => !knownIds.current.has(o.id));
        if (hasNew) playNotificationSound();
      }
      isFirstFetch.current = false;
      knownIds.current = new Set(newOrders.map((o) => o.id));
      setOrders(newOrders);
    } catch {}
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchEmployees, fetchOrders]);

  // ── Status ändern ──
  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: Order = await res.json();
        if (updated.status === 'abgeholt') {
          setOrders((prev) => prev.filter((o) => o.id !== id));
        } else {
          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        }
      }
    } catch {}
  };

  // ── Artikel zuweisen ──
  const handleItemAssign = async (orderId: string, itemIndex: number, worker: Employee | null) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemAssignment: { itemIndex, assignedTo: worker } }),
      });
      if (res.ok) {
        const updated: Order = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch {}
  };

  // ── Karten-Drag (Sortierung) ──
  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    setCardDraggingId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('cardId', id);
  };
  const handleCardDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('cardid')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  };
  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!cardDraggingId || cardDraggingId === targetId) { setCardDraggingId(null); return; }
    setOrders((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((o) => o.id === cardDraggingId);
      const to   = arr.findIndex((o) => o.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr;
    });
    setCardDraggingId(null);
  };

  // ── Mitarbeiter-Drag ──
  const handleWorkerDragStart = (e: React.DragEvent, worker: Employee) => {
    e.dataTransfer.setData('worker', worker); e.dataTransfer.effectAllowed = 'copy'; setDraggingWorker(worker);
  };
  const handleWorkerDragEnd = () => setDraggingWorker(null);

  // ── Mobil: Mitarbeiter antippen → auswählen ──
  const handleWorkerTap = (worker: Employee) => {
    setSelectedWorker((prev) => prev === worker ? null : worker);
  };

  // ── Mitarbeiter hinzufügen ──
  const handleAddEmployee = async () => {
    const name = newEmpName.trim();
    if (!name) return;
    setEmpError('');
    try {
      const res = await fetch('/api/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setEmpError(data.error ?? 'Fehler'); return; }
      setEmployees((prev) => [...prev, data]);
      setNewEmpName(''); setAddingEmp(false);
    } catch { setEmpError('Verbindungsfehler.'); }
  };

  // ── Mitarbeiter entfernen ──
  const handleRemoveEmployee = async (name: string) => {
    if (!confirm(`Mitarbeiter „${name}" wirklich entfernen?`)) return;
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.name !== name));
        if (selectedWorker === name) setSelectedWorker(null);
      }
    } catch {}
  };

  // ── Artikel-Zähler ──
  const getWorkerCount = (name: string) =>
    orders.filter((o) => o.status === 'neu' || o.status === 'in-arbeit')
      .reduce((t, o) => t + o.itemAssignments.filter((ia) => ia.assignedTo === name).length, 0);

  // ── Filter + Suche ──
  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'alle' || o.status === filter;
    const q = search.toLowerCase().trim();
    const matchSearch = !q
      || String(o.orderNumber).includes(q)
      || o.items.some((i) => i.product.toLowerCase().includes(q))
      || o.itemAssignments.some((ia) => (ia.assignedTo?.toLowerCase() ?? '').includes(q));
    return matchFilter && matchSearch;
  });

  const countBy = (v: FilterValue) => v === 'alle' ? orders.length : orders.filter((o) => o.status === v).length;

  return (
    <div className="flex flex-col h-full">

      {/* ══ MITARBEITER-PANEL ══ */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span className="hidden sm:inline">Mitarbeiter — auf Artikel ziehen</span>
            <span className="sm:hidden">Mitarbeiter antippen → zuweisen</span>
          </span>
          <button
            onClick={() => { setAddingEmp((v) => !v); setEmpError(''); setNewEmpName(''); }}
            className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap"
          >
            {addingEmp ? '✕' : '+ Mitarbeiter'}
          </button>
        </div>

        {/* Eingabe: Neuer Mitarbeiter */}
        {addingEmp && (
          <div className="mb-2.5 flex gap-2">
            <input
              autoFocus
              type="text"
              value={newEmpName}
              onChange={(e) => setNewEmpName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmployee(); if (e.key === 'Escape') setAddingEmp(false); }}
              placeholder="Name eingeben..."
              className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
            />
            <button onClick={handleAddEmployee}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              ✓
            </button>
            {empError && <span className="text-xs text-red-400 self-center">{empError}</span>}
          </div>
        )}

        {/* Mitarbeiter-Avatare: horizontal scrollbar auf Mobile */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-hide">
          {employees.map((emp) => {
            const count      = getWorkerCount(emp.name);
            const isDragging = draggingWorker === emp.name;
            const isSelected = selectedWorker === emp.name;
            return (
              <div key={emp.name} className="relative group flex-shrink-0">
                <div
                  draggable
                  onDragStart={(e) => handleWorkerDragStart(e, emp.name)}
                  onDragEnd={handleWorkerDragEnd}
                  onClick={() => handleWorkerTap(emp.name)}
                  className={`flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none transition-all ${isDragging ? 'opacity-40 scale-95' : 'hover:scale-105 active:scale-95'}`}
                >
                  <div
                    className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black text-white shadow-lg transition-all"
                    style={{
                      backgroundColor: emp.color,
                      boxShadow: isSelected
                        ? `0 0 0 3px white, 0 0 18px ${emp.color}80`
                        : `0 0 18px ${emp.color}50`,
                      outline: isSelected ? `3px solid ${emp.color}` : `3px solid ${emp.color}`,
                      outlineOffset: isSelected ? '4px' : '3px',
                    }}
                  >
                    {emp.name[0]?.toUpperCase()}
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 bg-white text-zinc-900 text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center px-1 shadow">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold leading-none" style={{ color: emp.color }}>{emp.name}</div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 leading-none">{count > 0 ? `${count}×` : 'frei'}</div>
                  </div>
                </div>

                {/* Entfernen-Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveEmployee(emp.name); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full text-white text-xs font-bold hidden group-hover:flex items-center justify-center shadow transition-all"
                  title={`${emp.name} entfernen`}
                >
                  ×
                </button>
              </div>
            );
          })}

          {employees.length === 0 && !addingEmp && (
            <span className="text-sm text-zinc-600 py-2">Noch keine Mitarbeiter — oben hinzufügen</span>
          )}
        </div>

        {/* Mobil: ausgewählter Mitarbeiter Hinweis */}
        {selectedWorker && (
          <div className="mt-2 sm:hidden flex items-center gap-2 text-xs font-semibold rounded-lg px-2.5 py-1.5 border"
            style={{
              color: employees.find((e) => e.name === selectedWorker)?.color ?? '#fff',
              borderColor: (employees.find((e) => e.name === selectedWorker)?.color ?? '#fff') + '40',
              backgroundColor: (employees.find((e) => e.name === selectedWorker)?.color ?? '#fff') + '10',
            }}>
            <span>👆</span>
            <span>{selectedWorker} ausgewählt — Artikel antippen zum Zuweisen</span>
            <button onClick={() => setSelectedWorker(null)} className="ml-auto text-sm opacity-60">✕</button>
          </div>
        )}

        {/* Desktop: Drag-Hinweis */}
        {draggingWorker && (
          <div className="hidden sm:block mt-1.5 text-sm font-semibold animate-pulse" style={{ color: employees.find((e) => e.name === draggingWorker)?.color ?? '#fff' }}>
            {draggingWorker} — auf Artikel fallen lassen!
          </div>
        )}
      </div>

      {/* ══ HEADER: Suche + Filter ══ */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-xs">🍳</span>
            Küchenmonitor
          </h2>
          <span className="text-xs text-zinc-600">{filtered.length} Bestellung{filtered.length !== 1 ? 'en' : ''}</span>
        </div>

        <div className="relative mb-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            placeholder="Nummer, Produkt, Mitarbeiter..." />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-base">×</button>}
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_TABS.map(({ value, label }) => (
            <button key={value} onClick={() => setFilter(value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === value ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 active:bg-zinc-600'}`}>
              {label} <span className={filter === value ? 'text-orange-200' : 'text-zinc-600'}>{countBy(value)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ BESTELLUNGEN ══ */}
      <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4 opacity-20">🥙</div>
            <p className="text-zinc-500 font-medium text-sm">
              {search || filter !== 'alle' ? 'Keine Bestellungen gefunden' : 'Noch keine Bestellungen'}
            </p>
            <p className="text-zinc-700 text-xs mt-1">
              {search || filter !== 'alle' ? 'Andere Filter versuchen' : 'Neue Bestellungen erscheinen automatisch'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 sm:gap-3">
            {filtered.map((order) => (
              <div key={order.id}
                onDragOver={handleCardDragOver}
                onDrop={(e) => handleCardDrop(e, order.id)}
                onDragEnd={() => setCardDraggingId(null)}
                className={`transition-all ${cardDraggingId === order.id ? 'opacity-40 scale-95' : ''}`}>
                <OrderCard
                  order={order}
                  employees={employees}
                  draggingWorker={draggingWorker}
                  selectedWorker={selectedWorker}
                  onSelectedWorkerAssign={(orderId, itemIndex) => {
                    if (selectedWorker) {
                      handleItemAssign(orderId, itemIndex, selectedWorker);
                    }
                  }}
                  onStatusChange={handleStatusChange}
                  onItemAssign={handleItemAssign}
                  draggable
                  onCardDragStart={handleCardDragStart}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
