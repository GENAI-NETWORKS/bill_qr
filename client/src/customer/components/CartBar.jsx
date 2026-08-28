import { useCartStore } from '../../shared/cartStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';

export default function CartBar() {
  const { items } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // Don't show on cart/invoice/payment pages
  const hide = ['/cart', '/invoice', '/payment'].some(p => location.pathname.startsWith(p));
  if (hide || itemCount === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
      color: 'white', padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 40, boxShadow: '0 -4px 20px rgba(79,70,229,0.3)',
    }} id="cartBar">
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#f59e0b', color: '#1e293b' }}>
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        </div>
        <div>
          <p className="text-xs opacity-75">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          <p className="font-bold text-sm">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <button
        id="viewCartBtn"
        onClick={() => navigate('/cart')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm"
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>
        View Cart <ChevronRight size={16} />
      </button>
    </div>
  );
}
