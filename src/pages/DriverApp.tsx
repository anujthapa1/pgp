import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Truck, MapPin, Phone, Package, ChevronRight, CheckCircle2, LogOut } from 'lucide-react';
import ProofOfDelivery from '../components/ProofOfDelivery';
import { Order, OrderStatus, ProofOfDelivery as PODType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const DriverApp: React.FC = () => {
  const { orders, drivers, updateOrderStatus } = useStore();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isPodOpen, setIsPodOpen] = useState(false);

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const driverOrders = orders.filter(o => o.driverId === selectedDriverId && o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.driverId === selectedDriverId && o.status === 'delivered');

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus;
    switch (currentStatus) {
      case 'assigned': nextStatus = 'picked_up'; break;
      case 'picked_up': nextStatus = 'out_for_delivery'; break;
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
      setIsPodOpen(false);
      setActiveOrderId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col">
      <AnimatePresence mode="wait">
        {!selectedDriverId ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center flex-1 space-y-8 py-12"
          >
            <div className="bg-primary-100 p-6 rounded-full">
              <Truck className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Driver Hub</h2>
              <p className="text-gray-500">Select your profile to start delivering</p>
            </div>
            <div className="grid gap-4 w-full px-4">
              {drivers.map(d => (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  key={d.id}
                  onClick={() => setSelectedDriverId(d.id)}
                  className="p-5 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-primary-500 hover:shadow-md transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">{d.id}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 pb-24"
          >
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedDriver?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedDriver?.name}</h2>
                  <div className="flex items-center text-xs text-green-500 font-bold">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    ONLINE
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverId(null)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Orders</h3>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {driverOrders.length}
                </span>
              </div>

              <AnimatePresence mode='popLayout'>
                {driverOrders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-100 text-center space-y-3"
                  >
                    <div className="bg-gray-50 inline-block p-4 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">All orders completed!</p>
                  </motion.div>
                ) : (
                  driverOrders.map(order => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={order.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden"
                    >
                      <div className="p-6 space-y-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">{order.customerName}</h4>
                          </div>
                          <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 mr-3 text-primary-500 shrink-0" />
                            <span className="text-gray-600 font-medium leading-tight">{order.address}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 mr-3 text-gray-400 shrink-0" />
                            <span className="text-gray-600 font-medium">{order.phone}</span>
                          </div>
                          <div className="flex items-start">
                            <Package className="h-5 w-5 mr-3 text-gray-400 shrink-0" />
                            <span className="text-gray-600 font-medium italic">{order.items}</span>
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleStatusUpdate(order.id, order.status)}
                          className="w-full mt-4 bg-primary-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all group"
                        >
                          {order.status === 'assigned' && 'Confirm Pickup'}
                          {order.status === 'picked_up' && 'Start Delivery'}
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
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Completed Today</h3>
                <div className="space-y-2">
                  {completedOrders.map(order => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={order.id}
                      className="bg-gray-50/50 p-4 rounded-2xl flex items-center justify-between border border-gray-100"
                    >
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{order.id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-green-600 uppercase">Delivered</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPodOpen && (
          <ProofOfDelivery
            onSave={handlePodSave}
            onCancel={() => setIsPodOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverApp;
