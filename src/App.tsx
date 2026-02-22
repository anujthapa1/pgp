import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DispatcherDashboard from './pages/DispatcherDashboard';
import DriverApp from './pages/DriverApp';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DispatcherDashboard />} />
          <Route path="/driver" element={<DriverApp />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
