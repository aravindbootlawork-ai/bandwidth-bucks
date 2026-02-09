'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateDoc, doc } from 'firebase/firestore';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';

export function KycUpload() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user!.uid);
  }, [db, user?.uid]);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !userDocRef) return;
    setIsUploading(true);
    try {
      // Read file as Data URL (simple prototype). In production, upload to Firebase Storage instead.
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await updateDoc(userDocRef, {
          kycDocument: {
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
            uploadedAt: new Date().toISOString(),
            verified: false
          }
        });
        toast({ title: 'KYC Uploaded', description: 'Document uploaded. Admin will review it shortly.' });
        setFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload KYC document.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold">KYC Document</Label>
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file || isUploading}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Upload an ID document (passport, Aadhar, driving license) for verification.</p>
    </div>
  );
}
