import { Order, CreateOrderDto, UpdateOrderDto, OrderStats, ItemAssignment, EmployeeData } from '@/types';

const PRICES: Record<string, number> = {
  'Döner': 7.50, 'Dürüm': 8.00, 'Lahmacun': 5.50,
  'Pommes': 3.50, 'Cola': 2.50, 'Ayran': 2.00,
};

const COLOR_PALETTE = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7',
  '#ec4899', '#eab308', '#06b6d4', '#f43f5e',
  '#84cc16', '#14b8a6', '#fb923c', '#818cf8',
];

const DEFAULT_EMPLOYEES: EmployeeData[] = [
  { name: 'Ali',    color: '#f97316' },
  { name: 'Mehmet', color: '#3b82f6' },
  { name: 'Yusuf',  color: '#22c55e' },
];

// ── In-Memory Fallback (lokale Entwicklung) ──
declare global {
  // eslint-disable-next-line no-var
  var __doenerStore: { orders: Order[]; counter: number; employees: EmployeeData[] } | undefined;
}

function getMemStore() {
  if (!global.__doenerStore) {
    global.__doenerStore = { orders: [], counter: 0, employees: [...DEFAULT_EMPLOYEES] };
  }
  return global.__doenerStore;
}

// Prüfen ob Vercel KV verfügbar ist
const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ── KV-Hilfsfunktionen ──
async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const { kv } = await import('@vercel/kv');
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value);
  } catch (e) {
    console.error('KV set error:', e);
  }
}

// ── Bestellungen ──
export async function getAllOrders(): Promise<Order[]> {
  if (USE_KV) {
    return (await kvGet<Order[]>('doener:orders')) ?? [];
  }
  return [...getMemStore().orders];
}

export async function createOrder(data: CreateOrderDto): Promise<Order> {
  let orders: Order[];
  let counter: number;

  if (USE_KV) {
    orders  = (await kvGet<Order[]>('doener:orders')) ?? [];
    counter = (await kvGet<number>('doener:counter')) ?? 0;
  } else {
    const mem = getMemStore();
    orders  = mem.orders;
    counter = mem.counter;
  }

  counter++;

  let price = 0;
  for (const item of data.items) price += (PRICES[item.product] || 0) * item.quantity;
  if (data.extras.includes('Extra Fleisch')) price += 2.00;

  const itemAssignments: ItemAssignment[] = [];
  let idx = 0;
  for (const item of data.items) {
    for (let i = 0; i < item.quantity; i++) {
      itemAssignments.push({
        itemIndex: idx++,
        product: item.product,
        assignedTo: null,
        ingredients: item.ingredients ?? [],
      });
    }
  }

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: counter,
    customerName: data.customerName?.trim() ?? '',
    items: data.items,
    extras: data.extras,
    priority: data.priority,
    notes: data.notes?.trim() ?? '',
    status: 'neu',
    itemAssignments,
    createdAt: new Date().toISOString(),
    completedAt: null,
    price: Math.round(price * 100) / 100,
  };

  const newOrders = [order, ...orders];

  if (USE_KV) {
    await kvSet('doener:orders', newOrders);
    await kvSet('doener:counter', counter);
  } else {
    const mem = getMemStore();
    mem.orders  = newOrders;
    mem.counter = counter;
  }

  return order;
}

export async function updateOrder(id: string, updates: UpdateOrderDto): Promise<Order | null> {
  let orders: Order[];

  if (USE_KV) {
    orders = (await kvGet<Order[]>('doener:orders')) ?? [];
  } else {
    orders = getMemStore().orders;
  }

  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = orders[index];
  let updated: Order = { ...current };

  if (updates.status !== undefined) {
    updated.status = updates.status;
    if (updates.status === 'fertig' && !current.completedAt) {
      updated.completedAt = new Date().toISOString();
    }
  }

  if (updates.itemAssignment !== undefined) {
    const { itemIndex, assignedTo } = updates.itemAssignment;
    updated.itemAssignments = current.itemAssignments.map((ia) =>
      ia.itemIndex === itemIndex ? { ...ia, assignedTo } : ia
    );
  }

  const newOrders = [...orders];
  newOrders[index] = updated;

  if (USE_KV) {
    await kvSet('doener:orders', newOrders);
  } else {
    getMemStore().orders = newOrders;
  }

  return updated;
}

export async function getStats(): Promise<OrderStats> {
  const orders = await getAllOrders();
  const today      = new Date().toDateString();
  const open       = orders.filter((o) => o.status === 'neu').length;
  const inProgress = orders.filter((o) => o.status === 'in-arbeit').length;
  const done       = orders.filter((o) => o.status === 'fertig' || o.status === 'abgeholt').length;
  const todayDone  = orders.filter((o) => new Date(o.createdAt).toDateString() === today && o.status === 'abgeholt');
  const totalRevenue = todayDone.reduce((s, o) => s + o.price, 0);
  const withTime   = orders.filter((o) => o.completedAt && new Date(o.createdAt).toDateString() === today);
  const avgProcessingTime = withTime.length > 0
    ? withTime.reduce((s, o) => s + (new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime()) / 60000, 0) / withTime.length
    : 0;
  return {
    open, inProgress, done,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    avgProcessingTime: Math.round(avgProcessingTime),
  };
}

// ── Reset (täglich 03:30) ──
export async function resetStore(): Promise<void> {
  if (USE_KV) {
    await kvSet('doener:orders', []);
    await kvSet('doener:counter', 0);
    // Mitarbeiter behalten
  } else {
    const mem = getMemStore();
    mem.orders  = [];
    mem.counter = 0;
  }
}

// ── Mitarbeiter ──
export async function getAllEmployees(): Promise<EmployeeData[]> {
  if (USE_KV) {
    return (await kvGet<EmployeeData[]>('doener:employees')) ?? [...DEFAULT_EMPLOYEES];
  }
  return [...getMemStore().employees];
}

export async function addEmployee(name: string): Promise<EmployeeData | null> {
  let employees: EmployeeData[];

  if (USE_KV) {
    employees = (await kvGet<EmployeeData[]>('doener:employees')) ?? [...DEFAULT_EMPLOYEES];
  } else {
    employees = getMemStore().employees;
  }

  const trimmed = name.trim();
  if (!trimmed) return null;
  if (employees.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return null;

  const usedColors = new Set(employees.map((e) => e.color));
  const color = COLOR_PALETTE.find((c) => !usedColors.has(c)) ?? COLOR_PALETTE[employees.length % COLOR_PALETTE.length];

  const emp: EmployeeData = { name: trimmed, color };
  const newEmployees = [...employees, emp];

  if (USE_KV) {
    await kvSet('doener:employees', newEmployees);
  } else {
    getMemStore().employees = newEmployees;
  }

  return emp;
}

export async function removeEmployee(name: string): Promise<boolean> {
  let employees: EmployeeData[];

  if (USE_KV) {
    employees = (await kvGet<EmployeeData[]>('doener:employees')) ?? [...DEFAULT_EMPLOYEES];
  } else {
    employees = getMemStore().employees;
  }

  const before = employees.length;
  const newEmployees = employees.filter((e) => e.name !== name);

  if (newEmployees.length === before) return false;

  if (USE_KV) {
    await kvSet('doener:employees', newEmployees);
  } else {
    getMemStore().employees = newEmployees;
  }

  return true;
}
