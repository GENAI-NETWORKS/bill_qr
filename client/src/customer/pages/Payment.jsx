import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../shared/api';
import { useCartStore } from '../../shared/cartStore';
import CustomerShell from '../components/CustomerShell';
import {
  CreditCard, CheckCircle, ArrowLeft, Smartphone
} from 'lucide-react';

const PAYMENT_STEPS = [
  { id: 'connecting', label: 'Connecting to payment gateway...', duration: 800 },
  { id: 'processing', label: 'Processing payment...', duration: 900 },
  { id: 'verifying', label: 'Verifying transaction...', duration: 700 },
  { id: 'success', label: 'Payment successful!', duration: 0 },
];

const PAYMENT_METHODS = [
  { id: 'card', icon: CreditCard, label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Rupay', color: '#4f46e5' },
  { id: 'upi',  icon: Smartphone, label: 'UPI', sub: 'PhonePe, GPay, Paytm', color: '#06b6d4' },
];

export default function Payment() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [order, setOrder] = useState(null);
  const [step, setStep] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('card');

  useEffect(() => {
    api.get(`/orders/${order_id}`)
      .then(res => {
        setOrder(res.data);
        if (res.data.payment_status === 'paid') setDone(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [order_id]);

  const simulatePay = async () => {
    for (const s of PAYMENT_STEPS) {
      setStep(s.id);
      if (s.duration > 0) {
        await new Promise(r => setTimeout(r, s.duration));
      }
    }
    try {
      await api.post(`/orders/${order_id}/pay`);
      clearCart();
      setDone(true);
      setTimeout(() => {
        navigate(`/invoice/${order_id}`);
      }, 2000);
    } catch (err) {
      setStep(null);
      alert('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <CustomerShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </CustomerShell>
    );
  }

  // ── SUCCESS screen ───────────────────────────────────
  if (done) {
    return (
      <CustomerShell>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(6,182,212,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, animation: 'pulse-ring 1.5s ease-in-out infinite' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={32} color="white" />
            </div>
          </div>
          <h1 style={{ color: '#1e293b', fontWeight: 800, fontSize: 22, margin: '0 0 8px', fontFamily: 'Outfit, sans-serif' }}>Payment Successful!</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>Redirecting to invoice...</p>
        </div>
      </CustomerShell>
    );
  }

  // ── PROCESSING screen ────────────────────────────────
  if (step) {
    const currentIdx = PAYMENT_STEPS.findIndex(s => s.id === step);
    return (
      <CustomerShell>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <h2 style={{ color: '#1e293b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Processing Payment</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px' }}>{PAYMENT_STEPS.find(s => s.id === step)?.label}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {PAYMENT_STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= currentIdx ? '#4f46e5' : '#e2e8f0', transform: i === currentIdx ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.5s' }} />
            ))}
          </div>
        </div>
      </CustomerShell>
    );
  }

  // ── PAYMENT ENTRY screen ─────────────────────────────
  return (
    <CustomerShell>
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ background: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
          Payment
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Amount */}
        {order && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', color: 'white' }}>
            <p className="text-xs opacity-75 uppercase tracking-widest mb-1">Amount Due</p>
            <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-75">{order.order_number}</p>
          </div>
        )}

        {/* Payment method card */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold text-sm" style={{ color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payment Method
          </h3>

          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, icon: Icon, label, sub, color }) => {
              const isSelected = selectedMethod === id;
              return (
                <div
                  key={id}
                  onClick={() => setSelectedMethod(id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `2px solid ${isSelected ? color : '#e2e8f0'}`,
                    background: isSelected ? `${color}08` : 'transparent',
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{label}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{sub}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: color }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm + Back */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button id="confirmPaymentBtn" onClick={simulatePay}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CreditCard size={18} />
            Pay Now · ₹{order ? parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
          </button>
        </div>
      </div>
    </div>
    </CustomerShell>
  );
}
