import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTPToken, hashBackupCode, log2FAAttempt } from '@/lib/2fa-service';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { getServerFirestore } from '@/lib/firebase-server';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, code, isBackupCode } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    if (!adminEmail || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const db = await getServerFirestore();
      const adminDocRef = doc(db, 'admins', adminEmail);
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        await log2FAAttempt(adminEmail, false, '2fa-totp', ipAddress);
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      const adminData = adminDoc.data();

      if (!adminData?.twoFactorEnabled) {
        return NextResponse.json({ error: '2FA not enabled for this account' }, { status: 400 });
      }

      let isValid = false;

      if (isBackupCode) {
        // Verify backup code
        const hashedCode = hashBackupCode(code);
        if (adminData.backupCodes?.includes(hashedCode)) {
          isValid = true;
          // Remove used backup code
          const updatedBackupCodes = adminData.backupCodes.filter((bc: string) => bc !== hashedCode);
          await updateDoc(adminDocRef, {
            backupCodes: updatedBackupCodes,
            backupCodesUsed: increment(1)
          });
        }
      } else {
        // Verify TOTP code
        if (verifyTOTPToken(adminData.twoFactorSecret, code)) {
          isValid = true;
        }
      }

      if (isValid) {
        await log2FAAttempt(adminEmail, true, isBackupCode ? '2fa-backup' : '2fa-totp', ipAddress);
        return NextResponse.json({
          success: true,
          message: '2FA verification successful'
        });
      } else {
        await log2FAAttempt(adminEmail, false, isBackupCode ? '2fa-backup' : '2fa-totp', ipAddress);
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
      }
    } catch (dbError) {
      console.error('Database error during 2FA verification:', dbError);
      await log2FAAttempt(adminEmail, false, '2fa-totp', ipAddress);
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('2FA login verification error:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  }
}
