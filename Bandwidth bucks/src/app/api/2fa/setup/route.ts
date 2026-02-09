import { NextRequest, NextResponse } from 'next/server';
import { generateTOTPSecret, generateQRCodeURI, generateBackupCodes } from '@/lib/2fa-service';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail } = await request.json();

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 });
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret();
    
    // Generate QR code URI
    const qrCodeUri = generateQRCodeURI(adminEmail, secret);

    // Store secret temporarily in session/cache (in production, use Redis or similar)
    // For now, return it to client (will be stored in state during setup)
    
    return NextResponse.json({
      secret,
      qrCodeUri,
      message: 'Scan the QR code with your authenticator app'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to initiate 2FA setup' }, { status: 500 });
  }
}
