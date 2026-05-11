'use client';

import { useState } from 'react';
import { ProductName, ExtraName, Priority, OrderItem, Ingredient, PRODUCT_INGREDIENTS } from '@/types';

interface Product { name: ProductName; price: number; emoji: string; }

const PRODUCTS: Product[] = [
  { name: 'Döner',    price: 7.50, emoji: '🥙' },
  { name: 'Dürüm',   price: 8.00, emoji: '🌯' },
  { name: 'Lahmacun', price: 5.50, emoji: '🫓' },
  { name: 'Pommes',   price: 3.50, emoji: '🍟' },
  { name: 'Cola',     price: 2.50, emoji: '🥤' },
  { name: 'Ayran',    price: 2.00, emoji: '🥛' },
];

const EXTRAS: { name: ExtraName; extra?: string }[] = [
  { name: 'Scharf' },
  { name: 'Ohne Zwiebeln' },
  { name: 'Extra Fleisch', extra: '+2,00 €' },
  { name: 'Extra Soße' },
];

type QuantityMap = Record<ProductName, number>;

// Jeder einzelne Artikel hat seine eigenen Zutaten
interface ItemEntry {
  id: string;
  product: ProductName;
  ingredients: Ingredient[];
}

const EMPTY_QTY: QuantityMap = { 'Döner': 0, 'Dürüm': 0, 'Lahmacun': 0, 'Pommes': 0, 'Cola': 0, 'Ayran': 0 };

function newEntry(product: ProductName): ItemEntry {
  return {
    id: Math.random().toString(36).slice(2),
    product,
    ingredients: [...(PRODUCT_INGREDIENTS[product] ?? [])],
  };
}

export default function OrderForm() {
  const [quantities,  setQuantities]  = useState<QuantityMap>({ ...EMPTY_QTY });
  const [itemEntries, setItemEntries] = useState<ItemEntry[]>([]);
  const [extras,      setExtras]      = useState<ExtraName[]>([]);
  const [priority,    setPriority]    = useState<Priority>('normal');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');

  // Menge ändern → ItemEntry hinzufügen oder letzten entfernen
  const adjustQty = (p: ProductName, d: number) => {
    const newQty = Math.max(0, quantities[p] + d);
    if (newQty === quantities[p]) return;
    setQuantities((prev) => ({ ...prev, [p]: newQty }));

    if (d > 0) {
      setItemEntries((prev) => [...prev, newEntry(p)]);
    } else {
      // Letzten Eintrag dieses Produkts entfernen
      setItemEntries((prev) => {
        const reversedIdx = [...prev].reverse().findIndex((e) => e.product === p);
        if (reversedIdx === -1) return prev;
        const realIdx = prev.length - 1 - reversedIdx;
        return prev.filter((_, i) => i !== realIdx);
      });
    }
  };

  const toggleExtra = (e: ExtraName) =>
    setExtras((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  // Zutat für einen einzelnen Artikel umschalten
  const toggleIngredient = (entryId: string, ing: Ingredient) =>
    setItemEntries((prev) => prev.map((e) =>
      e.id !== entryId ? e : {
        ...e,
        ingredients: e.ingredients.includes(ing)
          ? e.ingredients.filter((i) => i !== ing)
          : [...e.ingredients, ing],
      }
    ));

  const selectAll  = (entryId: string, p: ProductName) =>
    setItemEntries((prev) => prev.map((e) => e.id !== entryId ? e : { ...e, ingredients: [...PRODUCT_INGREDIENTS[p]] }));

  const selectNone = (entryId: string) =>
    setItemEntries((prev) => prev.map((e) => e.id !== entryId ? e : { ...e, ingredients: [] }));

  const total    = itemEntries.reduce((s, e) => s + (PRODUCTS.find((p) => p.name === e.product)?.price ?? 0), 0)
                  + (extras.includes('Extra Fleisch') ? 2 : 0);
  const hasItems = itemEntries.length > 0;

  // Nur Einträge mit Zutaten-Auswahl anzeigen
  const entriesWithIng = itemEntries.filter((e) => PRODUCT_INGREDIENTS[e.product]?.length > 0);

  const resetForm = () => {
    setQuantities({ ...EMPTY_QTY });
    setItemEntries([]);
    setExtras([]);
    setPriority('normal');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!hasItems) { setError('Bitte mindestens ein Produkt auswählen.'); return; }

    // Jeden Artikel einzeln mit eigenen Zutaten senden (quantity=1)
    const items: OrderItem[] = itemEntries.map((entry) => ({
      product: entry.product,
      quantity: 1,
      ingredients: entry.ingredients,
    }));

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, extras, priority }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Fehler beim Erstellen der Bestellung.'); return; }
      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError('Verbindungsfehler.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-3 sm:p-4 pb-6 sm:pb-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-sm">📝</span>
          Neue Bestellung
        </h2>
        {hasItems && (
          <button type="button" onClick={resetForm}
            className="text-xs text-zinc-500 hover:text-zinc-300 active:text-zinc-200 transition-colors px-2 py-1">
            Zurücksetzen
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* ── Produkte ── */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Produkte</label>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS.map((product) => {
              const qty    = quantities[product.name];
              const active = qty > 0;
              return (
                <div key={product.name}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${active ? 'bg-orange-500/5 border-orange-500/40' : 'bg-zinc-800/60 border-zinc-700/60'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">{product.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{product.name}</div>
                      <div className="text-xs text-zinc-500">{product.price.toFixed(2)} €</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => adjustQty(product.name, -1)} disabled={qty === 0}
                      className="w-7 h-7 sm:w-6 sm:h-6 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 disabled:opacity-30 rounded-lg text-white font-bold flex items-center justify-center text-sm transition-colors touch-manipulation">
                      −
                    </button>
                    <span className={`w-5 text-center text-sm font-bold tabular-nums ${active ? 'text-orange-400' : 'text-zinc-600'}`}>{qty}</span>
                    <button type="button" onClick={() => adjustQty(product.name, 1)}
                      className="w-7 h-7 sm:w-6 sm:h-6 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 rounded-lg text-white font-bold flex items-center justify-center text-sm transition-colors touch-manipulation">
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zutaten pro einzelnem Artikel ── */}
        {entriesWithIng.length > 0 && (
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Zutaten — pro Stück einzeln
            </label>

            {entriesWithIng.map((entry) => {
              const available  = PRODUCT_INGREDIENTS[entry.product];
              const allChosen  = entry.ingredients.length === available.length;
              const noneChosen = entry.ingredients.length === 0;
              const emoji      = PRODUCTS.find((p) => p.name === entry.product)?.emoji ?? '';

              // Nummer dieses Artikels unter seinen Geschwistern berechnen
              const siblings  = itemEntries.filter((e) => e.product === entry.product);
              const itemNum   = siblings.findIndex((e) => e.id === entry.id) + 1;
              const showNum   = siblings.length > 1;

              return (
                <div key={entry.id} className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-700/40 bg-zinc-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{emoji}</span>
                      <span className="text-sm font-bold text-white">{entry.product}</span>
                      {showNum && (
                        <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full font-bold">
                          #{itemNum}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        allChosen  ? 'bg-green-600/20 text-green-400' :
                        noneChosen ? 'bg-red-900/30 text-red-400' :
                                     'bg-orange-600/20 text-orange-400'
                      }`}>
                        {allChosen ? '✓ Alles' : noneChosen ? 'Nichts' : `${entry.ingredients.length}/${available.length}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => selectAll(entry.id, entry.product)}
                        className={`text-xs px-2 py-1.5 rounded-lg font-semibold transition-all touch-manipulation ${
                          allChosen ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 active:bg-zinc-500'
                        }`}>
                        Alles
                      </button>
                      <button type="button" onClick={() => selectNone(entry.id)}
                        className="text-xs px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 active:text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600 transition-all touch-manipulation">
                        Nichts
                      </button>
                    </div>
                  </div>

                  {/* Zutaten-Pills */}
                  <div className="p-2.5 sm:p-3 flex flex-wrap gap-1.5 sm:gap-2">
                    {available.map((ing) => {
                      const on = entry.ingredients.includes(ing);
                      return (
                        <button key={ing} type="button" onClick={() => toggleIngredient(entry.id, ing)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-2 sm:py-1.5 rounded-full border font-medium transition-all select-none touch-manipulation ${
                            on ? 'bg-orange-600/15 border-orange-500/50 text-orange-300 active:bg-orange-600/25'
                               : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 active:bg-zinc-800'
                          }`}>
                          {on
                            ? <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <svg className="w-3 h-3 opacity-30" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                          }
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Extras ── */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Extras</label>
          <div className="grid grid-cols-2 gap-2">
            {EXTRAS.map(({ name, extra }) => {
              const active = extras.includes(name);
              return (
                <button key={name} type="button" onClick={() => toggleExtra(name)}
                  className={`flex items-center gap-2 px-3 py-3 sm:py-2.5 rounded-xl border text-sm font-medium text-left transition-all touch-manipulation ${active ? 'bg-orange-500/10 border-orange-500/50 text-orange-300 active:bg-orange-500/20' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600 active:bg-zinc-700/60'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'}`}>
                    {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="flex-1 text-xs">{name}</span>
                  {extra && <span className="text-xs text-orange-500 font-semibold">{extra}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Priorität ── */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Priorität</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPriority('normal')}
              className={`py-3 sm:py-2.5 rounded-xl border text-sm font-semibold transition-all touch-manipulation ${priority === 'normal' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600 active:bg-zinc-700/60'}`}>
              Normal
            </button>
            <button type="button" onClick={() => setPriority('schnell')}
              className={`py-3 sm:py-2.5 rounded-xl border text-sm font-semibold transition-all touch-manipulation ${priority === 'schnell' ? 'bg-orange-500/15 border-orange-500/60 text-orange-400' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600 active:bg-zinc-700/60'}`}>
              🔥 Schnell
            </button>
          </div>
        </div>

        {/* ── Gesamt ── */}
        {hasItems && (
          <div className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-zinc-500">Gesamt</div>
              <div className="text-2xl font-bold text-orange-400 tabular-nums">{total.toFixed(2)} €</div>
            </div>
            <div className="text-right text-xs text-zinc-600 max-w-[55%]">
              {PRODUCTS.filter((p) => quantities[p.name] > 0).map((p) => `${quantities[p.name]}× ${p.name}`).join(', ')}
            </div>
          </div>
        )}

        {error   && <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 text-red-400 rounded-xl px-4 py-3 text-sm"><span>⚠️</span> {error}</div>}
        {success && <div className="flex items-center gap-2 bg-green-950/40 border border-green-800/40 text-green-400 rounded-xl px-4 py-3 text-sm"><span>✅</span> Bestellung aufgegeben!</div>}

        <button type="submit" disabled={loading || !hasItems}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border disabled:border-zinc-700 text-white font-bold py-4 sm:py-3.5 rounded-xl text-sm transition-all touch-manipulation">
          {loading
            ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Wird gesendet...</span>
            : 'Bestellung absenden →'}
        </button>
      </form>
    </div>
  );
}
