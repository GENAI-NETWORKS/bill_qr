import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../shared/api';
import { ArrowLeft, Download, Package } from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../../shared/invoicePDF';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!order) return <div className="text-center py-16" style={{ color: '#64748b' }}>Order not found</div>;

  const subtotal = order.items.reduce((s, i) => s + parseFloat(i.line_total), 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/orders')} className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {order.order_number}
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>
        <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : order.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
          {order.payment_status}
        </span>
        <button onClick={() => generateInvoicePDF(order)} className="btn-primary">
          <Download size={16} /> PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-2xl p-4 md:col-span-2" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide" style={{ color: '#64748b' }}>Customer</h3>
          <p className="text-white font-medium">{order.customer_name || '—'}</p>
          <p style={{ color: '#94a3b8' }}>{order.customer_phone || '—'}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Payment: {order.payment_method}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#64748b' }}>Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span style={{ color: '#94a3b8' }}>Subtotal</span><span className="text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span style={{ color: '#94a3b8' }}>Tax</span><span className="text-white">₹{parseFloat(order.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between pt-2 font-bold" style={{ borderTop: '1px solid #2a2d45' }}>
              <span className="text-white">Total</span>
              <span style={{ color: '#4ade80' }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #2a2d45' }}>
          <h3 className="font-semibold text-white">Order Items ({order.items.length})</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        style={{ border: '1px solid #2a2d45' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1c1f31' }}>
                        <Package size={14} style={{ color: '#64748b' }} />
                      </div>
                    )}
                    <span className="font-medium text-white text-sm">{item.product_name}</span>
                  </div>
                </td>
                <td style={{ color: '#94a3b8' }}>₹{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ color: '#94a3b8' }}>{item.quantity}</td>
                <td className="font-semibold text-white">₹{parseFloat(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
