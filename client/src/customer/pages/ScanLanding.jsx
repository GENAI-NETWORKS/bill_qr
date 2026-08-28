import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../shared/api';
import { useCartStore } from '../../shared/cartStore';
import InAppScanner from '../components/InAppScanner';
import CustomerShell from '../components/CustomerShell';
import { QrCode, Plus, Minus, Trash2, Camera, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScanLanding() {
  const { qr_token } = useParams();
  const navigate = useNavigate();
  const { items, addItem, updateQty, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [placing, setPlacing] = useState(false);
  
  // User info form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const processedToken = useRef(null);

  useEffect(() => {
    if (qr_token && processedToken.current !== qr_token) {
      processedToken.current = qr_token;
      setLoading(true);
      api.get(`/scan/${qr_token}`)
        .then(res => {
          const product = res.data;
          if (!product.in_stock) {
            toast.error('Product is out of stock!');
            return;
          }
          const { items: currentItems } = useCartStore.getState();
          const existing = currentItems.find(i => i.product_id === product.id);
          if (!existing) {
             addItem(product, 1);
             toast.success(`Added ${product.name} to cart!`);
          } else {
             const maxAddable = Math.max(0, parseFloat(product.stock_qty) - existing.quantity);
             if (maxAddable > 0) {
               updateQty(product.id, existing.quantity + 1);
               toast.success(`Increased ${product.name} quantity!`);
             } else {
               toast.error('Cart limit reached for this product.');
             }
          }
          navigate('/scan', { replace: true });
        })
        .catch(err => toast.error(err.response?.data?.error || 'QR code not found or invalid.'))
        .finally(() => setLoading(false));
    }
  }, [qr_token, navigate, addItem, updateQty]);

  const handleScanResult = useCallback((url) => {
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
  }, [navigate]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePayNow = () => {
    if (items.length === 0) return;
    setShowUserForm(true);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Name and Phone number are mandatory');
      return;
    }
    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerPhone.trim())) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim()
      });
      setShowUserForm(false);
      navigate(`/payment/${res.data.id}`);
    } catch (err) {
      toast.error('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const S = {
    card: { background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', margin: '8px 12px' },
  };

  return (
    <CustomerShell>
      <div style={{ paddingBottom: 160 }}>


        {loading && (
           <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #4f46e5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
              Loading product...
           </div>
        )}

        {items.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <Package size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
            <p style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 600, fontSize: 16 }}>No products scanned yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Scan a QR code to add products here.</p>
          </div>
        ) : (
          <div style={S.card}>
            {items.map((item, idx) => (
              <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} onError={e => { e.target.style.display = 'none'; }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={24} style={{ color: '#94a3b8' }} /></div>
                }
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  {item.brand_name && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{item.brand_name}</p>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#4f46e5' }}>₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
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

                  {item.quantity > 1 && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <Trash2 size={16} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.product_id, item.quantity - 1)} style={{ width: 30, height: 30, background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                    <span style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, item.quantity + 1)} style={{ width: 30, height: 30, background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar Container */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 30 }}>
        
        {/* Floating Scan Button */}
        <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button onClick={() => setShowScanner(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #4f46e5)', color: 'white', border: '5px solid #f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.3)', padding: 0 }}>
             <Camera size={26} />
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginTop: 4 }}>SCAN</span>
        </div>

        {/* Main Action Bar */}
        <div style={{ background: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', boxShadow: '0 -10px 40px rgba(0,0,0,0.08)' }}>
           <div style={{ flex: 1 }}>
             <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</p>
             <p style={{ margin: '2px 0 0', fontSize: 24, color: '#0f172a', fontWeight: 800 }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
           </div>
           <button onClick={handlePayNow} disabled={items.length === 0} style={{ background: items.length === 0 ? '#cbd5e1' : '#0f172a', color: 'white', border: 'none', borderRadius: 16, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: items.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: items.length > 0 ? '0 4px 12px rgba(15,23,42,0.2)' : 'none' }}>
             Pay Now
           </button>
        </div>

        {/* Footer */}
        <div style={{ background: 'white', textAlign: 'center', padding: '0 0 16px' }}>
          <a href="https://genaitechnology.in/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
            Powered by Gen-AI Tech | IT Solutions Salem
          </a>
        </div>
      </div>

      {/* User Information Modal (Bottom Sheet) */}
      {showUserForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => !placing && setShowUserForm(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 430, background: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px', boxSizing: 'border-box', animation: 'slideUp 0.3s ease-out' }}>
            
            <button onClick={() => !placing && setShowUserForm(false)} style={{ position: 'absolute', right: 20, top: 20, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            
            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px', display: 'none' }} />
            
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Almost there!</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>Please provide your details for the invoice.</p>
            
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="tel" 
                  required 
                  value={customerPhone} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCustomerPhone(val);
                  }}
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="e.g. 9876543210"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              
              <button type="submit" disabled={placing} style={{ marginTop: 12, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: placing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {placing ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> Processing...</> : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showScanner && <InAppScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
    </CustomerShell>
  );
}
