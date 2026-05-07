'use client';

import { useState } from 'react';
import { Order, OrderStatus, Employee, ItemAssignment, PRODUCT_INGREDIENTS, EmployeeData } from '@/types';
import WorkerAvatar from './WorkerAvatar';

const STATUS_CONFIG: Record<OrderStatus, { label: string; text: string; bg: string; border: string }> = {
  neu:       { label: 'Neu',       text: 'text-blue-400',   bg: 'bg-blue-600',   border: 'border-blue-600'   },
  'in-arbeit': { label: 'In Arbeit', text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500' },
  fertig:    { label: 'Fertig',    text: 'text-green-400',  bg: 'bg-green-600',  border: 'border-green-600'  },
  abgeholt:  { label: 'Abgeholt', text: 'text-zinc-500',   bg: 'bg-zinc-600',   border: 'border-zinc-600'   },
};

const ALL_STATUSES: OrderStatus[] = ['neu', 'in-arbeit', 'fertig', 'abgeholt'];

interface Props {
  order: Order;
  employees: EmployeeData[];
  draggingWorker: Employee | null;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onItemAssign: (orderId: string, itemIndex: number, worker: Employee | null) => void;
  draggable?: boolean;
  onCardDragStart?: (e: React.DragEvent, id: string) => void;
}

function getEmp(employees: EmployeeData[], name: string | null): EmployeeData | null {
  if (!name) return null;
  return employees.find((e) => e.name === name) ?? { name, color: '#6b7280' };
}

export default function OrderCard({ order, employees, draggingWorker, onStatusChange, onItemAssign, draggable, onCardDragStart }: Props) {
  const cfg     = STATUS_CONFIG[order.status];
  const timeStr = new Date(order.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const numStr  = String(order.orderNumber).padStart(3, '0');
  const isFertig = order.status === 'fertig';

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const handleItemDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setHoverIdx(idx); };
  const handleItemDrop     = (e: React.DragEvent, idx: number) => { e.preventDefault(); setHoverIdx(null); const w = e.dataTransfer.getData('worker'); if (w) onItemAssign(order.id, idx, w); };
  const handleDragLeave    = () => setHoverIdx(null);

  const handlePrint = () => {
    const lines = [
      '================================',
      '        DÖNER EXPRESS',
      '================================',
      `Bestellung #${numStr}   ${timeStr}`,
      `Priorität: ${order.priority === 'schnell' ? 'SCHNELL 🔥' : 'Normal'}`,
      '--------------------------------',
      ...order.itemAssignments.map((ia) => {
        const ings = ia.ingredients.length ? `\n     └ ${ia.ingredients.join(', ')}` : '';
        return `  1x ${ia.product}${ia.assignedTo ? ` → ${ia.assignedTo}` : ''}${ings}`;
      }),
      '',
      `Extras: ${order.extras.length > 0 ? order.extras.join(', ') : 'keine'}`,
      '--------------------------------',
      `Gesamt: ${order.price.toFixed(2)} EUR`,
      '================================',
    ].filter(Boolean).join('\n');

    const w = window.open('', '_blank', 'width=400,height=600');
    if (w) {
      w.document.write(`<html><head><title>Bon #${numStr}</title></head><body><pre style="font-family:monospace;font-size:14px;padding:20px;">${lines}</pre><script>window.onload=()=>{window.print();window.close();}</script></body></html>`);
      w.document.close();
    }
  };

  const assignedCount = order.itemAssignments.filter((ia) => ia.assignedTo).length;
  const totalItems    = order.itemAssignments.length;

  return (
    <div
      draggable={draggable}
      onDragStart={draggable && onCardDragStart ? (e) => onCardDragStart(e, order.id) : undefined}
      className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all duration-300 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isFertig
          ? 'border-green-500/70'
          : order.priority === 'schnell'
          ? 'border-orange-500/50'
          : 'border-zinc-800'
      }`}
      style={isFertig ? {
        boxShadow: '0 0 0 1px rgba(34,197,94,0.4), 0 0 20px rgba(34,197,94,0.25), 0 0 40px rgba(34,197,94,0.10)',
      } : order.priority === 'schnell' ? {
        boxShadow: '0 0 12px rgba(249,115,22,0.1)',
      } : undefined}
    >
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-3.5 py-2 border-b ${
        isFertig ? 'bg-green-950/20 border-green-900/30'
        : order.priority === 'schnell' ? 'bg-orange-950/20 border-orange-900/30'
        : 'bg-zinc-800/40 border-zinc-800'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {draggable && <span className="text-zinc-600 text-xs">⠿</span>}
          <span className="font-mono font-bold text-zinc-300 text-sm">#{numStr}</span>
          <span className="text-zinc-600 text-xs">{timeStr}</span>
          {order.priority === 'schnell' && (
            <span className="text-xs bg-orange-600/20 border border-orange-600/30 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold leading-none">
              🔥 Schnell
            </span>
          )}
          {isFertig && (
            <span className="text-xs bg-green-600/20 border border-green-600/30 text-green-400 px-1.5 py-0.5 rounded-full font-semibold leading-none animate-pulse">
              ✓ Fertig
            </span>
          )}
          <span className="text-xs text-zinc-600">{assignedCount}/{totalItems}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
          <button onClick={handlePrint} title="Bon drucken" className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-3.5 py-3 space-y-3">

        {/* Einzelne Artikel als Drop-Zonen */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Artikel — Mitarbeiter draufziehen
          </div>

          {order.itemAssignments.map((ia: ItemAssignment) => {
            const isHovered     = hoverIdx === ia.itemIndex && draggingWorker !== null;
            const previewEmp    = isHovered ? getEmp(employees, draggingWorker) : null;
            const assignedEmp   = getEmp(employees, ia.assignedTo);
            const displayEmp    = previewEmp ?? assignedEmp;

            const defaultIngs   = PRODUCT_INGREDIENTS[ia.product] ?? [];
            const selectedIngs  = ia.ingredients ?? [];
            const hasIngs       = defaultIngs.length > 0;
            const isKomplett    = hasIngs && selectedIngs.length === defaultIngs.length;
            const missingIngs   = defaultIngs.filter((i) => !selectedIngs.includes(i));

            return (
              <div
                key={ia.itemIndex}
                onDragOver={(e) => handleItemDragOver(e, ia.itemIndex)}
                onDrop={(e) => handleItemDrop(e, ia.itemIndex)}
                onDragLeave={handleDragLeave}
                className={`rounded-xl border transition-all ${
                  isHovered && displayEmp
                    ? 'border-2 bg-zinc-800/80'
                    : ia.assignedTo
                    ? 'border bg-zinc-800/30'
                    : 'border border-dashed border-zinc-700/40 bg-zinc-800/20'
                }`}
                style={
                  isHovered && displayEmp ? { borderColor: displayEmp.color + '80' }
                  : ia.assignedTo && assignedEmp ? { borderColor: assignedEmp.color + '40' }
                  : {}
                }
              >
                {/* Produkt + Mitarbeiter */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-zinc-100">{ia.product}</span>
                    {hasIngs && (
                      isKomplett
                        ? <span className="text-xs bg-green-600/15 border border-green-600/30 text-green-400 px-1.5 py-0.5 rounded-full font-semibold leading-none">✓ Komplett</span>
                        : selectedIngs.length === 0
                        ? <span className="text-xs bg-red-900/20 border border-red-800/30 text-red-400 px-1.5 py-0.5 rounded-full font-semibold leading-none">Keine Zutaten</span>
                        : <span className="text-xs bg-orange-600/10 border border-orange-600/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold leading-none">{selectedIngs.length}/{defaultIngs.length}</span>
                    )}
                    {isHovered && previewEmp && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: previewEmp.color + '20', color: previewEmp.color }}>
                        → {previewEmp.name}?
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {displayEmp ? (
                      <>
                        <WorkerAvatar name={displayEmp.name} color={displayEmp.color} size="sm" showName />
                        {ia.assignedTo && !isHovered && (
                          <button onClick={() => onItemAssign(order.id, ia.itemIndex, null)}
                            className="text-zinc-600 hover:text-red-400 transition-colors text-sm leading-none ml-0.5" title="Zuweisung entfernen">
                            ×
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-zinc-700 border border-dashed border-zinc-700 rounded-lg px-2 py-1 whitespace-nowrap">
                        Mitarbeiter ziehen
                      </span>
                    )}
                  </div>
                </div>

                {/* Zutaten-Anzeige */}
                {hasIngs && !isKomplett && selectedIngs.length > 0 && (
                  <div className="px-3 pb-2 pt-1 border-t border-zinc-700/30 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {selectedIngs.map((ing) => (
                        <span key={ing} className="text-xs bg-zinc-800 border border-zinc-700/60 text-zinc-300 px-2 py-0.5 rounded-full">{ing}</span>
                      ))}
                    </div>
                    {missingIngs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {missingIngs.map((ing) => (
                          <span key={ing} className="text-xs text-red-500/60 line-through px-1">{ing}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hasIngs && isKomplett && (
                  <div className="px-3 pb-2 pt-1 border-t border-zinc-700/30">
                    <div className="flex flex-wrap gap-1">
                      {selectedIngs.map((ing) => (
                        <span key={ing} className="text-xs bg-zinc-800/60 border border-zinc-700/40 text-zinc-500 px-2 py-0.5 rounded-full">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Extras */}
        {order.extras.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {order.extras.map((ex) => (
              <span key={ex} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{ex}</span>
            ))}
          </div>
        )}

        {/* Preis */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-orange-400 tabular-nums">{order.price.toFixed(2)} €</span>
          {order.completedAt && (
            <span className="text-xs text-zinc-600">
              Fertig: {new Date(order.completedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Status-Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {ALL_STATUSES.map((status) => {
            const s = STATUS_CONFIG[status];
            const isActive = order.status === status;
            return (
              <button key={status} onClick={() => onStatusChange(order.id, status)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive ? `${s.bg} ${s.border} text-white` : `bg-transparent border-zinc-700/60 ${s.text} hover:border-zinc-600`}`}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
