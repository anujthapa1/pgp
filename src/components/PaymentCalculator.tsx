import React from 'react';
import { useStore } from '../context/StoreContext';
import { DollarSign, Award, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentCalculator: React.FC = () => {
  const { orders, drivers } = useStore();
  const RATE_PER_DELIVERY = 5.00;

  const driverStats = drivers.map(driver => {
    const completedCount = orders.filter(o => o.driverId === driver.id && o.status === 'delivered').length;
    const earnings = completedCount * RATE_PER_DELIVERY;
    return { ...driver, completedCount, earnings };
  }).sort((a, b) => b.earnings - a.earnings);

  const totalPayout = driverStats.reduce((acc, d) => acc + d.earnings, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl">
          <p className="text-primary-400 text-xs font-black uppercase tracking-widest mb-2">Total Payouts</p>
          <h2 className="text-4xl font-black tracking-tighter">${totalPayout.toFixed(2)}</h2>
          <div className="flex items-center text-green-400 text-xs font-bold mt-4">
            <ArrowUpRight size={14} className="mr-1" /> +12.5% from last month
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Avg per Driver</p>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">
            ${(totalPayout / drivers.length).toFixed(2)}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Standard Rate</p>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">${RATE_PER_DELIVERY.toFixed(2)}</h2>
          <p className="text-gray-400 text-[10px] mt-1 italic">Flat rate per successful POD</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">Driver Earning Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4 text-center">Deliveries</th>
                <th className="px-6 py-4 text-right">Total Earning</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {driverStats.map((d, idx) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 mr-3">
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{d.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">{d.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900">{d.completedCount}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-gray-900">${d.earnings.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {idx === 0 && d.earnings > 0 && (
                      <div className="inline-flex items-center text-primary-500 bg-primary-50 px-2 py-1 rounded text-[10px] font-black">
                        <Award size={12} className="mr-1" /> TOP PERFORMER
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalculator;
