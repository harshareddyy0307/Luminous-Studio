import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Services from './pages/Services';
import Cart from './pages/Cart';
import Booking from './pages/Booking';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import PortfolioManager from './pages/admin/PortfolioManager';
import ServiceManager from './pages/admin/ServiceManager';
import BookingManager from './pages/admin/BookingManager';
import AccountSettings from './pages/admin/AccountSettings';
import AnalyticsView from './pages/admin/AnalyticsView';
import CustomerManager from './pages/admin/CustomerManager';
import BusinessManager from './pages/admin/BusinessManager';
import ClientPortal from './pages/ClientPortal';
import InteractiveTools from './pages/InteractiveTools';
import Blog from './pages/Blog';
import WhatsAppWidget from './components/WhatsAppWidget';
import Chatbot from './components/Chatbot';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
    <WhatsAppWidget />
    <Chatbot />
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/portfolio" element={<PublicLayout><Portfolio /></PublicLayout>} />
            <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
            <Route path="/tools" element={<PublicLayout><InteractiveTools /></PublicLayout>} />
            <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
            <Route path="/portal" element={<PublicLayout><ClientPortal /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
            <Route path="/booking" element={<PublicLayout><Booking /></PublicLayout>} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="operations" element={<CustomerManager />} />
              <Route path="business" element={<BusinessManager />} />
              <Route path="portfolio" element={<PortfolioManager />} />
              <Route path="services" element={<ServiceManager />} />
              <Route path="bookings" element={<BookingManager />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            theme="dark"
            toastStyle={{ background: 'var(--charcoal-3)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--cream)' }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
