import { Order, CreateOrderDto, UpdateOrderDto, OrderStats, ItemAssignment, EmployeeData } from '@/types';

const PRICES: Record<string, number> = {
  'Döner': 7.50, 'Dürüm': 8.00, 'Lahmacun': 5.50,
  'Pommes': 3.50, 'Cola': 2.50, 'Ayran': 2.00,
};

// Farbpalette für neue Mitarbeiter
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

declare global {
  // eslint-disable-next-line no-var
  var __doenerStore: {
    orders: Order[];
    counter: number;
    employees: EmployeeData[];
  } | undefined;
}

function getStore() {
  if (!global.__doenerStore) {
    global.__doenerStore = { orders: [], counter: 0, employees: [...DEFAULT_EMPLOYEES] };
  }
  return global.__doenerStore;
}

// ── Bestellungen ──
export function getAllOrders(): Order[] {
  return [...getStore().orders];
}

export function createOrder(data: CreateOrderDto): Order {
  const store = getStore();
  store.counter++;

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
    orderNumber: store.counter,
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

  store.orders.unshift(order);
  return order;
}

export function updateOrder(id: string, updates: UpdateOrderDto): Order | null {
  const store = getStore();
  const index = store.orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = store.orders[index];
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

  store.orders[index] = updated;
  return updated;
}

export function getStats(): OrderStats {
  const store = getStore();
  const today = new Date().toDateString();
  const open       = store.orders.filter((o) => o.status === 'neu').length;
  const inProgress = store.orders.filter((o) => o.status === 'in-arbeit').length;
  const done       = store.orders.filter((o) => o.status === 'fertig' || o.status === 'abgeholt').length;
  const todayDone  = store.orders.filter((o) => new Date(o.createdAt).toDateString() === today && o.status === 'abgeholt');
  const totalRevenue = todayDone.reduce((s, o) => s + o.price, 0);
  const withTime   = store.orders.filter((o) => o.completedAt && new Date(o.createdAt).toDateString() === today);
  const avgProcessingTime = withTime.length > 0
    ? withTime.reduce((s, o) => s + (new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime()) / 60000, 0) / withTime.length
    : 0;
  return { open, inProgress, done, totalRevenue: Math.round(totalRevenue * 100) / 100, avgProcessingTime: Math.round(avgProcessingTime) };
}

// ── Mitarbeiter ──
export function getAllEmployees(): EmployeeData[] {
  return [...getStore().employees];
}

export function addEmployee(name: string): EmployeeData | null {
  const store = getStore();
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (store.employees.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return null;

  const usedColors = new Set(store.employees.map((e) => e.color));
  const color = COLOR_PALETTE.find((c) => !usedColors.has(c)) ?? COLOR_PALETTE[store.employees.length % COLOR_PALETTE.length];

  const emp: EmployeeData = { name: trimmed, color };
  store.employees.push(emp);
  return emp;
}

export function removeEmployee(name: string): boolean {
  const store = getStore();
  const before = store.employees.length;
  store.employees = store.employees.filter((e) => e.name !== name);
  return store.employees.length < before;
}
