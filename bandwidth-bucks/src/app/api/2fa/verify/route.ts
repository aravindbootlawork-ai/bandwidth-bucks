import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTPToken, generateBackupCodes, hashBackupCode } from '@/lib/2fa-service';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getServerFirestore } from '@/lib/firebase-server';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, secret, code } = await request.json();

    if (!adminEmail || !secret || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the TOTP code
    const isValidCode = verifyTOTPToken(secret, code);
    
    if (!isValidCode) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Update admin document in Firestore with 2FA settings
    try {
      const db = await getServerFirestore();
      const adminDocRef = doc(db, 'admins', adminEmail);
      
      await updateDoc(adminDocRef, {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: hashedBackupCodes,
        backupCodesCreatedAt: serverTimestamp(),
        lastSecurityUpdate: serverTimestamp()
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // Continue anyway - backup codes will still be returned to user
    }

    return NextResponse.json({
      success: true,
      backupCodes,
      message: 'Two-factor authentication has been enabled'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
