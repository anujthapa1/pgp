import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, LogOut, Menu, X, MessageSquare, PieChart } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = currentUser?.role === 'dispatcher' ? [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Reports', href: '/reports', icon: PieChart },
  ] : currentUser?.role === 'driver' ? [
    { name: 'My Tasks', href: '/', icon: Truck },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
  ] : [
    { name: 'Login', href: '/login', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      {currentUser && (
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 text-white">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <h1 className="text-xl font-black tracking-tighter text-white">
                PABITRA GANESH <span className="text-primary-400">SUPPLIERS</span>
              </h1>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gray-800 text-primary-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                      'group flex items-center px-3 py-3 text-sm font-bold rounded-xl transition-all'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-300',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center space-x-3 mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{currentUser.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-lg font-black tracking-tighter">
          PG <span className="text-primary-400">SUPPLIERS</span>
        </h1>
        {currentUser && (
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && currentUser && (
        <div className="md:hidden fixed inset-0 z-30 bg-gray-900 pt-20 px-4">
          <nav className="space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center p-4 text-xl font-bold text-white border-b border-gray-800"
              >
                <item.icon className="mr-4 h-6 w-6 text-primary-400" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-4 text-xl font-bold text-red-400"
            >
              <LogOut className="mr-4 h-6 w-6" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      <main className={cn("flex-1", currentUser && "md:ml-64")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
