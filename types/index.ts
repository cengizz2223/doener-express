export type ProductName = 'Döner' | 'Dürüm' | 'Lahmacun' | 'Pommes' | 'Cola' | 'Ayran';
export type ExtraName = 'Scharf' | 'Ohne Zwiebeln' | 'Extra Fleisch' | 'Extra Soße';
export type OrderStatus = 'neu' | 'in-arbeit' | 'fertig' | 'abgeholt';
export type Priority = 'normal' | 'schnell';

// Mitarbeiter ist jetzt ein freier String (dynamisch hinzufügbar)
export type Employee = string;

// Mitarbeiterdaten mit Farbe
export interface EmployeeData {
  name: string;
  color: string;
}

export type Ingredient =
  | 'Tomate' | 'Salat' | 'Gurke' | 'Zwiebeln' | 'Rotkohl' | 'Weißkohl'
  | 'Peperoni' | 'Knoblauchsoße' | 'Scharfe Soße' | 'Joghurtsoße'
  | 'Zitrone' | 'Petersilie' | 'Ketchup' | 'Mayonnaise' | 'Curry' | 'Salz';

export const PRODUCT_INGREDIENTS: Record<ProductName, Ingredient[]> = {
  Döner:    ['Tomate', 'Salat', 'Gurke', 'Zwiebeln', 'Rotkohl', 'Weißkohl', 'Peperoni', 'Knoblauchsoße', 'Scharfe Soße', 'Joghurtsoße'],
  Dürüm:   ['Tomate', 'Salat', 'Gurke', 'Zwiebeln', 'Rotkohl', 'Weißkohl', 'Peperoni', 'Knoblauchsoße', 'Scharfe Soße', 'Joghurtsoße'],
  Lahmacun: ['Tomate', 'Salat', 'Gurke', 'Zwiebeln', 'Peperoni', 'Zitrone', 'Petersilie'],
  Pommes:   ['Ketchup', 'Mayonnaise', 'Curry', 'Salz'],
  Cola:     [],
  Ayran:    [],
};

export interface OrderItem {
  product: ProductName;
  quantity: number;
  ingredients: Ingredient[];
}

export interface ItemAssignment {
  itemIndex: number;
  product: ProductName;
  assignedTo: Employee | null;
  ingredients: Ingredient[];
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  items: OrderItem[];
  extras: ExtraName[];
  priority: Priority;
  notes: string;
  status: OrderStatus;
  itemAssignments: ItemAssignment[];
  createdAt: string;
  completedAt: string | null;
  price: number;
}

export interface OrderStats {
  open: number;
  inProgress: number;
  done: number;
  totalRevenue: number;
  avgProcessingTime: number;
}

export interface CreateOrderDto {
  customerName?: string;
  items: OrderItem[];
  extras: ExtraName[];
  priority: Priority;
  notes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  itemAssignment?: {
    itemIndex: number;
    assignedTo: Employee | null;
  };
}
