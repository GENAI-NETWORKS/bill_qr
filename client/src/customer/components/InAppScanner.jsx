import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, FlipHorizontal } from 'lucide-react';

export default function InAppScanner({ onResult, onClose }) {
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [camIdx, setCamIdx] = useState(0);
  const html5QrRef = useRef(null);
  const scannerDivId = 'qr-reader-container';

  const startScanner = async (deviceId) => {
    // Stop any running scanner first
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch (_) {}
      html5QrRef.current = null;
    }

    const qr = new Html5Qrcode(scannerDivId);
    html5QrRef.current = qr;

    try {
      await qr.start(
        deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 220, height: 220 },
          aspectRatio: undefined, // Let the browser decide — avoids split video bug
          disableFlip: false,
        },
        async (decodedText) => {
          if (html5QrRef.current) {
            try { await html5QrRef.current.stop(); } catch (err) {}
            html5QrRef.current = null;
          }
          onResult(decodedText);
        },
        () => {} // ignore per-frame failures
      );
    } catch (err) {
      setError('Could not access camera. Please allow camera permission and try again.');
      console.error(err);
    }
  };

  useEffect(() => {
    // Enumerate cameras then start
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices);
        // Prefer back camera
        const backIdx = devices.findIndex(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const idx = backIdx >= 0 ? backIdx : 0;
        setCamIdx(idx);
        if (devices.length > 0) {
          startScanner(devices[idx]?.id);
        } else {
          startScanner(null); // fallback to environment facing
        }
      })
      .catch(() => {
        startScanner(null); // fallback
      });

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleFlip = async () => {
    if (cameras.length < 2) return;
    const nextIdx = (camIdx + 1) % cameras.length;
    setCamIdx(nextIdx);
    await startScanner(cameras[nextIdx]?.id);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', flexShrink: 0,
        background: 'rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Camera size={20} style={{ color: '#4f46e5' }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Scan QR Code</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cameras.length > 1 && (
            <button onClick={handleFlip}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlipHorizontal size={18} />
            </button>
          )}
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scanner Area — takes all remaining space */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* The html5-qrcode mounts the video here */}
        <div
          id={scannerDivId}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Overlay: dark corners with transparent centre box */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* top dark bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.5)' }} />
          {/* bottom dark bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.5)' }} />
          {/* left dark bar */}
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', bottom: 'calc(50% - 110px)', left: 0, width: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.5)' }} />
          {/* right dark bar */}
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', bottom: 'calc(50% - 110px)', right: 0, width: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.5)' }} />

          {/* Corner markers */}
          {[
            { top: 'calc(50% - 110px)', left: 'calc(50% - 110px)' },
            { top: 'calc(50% - 110px)', right: 'calc(50% - 110px)' },
            { bottom: 'calc(50% - 110px)', left: 'calc(50% - 110px)' },
            { bottom: 'calc(50% - 110px)', right: 'calc(50% - 110px)' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', width: 28, height: 28,
              borderColor: '#4f46e5', borderStyle: 'solid', borderWidth: 0,
              ...pos,
              ...(i === 0 ? { borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 6 } : {}),
              ...(i === 1 ? { borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 6 } : {}),
              ...(i === 2 ? { borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 6 } : {}),
              ...(i === 3 ? { borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 6 } : {}),
            }} />
          ))}

          {/* Scanning line animation */}
          <div style={{
            position: 'absolute',
            top: 'calc(50% - 110px)', left: 'calc(50% - 110px)',
            width: 220, height: 220,
            overflow: 'hidden',
          }}>
            <div style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, #4f46e5, transparent)',
              animation: 'scanLine 2s linear infinite',
            }} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            position: 'absolute', bottom: 80, left: 16, right: 16,
            background: 'rgba(239,68,68,0.9)', borderRadius: 12,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 13,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div style={{ padding: '12px 16px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', flexShrink: 0 }}>
        <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Point your camera at a product QR code</p>
      </div>

      {/* CSS for scan line animation and html5-qrcode overrides */}
      <style>{`
        @keyframes scanLine {
          0%   { margin-top: 0; }
          50%  { margin-top: 216px; }
          100% { margin-top: 0; }
        }
        /* Make the video fill the container without clipping or splitting */
        #${scannerDivId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important; left: 0 !important;
        }
        /* Hide html5-qrcode's own UI chrome — we draw our own overlay */
        #${scannerDivId} #qr-shaded-region { display: none !important; }
        #${scannerDivId} img { display: none !important; }
        #${scannerDivId} button { display: none !important; }
        #${scannerDivId} select { display: none !important; }
        #${scannerDivId} span { display: none !important; }
        #${scannerDivId} > div:last-child { display: none !important; }
      `}</style>
    </div>
  );
}
