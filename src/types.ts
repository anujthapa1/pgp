export type OrderStatus = 'unassigned' | 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface ProofOfDelivery {
  signature?: string; // Base64 string or URL
  photo?: string; // Base64 string or URL
  timestamp: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  items: string;
  status: OrderStatus;
  createdAt: string;
  driverId?: string;
  pod?: ProofOfDelivery;
}

export interface Driver {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  currentOrderId?: string;
}

export interface StoreState {
  orders: Order[];
  drivers: Driver[];
}
