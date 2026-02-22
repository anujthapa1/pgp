import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { MapPin, Package, Truck, CheckCircle, ChevronLeft, Phone, User, Star, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '../constants/company';

const CustomerTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, drivers, driverLocations, submitFeedback } = useStore();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const order = orders.find(o => o.id === orderId);
  const driver = drivers.find(d => d.id === order?.driverId);
  const location = driver ? driverLocations[driver.id] : null;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!order?.feedback) return;
    setRating(order.feedback.rating);
    setComment(order.feedback.comment || '');
    setFeedbackSubmitted(true);
  }, [order?.feedback]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-primary-500">
          <Truck size={48} />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Order Not Found</h2>
        <p className="text-gray-500 mb-8 text-center">We couldn't find an order with ID: <span className="font-mono text-gray-900">{orderId}</span></p>
        <Link to="/" className="text-primary-600 font-bold flex items-center">
          <ChevronLeft className="mr-1" /> Back to Home
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 'unassigned', label: 'Order Received', icon: Package },
    { id: 'assigned', label: 'Processing', icon: User },
    { id: 'picked_up', label: 'Picked Up', icon: Truck },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto shadow-2xl">
      {/* Header */}
      <div className="bg-gray-900 text-white p-6 rounded-b-3xl shadow-xl z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-primary-400 text-[10px] font-black tracking-widest uppercase">Live Tracking</p>
            <h1 className="text-2xl font-black tracking-tighter">{COMPANY_NAME}</h1>
          </div>
          <div className="bg-gray-800 px-3 py-1 rounded-full text-[10px] font-mono font-bold">
            {order.id}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-8 pb-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary-500 -translate-y-1/2 rounded-full transition-all duration-1000"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between relative">
            {steps.map((step, idx) => {
              const active = idx <= currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-500 ${active ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/50' : 'bg-gray-800 text-gray-500'}`}>
                    <step.icon size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm font-bold text-primary-400 uppercase tracking-tight">
            {steps[currentStepIndex]?.label}
          </p>
        </div>
      </div>

      {/* Map Simulation */}
      <div className="flex-1 relative bg-gray-200 overflow-hidden min-h-[300px]">
        {/* Placeholder Map Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Route Line Simulation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d="M 50 300 Q 150 150 350 100"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeDasharray="10 5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />
        </svg>

        {/* Customer Location */}
        <div className="absolute top-[100px] left-[350px] -translate-x-1/2 -translate-y-1/2 text-primary-600">
          <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-primary-500">
            <Package size={24} />
          </div>
          <div className="w-4 h-1 bg-black/10 mx-auto rounded-full mt-1" />
        </div>

        {/* Driver Location */}
        <AnimatePresence>
          {location && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute"
              style={{
                left: `${(location.lng - 85.3) * 10000 % 400}px`,
                top: `${(location.lat - 27.7) * 10000 % 400}px`
              }}
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-primary-500/30 rounded-full"
                />
                <div className="bg-primary-600 p-3 rounded-full shadow-2xl text-white relative z-10 rotate-[var(--bearing)]" style={{ '--bearing': `${location.bearing}deg` } as any}>
                  <Truck size={24} />
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-md shadow-lg border border-gray-100 whitespace-nowrap">
                  <p className="text-[10px] font-black text-gray-900">{driver?.name}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Driver Info Card */}
      <AnimatePresence>
        {driver && order.status !== 'delivered' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="p-6 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-primary-100">
                  <User className="text-gray-400" size={32} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{driver.name}</h3>
                  <p className="text-gray-400 text-sm font-bold flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-1" /> Certified Courier
                  </p>
                </div>
              </div>
              <a href={`tel:${order.phone}`} className="bg-primary-500 p-4 rounded-2xl text-white shadow-lg shadow-primary-200 hover:bg-primary-600 transition">
                <Phone size={24} />
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                <p className="text-xl font-black text-gray-900">15 - 20 MINS</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                <p className="text-xl font-black text-gray-900">2.4 KM</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="bg-white p-6 border-t border-gray-100">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery To</p>
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.address}</p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
              <p className="text-sm text-gray-900 italic">{order.items}</p>
            </div>
            <p className="text-[10px] font-mono text-gray-300">EST 1998 - {COMPANY_NAME}</p>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Support</p>
            <div className="space-y-1">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-gray-500 flex items-center font-semibold hover:text-primary-600">
                <Mail size={12} className="mr-2" /> {SUPPORT_EMAIL}
              </a>
              <a href={`tel:${SUPPORT_PHONE}`} className="text-xs text-gray-500 flex items-center font-semibold hover:text-primary-600">
                <Phone size={12} className="mr-2" /> {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </div>
      </div>

      {order.status === 'delivered' && (
        <div className="bg-white p-6 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instant Feedback</p>
          {feedbackSubmitted ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="font-black text-green-700">Thanks for your feedback!</p>
              <div className="flex items-center mt-2">
                {Array.from({ length: 5 }, (_, idx) => (
                  <Star key={idx} size={16} className={idx < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                ))}
              </div>
              {comment && <p className="text-sm text-green-700/80 mt-2">{comment}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRating(idx + 1)}
                    className="p-1"
                  >
                    <Star size={20} className={idx < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us how your delivery experience was."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary-500"
                rows={2}
              />
              <button
                onClick={() => {
                  if (!rating) return;
                  submitFeedback(order.id, rating, comment);
                  setFeedbackSubmitted(true);
                }}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold disabled:bg-gray-300"
                disabled={!rating}
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerTracking;
