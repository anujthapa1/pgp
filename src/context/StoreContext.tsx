import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ChatMessage,
  DriverLocation,
  NotificationChannel,
  NotificationEvent,
  NotificationLog,
  NotificationStatus,
  Order,
  OrderStatus,
  ProofOfDelivery,
  User,
} from '../types';
import { COMPANY_NAME } from '../constants/company';
import { getTrackingUrl } from '../lib/tracking';

interface StoreContextType {
  orders: Order[];
  drivers: User[];
  dispatchers: User[];
  currentUser: User | null;
  messages: ChatMessage[];
  notifications: NotificationLog[];
  driverLocations: Record<string, DriverLocation>;
  login: (userId: string, role: 'dispatcher' | 'driver') => boolean;
  logout: () => void;
  addOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt' | 'driverId' | 'pod' | 'feedback'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, pod?: ProofOfDelivery) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  sendMessage: (receiverId: string, text: string) => void;
  submitFeedback: (orderId: string, rating: number, comment?: string) => void;
}

type PersistedData = {
  orders?: Order[];
  messages?: ChatMessage[];
  currentUser?: User | null;
  notifications?: NotificationLog[];
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'pg_suppliers_data';
const AUTO_DISPATCH_ENABLED = true;
const NOTIFICATION_WEBHOOK_URL = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL as string | undefined;
const SLACK_WEBHOOK_PREFIX = 'https://hooks.slack.com/services/';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

const getLeastBusyDriverId = (currentOrders: Order[]) => {
  const activeStatuses: OrderStatus[] = ['unassigned', 'assigned', 'picked_up', 'out_for_delivery'];
  const loadByDriver: Record<string, number> = {};

  INITIAL_DRIVERS.forEach((driver) => {
    loadByDriver[driver.id] = 0;
  });

  currentOrders
    .filter((order) => order.driverId && activeStatuses.includes(order.status))
    .forEach((order) => {
      if (order.driverId) {
        loadByDriver[order.driverId] += 1;
      }
    });

  return INITIAL_DRIVERS.reduce((leastBusy, current) => {
    if (!leastBusy) return current.id;
    return loadByDriver[current.id] < loadByDriver[leastBusy] ? current.id : leastBusy;
  }, '');
};

const normalizeOrders = (rawOrders: Order[] | undefined) => {
  if (!rawOrders) return [];
  return rawOrders.map((order) => ({
    ...order,
    customerEmail: order.customerEmail || '',
  }));
};

const buildCustomerMessage = (event: NotificationEvent, order: Order) => {
  const trackingUrl = getTrackingUrl(order.id);
  if (event === 'tracking_started') {
    return `Your order ${order.id} is now out for delivery. Track live: ${trackingUrl}`;
  }
  return `Your order ${order.id} has been delivered by ${COMPANY_NAME}. Thank you for choosing us.`;
};

const buildCustomerSubject = (event: NotificationEvent, order: Order) => {
  if (event === 'tracking_started') return `${COMPANY_NAME}: Live tracking for ${order.id}`;
  return `${COMPANY_NAME}: Delivery confirmation for ${order.id}`;
};

const buildNotificationChannels = (order: Order): NotificationChannel[] => {
  const channels: NotificationChannel[] = ['sms', 'whatsapp'];
  if (order.customerEmail) channels.unshift('email');
  return channels;
};

const isNotificationStatus = (value: unknown): value is NotificationStatus =>
  value === 'sent' || value === 'queued' || value === 'failed' || value === 'skipped';

const sendIntegrationNotification = async (payload: {
  event: NotificationEvent;
  subject: string;
  message: string;
  orderId: string;
  trackingUrl: string;
  channels: NotificationChannel[];
  customer: { name: string; email: string; phone: string };
}) => {
  if (!NOTIFICATION_WEBHOOK_URL) {
    return {
      status: 'queued' as NotificationStatus,
      detail: 'Webhook not configured. Set VITE_NOTIFICATION_WEBHOOK_URL to deliver Email/SMS/WhatsApp.',
    };
  }

  try {
    const isSlackWebhook = NOTIFICATION_WEBHOOK_URL.startsWith(SLACK_WEBHOOK_PREFIX);
    const body = isSlackWebhook
      ? {
          text: `${payload.subject}\n${payload.message}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: payload.subject,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  `*Customer:* ${payload.customer.name}\n` +
                  `*Email:* ${payload.customer.email || 'N/A'}\n` +
                  `*Phone:* ${payload.customer.phone}\n` +
                  `*Order:* ${payload.orderId}\n` +
                  `*Event:* ${payload.event}\n` +
                  `*Channels:* ${payload.channels.join(', ')}\n` +
                  `*Tracking:* ${payload.trackingUrl}`,
              },
            },
          ],
        }
      : payload;

    const response = await fetch(NOTIFICATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        status: 'failed' as NotificationStatus,
        detail: `Webhook returned HTTP ${response.status}${errorBody ? `: ${errorBody}` : '.'}`,
      };
    }

    const responseBody = await response.text();
    if (isSlackWebhook) {
      return {
        status: 'sent' as NotificationStatus,
        detail: 'Notification posted to Slack webhook.',
      };
    }

    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody) as {
          status?: unknown;
          detail?: unknown;
        };

        if (isNotificationStatus(parsed.status)) {
          return {
            status: parsed.status,
            detail:
              typeof parsed.detail === 'string' && parsed.detail
                ? parsed.detail
                : 'Notification processed by webhook.',
          };
        }
      } catch {
        // Non-JSON response body is acceptable for generic webhooks.
      }
    }

    return {
      status: 'sent' as NotificationStatus,
      detail: 'Notification sent to configured integration webhook.',
    };
  } catch (error) {
    return {
      status: 'failed' as NotificationStatus,
      detail: error instanceof Error ? error.message : 'Unknown webhook error.',
    };
  }
};

// Seed 15 Drivers
const INITIAL_DRIVERS: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: `DRV-${100 + i}`,
  name: `Driver ${i + 1}`,
  role: 'driver',
  password: 'password',
}));

// Seed 5 Dispatchers
const INITIAL_DISPATCHERS: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: `DISP-${100 + i}`,
  name: `Staff ${i + 1}`,
  role: 'dispatcher',
  password: 'password',
}));

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [driverLocations, setDriverLocations] = useState<Record<string, DriverLocation>>({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved) as PersistedData;
      setOrders(normalizeOrders(data.orders));
      setMessages(data.messages || []);
      setCurrentUser(data.currentUser || null);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load state', error);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ orders, messages, currentUser, notifications })
    );
  }, [orders, messages, currentUser, notifications]);

  // Simulated Driver Movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocations((prev) => {
        const next = { ...prev };
        INITIAL_DRIVERS.forEach((driver) => {
          if (!next[driver.id]) {
            next[driver.id] = { lat: 27.7172, lng: 85.324, bearing: 0 };
          } else {
            next[driver.id] = {
              lat: next[driver.id].lat + (Math.random() - 0.5) * 0.001,
              lng: next[driver.id].lng + (Math.random() - 0.5) * 0.001,
              bearing: Math.random() * 360,
            };
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const notifyCustomer = async (order: Order, event: NotificationEvent) => {
    const trackingUrl = getTrackingUrl(order.id);
    const channels = buildNotificationChannels(order);
    const subject = buildCustomerSubject(event, order);
    const message = buildCustomerMessage(event, order);

    const result = await sendIntegrationNotification({
      event,
      subject,
      message,
      orderId: order.id,
      trackingUrl,
      channels,
      customer: {
        name: order.customerName,
        email: order.customerEmail || '',
        phone: order.phone,
      },
    });

    const detail = order.customerEmail
      ? result.detail
      : `${result.detail} Email was skipped because customer email is missing.`;

    setNotifications((prev) => [
      {
        id: generateId('NTF'),
        orderId: order.id,
        event,
        channels,
        status: result.status,
        detail,
        createdAt: new Date().toISOString(),
        customerName: order.customerName,
        customerEmail: order.customerEmail || undefined,
        customerPhone: order.phone,
      },
      ...prev,
    ]);

    console.log(`[CUSTOMER NOTIFICATION] ${subject} | ${message}`);
  };

  const login = (userId: string, role: 'dispatcher' | 'driver') => {
    const account = (role === 'dispatcher' ? INITIAL_DISPATCHERS : INITIAL_DRIVERS).find(
      (user) => user.id === userId
    );

    if (!account) return false;

    setCurrentUser(account);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addOrder = (orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'driverId' | 'pod' | 'feedback'>) => {
    setOrders((prev) => {
      const autoAssignedDriverId = AUTO_DISPATCH_ENABLED ? getLeastBusyDriverId(prev) : '';
      const newOrder: Order = {
        ...orderData,
        id: generateId('ORD'),
        createdAt: new Date().toISOString(),
        driverId: autoAssignedDriverId || undefined,
        status: autoAssignedDriverId ? 'assigned' : 'unassigned',
      };
      return [newOrder, ...prev];
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, pod?: ProofOfDelivery) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder) return;

    const updatedOrder: Order = { ...currentOrder, status, pod: pod || currentOrder.pod };

    setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));

    if (status === 'out_for_delivery') {
      void notifyCustomer(updatedOrder, 'tracking_started');
    }

    if (status === 'delivered') {
      void notifyCustomer(updatedOrder, 'delivery_confirmed');
    }
  };

  const assignDriver = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, driverId, status: 'assigned' } : order))
    );
  };

  const sendMessage = (receiverId: string, text: string) => {
    if (!currentUser) return;

    const newMessage: ChatMessage = {
      id: generateId('MSG'),
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const submitFeedback = (orderId: string, rating: number, comment?: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              feedback: {
                rating,
                comment: comment || undefined,
                submittedAt: new Date().toISOString(),
              },
            }
          : order
      )
    );
  };

  return (
    <StoreContext.Provider
      value={{
        orders,
        drivers: INITIAL_DRIVERS,
        dispatchers: INITIAL_DISPATCHERS,
        currentUser,
        messages,
        notifications,
        driverLocations,
        login,
        logout,
        addOrder,
        updateOrderStatus,
        assignDriver,
        sendMessage,
        submitFeedback,
      }}
    >
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
