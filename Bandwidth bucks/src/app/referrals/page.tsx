"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Gift, 
  Share2, 
  Copy, 
  ArrowLeft,
  CheckCircle2,
  BadgeIndianRupee,
  History,
  Info,
  Globe,
  Loader2,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import jsPDF from "jspdf";

export default function ReferralsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  // 1. నా రెఫరల్ కోడ్ (UID లో మొదటి 8 అక్షరాలతో)
  const referralCode = user ? `BW-${user.uid.slice(0, 8).toUpperCase()}` : "LOADING...";
  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/auth/signup?ref=${referralCode}`
    : `https://bandwidthbucks.com/signup?ref=${referralCode}`;

  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Firebase నుండి నా ఫ్రెండ్స్ ని తీసుకురావడం (Real Logic)
  useEffect(() => {
    if (!user || !db || !referralCode) return;

    // జస్ట్ కోడ్ మ్యాచ్ అయ్యే యూజర్స్ ని వెతకాలి
    const q = query(collection(db, "users"), where("referredBy", "==", referralCode));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: `${data.firstName || 'User'} ${data.lastName || ''}`,
          date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now',
          shared: data.totalBandwidthUsed || 0,
          // వాళ్ళ సంపాదనలో 10% మనకి కమిషన్
          commission: (data.totalEarnings || 0) * 0.10 
        });
      });
      setReferredUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, db, referralCode]);

  // గణాంకాలు (Stats)
  const totalReferrals = referredUsers.length;
  const totalCommission = referredUsers.reduce((acc, curr) => acc + curr.commission, 0);
  const activeReferrals = referredUsers.filter(u => u.shared > 0).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Share it with your friends to start earning.",
    });
  };

  const handleDownloadTerms = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("BandwidthBucks - Referral Program Terms", 14, 20);
    doc.setFontSize(11);
    doc.text(`1. You earn 10% of every friend's earnings for lifetime.`, 14, 30);
    doc.text(`2. Friends must join using your unique code: ${referralCode}`, 14, 38);
    doc.text(`3. Earnings are credited instantly to your wallet.`, 14, 46);
    doc.text(`4. Fake accounts or self-referrals will lead to ban.`, 14, 54);
    doc.save("Referral_Terms.pdf");
    toast({ title: "Downloaded", description: "Terms & Conditions PDF saved." });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-1">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Referral Program</h1>
            <p className="text-muted-foreground">Share the bandwidth, share the wealth.</p>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Gift className="w-64 h-64 -mr-10 -mt-10" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <BadgeIndianRupee className="w-12 h-12 mb-4 text-yellow-300" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Invite friends and earn 10% lifetime commission!
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Earn passive income for every GB of bandwidth your referrals share. 
              There's no limit to how many friends you can invite.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 max-w-md">
              <label className="text-xs uppercase font-bold text-white/60 mb-2 block">Your Referral Code</label>
              <div className="flex items-center justify-between gap-4">
                <code className="text-2xl font-mono font-bold tracking-wider">
                  {isUserLoading ? "..." : referralCode}
                </code>
                <Button size="sm" variant="secondary" onClick={handleCopy} className="gap-2">
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">Friends joined via your link</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{activeReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently sharing bandwidth</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">₹{totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total bonus received</p>
            </CardContent>
          </Card>
        </div>

        {/* Link Sharing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite with Link</CardTitle>
                <CardDescription>Share your unique link directly with friends or on social media.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input readOnly value={referralLink} className="bg-muted font-mono text-sm" />
                  <Button onClick={handleCopy} className="shrink-0">Copy Link</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center space-y-2 hover:bg-muted/50 transition">
                    <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">1. Share</h3>
                    <p className="text-xs text-muted-foreground">Send link to friends</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center space-y-2 hover:bg-muted/50 transition">
                    <div className="w-10 h-10 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">2. Join</h3>
                    <p className="text-xs text-muted-foreground">They sign up & share</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center space-y-2 hover:bg-muted/50 transition">
                    <div className="w-10 h-10 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <BadgeIndianRupee className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold">3. Earn</h3>
                    <p className="text-xs text-muted-foreground">Get 10% of their earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <CardTitle>Your Referrals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Joined Date</th>
                        <th className="px-6 py-4">Lifetime Shared</th>
                        <th className="px-6 py-4">Your Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                         <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                      ) : referredUsers.length > 0 ? (
                        referredUsers.map((user, i) => (
                          <tr key={i} className="hover:bg-accent/5 transition-colors">
                            <td className="px-6 py-4 font-bold">{user.name}</td>
                            <td className="px-6 py-4 text-muted-foreground">{user.date}</td>
                            <td className="px-6 py-4 font-semibold">{user.shared.toFixed(2)} GB</td>
                            <td className="px-6 py-4 text-green-600 font-bold">+ ₹{user.commission.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                            You haven't referred anyone yet. Start sharing your link!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader>
                <div className="flex items-center gap-2 text-blue-700">
                  <Info className="w-5 h-5" />
                  <CardTitle>Program Rules</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-blue-900">
                <ul className="space-y-3 list-disc pl-4">
                  <li>Bonus is calculated as 10% of referred users' pure bandwidth earnings.</li>
                  <li>Bonus is credited instantly when your friend's earnings are updated.</li>
                  <li>No limit on referrals per account.</li>
                  <li>Self-referral is strictly prohibited and leads to account suspension.</li>
                  <li>Friends must be new users to BandwidthBucks.</li>
                </ul>
                <Button variant="outline" className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={handleDownloadTerms}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Terms (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}