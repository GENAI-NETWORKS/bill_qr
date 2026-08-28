import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../shared/api';
import { format } from 'date-fns';
import { ShoppingCart, Eye, ArrowLeft, Download, User } from 'lucide-react';
import { generateInvoicePDF } from '../../shared/invoicePDF';
import toast from 'react-hot-toast';

export default function CustomerDetail() {
  const { phone } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${phone}/orders`);
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [phone]);

  const handleDownloadPDF = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      generateInvoicePDF(res.data);
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const name = orders.length > 0 ? (orders[0].customer_name || '—') : '—';
  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/customers" className="p-2 rounded-xl" style={{ background: '#1c1f31', color: '#64748b', border: '1px solid #2a2d45' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <User size={24} style={{ color: '#6c63ff' }} />
            {name}
          </h1>
          <p className="text-sm mt-0.5 font-mono" style={{ color: '#64748b' }}>{phone}</p>
        </div>
      </div>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="stat-card flex flex-col justify-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>Total Orders</p>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{orders.length}</p>
          </div>
          <div className="stat-card flex flex-col justify-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>Lifetime Spent</p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#4ade80' }}>
              ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Purchase History</h2>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <ShoppingCart size={40} style={{ color: '#334155' }} />
            <p style={{ color: '#64748b' }}>No orders found for this customer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: '#6c63ff' }}>{o.order_number}</span>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{format(new Date(o.created_at), 'MMM d, yyyy h:mm a')}</td>
                    <td className="font-semibold text-white">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${o.payment_status === 'paid' ? 'badge-success' : o.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/admin/orders/${o.id}`}
                          className="p-1.5 rounded-lg"
                          style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff', display: 'inline-flex' }}>
                          <Eye size={14} />
                        </Link>
                        <button onClick={() => handleDownloadPDF(o.id)}
                          className="p-1.5 rounded-lg"
                          style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'none', cursor: 'pointer' }}>
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
