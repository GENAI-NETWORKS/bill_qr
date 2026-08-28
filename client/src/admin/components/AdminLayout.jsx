import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/AuthContext';
import {
  QrCode, LayoutDashboard, Package, ShoppingCart, Users,
  LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default false on mobile, we can let CSS handle desktop state naturally

  return (
    <div className="admin-layout flex h-screen overflow-hidden relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 flex-shrink-0 fixed md:relative z-50 h-full ${sidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full md:translate-x-0 md:w-[72px]'}`}
        style={{
          background: '#141622',
          borderRight: '1px solid #2a2d45',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid #2a2d45' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 gradient-primary">
            <QrCode size={18} color="white" />
          </div>
          {(sidebarOpen || window.innerWidth > 768) && (
            <span className={`text-white font-bold text-lg ${!sidebarOpen ? 'md:hidden' : ''}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
              BillQR
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }>
              <Icon size={19} className="flex-shrink-0" />
              <span className={!sidebarOpen ? 'md:hidden' : ''}>{label}</span>
              {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-30" />}
            </NavLink>
          ))}
        </nav>

        {/* Admin info */}
        <div className="p-3" style={{ borderTop: '1px solid #2a2d45' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)' }}>
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className={`flex-1 min-w-0 ${!sidebarOpen ? 'md:hidden' : ''}`}>
              <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs truncate" style={{ color: '#64748b' }}>{admin?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Top bar */}
        <header className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 flex-shrink-0"
          style={{ background: '#141622', borderBottom: '1px solid #2a2d45' }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg"
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1" />

          <button className="p-2 rounded-xl" style={{ background: '#1c1f31', color: '#64748b', border: '1px solid #2a2d45', cursor: 'pointer' }}>
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl" style={{ background: '#1c1f31', border: '1px solid #2a2d45' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)' }}>
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium hidden md:block" style={{ color: '#e2e8f0' }}>{admin?.name || 'Admin'}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col" style={{ background: '#0d0f1a' }}>
          <div className="flex-1">
            <Outlet />
          </div>
          
          <div className="mt-auto pt-10 text-center">
            <a href="https://genaitechnology.in/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
              Powered by Gen-AI Tech | IT Solutions Salem
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
