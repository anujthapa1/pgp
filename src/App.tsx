import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DispatcherDashboard from './pages/DispatcherDashboard';
import DriverApp from './pages/DriverApp';
import Login from './pages/Login';
import CustomerTracking from './pages/CustomerTracking';
import { useStore } from './context/StoreContext';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'dispatcher' | 'driver' }) {
  const { currentUser } = useStore();

  if (!currentUser) return <Navigate to="/login" />;
  if (role && currentUser.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
}

function App() {
  const { currentUser } = useStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/track/:orderId" element={<CustomerTracking />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              {currentUser?.role === 'dispatcher' ? <DispatcherDashboard /> : <DriverApp />}
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute role="dispatcher">
            <Layout>
              <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">Reports View (Coming Soon)</div>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">Real-time Chat Portal</div>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
