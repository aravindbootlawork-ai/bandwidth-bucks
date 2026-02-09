'use server';

import crypto from 'crypto';
import { getServerFirestore } from '@/lib/firebase-server';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

/**
 * Generate TOTP secret for admin 2FA
 * Uses Time-based One-Time Password (TOTP) for 2FA
 */
export async function generateTOTPSecret(): Promise<string> {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Generate QR code URI for Google Authenticator/Authy
 */
export async function generateQRCodeURI(email: string, secret: string, issuer: string = 'BandwidthBucks'): Promise<string> {
  const label = encodeURIComponent(`${issuer} (${email})`);
  const secret_param = encodeURIComponent(secret);
  return `otpauth://totp/${label}?secret=${secret_param}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Verify TOTP token (code from authenticator app)
 * Allows for 30-second time window variance
 */
export async function verifyTOTPToken(secret: string, token: string): Promise<boolean> {
  try {
    const buf = Buffer.from(secret, 'base64');
    const time = Math.floor(Date.now() / 30000);
    
    // Check current and adjacent time window (±1 for clock skew)
    for (let i = -1; i <= 1; i++) {
      const hmac = crypto
        .createHmac('sha1', buf)
        .update(Buffer.from(String(time + i), 'utf-8'))
        .digest();
      
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000;
      
      const codeStr = String(code).padStart(6, '0');
      if (codeStr === token) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * User should save these in secure location
 */
export async function generateBackupCodes(count: number = 10): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4));
  }
  return codes;
}

/**
 * Hash backup code for storage (one-way)
 */
export async function hashBackupCode(code: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
}

/**
 * Log 2FA attempt for security audit
 */
export async function log2FAAttempt(
  adminEmail: string,
  success: boolean,
  method: '2fa-totp' | '2fa-backup',
  ipAddress?: string
) {
  try {
    const db = await getServerFirestore();
    
    await addDoc(collection(db, 'securityLogs'), {
      adminEmail,
      action: '2fa-attempt',
      method,
      success,
      ipAddress: ipAddress || 'unknown',
      userAgent: '',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log 2FA attempt:', error);
  }
}

/**
 * Check if admin has 2FA enabled
 */
export async function is2FAEnabled(adminEmail: string): Promise<boolean> {
  try {
    const db = await getServerFirestore();
    
    const adminDoc = await getDoc(doc(db, 'admins', adminEmail));
    return adminDoc.exists() && adminDoc.data()?.twoFactorEnabled === true;
  } catch (error) {
    console.error('Failed to check 2FA status:', error);
    return false;
  }
}
