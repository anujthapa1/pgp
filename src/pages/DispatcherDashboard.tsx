import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { Plus, User, Clock, MapPin, CheckCircle, Package, MessageSquare, DollarSign, History, ChevronRight, Mail, Phone, Bell } from 'lucide-react';
import OrderForm from '../components/OrderForm';
import DriverAssignment from '../components/DriverAssignment';
import ChatSystem from '../components/ChatSystem';
import PaymentCalculator from '../components/PaymentCalculator';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const DispatcherDashboard: React.FC = () => {
  const { orders, drivers, notifications } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'chat' | 'history'>('orders');
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const webhookConfigured = Boolean(import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unassigned': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentOrders = orders.filter(o => o.status !== 'delivered');
  const historicalOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <p className="text-primary-500 font-black text-xs uppercase tracking-[0.2em] mb-2">Central Management</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Dispatcher Console</h1>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-auto">
          {[
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'chat', label: 'Comms', icon: MessageSquare },
            { id: 'payments', label: 'Payouts', icon: DollarSign },
            { id: 'history', label: 'Reports', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Unassigned', value: orders.filter(o => o.status === 'unassigned').length, icon: Package, color: 'text-yellow-600' },
                { label: 'In Transit', value: orders.filter(o => ['picked_up', 'out_for_delivery'].includes(o.status)).length, icon: Clock, color: 'text-orange-600' },
                { label: 'Today Success', value: historicalOrders.length, icon: CheckCircle, color: 'text-green-600' },
                { label: 'Total Drivers', value: drivers.length, icon: User, color: 'text-primary-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center group hover:border-primary-200 transition-colors">
                  <div className={`p-4 rounded-2xl bg-gray-50 ${stat.color} mr-4 group-hover:bg-primary-50 transition-colors`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Active Queue</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Standard auto-dispatch is enabled</p>
                </div>
                <button
                  onClick={() => setIsOrderFormOpen(true)}
                  className="bg-primary-500 text-white flex items-center px-5 py-2.5 rounded-xl hover:bg-primary-600 transition shadow-lg shadow-primary-200 font-black text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4">Order ID</th>
                      <th className="px-8 py-4">Recipient</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Assigned To</th>
                      <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">Queue is currently empty...</td>
                      </tr>
                    ) : (
                      currentOrders.map((order) => {
                        const driver = drivers.find(d => d.id === order.driverId);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-6 text-sm font-mono font-bold text-primary-600">{order.id}</td>
                            <td className="px-8 py-6">
                              <p className="font-black text-gray-900">{order.customerName}</p>
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <MapPin size={12} className="mr-1" /> {order.address}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <Mail size={12} className="mr-1" /> {order.customerEmail || 'No email on file'}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <Phone size={12} className="mr-1" /> {order.phone}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {driver ? (
                                <div className="flex items-center text-sm font-bold text-gray-700">
                                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mr-2 text-[10px]">
                                    {driver.name.charAt(0)}
                                  </div>
                                  {driver.name}
                                </div>
                              ) : <span className="text-xs text-gray-300 italic">Pending...</span>}
                            </td>
                            <td className="px-8 py-6 text-right">
                              {order.status === 'unassigned' ? (
                                <button
                                  onClick={() => setAssigningOrderId(order.id)}
                                  className="text-primary-600 bg-primary-50 px-4 py-2 rounded-xl text-xs font-black hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                                >
                                  Manual Assign
                                </button>
                              ) : (
                                <Link to={`/track/${order.id}`} target="_blank" className="text-gray-400 hover:text-primary-500 flex items-center justify-end text-xs font-bold">
                                  Track Live <ChevronRight size={14} className="ml-1" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChatSystem />
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PaymentCalculator />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex items-center">
              <History className="mr-2 text-primary-500" />
              <h3 className="text-xl font-black text-gray-900">Historical Delivery Report</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4">Order ID</th>
                      <th className="px-8 py-4">Recipient</th>
                      <th className="px-8 py-4">Delivery Proof</th>
                      <th className="px-8 py-4 text-right">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historicalOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold">No historical data available...</td>
                      </tr>
                    ) : (
                      historicalOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6 text-sm font-mono font-bold text-gray-400">{order.id}</td>
                          <td className="px-8 py-6">
                            <p className="font-bold text-gray-900">{order.customerName}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">DRIVER: {drivers.find(d => d.id === order.driverId)?.name}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-2">
                              {order.pod?.photo && <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200"><img src={order.pod.photo} className="w-full h-full object-cover" /></div>}
                              {order.pod?.signature && <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center p-1"><img src={order.pod.signature} className="max-w-full max-h-full opacity-50" /></div>}
                              {!order.pod && <span className="text-xs text-red-400 font-bold uppercase italic">Missing POD</span>}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right text-sm font-bold text-gray-500">
                            {order.pod?.timestamp ? format(new Date(order.pod.timestamp), 'MMM dd, HH:mm') : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>

            <div className="border-t border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center">
                  <Bell className="mr-2 text-primary-500" />
                  <h3 className="text-xl font-black text-gray-900">Notification History (Email/SMS/WhatsApp)</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  webhookConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {webhookConfigured ? 'Integration ready' : 'Webhook not set'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4">Time</th>
                      <th className="px-8 py-4">Order</th>
                      <th className="px-8 py-4">Channels</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold">No notification history yet...</td>
                      </tr>
                    ) : (
                      notifications.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-xs font-semibold text-gray-500">
                            {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-mono text-xs font-black text-gray-700">{entry.orderId}</p>
                            <p className="text-xs text-gray-400">{entry.customerName}</p>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-gray-600 uppercase">
                            {entry.channels.join(', ')}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${
                              entry.status === 'sent' ? 'bg-green-100 text-green-700' :
                              entry.status === 'queued' ? 'bg-yellow-100 text-yellow-700' :
                              entry.status === 'skipped' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs text-gray-500">{entry.detail}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderFormOpen && <OrderForm onClose={() => setIsOrderFormOpen(false)} />}
        {assigningOrderId && (
          <DriverAssignment
            orderId={assigningOrderId}
            onClose={() => setAssigningOrderId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DispatcherDashboard;
