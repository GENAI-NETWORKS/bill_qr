import { X, Printer, QrCode, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRModal({ product, onClose }) {
  // Construct scan URL directly on client to avoid network latency
  const scanUrl = `${window.location.origin}/scan/${product.qr_token}`;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    // Extract the SVG string from the modal for printing
    const svgElement = document.getElementById(`qr-svg-${product.id}`);
    const svgData = new XMLSerializer().serializeToString(svgElement);

    win.document.write(`
      <html><head><title>QR - ${product.name}</title>
      <style>
        body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
        .qr-container { width: 300px; height: 300px; margin-bottom: 20px; }
        h2 { font-size: 22px; margin: 12px 0 4px; color: #1e293b; }
        p { font-size: 14px; color: #64748b; margin: 0; }
        .url { font-size: 10px; color: #94a3b8; margin-top: 20px; }
      </style></head>
      <body>
        <div class="qr-container">${svgData}</div>
        <h2>${product.name}</h2>
        <p>Scan to view product & add to cart</p>
        <p class="url">${scanUrl}</p>
      </body></html>
    `);
    win.document.close();
    // Small delay to ensure SVG renders before print dialog
    setTimeout(() => win.print(), 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode size={18} style={{ color: '#6c63ff' }} />
            <h3 className="text-white font-semibold">Product QR</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>{product.name}</p>

        {/* Modernistic QR rendering */}
        <div className="bg-white rounded-[32px] p-6 inline-block mb-6 mx-auto relative overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(108,99,255,0.25)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #6c63ff, #4ade80)' }}></div>
          <QRCodeSVG 
            id={`qr-svg-${product.id}`}
            value={scanUrl} 
            size={220} 
            fgColor="#4f46e5" // Deep modern purple
            bgColor="transparent" 
            level="M" 
            marginSize={0}
            style={{ position: 'relative', zIndex: 10 }}
          />
        </div>

        <p className="text-xs mb-6 px-2" style={{ color: '#475569', wordBreak: 'break-all' }}>
          {scanUrl}
        </p>

        <div className="flex gap-2 justify-center">
          <button onClick={handlePrint} className="btn-primary flex-1 justify-center py-2.5">
            <Printer size={15} /> Print QR
          </button>
          <a href={scanUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4">
            <ExternalLink size={15} /> Open
          </a>
        </div>
      </div>
    </div>
  );
}
