'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TwoFactorSetupProps {
  adminEmail: string;
  onSetupComplete: () => void;
}

export function TwoFactorSetup({ adminEmail, onSetupComplete }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInitiate2FA = async () => {
    try {
      // In a real implementation, this would call your backend
      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail })
      });

      if (!response.ok) throw new Error('Failed to initiate 2FA setup');
      
      const data = await response.json();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setStep('verify');

      toast({
        title: 'Scan with Authenticator',
        description: 'Use Google Authenticator, Authy, or similar app to scan the QR code.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initiate 2FA setup.',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit code.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          secret,
          code: verificationCode
        })
      });

      if (!response.ok) throw new Error('Code verification failed');
      
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep('backup');

      toast({
        title: 'Code Verified',
        description: 'Save your backup codes in a secure location.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'The code you entered is invalid. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodes = () => {
    const text = `BandwidthBucks 2FA Backup Codes\n\nAdmin: ${adminEmail}\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.join('\n')}\n\n⚠️ KEEP THESE CODES SAFE!\nIf you lose access to your authenticator app, you'll need these codes to regain access.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2fa-backup-codes-${adminEmail}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    setStep('complete');
    toast({
      title: '2FA Enabled',
      description: 'Two-factor authentication is now active on your account.',
    });
    onSetupComplete();
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Protect your admin account with 2FA using an authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Security Recommendation</AlertTitle>
              <AlertDescription>
                2FA adds an extra layer of security to your admin account.
              </AlertDescription>
            </Alert>
            <Button onClick={handleInitiate2FA} className="w-full" size="lg">
              Start Setup
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Use an authenticator app like Google Authenticator or Authy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold">Can't scan QR code?</Label>
              <p className="text-xs text-muted-foreground break-all">
                Enter this code manually: <code className="bg-muted p-1 rounded">{secret}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <Button 
              onClick={handleVerifyCode} 
              disabled={isVerifying || verificationCode.length < 6}
              className="w-full"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify Code
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle>Save Backup Codes</CardTitle>
            <CardDescription>
              Save these codes in a secure location for account recovery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                If you lose access to your authenticator app, you'll need these codes to regain access to your account.
              </AlertDescription>
            </Alert>

            <div className="relative">
              <div 
                className={`p-4 bg-muted rounded-lg border transition-all ${showBackupCodes ? 'border-primary' : 'border-dashed'}`}
              >
                {showBackupCodes ? (
                  <div className="font-mono text-xs space-y-1">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-muted-foreground">
                        {code}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm">
                    Click to reveal backup codes
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={handleCopyCode}
                disabled={!showBackupCodes}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={handleDownloadCodes}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">2FA Enabled</CardTitle>
            <CardDescription>
              Your account is now protected with two-factor authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Next time you log in, you'll be prompted to enter a code from your authenticator app.
            </p>
            <Button className="w-full" onClick={onSetupComplete}>
              Return to Admin Panel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
