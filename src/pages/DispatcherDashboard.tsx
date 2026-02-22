import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, User, Clock, MapPin, CheckCircle, Package } from 'lucide-react';
import OrderForm from '../components/OrderForm';
import DriverAssignment from '../components/DriverAssignment';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const DispatcherDashboard: React.FC = () => {
  const { orders, drivers } = useStore();
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispatcher Dashboard</h1>
          <p className="text-gray-500">Manage orders and dispatch drivers in real-time.</p>
        </div>
        <button
          onClick={() => setIsOrderFormOpen(true)}
          className="w-full sm:w-auto bg-primary-600 text-white flex items-center justify-center px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Order
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unassigned', value: orders.filter(o => o.status === 'unassigned').length, icon: Package, color: 'text-yellow-600' },
          { label: 'In Progress', value: orders.filter(o => ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status)).length, icon: Clock, color: 'text-blue-600' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Active Drivers', value: drivers.filter(d => d.status === 'active').length, icon: User, color: 'text-purple-600' },
        ].map((stat) => (
          <motion.div
            whileHover={{ scale: 1.02 }}
            key={stat.label}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center"
          >
            <div className={`p-3 rounded-lg bg-gray-50 ${stat.color} mr-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence mode='popLayout'>
                {orders.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="no-orders"
                  >
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No orders found. Create one to get started.</td>
                  </motion.tr>
                ) : (
                  orders.map((order) => {
                    const driver = drivers.find(d => d.id === order.driverId);
                    return (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={order.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">{order.customerName}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <MapPin className="h-3 w-3 mr-1" /> {order.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-primary-500" />
                              {driver.name}
                            </div>
                          ) : <span className="text-gray-400 italic">Not assigned</span>}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {order.status === 'unassigned' && (
                            <button
                              onClick={() => setAssigningOrderId(order.id)}
                              className="text-primary-600 hover:text-primary-900 bg-primary-50 px-3 py-1 rounded-md transition"
                            >
                              Assign
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="text-green-600 font-bold flex items-center justify-end">
                              <CheckCircle className="h-4 w-4 mr-1" /> Done
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isOrderFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <OrderForm onClose={() => setIsOrderFormOpen(false)} />
          </motion.div>
        )}
        {assigningOrderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DriverAssignment
              orderId={assigningOrderId}
              onClose={() => setAssigningOrderId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DispatcherDashboard;
