import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../shared/cartStore';
import api from '../../shared/api';
import { Minus, Plus, Trash2, ShoppingBag, QrCode, Package, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import InAppScanner from '../components/InAppScanner';
import CustomerShell from '../components/CustomerShell';

export default function Cart() {
  const { items, updateQty, removeItem } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      });
      navigate(`/invoice/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order';
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  const handleScanResult = (url) => {
    setShowScanner(false);
    const scanMatch = url.match(/\/scan\/([^/?#]+)/);
    if (scanMatch) {
      navigate(`/scan/${scanMatch[1]}`);
      return;
    }
    const invoiceMatch = url.match(/\/invoice\/(.+)/);
    if (invoiceMatch) {
      navigate(`/invoice/${invoiceMatch[1]}`);
      return;
    }
    toast.error('Invalid QR code');
  };

  const S = {
    header: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20 },
    card: { background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', margin: '8px 12px' },
    input: { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' },
  };

  // Empty cart
  if (items.length === 0) {
    return (
      <CustomerShell>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#ede9fe,#e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShoppingBag size={28} style={{ color: '#4f46e5' }} />
          </div>
          <h2 style={{ color: '#1e293b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Your cart is empty</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>Scan a product QR code to get started</p>
          <button onClick={() => setShowScanner(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', border: 'none', borderRadius: 12, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <QrCode size={16} /> Start Scanning
          </button>
          {showScanner && <InAppScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <div style={{ paddingBottom: 20 }}>
        {/* Header */}
        <div style={S.header}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ color: '#1e293b', fontWeight: 700, fontSize: 17, flex: 1, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Your Cart</h1>
          <span style={{ background: '#ede9fe', color: '#4f46e5', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        </div>

        {/* Cart Items */}
        <div style={S.card}>
          {items.map((item, idx) => (
            <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              {/* Image */}
              {item.image_url
                ? <img src={item.image_url} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} onError={e => { e.target.style.display = 'none'; }} />
                : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={18} style={{ color: '#94a3b8' }} /></div>
              }
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                {item.brand_name && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#94a3b8' }}>{item.brand_name}</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  {item.mrp > item.price && (
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{(item.mrp * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{ fontSize: 9, padding: '2px 4px', background: '#f1f5f9', borderRadius: 4, color: '#475569', fontWeight: 600 }}>MRP: ₹{item.mrp ? parseFloat(item.mrp).toFixed(2) : parseFloat(item.price).toFixed(2)}</span>
                  <span style={{ fontSize: 9, padding: '2px 4px', background: item.discount_percent > 0 ? '#dcfce7' : '#f1f5f9', borderRadius: 4, color: item.discount_percent > 0 ? '#16a34a' : '#475569', fontWeight: 600 }}>Disc: {item.discount_percent ? parseFloat(item.discount_percent) : 0}%</span>
                  <span style={{ fontSize: 9, padding: '2px 4px', background: '#f1f5f9', borderRadius: 4, color: '#475569', fontWeight: 600 }}>GST: {item.gst_percent ? parseFloat(item.gst_percent) : 0}%</span>
                </div>

                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>
              </div>
              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <button onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => updateQty(item.product_id, item.quantity - 1)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                  <span style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, item.quantity + 1)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div style={{ ...S.card, padding: '12px 14px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Info (optional)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} style={S.input} placeholder="Your name (optional)" />
            <input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={S.input} placeholder="Phone number (optional)" type="tel" />
          </div>
        </div>

        {/* Summary */}
        <div style={{ ...S.card, padding: '12px 14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</p>
          {items.map(i => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{i.name} × {i.quantity}</span>
              <span style={{ color: '#1e293b', flexShrink: 0 }}>₹{(i.price * i.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, paddingTop: 10, borderTop: '2px solid #e2e8f0', marginTop: 6 }}>
            <span style={{ color: '#1e293b' }}>Total</span>
            <span style={{ color: '#4f46e5' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button id="placeOrderBtn" onClick={handlePlaceOrder} disabled={placing}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', fontWeight: 700, fontSize: 15, cursor: placing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {placing
              ? <><span style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Placing Order...</>
              : <><ShoppingBag size={18} /> Place Order · ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>}
          </button>
          <button onClick={() => setShowScanner(true)} style={{ width: '100%', padding: '11px', borderRadius: 12, border: '2px solid #4f46e5', background: 'white', color: '#4f46e5', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <QrCode size={16} /> Continue Scanning
          </button>
        </div>
      </div>
      {showScanner && <InAppScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
    </CustomerShell>
  );
}
