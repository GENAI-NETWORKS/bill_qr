import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/api';
import {
  Package, TrendingUp, ShoppingCart, IndianRupee,
  AlertTriangle, RefreshCw, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#6c63ff', '#4ade80', '#f59e0b', '#06b6d4', '#ec4899', '#f97316'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm" style={{ color: '#64748b' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, recentRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/recent-orders'),
      ]);
      setData(summaryRes.data);
      setRecentOrders(recentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const weekData = data?.orders_last_week?.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    orders: d.count,
    revenue: parseFloat(d.revenue || 0),
  })) || [];

  const categoryData = (data?.stock_by_category || [])
    .filter(c => c.category && parseFloat(c.value) > 0)
    .map(c => ({ name: c.category || 'Uncategorized', value: parseFloat(c.value) }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Welcome back! Here's what's happening today.</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Total Products" value={data?.total_products || 0} color="#6c63ff" />
        <StatCard icon={IndianRupee} label="Stock Value" value={`₹${parseFloat(data?.stock_value || 0).toLocaleString('en-IN')}`} color="#4ade80" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${parseFloat(data?.total_revenue || 0).toLocaleString('en-IN')}`}
          sub={`Today: ₹${parseFloat(data?.orders?.today?.revenue || 0).toLocaleString('en-IN')}`} color="#f59e0b" />
        <StatCard icon={ShoppingCart} label="Orders (All)" value={data?.orders?.all?.count || 0}
          sub={`This month: ${data?.orders?.month?.count || 0}`} color="#06b6d4" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <h3 className="font-semibold text-white mb-4">Orders: Last 7 Days</h3>
          {weekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekData} barSize={28}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1c1f31', border: '1px solid #2a2d45', borderRadius: 8, color: '#e2e8f0' }}
                  cursor={{ fill: 'rgba(108,99,255,0.08)' }}
                />
                <Bar dataKey="orders" fill="#6c63ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#64748b' }}>
              No order data for last 7 days
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl p-5" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <h3 className="font-semibold text-white mb-4">Stock by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" outerRadius={70} dataKey="value" nameKey="name">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={v => `₹${parseFloat(v).toLocaleString('en-IN')}`}
                  contentStyle={{ background: '#1c1f31', border: '1px solid #2a2d45', borderRadius: 8, color: '#e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#64748b' }}>
              No category data yet
            </div>
          )}
        </div>
      </div>

      {/* Low Stock + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low stock */}
        <div className="rounded-2xl p-5" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <h3 className="font-semibold text-white">Low Stock Alerts</h3>
            <span className="badge badge-warning ml-auto">{data?.low_stock?.length || 0}</span>
          </div>
          {data?.low_stock?.length > 0 ? (
            <div className="space-y-2">
              {data.low_stock.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1c1f31' }}>
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{p.brand_name || '—'} · {p.category_name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-danger">{p.stock_qty} left</span>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>Threshold: {p.low_stock_threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: '#64748b' }}>All products adequately stocked</p>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl p-5" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs flex items-center gap-1" style={{ color: '#6c63ff' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.slice(0, 8).map(o => (
                <div key={o.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1c1f31' }}>
                  <div>
                    <p className="text-sm font-medium text-white">{o.order_number}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {format(new Date(o.created_at), 'MMM d, h:mm a')} · {o.item_count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</p>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-success' : o.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                      {o.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: '#64748b' }}>No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
