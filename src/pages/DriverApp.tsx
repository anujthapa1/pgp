import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Truck, MapPin, Phone, Package, ChevronRight, CheckCircle2, LogOut, MessageSquare, Zap, Bell } from 'lucide-react';
import ProofOfDelivery from '../components/ProofOfDelivery';
import ChatSystem from '../components/ChatSystem';
import { Order, OrderStatus, ProofOfDelivery as PODType } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const DriverApp: React.FC = () => {
  const { orders, currentUser, logout, updateOrderStatus } = useStore();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isPodOpen, setIsPodOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [notification, setNotification] = useState<{ title: string, body: string } | null>(null);

  const driverOrders = useMemo(() => {
    let filtered = orders.filter(o => o.driverId === currentUser?.id && o.status !== 'delivered');
    if (optimizeRoute) {
      // Simulate route optimization by sorting orders (mock logic)
      return [...filtered].sort((a, b) => a.customerName.localeCompare(b.customerName));
    }
    return filtered;
  }, [orders, currentUser, optimizeRoute]);

  const completedOrders = orders.filter(o => o.driverId === currentUser?.id && o.status === 'delivered');

  const triggerNotification = (title: string, body: string) => {
    setNotification({ title, body });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus;
    switch (currentStatus) {
      case 'assigned':
        nextStatus = 'picked_up';
        triggerNotification("Order Picked Up", "Dispatcher has been notified.");
        break;
      case 'picked_up':
        nextStatus = 'out_for_delivery';
        triggerNotification("Live Track Shared", "Customer emailed tracking link: http://localhost:5173/track/" + orderId);
        break;
      case 'out_for_delivery':
        setActiveOrderId(orderId);
        setIsPodOpen(true);
        return;
      default: return;
    }
    updateOrderStatus(orderId, nextStatus);
  };

  const handlePodSave = (pod: PODType) => {
    if (activeOrderId) {
      updateOrderStatus(activeOrderId, 'delivered', pod);
      triggerNotification("Delivery Confirmed", "Confirmation sent via Email & SMS.");
      setIsPodOpen(false);
      setActiveOrderId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col relative">
      {/* App Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[100] bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-start space-x-3 border-l-4 border-primary-500"
          >
            <div className="bg-primary-500/20 p-2 rounded-lg text-primary-400">
              <Bell size={20} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-tight">{notification.title}</p>
              <p className="text-xs text-gray-400 leading-tight mt-1">{notification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-black text-gray-900 tracking-tight">{currentUser?.name}</h2>
            <div className="flex items-center text-[10px] text-green-500 font-black tracking-widest uppercase">
              <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Agent Online
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setShowChat(true)} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition relative">
            <MessageSquare size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-white" />
          </button>
           <button onClick={logout} className="p-3 bg-gray-50 text-red-500 rounded-xl hover:bg-red-50 transition">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Route Queue</h3>
          <button
            onClick={() => { setOptimizeRoute(!optimizeRoute); if(!optimizeRoute) triggerNotification("AI Optimized", "Route sorted by shortest path."); }}
            className={`flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight transition-all ${optimizeRoute ? 'bg-primary-500 text-white shadow-lg shadow-primary-100' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            <Zap size={10} className="mr-1.5" /> {optimizeRoute ? 'OPTIMIZED' : 'OPTIMIZE ROUTE'}
          </button>
        </div>

        <AnimatePresence mode='popLayout'>
          {driverOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-12 rounded-[40px] border-2 border-dashed border-gray-100 text-center space-y-4 shadow-sm"
            >
              <div className="bg-gray-50 inline-block p-6 rounded-full text-gray-200">
                <Truck size={48} />
              </div>
              <div>
                <p className="text-gray-900 font-black uppercase tracking-tight text-lg">Shift Complete</p>
                <p className="text-gray-400 text-sm font-medium">Wait for dispatcher assignment.</p>
              </div>
            </motion.div>
          ) : (
            driverOrders.map(order => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={order.id}
                className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        {optimizeRoute && <Zap size={14} className="text-yellow-500 animate-pulse" />}
                      </div>
                      <h4 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{order.customerName}</h4>
                    </div>
                    <span className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start">
                      <div className="bg-primary-50 p-2 rounded-lg mr-4 mt-0.5">
                        <MapPin className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="text-gray-600 font-bold text-lg leading-tight">{order.address}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-gray-50 p-2 rounded-lg mr-4">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <span className="text-gray-600 font-bold">{order.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-gray-50 p-2 rounded-lg mr-4">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <span className="text-gray-500 font-medium italic">{order.items}</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStatusUpdate(order.id, order.status)}
                    className="w-full mt-4 bg-primary-500 text-white py-5 rounded-[24px] font-black text-xl flex items-center justify-center hover:bg-primary-600 shadow-2xl shadow-primary-200 transition-all group"
                  >
                    {order.status === 'assigned' && 'Confirm Pickup'}
                    {order.status === 'picked_up' && 'Start Live Delivery'}
                    {order.status === 'out_for_delivery' && 'Complete POD'}
                    <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {completedOrders.length > 0 && (
        <div className="mt-10 space-y-4 mb-20">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Successful Drops</h3>
          <div className="space-y-3">
            {completedOrders.map(order => (
              <div key={order.id} className="bg-white/50 p-5 rounded-3xl flex items-center justify-between border border-gray-100 shadow-sm opacity-60">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-2xl mr-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 tracking-tight">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase">{order.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-green-600 uppercase">Success</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{order.pod?.timestamp ? format(new Date(order.pod.timestamp), 'HH:mm') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {isPodOpen && (
          <ProofOfDelivery
            onSave={handlePodSave}
            onCancel={() => setIsPodOpen(false)}
          />
        )}
        {showChat && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <ChatSystem onClose={() => setShowChat(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverApp;
