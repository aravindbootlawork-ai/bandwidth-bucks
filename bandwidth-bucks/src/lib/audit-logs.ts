'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getServerFirestore } from '@/lib/firebase-server';

export async function logAdminAction(
  adminEmail: string,
  action: 'approve_payout' | 'reject_payout' | 'reset_data' | 'suspend_user' | 'other',
  details: {
    userId?: string;
    payoutId?: string;
    amount?: number;
    reason?: string;
    [key: string]: any;
  }
) {
  try {
    const db = await getServerFirestore();
    const auditLogsCollection = collection(db, 'auditLogs');
    
    await addDoc(auditLogsCollection, {
      adminEmail,
      action,
      details,
      timestamp: serverTimestamp(),
      ipAddress: 'N/A', // Would need server-side IP detection
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    });
    
    console.log(`📋 Audit log: ${adminEmail} performed ${action}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to log admin action:', error);
    return { success: false, error };
  }
}
