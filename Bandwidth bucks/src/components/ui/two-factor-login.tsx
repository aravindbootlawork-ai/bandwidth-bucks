'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TwoFactorLoginProps {
  adminEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorLogin({ adminEmail, onSuccess, onCancel }: TwoFactorLoginProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a code');
      return;
    }

    if (!useBackupCode && code.length !== 6) {
      setError('Authenticator code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/2fa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          code: code.replace(/-/g, ''),
          isBackupCode: useBackupCode
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      toast({
        title: 'Verified',
        description: '2FA verification successful. Logging you in...',
      });

      // Call onSuccess callback
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMsg);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: errorMsg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {useBackupCode ? 'Enter a backup code' : 'Enter the 6-digit code from your authenticator app'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">
            {useBackupCode ? 'Backup Code' : 'Authentication Code'}
          </Label>
          <Input
            id="code"
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d\-]/g, ''))}
            disabled={isVerifying}
            className={useBackupCode ? '' : 'text-center text-lg tracking-widest'}
            maxLength={useBackupCode ? 9 : 6}
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !code}
            className="flex-1"
          >
            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Verify
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isVerifying}>
            Cancel
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode('');
            setError('');
          }}
          className="text-xs text-primary hover:underline block mx-auto"
        >
          {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
        </button>
      </CardContent>
    </Card>
  );
}
