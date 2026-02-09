"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Search, 
  LayoutDashboard, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Trash2,
  Loader2,
  QrCode,
  Download,
  FileText,        // PDF Icon
  FileSpreadsheet  // Excel Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, getDocs, getDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { sendPayoutNotification } from "@/lib/email-service";
import { logAdminAction } from "@/lib/audit-logs";
import jsPDF from "jspdf"; // వాలెట్ పేజీ లాగే కేవలం jsPDF మాత్రమే వాడుతున్నాం

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "payouts">("users");

  // Authentication check
  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== "stayconnectedtoearn@gmail.com") {
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, router]);

  // Fetch all users
  const usersQuery = useMemoFirebase(() => collection(db, "users"), [db]);
  const { data: usersData, isLoading: isUsersLoading } = useCollection(usersQuery);

  const [payouts, setPayouts] = useState<any[]>([]);
  const [isPayoutsLoading, setIsPayoutsLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingPayoutId, setRejectingPayoutId] = useState<{ userId: string; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedQRPayout, setSelectedQRPayout] = useState<any>(null);

  const fetchPayouts = async () => {
    if (!usersData) return;
    setIsPayoutsLoading(true);
    const allPayouts: any[] = [];
    
    try {
      for (const u of usersData) {
        const pRef = collection(db, "users", u.id, "payoutRequests");
        const pSnap = await getDocs(pRef);
        pSnap.forEach(doc => {
          allPayouts.push({ 
            ...doc.data(), 
            id: doc.id, 
            userId: u.id,
            userName: `${u.firstName} ${u.lastName}`,
            userEmail: u.email,
            userUPI: u.upiId || null,
            userPayPal: u.paypalEmail || null
          });
        });
      }
      setPayouts(allPayouts.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setIsPayoutsLoading(false);
    }
  };

  useEffect(() => {
    if (usersData && activeTab === "payouts") {
      fetchPayouts();
    }
  }, [usersData, activeTab]);

  // --- 1. CSV EXPORT LOGIC (Excel Style) ---
  const handleExportCSV = () => {
    if (!usersData) return;
    const headers = ["First Name,Last Name,Email,Total Earnings (INR),Bandwidth Used (GB),Status"];
    const rows = usersData.map(u => {
      return `${u.firstName || ""},${u.lastName || ""},${u.email},${u.totalEarnings || 0},${u.totalBandwidthUsed || 0},Active`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BandwidthBucks_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: "User data exported successfully." });
  };

  // --- 2. PDF EXPORT LOGIC (Simple Text Style - Like Wallet) ---
  const handleExportPDF = () => {
    if (!usersData) return;
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text("BandwidthBucks - User List", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      
      let y = 40; // Starting height

      // Headers
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Name | Email | Earnings", 14, 35);
      doc.line(14, 37, 200, 37); // Underline

      // Loop through users
      doc.setTextColor(0);
      usersData.forEach((u) => {
        const line = `${u.firstName} ${u.lastName} - ${u.email} - Rs.${(u.totalEarnings || 0).toFixed(2)}`;
        
        // పేజీ నిండిపోతే కొత్త పేజీ యాడ్ చేయడం
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(line, 14, y);
        y += 10;
      });

      doc.save(`BandwidthBucks_Users_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "PDF Generated", description: "User list downloaded successfully." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not generate PDF." });
    }
  };

  const handleApprovePayout = async (userId: string, payoutId: string) => {
    try {
      const payoutRef = doc(db, "users", userId, "payoutRequests", payoutId);
      const payoutSnap = await getDoc(payoutRef);
      const payoutData = payoutSnap.data();
      
      const payout = payouts.find(p => p.id === payoutId && p.userId === userId);
      const userEmail = payout?.userEmail;
      
      await updateDoc(payoutRef, {
        status: "approved",
        processedDate: new Date().toISOString()
      });
      
      if (userEmail && payoutData) {
        await sendPayoutNotification(userEmail, {
          amount: payoutData.amount,
          currency: payoutData.currency,
          method: payoutData.payoutMethod,
          status: 'approved'
        });
      }
      
      if (user?.email && payoutData) {
        await logAdminAction(user.email, 'approve_payout', {
          userId,
          payoutId,
          amount: payoutData.amount,
          currency: payoutData.currency
        });
      }
      
      toast({ title: "Payout Approved", description: "The request has been marked as completed." });
      fetchPayouts();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not approve payout." });
    }
  };

  const handleRejectPayout = async () => {
    if (!rejectingPayoutId || !rejectReason.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please provide a rejection reason." });
      return;
    }

    try {
      const { userId, id: payoutId } = rejectingPayoutId;
      const payoutRef = doc(db, "users", userId, "payoutRequests", payoutId);
      const payoutSnap = await getDoc(payoutRef);
      const payoutData = payoutSnap.data();
      
      if (!payoutData) {
        toast({ variant: "destructive", title: "Error", description: "Payout request not found." });
        return;
      }

      const amountInINR = payoutData.currency === "INR" ? payoutData.amount : payoutData.amount * 83.5;

      await updateDoc(payoutRef, {
        status: "rejected",
        rejectionReason: rejectReason,
        processedDate: new Date().toISOString()
      });

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        totalEarnings: increment(amountInINR)
      });
      
      const payout = payouts.find(p => p.id === payoutId && p.userId === userId);
      const userEmail = payout?.userEmail;
      
      if (userEmail) {
        await sendPayoutNotification(userEmail, {
          amount: payoutData.amount,
          currency: payoutData.currency,
          method: payoutData.payoutMethod,
          status: 'rejected',
          reason: rejectReason
        });
      }
      
      if (user?.email) {
        await logAdminAction(user.email, 'reject_payout', {
          userId,
          payoutId,
          amount: payoutData.amount,
          currency: payoutData.currency,
          reason: rejectReason
        });
      }

      toast({ title: "Payout Rejected", description: "Amount refunded to user." });
      setRejectDialogOpen(false);
      setRejectingPayoutId(null);
      setRejectReason("");
      fetchPayouts();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not reject payout." });
    }
  };

  const handleResetAllData = async () => {
    if (!usersData) return;
    if (!confirm("Are you sure you want to reset all earnings and bandwidth for all users to zero?")) return;
    
    try {
      for (const u of usersData) {
        const uRef = doc(db, "users", u.id);
        await updateDoc(uRef, {
          totalEarnings: 0,
          totalBandwidthUsed: 0
        });
      }
      toast({ title: "Platform Reset", description: "All user stats have been set to zero." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not reset data." });
    }
  };

  const generateUPIString = (upiId: string, userName: string, amount: number) => {
    const sanitizedName = userName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 60);
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(sanitizedName)}&am=${amount}&tn=BandwidthBucks%20Payout&tr=${Date.now()}`;
  };

  const handleDownloadQRCode = () => {
    if (!selectedQRPayout) return;
    const imgElement = document.querySelector('#qr-code-image') as HTMLImageElement;
    if (imgElement) {
      const link = document.createElement('a');
      link.href = imgElement.src;
      link.download = `upi-qr-${selectedQRPayout.userEmail}-${selectedQRPayout.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredUsers = usersData?.filter(u => 
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isUserLoading || isUsersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-6 h-16 border-b flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-secondary" />
          <span className="font-headline font-bold text-xl">AdminPanel</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === "users" ? "bg-primary/10 text-primary font-bold" : "hover:bg-accent text-muted-foreground"}`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button 
            onClick={() => setActiveTab("payouts")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === "payouts" ? "bg-primary/10 text-primary font-bold" : "hover:bg-accent text-muted-foreground"}`}
          >
            <Clock className="w-5 h-5" />
            Payout Requests
          </button>
          <button 
            onClick={handleResetAllData}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-8"
          >
            <Trash2 className="w-5 h-5" />
            Reset All Data
          </button>
        </nav>
        <div className="p-4 border-t">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full justify-start gap-2">
              <ArrowLeft className="w-4 h-4" />
              Exit Admin
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-secondary">
              {activeTab === "users" ? "User Management" : "Payout Management"}
            </h1>
            <p className="text-muted-foreground">Monitoring global platform activity.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-10 w-full md:w-64" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button variant="outline" size="icon" onClick={() => activeTab === "payouts" ? fetchPayouts() : null}>
                <RefreshCw className={`w-4 h-4 ${isPayoutsLoading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </header>

        {activeTab === "users" ? (
          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>All registered users sharing bandwidth.</CardDescription>
              </div>
              <div className="flex gap-2">
                {/* PDF Button */}
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                {/* CSV Button */}
                <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Total Earnings</th>
                      <th className="px-6 py-4">Bandwidth</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-headline font-medium">₹{user.totalEarnings?.toFixed(2) || "0.00"}</td>
                        <td className="px-6 py-4 text-sm">{user.totalBandwidthUsed?.toFixed(2) || "0.00"} GB</td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Review and process withdrawal requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Account</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{p.userName}</span>
                            <span className="text-xs text-muted-foreground">{p.userEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{p.payoutMethod}</td>
                        <td className="px-6 py-4">
                          {p.payoutMethod === "UPI" && p.userUPI ? (
                            <button
                              onClick={() => {
                                setSelectedQRPayout(p);
                                setQrCodeDialogOpen(true);
                              }}
                              className="text-sm font-mono font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <QrCode className="w-4 h-4" />
                              {p.userUPI}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">{p.userPayPal || "N/A"}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-headline">
                          {p.currency === "INR" ? "₹" : "$"}{p.amount}
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={p.status === "pending" ? "outline" : "secondary"} className={`font-bold text-[10px] uppercase ${p.status === 'approved' ? 'bg-green-100 text-green-700' : ''}`}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 border-green-500 text-green-600 hover:bg-green-50"
                                onClick={() => handleApprovePayout(p.userId, p.id)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 border-red-500 text-red-600 hover:bg-red-50" 
                                onClick={() => {
                                  setRejectingPayoutId({ userId: p.userId, id: p.id });
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>Reason for rejection (will be sent to user):</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Invalid UPI ID provided."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectPayout}>Reject & Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Scan to Pay</DialogTitle></DialogHeader>
          {selectedQRPayout && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="p-4 bg-white border-2 border-primary rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateUPIString(selectedQRPayout.userUPI, selectedQRPayout.userName, selectedQRPayout.amount))}`}
                  alt="UPI QR Code"
                  className="w-full h-full"
                  id="qr-code-image"
                />
              </div>
              <p className="text-center font-bold">₹{selectedQRPayout.amount}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrCodeDialogOpen(false)}>Close</Button>
            <Button onClick={handleDownloadQRCode} className="gap-2"><Download className="w-4 h-4" /> Download QR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}