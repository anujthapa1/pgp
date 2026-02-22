import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, User, OrderStatus, ProofOfDelivery, ChatMessage, DriverLocation } from '../types';

interface StoreContextType {
  orders: Order[];
  drivers: User[];
  dispatchers: User[];
  currentUser: User | null;
  messages: ChatMessage[];
  driverLocations: Record<string, DriverLocation>;
  login: (userId: string, role: 'dispatcher' | 'driver') => boolean;
  logout: () => void;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, pod?: ProofOfDelivery) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  sendMessage: (receiverId: string, text: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'pg_suppliers_data';

// Seed 15 Drivers
const INITIAL_DRIVERS: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: `DRV-${100 + i}`,
  name: `Driver ${i + 1}`,
  role: 'driver',
  password: 'password'
}));

// Seed 5 Dispatchers
const INITIAL_DISPATCHERS: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: `DISP-${100 + i}`,
  name: `Staff ${i + 1}`,
  role: 'dispatcher',
  password: 'password'
}));

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [driverLocations, setDriverLocations] = useState<Record<string, DriverLocation>>({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setOrders(data.orders || []);
        setMessages(data.messages || []);
        setCurrentUser(data.currentUser || null);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ orders, messages, currentUser }));
  }, [orders, messages, currentUser]);

  // Simulated Driver Movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocations(prev => {
        const next = { ...prev };
        INITIAL_DRIVERS.forEach(d => {
          if (!next[d.id]) {
            next[d.id] = { lat: 27.7172, lng: 85.3240, bearing: 0 }; // Kathmandu
          } else {
            next[d.id] = {
              lat: next[d.id].lat + (Math.random() - 0.5) * 0.001,
              lng: next[d.id].lng + (Math.random() - 0.5) * 0.001,
              bearing: Math.random() * 360
            };
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const login = (userId: string, role: 'dispatcher' | 'driver') => {
    const account = (role === 'dispatcher' ? INITIAL_DISPATCHERS : INITIAL_DRIVERS).find(u => u.id === userId);
    if (account) {
      setCurrentUser(account);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addOrder = (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'unassigned',
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, pod?: ProofOfDelivery) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, pod: pod || ord.pod } : ord))
    );

    // Simulate Notification
    if (status === 'out_for_delivery') {
      console.log(`[SIMULATED NOTIFICATION] To customer of ${orderId}: Your driver is on the way! Track here: http://localhost:5173/track/${orderId}`);
    } else if (status === 'delivered') {
      console.log(`[SIMULATED NOTIFICATION] To customer of ${orderId}: Order delivered!`);
    }
  };

  const assignDriver = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, driverId, status: 'assigned' } : ord))
    );
  };

  const sendMessage = (receiverId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <StoreContext.Provider value={{
      orders,
      drivers: INITIAL_DRIVERS,
      dispatchers: INITIAL_DISPATCHERS,
      currentUser,
      messages,
      driverLocations,
      login,
      logout,
      addOrder,
      updateOrderStatus,
      assignDriver,
      sendMessage
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
