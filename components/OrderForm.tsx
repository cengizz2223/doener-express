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

type QuantityMap   = Record<ProductName, number>;
type IngredientsMap = Record<ProductName, Ingredient[]>;

const EMPTY_QTY: QuantityMap = { 'Döner': 0, 'Dürüm': 0, 'Lahmacun': 0, 'Pommes': 0, 'Cola': 0, 'Ayran': 0 };

function defaultIngredients(): IngredientsMap {
  return Object.fromEntries(PRODUCTS.map((p) => [p.name, [...(PRODUCT_INGREDIENTS[p.name] ?? [])]])) as IngredientsMap;
}

export default function OrderForm() {
  const [quantities,   setQuantities]   = useState<QuantityMap>({ ...EMPTY_QTY });
  const [ingredients,  setIngredients]  = useState<IngredientsMap>(defaultIngredients());
  const [extras,       setExtras]       = useState<ExtraName[]>([]);
  const [priority,     setPriority]     = useState<Priority>('normal');
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState('');

  const adjustQty = (p: ProductName, d: number) =>
    setQuantities((prev) => ({ ...prev, [p]: Math.max(0, prev[p] + d) }));

  const toggleExtra = (e: ExtraName) =>
    setExtras((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const toggleIngredient = (p: ProductName, ing: Ingredient) =>
    setIngredients((prev) => {
      const cur = prev[p];
      return { ...prev, [p]: cur.includes(ing) ? cur.filter((i) => i !== ing) : [...cur, ing] };
    });

  const selectAll  = (p: ProductName) => setIngredients((prev) => ({ ...prev, [p]: [...PRODUCT_INGREDIENTS[p]] }));
  const selectNone = (p: ProductName) => setIngredients((prev) => ({ ...prev, [p]: [] }));

  const total    = PRODUCTS.reduce((s, p) => s + p.price * quantities[p.name], 0) + (extras.includes('Extra Fleisch') ? 2 : 0);
  const hasItems = PRODUCTS.some((p) => quantities[p.name] > 0);

  const activeWithIng = PRODUCTS.filter((p) => quantities[p.name] > 0 && PRODUCT_INGREDIENTS[p.name].length > 0);

  const resetForm = () => {
    setQuantities({ ...EMPTY_QTY });
    setIngredients(defaultIngredients());
    setExtras([]);
    setPriority('normal');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!hasItems) { setError('Bitte mindestens ein Produkt auswählen.'); return; }

    const items: OrderItem[] = PRODUCTS.filter((p) => quantities[p.name] > 0).map((p) => ({
      product: p.name, quantity: quantities[p.name], ingredients: ingredients[p.name] ?? [],
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
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-sm">📝</span>
          Neue Bestellung
        </h2>
        {hasItems && <button type="button" onClick={resetForm} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Zurücksetzen</button>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Produkte ── */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Produkte</label>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS.map((product) => {
              const qty = quantities[product.name];
              const active = qty > 0;
              return (
                <div key={product.name}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 border transition-all ${active ? 'bg-orange-500/5 border-orange-500/40' : 'bg-zinc-800/60 border-zinc-700/60'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">{product.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{product.name}</div>
                      <div className="text-xs text-zinc-500">{product.price.toFixed(2)} €</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => adjustQty(product.name, -1)} disabled={qty === 0}
                      className="w-6 h-6 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 rounded-lg text-white font-bold flex items-center justify-center text-sm transition-colors">−</button>
                    <span className={`w-5 text-center text-sm font-bold tabular-nums ${active ? 'text-orange-400' : 'text-zinc-600'}`}>{qty}</span>
                    <button type="button" onClick={() => adjustQty(product.name, 1)}
                      className="w-6 h-6 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold flex items-center justify-center text-sm transition-colors">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zutaten pro aktivem Gericht ── */}
        {activeWithIng.length > 0 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Zutaten pro Gericht</label>
            {activeWithIng.map((product) => {
              const available  = PRODUCT_INGREDIENTS[product.name];
              const selected   = ingredients[product.name];
              const allChosen  = selected.length === available.length;
              const noneChosen = selected.length === 0;
              return (
                <div key={product.name} className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-700/40 bg-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span>{product.emoji}</span>
                      <span className="text-sm font-bold text-white">{product.name}</span>
                      <span className="text-xs text-zinc-500">({quantities[product.name]}×)</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${allChosen ? 'bg-green-600/20 text-green-400' : noneChosen ? 'bg-red-900/30 text-red-400' : 'bg-orange-600/20 text-orange-400'}`}>
                        {allChosen ? '✓ Alles' : noneChosen ? 'Nichts' : `${selected.length}/${available.length}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => selectAll(product.name)}
                        className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${allChosen ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}>
                        Alles
                      </button>
                      <button type="button" onClick={() => selectNone(product.name)}
                        className="text-xs px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-all">
                        Nichts
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-wrap gap-1.5">
                    {available.map((ing) => {
                      const on = selected.includes(ing);
                      return (
                        <button key={ing} type="button" onClick={() => toggleIngredient(product.name, ing)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border font-medium transition-all select-none ${on ? 'bg-orange-600/15 border-orange-500/50 text-orange-300' : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400'}`}>
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
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${active ? 'bg-orange-500/10 border-orange-500/50 text-orange-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-600'}`}>
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
              className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${priority === 'normal' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600'}`}>
              Normal
            </button>
            <button type="button" onClick={() => setPriority('schnell')}
              className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${priority === 'schnell' ? 'bg-orange-500/15 border-orange-500/60 text-orange-400' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600'}`}>
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
            <div className="text-right text-xs text-zinc-600 max-w-[50%]">
              {PRODUCTS.filter((p) => quantities[p.name] > 0).map((p) => `${quantities[p.name]}× ${p.name}`).join(', ')}
            </div>
          </div>
        )}

        {error   && <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 text-red-400 rounded-xl px-4 py-3 text-sm"><span>⚠️</span> {error}</div>}
        {success && <div className="flex items-center gap-2 bg-green-950/40 border border-green-800/40 text-green-400 rounded-xl px-4 py-3 text-sm"><span>✅</span> Bestellung aufgegeben!</div>}

        <button type="submit" disabled={loading || !hasItems}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border disabled:border-zinc-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
          {loading
            ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Wird gesendet...</span>
            : 'Bestellung absenden →'}
        </button>
      </form>
    </div>
  );
}
