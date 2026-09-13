import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Generates a cryptographically secure random unique QR token.
 * Example format: 8F29A7X2K91
 */
export function generateQRToken(length = 11): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars (0, O, 1, I)
  let token = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
}

/**
 * Generates a base64 Data URL representation of a QR Code for a given token string.
 */
export async function generateQRDataUrl(token: string): Promise<string> {
  try {
    return await QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    throw new Error('Failed to generate QR code data URL');
  }
}
