import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Truck, Shield, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [role, setRole] = useState<'dispatcher' | 'driver'>('dispatcher');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const { login, dispatchers, drivers } = useStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(userId, role)) {
      navigate('/');
    } else {
      setError('Invalid ID for selected role');
    }
  };

  const availableAccounts = role === 'dispatcher' ? dispatchers : drivers;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-gray-900 p-8 text-center text-white">
          <div className="bg-primary-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/50">
            {role === 'dispatcher' ? <Shield size={32} /> : <Truck size={32} />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">PABITRA GANESH</h2>
          <p className="text-primary-400 font-bold text-sm tracking-widest uppercase mt-1">Suppliers Portal</p>
        </div>

        <div className="p-8">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => setRole('dispatcher')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'dispatcher' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dispatcher
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'driver' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Driver
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Account ID</label>
              <div className="relative">
                <select
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(''); }}
                  required
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 appearance-none focus:border-primary-500 transition-all outline-none font-medium"
                >
                  <option value="">Select your account...</option>
                  {availableAccounts.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <UserIcon size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="password"
                  disabled
                  className="w-full bg-gray-100 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-400 font-mono outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <Lock size={18} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 italic">* Password is preset to 'password' for demo</p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm font-bold text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98]"
            >
              Sign In to {role.toUpperCase()}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
