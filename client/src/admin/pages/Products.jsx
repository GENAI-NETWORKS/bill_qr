import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/api';
import QRModal from '../components/QRModal';
import StockModal from '../components/StockModal';
import {
  Plus, Search, Filter, QrCode, Edit2, Trash2,
  Package, BarChart2, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const UNIT_LABELS = { gram: 'g', kg: 'kg', litre: 'L', ml: 'ml', quantity: 'qty' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ brand_id: '', category_id: '', sort: 'name', order: 'asc' });
  const [qrProduct, setQrProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const navigate = useNavigate();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search, ...filters, limit: 100 };
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    api.get('/brands').then(r => setBrands(r.data));
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Products</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{total} products total</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-2xl" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            id="productSearch"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="form-input !pl-9"
          />
        </div>

        <select
          value={filters.brand_id}
          onChange={e => setFilters(f => ({ ...f, brand_id: e.target.value }))}
          className="form-input w-full sm:w-40">
          <option value="">All Brands</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select
          value={filters.category_id}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
          className="form-input w-full sm:w-40">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={`${filters.sort}_${filters.order}`}
          onChange={e => {
            const [sort, order] = e.target.value.split('_');
            setFilters(f => ({ ...f, sort, order }));
          }}
          className="form-input w-full sm:w-44">
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="stock_asc">Stock: Low first</option>
          <option value="stock_desc">Stock: High first</option>
          <option value="price_asc">Price: Low first</option>
          <option value="price_desc">Price: High first</option>
          <option value="created_desc">Newest first</option>
        </select>

        <button onClick={loadProducts} className="btn-secondary">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Package size={40} style={{ color: '#334155' }} />
            <p style={{ color: '#64748b' }}>No products found</p>
            <Link to="/admin/products/new" className="btn-primary">
              <Plus size={15} /> Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLow = parseFloat(p.stock_qty) <= parseFloat(p.low_stock_threshold);
                  const isOut = parseFloat(p.stock_qty) === 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                              style={{ border: '1px solid #2a2d45' }}
                              onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: '#1c1f31' }}>
                              <Package size={16} style={{ color: '#64748b' }} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white text-sm">{p.name}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>#{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{p.brand_name || '—'}</td>
                      <td style={{ color: '#94a3b8' }}>{p.category_name || '—'}</td>
                      <td style={{ color: '#94a3b8' }}>{p.unit_value} {UNIT_LABELS[p.unit_type] || p.unit_type}</td>
                      <td className="font-semibold text-white">₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`font-medium ${isOut ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'}`}>
                          {p.stock_qty}
                        </span>
                        {isLow && !isOut && <AlertTriangle size={13} className="inline ml-1" style={{ color: '#f59e0b' }} />}
                      </td>
                      <td>
                        <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                          {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Edit"
                            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff', border: 'none', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="QR Code"
                            onClick={() => setQrProduct(p)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'none', cursor: 'pointer' }}>
                            <QrCode size={14} />
                          </button>
                          <button
                            title="Edit Stock"
                            onClick={() => setStockProduct(p)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'none', cursor: 'pointer' }}>
                            <BarChart2 size={14} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrProduct && (
        <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />
      )}

      {/* Stock Modal */}
      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onUpdated={(newQty) => {
            setProducts(ps => ps.map(p => p.id === stockProduct.id ? { ...p, stock_qty: newQty } : p));
            setStockProduct(null);
          }}
        />
      )}
    </div>
  );
}
