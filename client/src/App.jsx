import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './shared/AuthContext';

// Admin pages
import Login from './admin/pages/Login';
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Products from './admin/pages/Products';
import ProductForm from './admin/pages/ProductForm';
import Orders from './admin/pages/Orders';
import OrderDetail from './admin/pages/OrderDetail';

import Customers from './admin/pages/Customers';
import CustomerDetail from './admin/pages/CustomerDetail';

// Customer pages
import ScanLanding from './customer/pages/ScanLanding';
import Cart from './customer/pages/Cart';
import Invoice from './customer/pages/Invoice';
import Payment from './customer/pages/Payment';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f1a' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin-custom"
          style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return admin ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Customer (public) */}
      <Route path="/scan/:qr_token" element={<ScanLanding />} />
      <Route path="/scan" element={<ScanLanding />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/invoice/:order_id" element={<Invoice />} />
      <Route path="/payment/:order_id" element={<Payment />} />

      {/* Admin (protected) */}
      <Route path="/admin" element={
        <ProtectedRoute><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:phone" element={<CustomerDetail />} />
      </Route>

      {/* Root redirects */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0d0f1a', color: '#64748b' }}>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="mb-6">Page not found</p>
          <a href="/" style={{ color: '#6c63ff' }}>← Back to home</a>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1f31',
              color: '#e2e8f0',
              border: '1px solid #2a2d45',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#1c1f31' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1c1f31' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
