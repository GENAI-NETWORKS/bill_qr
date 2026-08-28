const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const QR_DIR = path.join(__dirname, '../../uploads/qr');

// Ensure QR directory exists
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Generate a QR code image file and return the data URL
 * @param {string} url - The URL to encode in the QR
 * @param {string} token - The unique token (used as filename)
 * @returns {Promise<{filePath: string, relativePath: string, dataUrl: string}>}
 */
async function generateQR(url, token) {
  const filename = `qr_${token}.png`;
  const filePath = path.join(QR_DIR, filename);
  const relativePath = `/uploads/qr/${filename}`;

  const opts = {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 512,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  };

  // Generate file (fast, no network call)
  await QRCode.toFile(filePath, url, opts);

  // Also generate data URL for immediate response
  const dataUrl = await QRCode.toDataURL(url, { ...opts, width: 300 });

  return { filePath, relativePath, dataUrl };
}

/**
 * Generate QR as data URL only (no file write)
 */
async function generateQRDataUrl(url) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

module.exports = { generateQR, generateQRDataUrl };
