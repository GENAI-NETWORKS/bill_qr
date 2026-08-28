import jsPDF from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';

/**
 * Generate and download invoice PDF (Thermal Receipt Style)
 * @param {object} order - Full order object with items
 */
export async function generateInvoicePDF(order) {
  // A standard thermal receipt width is 80mm.
  // Estimate height: base 170 (increased for QR) + ~10mm per item
  const baseHeight = 170;
  const itemHeight = 12;
  const totalHeight = baseHeight + (order.items.length * itemHeight);
  
  const doc = new jsPDF({ unit: 'mm', format: [80, Math.max(200, totalHeight)] });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const storeName = order.settings?.store_name || 'BillQR Store';
  const currency = 'Rs.';
  
  let y = 10;
  
  // Font settings
  doc.setFont('courier', 'normal');
  
  // --- Header ---
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  const splitStoreName = doc.splitTextToSize(storeName, 70);
  splitStoreName.forEach(line => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 6;
  });
  
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.text('QR-Based Billing System', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFont('courier', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  
  y += 4;
  doc.setFont('courier', 'normal');
  doc.text('-'.repeat(36), pageWidth / 2, y, { align: 'center' });
  
  // --- Order Info ---
  y += 6;
  doc.setFontSize(8);
  doc.text(`Order: ${order.order_number}`, 5, y);
  y += 5;
  doc.text(`Date : ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}`, 5, y);
  y += 5;
  doc.text(`Pay  : ${order.payment_method || 'dummy'} [${(order.payment_status || '').toUpperCase()}]`, 5, y);
  
  if (order.customer_name) {
    y += 5;
    doc.text(`Cust : ${order.customer_name}`, 5, y);
    if (order.customer_phone) {
      y += 5;
      doc.text(`Phone: ${order.customer_phone}`, 5, y);
    }
  }

  y += 4;
  doc.text('-'.repeat(36), pageWidth / 2, y, { align: 'center' });
  
  // --- Items Header ---
  y += 6;
  doc.setFont('courier', 'bold');
  doc.text('Item', 5, y);
  doc.text('Qty', 42, y, { align: 'right' });
  doc.text('Price', 56, y, { align: 'right' });
  doc.text('Total', 75, y, { align: 'right' });
  
  y += 3;
  doc.setFont('courier', 'normal');
  doc.text('-'.repeat(36), pageWidth / 2, y, { align: 'center' });
  
  // --- Items List ---
  y += 6;
  order.items.forEach(item => {
    const name = item.product_name;
    const splitName = doc.splitTextToSize(name, 35);
    doc.text(splitName[0], 5, y);
    
    const qty = parseFloat(item.quantity).toFixed(2);
    const price = parseFloat(item.unit_price).toFixed(2);
    const total = parseFloat(item.line_total).toFixed(2);
    const mrp = parseFloat(item.mrp) || parseFloat(item.unit_price);
    const disc = parseFloat(item.discount_percent) || 0;
    const gst = parseFloat(item.gst_percent) || 0;
    
    doc.text(qty, 42, y, { align: 'right' });
    doc.text(price, 56, y, { align: 'right' });
    doc.text(total, 75, y, { align: 'right' });
    
    y += 4;
    if (splitName.length > 1) {
      doc.text(splitName[1], 5, y);
      y += 4;
    }

    let details = [];
    if (mrp > parseFloat(item.unit_price)) details.push(`MRP:${mrp.toFixed(2)}`);
    if (disc > 0) details.push(`Disc:${disc}%`);
    if (gst > 0) details.push(`GST:${gst}%`);
    
    if (details.length > 0) {
      doc.setFontSize(7);
      doc.setTextColor(80);
      doc.text(details.join(' | '), 5, y);
      doc.setFontSize(8);
      doc.setTextColor(0);
      y += 5;
    } else {
      y += 2;
    }
  });
  
  y += 2;
  doc.text('-'.repeat(36), pageWidth / 2, y, { align: 'center' });
  
  // --- Totals ---
  y += 6;
  const subtotal = order.items.reduce((s, i) => s + parseFloat(i.line_total), 0);
  const tax = parseFloat(order.tax_amount || 0);
  const totalAmt = parseFloat(order.total_amount);
  
  doc.text('Subtotal:', 50, y, { align: 'right' });
  doc.text(`${currency}${subtotal.toFixed(2)}`, 75, y, { align: 'right' });
  
  y += 5;
  doc.text('Total GST:', 50, y, { align: 'right' });
  doc.text(`${currency}${tax.toFixed(2)}`, 75, y, { align: 'right' });
  
  y += 3;
  doc.text('-'.repeat(18), 75, y, { align: 'right' });
  
  y += 6;
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', 50, y, { align: 'right' });
  doc.text(`${currency}${totalAmt.toFixed(2)}`, 75, y, { align: 'right' });
  
  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('='.repeat(36), pageWidth / 2, y, { align: 'center' });
  
  // --- Footer ---
  y += 8;
  doc.text('Thank you for your purchase!', pageWidth / 2, y, { align: 'center' });
  
  // --- QR Code Injection ---
  try {
    const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      margin: 1,
      width: 120,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    y += 4;
    doc.addImage(qrDataUrl, 'PNG', (pageWidth / 2) - 15, y, 30, 30);
    y += 34;
    doc.setFontSize(7);
    doc.text('Scan to Verify', pageWidth / 2, y, { align: 'center' });
  } catch (err) {
    console.error('QR generation failed', err);
  }
  
  y += 8;
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text('Powered by Gen-AI Tech', pageWidth / 2, y, { align: 'center' });
  doc.text('IT Solutions Salem', pageWidth / 2, y + 4, { align: 'center' });
  
  // Save
  doc.save(`Receipt_${order.order_number}.pdf`);
}
