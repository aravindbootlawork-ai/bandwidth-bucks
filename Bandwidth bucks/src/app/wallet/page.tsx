
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  History, 
  Landmark, 
  ArrowLeft, 
  Mail, 
  CreditCard, 
  Loader2, 
  Clock, 
  CheckCircle2,
  BadgeIndianRupee,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  FileText,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, orderBy, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { validateAndExplainPayoutRequest } from "@/ai/flows/validate-and-explain-payout-request";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateEarningReportHTML } from "@/lib/reports-generator";
import { KycUpload } from '@/components/kyc-upload';
import jsPDF from 'jspdf';

export default function WalletPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  // Fetch real transaction history (payout requests)
  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "users", user.uid, "payoutRequests"),
      orderBy("requestDate", "desc")
    );
  }, [db, user?.uid]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  const [editing, setEditing] = useState<"upi" | "paypal" | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  // Payout Request States
  const [payoutMethod, setPayoutMethod] = useState<"UPI" | "PayPal">("UPI");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isPayoutValidating, setIsPayoutValidating] = useState(false);
  const [payoutValidation, setPayoutValidation] = useState<{ isValid: boolean; explanation: string } | null>(null);

  const handleStartEdit = (method: "upi" | "paypal") => {
    setEditing(method);
    setTempValue(method === "upi" ? userData?.upiId || "" : userData?.paypalEmail || "");
  };

  const handleSave = async (method: "upi" | "paypal") => {
    if (!userDocRef) return;

    try {
      await updateDoc(userDocRef, {
        [method === "upi" ? "upiId" : "paypalEmail"]: tempValue
      });
      setEditing(null);
      toast({
        title: "Settings Updated",
        description: `Your ${method.toUpperCase()} ${method === 'upi' ? 'ID' : 'Email'} has been saved.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    }
  };

  const handleValidatePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter a valid payout amount." });
      return;
    }

    setIsPayoutValidating(true);
    try {
      const result = await validateAndExplainPayoutRequest({
        payoutMethod,
        payoutAmount: amount,
        userEarnings: userData?.totalEarnings || 0,
        exchangeRate: 83.5
      });
      setPayoutValidation(result);
      
      if (result.isValid) {
        toast({ title: "Validation successful", description: "Your payout request meets all criteria." });
      } else {
        toast({ variant: "destructive", title: "Validation failed", description: result.explanation });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to validate payout request." });
    } finally {
      setIsPayoutValidating(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutValidation?.isValid || !userDocRef || !user) return;
    
    const amount = parseFloat(payoutAmount);
    const inrValue = payoutMethod === "UPI" ? amount : amount * 83.5;

    try {
      // 1. Create the payout request document
      const requestsRef = collection(db, "users", user.uid, "payoutRequests");
      await addDoc(requestsRef, {
        userId: user.uid,
        amount: amount,
        currency: payoutMethod === "UPI" ? "INR" : "USD",
        payoutMethod: payoutMethod,
        status: "pending",
        requestDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      // 2. Deduct the amount from user's balance
      await updateDoc(userDocRef, {
        totalEarnings: increment(-inrValue)
      });

      toast({
        title: "Payout Requested",
        description: `Your ${payoutMethod} payout of ${payoutAmount} ${payoutMethod === "UPI" ? "INR" : "USD"} is being processed.`,
      });
      
      setPayoutAmount("");
      setPayoutValidation(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit payout request." });
    }
  };

  const handleDownloadReport = () => {
    if (!userData || !user) {
      toast({ variant: "destructive", title: "Error", description: "User data not loaded." });
      return;
    }

    setIsDownloadingReport(true);
    try {
      // Prepare monthly data from transaction history
      const monthlyMap: Record<string, { earnings: number; bandwidthGB: number }> = {};
      
      transactions?.forEach((tx) => {
        const date = new Date(tx.requestDate);
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { earnings: 0, bandwidthGB: 0 };
        }
        monthlyMap[month].earnings += tx.amount;
      });

      const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        earnings: data.earnings,
        bandwidthGB: data.bandwidthGB || 0
      }));

      // Prepare payout history
      const payoutHistory = (transactions || []).map((tx) => ({
        date: new Date(tx.requestDate).toLocaleDateString(),
        amount: tx.amount,
        method: tx.payoutMethod,
        status: tx.status
      }));

      // Generate HTML report
      const html = generateEarningReportHTML({
        firstName: userData.firstName || "User",
        lastName: userData.lastName || "",
        email: user.email || "",
        totalEarnings: userData.totalEarnings || 0,
        monthlyData,
        payoutHistory
      });

      // Download as HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earning-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your earning report has been downloaded as an HTML file.",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate report." });
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!userData || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User data not loaded.' });
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('BandwidthBucks - Earning Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Name: ${userData.firstName || 'User'} ${userData.lastName || ''}`, 14, 30);
      doc.text(`Email: ${user.email || ''}`, 14, 36);
      doc.text(`Total Earnings: ₹${(userData.totalEarnings || 0).toFixed(2)}`, 14, 44);

      // Payout history
      doc.setFontSize(12);
      doc.text('Payout History', 14, 58);
      let y = 66;
      (transactions || []).slice(0, 12).forEach((tx, i) => {
        const line = `${new Date(tx.requestDate).toLocaleDateString()} - ${tx.currency === 'INR' ? '₹' : '$'}${tx.amount} - ${tx.payoutMethod} - ${tx.status}`;
        doc.setFontSize(10);
        doc.text(line, 14, y);
        y += 8;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`earning-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'PDF Generated', description: 'Earning PDF has been downloaded.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate PDF.' });
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      <header className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-headline font-bold text-secondary">My Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and secure payout methods.</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="shadow-md border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg">Earnings Overview</CardTitle>
              <CardDescription>Real-time balance across all nodes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-6 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Balance</span>
                  <span className="text-3xl font-bold text-primary">
                    ₹{userData?.totalEarnings?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    ${((userData?.totalEarnings || 0) / 85.50).toFixed(2)} USD
                  </span>
                </div>
                <Wallet className="w-10 h-10 text-primary opacity-20" />
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Monthly Cap Usage</span>
                <span className="text-lg font-bold text-secondary">
                  {((userData?.totalEarnings || 0) / 5000 * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payout Request Section - Moved from Dashboard */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Wallet className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Request Payout</CardTitle>
              </div>
              <CardDescription>
                Withdraw your earnings to your saved methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Payout Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={payoutMethod === "UPI" ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => { setPayoutMethod("UPI"); setPayoutValidation(null); }}
                  >
                    <BadgeIndianRupee className="w-4 h-4" />
                    UPI
                  </Button>
                  <Button 
                    variant={payoutMethod === "PayPal" ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => { setPayoutMethod("PayPal"); setPayoutValidation(null); }}
                  >
                    <DollarSign className="w-4 h-4" />
                    PayPal
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({payoutMethod === "UPI" ? "INR" : "USD"})</Label>
                <div className="flex gap-2">
                  <Input 
                    id="amount" 
                    placeholder={payoutMethod === "UPI" ? "Min 50" : "Min 1.00"} 
                    value={payoutAmount}
                    onChange={(e) => { setPayoutAmount(e.target.value); setPayoutValidation(null); }}
                  />
                  <Button onClick={handleValidatePayout} disabled={isPayoutValidating || !payoutAmount}>
                    {isPayoutValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                  </Button>
                </div>
              </div>

              {payoutValidation && (
                <Alert variant={payoutValidation.isValid ? "default" : "destructive"} className={payoutValidation.isValid ? "bg-green-50 border-green-200" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{payoutValidation.isValid ? "Valid Request" : "Invalid Request"}</AlertTitle>
                  <AlertDescription>{payoutValidation.explanation}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full font-bold" 
                size="lg" 
                disabled={!payoutValidation?.isValid}
                onClick={handleRequestPayout}
              >
                Confirm Payout Request
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="shadow-md h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Payout Destinations</CardTitle>
            <CardDescription>Where should we send your money?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">UPI ID</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-accent/10">
                <div className="p-2 rounded-md bg-white text-primary">
                  <Landmark className="w-4 h-4" />
                </div>
                {isUserLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing === "upi" ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={tempValue}
                      placeholder="username@bank"
                      className="h-9"
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSave("upi")}>Save</Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm ${!userData?.upiId ? 'text-muted-foreground italic' : 'font-medium'}`}>
                      {userData?.upiId || "No UPI ID set"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 text-primary font-bold" onClick={() => handleStartEdit("upi")}>
                      {userData?.upiId ? "Change" : "Add"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">PayPal Email</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-accent/10">
                <div className="p-2 rounded-md bg-white text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                {isUserLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing === "paypal" ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="email"
                      value={tempValue}
                      placeholder="name@example.com"
                      className="h-9"
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSave("paypal")}>Save</Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm ${!userData?.paypalEmail ? 'text-muted-foreground italic' : 'font-medium'}`}>
                      {userData?.paypalEmail || "No PayPal Email set"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 text-primary font-bold" onClick={() => handleStartEdit("paypal")}>
                      {userData?.paypalEmail ? "Change" : "Add"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md overflow-hidden">
        <CardHeader className="bg-muted/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-secondary" />
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadReport}
              disabled={isDownloadingReport || !transactions || transactions.length === 0}
              className="gap-2"
            >
              {isDownloadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloadingReport ? "Generating..." : "Download Report"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF}
              disabled={!transactions || transactions.length === 0}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isTxLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {new Date(tx.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 uppercase font-bold text-[10px] tracking-wider text-muted-foreground">
                        {tx.payoutMethod}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {tx.currency === "INR" ? "₹" : "$"}{tx.amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <Badge variant={tx.status === "pending" ? "outline" : "secondary"} className={`font-bold text-[10px] uppercase gap-1 w-fit ${tx.status === 'approved' ? 'bg-green-100 text-green-700' : tx.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}`}>
                            {tx.status === "pending" ? <Clock className="w-3 h-3" /> : tx.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {tx.status}
                          </Badge>
                          {tx.status === "rejected" && tx.rejectionReason && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                              <span className="font-bold">Reason:</span> {tx.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-8 h-8 opacity-20" />
                        <p>Your transaction history will appear here once you request a payout.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
