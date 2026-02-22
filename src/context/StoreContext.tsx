import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Driver, OrderStatus, ProofOfDelivery } from '../types';

interface StoreContextType {
  orders: Order[];
  drivers: Driver[];
  addOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, pod?: ProofOfDelivery) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  addDriver: (name: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'shipflow_data';

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'John Doe', status: 'active' },
  { id: 'd2', name: 'Jane Smith', status: 'active' },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { orders: savedOrders, drivers: savedDrivers } = JSON.parse(saved);
      setOrders(savedOrders);
      setDrivers(savedDrivers || INITIAL_DRIVERS);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ orders, drivers }));
  }, [orders, drivers]);

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
  };

  const assignDriver = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, driverId, status: 'assigned' } : ord))
    );
  };

  const addDriver = (name: string) => {
    const newDriver: Driver = {
      id: `DRV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      name,
      status: 'active',
    };
    setDrivers((prev) => [...prev, newDriver]);
  };

  return (
    <StoreContext.Provider value={{ orders, drivers, addOrder, updateOrderStatus, assignDriver, addDriver }}>
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
