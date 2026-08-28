import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/api';
import { format } from 'date-fns';
import { Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Customers</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{customers.length} total customers</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Users size={40} style={{ color: '#334155' }} />
            <p style={{ color: '#64748b' }}>No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Name</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.phone}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: '#6c63ff' }}>{c.phone}</span>
                    </td>
                    <td className="font-medium text-white">{c.name || '—'}</td>
                    <td style={{ color: '#94a3b8' }}>{c.total_orders}</td>
                    <td className="font-semibold text-white">₹{parseFloat(c.total_spent).toLocaleString('en-IN')}</td>
                    <td style={{ color: '#94a3b8' }}>{format(new Date(c.last_order_date), 'MMM d, yyyy h:mm a')}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/admin/customers/${c.phone}`}
                          className="p-1.5 rounded-lg"
                          style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff', display: 'inline-flex' }}>
                          <Eye size={14} />
                        </Link>
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
