import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../shared/api';
import { ArrowLeft, Plus, Upload, Link2, QrCode, Check, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const UNIT_TYPES = ['gram', 'kg', 'litre', 'ml', 'quantity'];

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState(null); // shows QR after save
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState(null);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', brand_id: '', category_id: '', image_url: '',
    unit_type: 'quantity', unit_value: '1',
    mrp: '', discount_percent: '', price: '', gst_percent: '', 
    stock_qty: '', low_stock_threshold: '5',
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const loadMeta = async () => {
      const [br, ca] = await Promise.all([api.get('/brands'), api.get('/categories')]);
      setBrands(br.data);
      setCategories(ca.data);
    };
    loadMeta();

    if (isEdit) {
      setLoading(true);
      api.get(`/products/${id}`)
        .then(res => {
          const p = res.data;
          setForm({
            name: p.name, brand_id: p.brand_id || '', category_id: p.category_id || '',
            image_url: p.image_url || '', unit_type: p.unit_type, unit_value: String(p.unit_value),
            mrp: p.mrp ? String(p.mrp) : String(p.price),
            discount_percent: p.discount_percent ? String(p.discount_percent) : '',
            price: String(p.price), 
            gst_percent: p.gst_percent ? String(p.gst_percent) : '',
            stock_qty: String(p.stock_qty), low_stock_threshold: String(p.low_stock_threshold || '5'),
          });
          if (p.image_url) {
            setImagePreview(p.image_url);
            setImageMode(p.image_url.startsWith('/uploads') ? 'upload' : 'url');
          }
        })
        .catch(() => toast.error('Failed to load product'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      const res = await api.post('/brands', { name: newBrand.trim() });
      setBrands(b => [...b, res.data]);
      setForm(f => ({ ...f, brand_id: res.data.id }));
      setNewBrand('');
      setAddingBrand(false);
      toast.success('Brand added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add brand');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await api.post('/categories', { name: newCategory.trim() });
      setCategories(c => [...c, res.data]);
      setForm(f => ({ ...f, category_id: res.data.id }));
      setNewCategory('');
      setAddingCategory(false);
      toast.success('Category added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imageMode === 'upload' && imageFile) {
        formData.append('image', imageFile);
        formData.delete('image_url');
      }

      let res;
      if (isEdit) {
        res = await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        res = await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
        setSavedProduct(res.data);
        return; // Stay on page to show QR
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-custom" style={{ borderColor: '#6c63ff', borderTopColor: 'transparent' }} />
    </div>;
  }

  // After save — show QR code immediately
  if (savedProduct) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ background: '#141622', border: '1px solid #2a2d45' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,222,128,0.15)' }}>
            <Check size={24} style={{ color: '#4ade80' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Product Created!</h2>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>{savedProduct.name}</p>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 inline-block mb-4">
            <img src={savedProduct.qr_data_url} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-xs mb-6" style={{ color: '#64748b' }}>Scan URL: {savedProduct.scan_url}</p>

          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={savedProduct.qr_data_url}
              download={`qr_${savedProduct.name}.png`}
              className="btn-primary">
              <QrCode size={16} /> Download QR
            </a>
            <button
              onClick={() => { setSavedProduct(null); navigate('/admin/products'); }}
              className="btn-secondary">
              View All Products
            </button>
            <button
              onClick={() => { setSavedProduct(null); setForm({ name:'',brand_id:'',category_id:'',image_url:'',unit_type:'quantity',unit_value:'1',mrp:'',discount_percent:'',price:'',gst_percent:'',stock_qty:'',low_stock_threshold:'5' }); setImagePreview(null); setImageFile(null); }}
              className="btn-secondary">
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#141622', border: '1px solid #2a2d45' }}>

          {/* Name */}
          <div>
            <label className="form-label">Product Name *</label>
            <input id="productName" value={form.name} onChange={e => set('name', e.target.value)}
              className="form-input" placeholder="e.g. Amul Butter 500g" required autoFocus />
          </div>

          {/* Brand */}
          <div>
            <label className="form-label">Brand</label>
            <div className="flex gap-2">
              <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} className="form-input flex-1">
                <option value="">No brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button type="button" onClick={() => setAddingBrand(a => !a)} className="btn-secondary px-3">
                <Plus size={15} />
              </button>
            </div>
            {addingBrand && (
              <div className="flex gap-2 mt-2">
                <input value={newBrand} onChange={e => setNewBrand(e.target.value)}
                  className="form-input flex-1" placeholder="New brand name" />
                <button type="button" onClick={handleAddBrand} className="btn-primary px-4">Add</button>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category</label>
            <div className="flex gap-2">
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="form-input flex-1">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setAddingCategory(a => !a)} className="btn-secondary px-3">
                <Plus size={15} />
              </button>
            </div>
            {addingCategory && (
              <div className="flex gap-2 mt-2">
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  className="form-input flex-1" placeholder="New category name" />
                <button type="button" onClick={handleAddCategory} className="btn-primary px-4">Add</button>
              </div>
            )}
          </div>

          {/* Image */}
          <div>
            <label className="form-label">Product Image</label>
            <div className="flex gap-2 mb-3">
              <button type="button"
                onClick={() => setImageMode('url')}
                className={`btn-secondary flex-1 justify-center ${imageMode === 'url' ? 'border-purple-500' : ''}`}
                style={imageMode === 'url' ? { borderColor: '#6c63ff', color: '#6c63ff' } : {}}>
                <Link2 size={15} /> Paste URL
              </button>
              <button type="button"
                onClick={() => setImageMode('upload')}
                className={`btn-secondary flex-1 justify-center ${imageMode === 'upload' ? 'border-purple-500' : ''}`}
                style={imageMode === 'upload' ? { borderColor: '#6c63ff', color: '#6c63ff' } : {}}>
                <Upload size={15} /> Upload File
              </button>
            </div>

            {imageMode === 'url' ? (
              <input value={form.image_url} onChange={e => { set('image_url', e.target.value); setImagePreview(e.target.value); }}
                className="form-input" placeholder="https://example.com/image.jpg" />
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="imageFile" />
                <label htmlFor="imageFile"
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                  style={{ borderColor: '#2a2d45', color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d45'}>
                  <Upload size={24} />
                  <span className="text-sm">Click to upload image (max 5MB)</span>
                </label>
              </div>
            )}

            {imagePreview && (
              <div className="mt-3 flex items-center gap-3">
                <img src={imagePreview} alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover"
                  style={{ border: '1px solid #2a2d45' }}
                  onError={e => { e.target.src = ''; setImagePreview(null); }} />
                <div>
                  <p className="text-xs text-white font-medium">Preview</p>
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); set('image_url', ''); }}
                    className="text-xs" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Unit Type *</label>
              <select value={form.unit_type} onChange={e => set('unit_type', e.target.value)} className="form-input" required>
                {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Unit Value *</label>
              <input type="number" value={form.unit_value} onChange={e => set('unit_value', e.target.value)}
                className="form-input" placeholder="e.g. 500" min="0" step="0.01" required />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label">MRP (₹) *</label>
              <input type="number" value={form.mrp} 
                onChange={e => {
                  const mrp = parseFloat(e.target.value) || 0;
                  const disc = parseFloat(form.discount_percent) || 0;
                  const newPrice = mrp - (mrp * disc / 100);
                  setForm(f => ({ ...f, mrp: e.target.value, price: newPrice > 0 ? newPrice.toFixed(2) : e.target.value }));
                }}
                className="form-input" placeholder="0.00" min="0" step="0.01" required />
            </div>
            <div>
              <label className="form-label">Discount (%)</label>
              <input type="number" value={form.discount_percent} 
                onChange={e => {
                  const disc = parseFloat(e.target.value) || 0;
                  const mrp = parseFloat(form.mrp) || 0;
                  const newPrice = mrp - (mrp * disc / 100);
                  setForm(f => ({ ...f, discount_percent: e.target.value, price: newPrice > 0 ? newPrice.toFixed(2) : form.mrp }));
                }}
                className="form-input" placeholder="0" min="0" max="100" step="0.01" />
            </div>
            <div>
              <label className="form-label">Selling Price (₹) *</label>
              <input id="productPrice" type="number" value={form.price} 
                onChange={e => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  const mrp = parseFloat(form.mrp) || 0;
                  if (mrp > 0 && newPrice <= mrp) {
                    const newDisc = ((mrp - newPrice) / mrp) * 100;
                    setForm(f => ({ ...f, price: e.target.value, discount_percent: newDisc.toFixed(2) }));
                  } else {
                    setForm(f => ({ ...f, price: e.target.value }));
                  }
                }}
                className="form-input" placeholder="0.00" min="0" step="0.01" required />
            </div>
          </div>

          {/* GST & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">GST (%)</label>
              <input type="number" value={form.gst_percent} onChange={e => set('gst_percent', e.target.value)}
                className="form-input" placeholder="e.g. 5" min="0" step="0.01" />
            </div>
            <div>
              <label className="form-label">{isEdit ? 'Stock Qty' : 'Opening Stock'}</label>
              <input type="number" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)}
                className="form-input" placeholder="0" min="0" step="0.01" />
            </div>
          </div>

          {/* Low stock threshold */}
          <div>
            <label className="form-label">Low Stock Alert Threshold</label>
            <input type="number" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)}
              className="form-input" placeholder="5" min="0" step="0.01" />
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Alert when stock falls to or below this number</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} id="saveProduct" className="btn-primary flex-1 justify-center py-3">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-custom" />
                  Saving...
                </span>
              ) : isEdit ? 'Update Product' : 'Save & Generate QR'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary px-6">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
