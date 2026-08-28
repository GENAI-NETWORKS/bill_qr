import { useState } from 'react';
import api from '../../shared/api';
import { X, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockModal({ product, onClose, onUpdated }) {
  const [action, setAction] = useState('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const currentStock = parseFloat(product.stock_qty);

  const getPreview = () => {
    const amt = parseFloat(amount) || 0;
    if (action === 'add') return currentStock + amt;
    if (action === 'subtract') return Math.max(0, currentStock - amt);
    return amt;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch(`/products/${product.id}/stock`, { action, amount: parseFloat(amount), reason });
      toast.success('Stock updated!');
      onUpdated(res.data.stock_qty);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} style={{ color: '#4ade80' }} />
            <h3 className="text-white font-semibold">Edit Stock</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
          {product.name} — Current: <strong style={{ color: '#e2e8f0' }}>{currentStock}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action radios */}
          <div>
            <label className="form-label">Action</label>
            <div className="flex gap-2">
              {[['add', 'Add'], ['subtract', 'Subtract'], ['set', 'Set to']].map(([val, lbl]) => (
                <label key={val} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: action === val ? 'rgba(108,99,255,0.15)' : '#1c1f31',
                    border: `1px solid ${action === val ? '#6c63ff' : '#2a2d45'}`,
                    color: action === val ? '#6c63ff' : '#94a3b8',
                    fontSize: '0.8rem', fontWeight: 600
                  }}>
                  <input type="radio" value={val} checked={action === val} onChange={() => setAction(val)} className="hidden" />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Amount</label>
            <input
              id="stockAmount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="form-input"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Preview */}
          {amount && (
            <div className="p-3 rounded-xl text-sm" style={{ background: '#1c1f31', border: '1px solid #2a2d45' }}>
              <span style={{ color: '#64748b' }}>New stock: </span>
              <strong style={{ color: '#4ade80' }}>{getPreview()}</strong>
            </div>
          )}

          <div>
            <label className="form-label">Reason (optional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              className="form-input" placeholder="e.g. Restock, Damage, Manual correction" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Updating...' : 'Update Stock'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
