import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/api';
import { format } from 'date-fns';
import { ShoppingCart, Search, Filter, Eye, Download } from 'lucide-react';
import { generateInvoicePDF } from '../../shared/invoicePDF';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { params: { ...filters, page, limit: 20 } });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters, page]);

  const handleDownloadPDF = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      generateInvoicePDF(res.data);
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-2xl" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="form-input w-full sm:w-40">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: '#64748b' }}>From</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="form-input w-36" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: '#64748b' }}>To</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="form-input w-36" />
        </div>
        <button onClick={() => { setFilters({ status: '', from: '', to: '' }); setPage(1); }} className="btn-secondary">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <ShoppingCart size={40} style={{ color: '#334155' }} />
            <p style={{ color: '#64748b' }}>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
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
                    <td style={{ color: '#94a3b8' }}>
                      {o.customer_name || '—'}<br/>
                      <span className="text-xs">{o.customer_phone || ''}</span>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{o.item_count}</td>
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

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-3 p-4" style={{ borderTop: '1px solid #2a2d45' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-sm">Prev</button>
            <span className="text-sm" style={{ color: '#64748b' }}>Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-secondary px-4 py-1.5 text-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
