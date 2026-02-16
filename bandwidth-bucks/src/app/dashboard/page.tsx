"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Wallet, 
  Globe, 
  LogOut, 
  TrendingUp, 
  Cpu, 
  Info,
  Loader2,
  Download,
  Users,
  Play,
  Square,
  ShieldCheck,
  Laptop,
  Smartphone,
  User,       
  Settings    
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeMonthlyEarnings } from "@/ai/flows/summarize-monthly-earnings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { AchievementsUI } from '@/components/achievements-ui';
import { signOut } from "firebase/auth";
import { doc, updateDoc, increment } from "firebase/firestore";
// PWA Button Import
import { PWAInstallBtn } from "@/components/pwa-install-btn";

export default function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // --- REALITY SETTINGS ---
  const REAL_RATE_PER_GB = 3.00;     
  const DATA_CONSUMPTION = 0.01;     
  const TICK_INTERVAL = 3000;        
  // -------------------------

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: userData, isLoading: isDocLoading } = useDoc(userDocRef);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const userAvatarUrl = user?.photoURL || PlaceHolderImages.find(img => img.id === "dashboard-avatar")?.imageUrl;
  
  const isAdmin = user?.email === "aravindbootlawork@gmail.com";
  const isSharing = userData?.isSharing || false;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSharing && userDocRef) {
      interval = setInterval(() => {
        const earningsForThisTick = DATA_CONSUMPTION * REAL_RATE_PER_GB;

        updateDoc(userDocRef, {
          totalEarnings: increment(earningsForThisTick),
          totalBandwidthUsed: increment(DATA_CONSUMPTION)
        });
      }, TICK_INTERVAL); 
    }
    return () => clearInterval(interval);
  }, [isSharing, userDocRef]);

  const fetchSummary = async () => {
    if (!user || !userData) return;
    setIsSummaryLoading(true);
    try {
      const result = await summarizeMonthlyEarnings({
        userId: user.uid,
        monthlyEarnings: userData.totalEarnings || 0,
        bandwidthUsedInGB: userData.totalBandwidthUsed || 0
      });
      setAiSummary(result.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const toggleSharing = async () => {
    if (!userDocRef) return;
    
    const nextState = !isSharing;
    await updateDoc(userDocRef, {
      isSharing: nextState
    });

    toast({
      title: nextState ? "Sharing Started" : "Sharing Stopped",
      description: nextState ? "Your device is now monetizing idle bandwidth." : "Bandwidth monetization paused.",
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (isAuthLoading || (user && isDocLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const earnings = userData?.totalEarnings || 0;
  const bandwidthUsed = userData?.totalBandwidthUsed || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span className="text-xl font-headline font-bold text-primary">BandwidthBucks</span>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 mr-6">
            <Link href="/dashboard" className="text-sm font-bold text-primary">Dashboard</Link>
            <Link href="/wallet" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Wallet</Link>
            <Link href="/referrals" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Referrals</Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm font-bold text-secondary flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}
            
            {/* 🔥 CORRECT PLACE FOR PWA BUTTON 🔥 */}
            <PWAInstallBtn />
            
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 mr-4 cursor-pointer hover:bg-muted p-1 rounded-full transition-colors">
                 <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary">
                    {userAvatarUrl && <Image src={userAvatarUrl} alt="Avatar" fill className="object-cover" />}
                 </div>
                 <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user.displayName || "User"}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2 w-full">
                    <ShieldCheck className="w-4 h-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/referrals" className="flex items-center gap-2 w-full">
                  <Users className="w-4 h-4" />
                  Refer & Earn
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <LogOut className="w-4 h-4" />
                  Logout
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-secondary">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back, {user.displayName || "User"}! Here&apos;s your performance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={isSharing ? "destructive" : "default"} onClick={toggleSharing} className="font-bold">
              {isSharing ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isSharing ? "Stop Sharing" : "Start Sharing"}
            </Button>
            <Button variant="outline" onClick={fetchSummary} disabled={isSummaryLoading}>
              {isSummaryLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cpu className="w-4 h-4 mr-2" />}
              AI Insights
            </Button>
          </div>
        </div>

        {/* Sharing Banner */}
        {isSharing && (
          <Alert className="bg-green-50 border-green-200 animate-pulse">
            <Globe className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 font-bold">Node Active</AlertTitle>
            <AlertDescription className="text-green-700">
              Your device is currently sharing bandwidth. Earnings are accumulating.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/wallet">
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-primary cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₹{earnings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-1">${(earnings / 85.50).toFixed(2)} USD</div>
                <p className="text-xs text-muted-foreground mt-2">₹1500 Monthly Cap</p>
                <div className="mt-4">
                  <ProgressBar percentage={earnings > 0 ? Math.min((earnings / 1500) * 100, 100) : 0} />
                </div>
              </CardContent>
            </Card>
          </Link>
          <div className="md:col-span-2">
            <AchievementsUI />
          </div>
          <Link href="/analytics">
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-secondary cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Bandwidth Shared</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{bandwidthUsed.toFixed(1)} GB</div>
                <p className="text-xs text-muted-foreground">Updated in real-time</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/referrals">
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">0</div>
                <p className="text-xs text-muted-foreground">Invite friends to earn bonus</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/connection">
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <Globe className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{isSharing ? "Active" : "Idle"}</div>
                <p className="text-xs text-muted-foreground">Connected from Bangalore, IN</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* AI Summary and Payout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights */}
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>AI Earning Insights</CardTitle>
              </div>
              <CardDescription>
                Smart summary of your performance and tips to maximize revenue.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col justify-center">
              {isSummaryLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating your personalized summary...</p>
                </div>
              ) : aiSummary ? (
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed italic bg-accent/20 p-4 rounded-lg border border-primary/20">
                  &ldquo;{aiSummary}&rdquo;
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button variant="ghost" onClick={fetchSummary}>Click to generate insights</Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4" />
                Tips are updated based on your bandwidth trends.
              </div>
            </CardFooter>
          </Card>

          {/* Download App Card */}
          <Card className="shadow-md border-t-4 border-t-secondary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-secondary" />
                Get the App
              </CardTitle>
              <CardDescription>Install our background node to earn even when your browser is closed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-between h-14 font-bold">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>Android APK</span>
                </div>
                <Download className="w-4 h-4 opacity-50" />
              </Button>
              <Button variant="outline" className="w-full justify-between h-14 font-bold">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-secondary" />
                  <span>Windows .EXE</span>
                </div>
                <Download className="w-4 h-4 opacity-50" />
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-[10px] text-muted-foreground text-center w-full">
                Run our secure node to maximize your idle bandwidth sharing.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
