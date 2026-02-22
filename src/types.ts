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

export type UserRole = 'dispatcher' | 'driver';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // For simulation
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  bearing: number;
}

export interface StoreState {
  orders: Order[];
  drivers: User[];
  dispatchers: User[];
  currentUser: User | null;
  messages: ChatMessage[];
  driverLocations: Record<string, DriverLocation>;
}
