import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../shared/api';
import { generateInvoicePDF } from '../../shared/invoicePDF';
import { format } from 'date-fns';
import { Download, ArrowLeft, Receipt } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import CustomerShell from '../components/CustomerShell';

export default function Invoice() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFullView = searchParams.get('view') === 'full';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${order_id}`)
      .then(res => setOrder(res.data))
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [order_id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #6c63ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14, background: '#f8fafc' }}>
      Invoice not found
    </div>
  );

  const subtotal = order.items.reduce((s, i) => s + parseFloat(i.line_total), 0);
  const tax = parseFloat(order.tax_amount || 0);
  const total = parseFloat(order.total_amount);
  const storeName = order.settings?.store_name || 'BillQR Store';

  // --- FULL PDF-STYLE INVOICE VIEW ---
  if (isFullView) {
    return (
      <div style={{ minHeight: '100vh', background: '#e8ecf4', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Thermal Receipt Container */}
        <div style={{ width: '100%', maxWidth: 360, background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden', fontFamily: '"Courier New", Courier, monospace', color: '#000', padding: '32px 24px', position: 'relative' }}>
          
          {/* Jagged top edge effect using CSS radial-gradient (optional, but let's keep it simple with standard padding) */}
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}>{storeName}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>QR-Based Billing System</p>
            <h2 style={{ margin: '16px 0 0', fontSize: 16, fontWeight: 700 }}>TAX INVOICE</h2>
            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }}></div>
          </div>
          
          {/* Info Block */}
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <div><span style={{ display: 'inline-block', width: 60 }}>Order:</span>{order.order_number}</div>
            <div><span style={{ display: 'inline-block', width: 60 }}>Date:</span>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</div>
            <div><span style={{ display: 'inline-block', width: 60 }}>Pay:</span>{order.payment_method || 'dummy'} [{order.payment_status?.toUpperCase() || 'UNPAID'}]</div>
            {order.customer_name && (
              <>
                <div><span style={{ display: 'inline-block', width: 60 }}>Cust:</span>{order.customer_name}</div>
                {order.customer_phone && <div><span style={{ display: 'inline-block', width: 60 }}>Phone:</span>{order.customer_phone}</div>}
              </>
            )}
          </div>
          <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }}></div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ padding: '0 0 8px', textAlign: 'left', fontWeight: 700 }}>Item</th>
                <th style={{ padding: '0 0 8px', textAlign: 'right', fontWeight: 700, width: 40 }}>Qty</th>
                <th style={{ padding: '0 0 8px', textAlign: 'right', fontWeight: 700, width: 50 }}>Price</th>
                <th style={{ padding: '0 0 8px', textAlign: 'right', fontWeight: 700, width: 60 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const unitPrice = parseFloat(item.unit_price);
                const mrp = parseFloat(item.mrp) || unitPrice;
                const discount = parseFloat(item.discount_percent) || 0;
                const gst = parseFloat(item.gst_percent) || 0;
                const qty = parseFloat(item.quantity);

                let details = [];
                if (mrp > unitPrice) details.push(`MRP:${mrp.toFixed(2)}`);
                if (discount > 0) details.push(`Disc:${discount}%`);
                if (gst > 0) details.push(`GST:${gst}%`);

                return (
                  <tr key={item.id}>
                    <td colSpan={4} style={{ padding: '8px 0', borderTop: '1px dashed #ccc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: details.length > 0 ? 4 : 0 }}>
                        <div style={{ flex: 1, paddingRight: 8, fontWeight: 700 }}>{item.product_name}</div>
                        <div style={{ width: 40, textAlign: 'right' }}>{qty.toFixed(2)}</div>
                        <div style={{ width: 50, textAlign: 'right' }}>{unitPrice.toFixed(2)}</div>
                        <div style={{ width: 60, textAlign: 'right', fontWeight: 700 }}>{parseFloat(item.line_total).toFixed(2)}</div>
                      </div>
                      {details.length > 0 && (
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {details.join(' | ')}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }}></div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, alignItems: 'flex-end', marginBottom: 24 }}>
            <div style={{ display: 'flex', width: 160, justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', width: 160, justifyContent: 'space-between' }}>
              <span>Total GST:</span>
              <span>Rs.{tax.toFixed(2)}</span>
            </div>
            <div style={{ width: 160, borderBottom: '1px dashed #000', margin: '4px 0' }}></div>
            <div style={{ display: 'flex', width: 160, justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
              <span>TOTAL:</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ borderBottom: '2px solid #000', margin: '16px 0 24px' }}></div>
          
          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 12 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700 }}>Thank you for your purchase!</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
              <QRCodeSVG 
                value={`${window.location.origin}/invoice/${order.id}`} 
                size={80} 
                fgColor="#1e293b" 
                level="M" 
                marginSize={0}
              />
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 10, color: '#64748b' }}>Scan to Verify</p>

            <p style={{ margin: 0, fontSize: 10, color: '#666' }}>Powered by Gen-AI Tech</p>
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#666' }}>IT Solutions Salem</p>
          </div>
        </div>
        
        <div style={{ marginTop: 24 }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  // --- COMPACT RECEIPT VIEW (After Payment) ---
  return (
    <CustomerShell>
      <div style={{ paddingBottom: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20 }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ color: '#1e293b', fontWeight: 700, fontSize: 17, flex: 1, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Invoice</h1>

        </div>

        {/* Store Header */}
        <div style={{ margin: '10px 12px', borderRadius: 12, padding: '14px 16px', textAlign: 'center', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white' }}>
          <p style={{ fontSize: 10, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Invoice from</p>
          <h2 style={{ fontWeight: 800, fontSize: 18, margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>{storeName}</h2>
          <p style={{ fontSize: 11, opacity: 0.75, margin: 0 }}>
            {order.order_number} · {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
          </p>
          {order.customer_name && (
            <p style={{ fontSize: 12, opacity: 0.9, margin: '4px 0 0' }}>For: {order.customer_name}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <button id="downloadInvoiceBtn" onClick={() => generateInvoicePDF(order)}
            style={{ width: 'fit-content', padding: '11px 24px', borderRadius: 12, border: '2px solid #4f46e5', background: 'white', color: '#4f46e5', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={16} /> Download Invoice PDF
          </button>
        </div>

        {/* QR Code */}
        <div style={{ margin: '20px 12px', padding: '20px', background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#1e293b', textAlign: 'center' }}>Scan for Physical Invoice for Item Purchase Checklist</p>
          <div style={{ padding: 12, background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(6,182,212,0.05))', borderRadius: 16 }}>
            <QRCodeSVG 
              value={`${window.location.origin}/invoice/${order_id}?view=full`} 
              size={130} 
              fgColor="#1e293b" 
              level="M" 
              marginSize={0}
            />
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
