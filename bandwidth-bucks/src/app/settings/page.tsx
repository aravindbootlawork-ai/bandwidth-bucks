"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // షాడ్-సిఎన్ స్విచ్ కాంపోనెంట్
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Shield, Zap, Moon, Laptop, LogOut, ArrowLeft } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [turboMode, setTurboMode] = useState(false);
  const [autoStart, setAutoStart] = useState(true);

  // అవతార్స్ లిస్ట్ (నువ్వు పంపిన ఇమేజ్ లో ఉన్నవి)
  const avatars = [
    "/avatars/avatar-1.png", // ఇవి నీ దగ్గర లేకపోతే ప్లేస్‌హోల్డర్స్ వాడతాం
    "/avatars/avatar-2.png",
    "/avatars/avatar-3.png",
    "/avatars/avatar-4.png",
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and node configuration.</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="node">Node Config</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* 1. GENERAL TAB (Profile & Avatar) */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Configuration</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Choose Your Avatar</Label>
                  <div className="flex gap-4 flex-wrap">
                    {/* Demo Avatars - క్లిక్ చేస్తే సెలెక్ట్ అవుతాయి */}
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedAvatar(i)}
                        className={`cursor-pointer rounded-full p-1 border-2 transition-all ${selectedAvatar === i ? "border-primary scale-110" : "border-transparent hover:border-gray-200"}`}
                      >
                         <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                           {/* ఇక్కడ మనం ప్లేస్‌హోల్డర్ ఇమేజ్ వాడుతున్నాం, తర్వాత నీ ఇమేజెస్ పెట్టొచ్చు */}
                           <Image 
                             src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`} 
                             alt="Avatar" 
                             fill 
                           />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={user?.displayName || ""} placeholder="Your Name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email || ""} disabled className="bg-muted" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card className="border-red-100">
               <CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader>
               <CardContent>
                 <Button variant="destructive" onClick={handleLogout} className="gap-2">
                   <LogOut className="w-4 h-4" /> Log Out
                 </Button>
               </CardContent>
            </Card>
          </TabsContent>

          {/* 2. NODE CONFIG TAB (Turbo Mode Here!) */}
          <TabsContent value="node" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-primary" />
                  Performance Settings
                </CardTitle>
                <CardDescription>Control how your device shares bandwidth.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Auto Start */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <div className="font-bold">Auto-Start Node</div>
                    <div className="text-xs text-muted-foreground">Start sharing automatically when browser opens.</div>
                  </div>
                  <Switch checked={autoStart} onCheckedChange={setAutoStart} />
                </div>

                {/* TURBO MODE */}
                <div className="flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-lg">
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2 text-purple-700">
                      <Zap className="w-4 h-4 fill-purple-700" />
                      Turbo Mode (Night Owl)
                    </div>
                    <div className="text-xs text-purple-600/80">
                      Automatically double bandwidth sharing between 12 AM - 6 AM.
                      <span className="block mt-1 font-semibold">Earn 2x rewards during these hours.</span>
                    </div>
                  </div>
                  <Switch checked={turboMode} onCheckedChange={setTurboMode} className="data-[state=checked]:bg-purple-600" />
                </div>

                {/* Battery Saver */}
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div className="space-y-0.5">
                    <div className="font-bold">Battery Saver</div>
                    <div className="text-xs text-muted-foreground">Pause sharing when battery is below 20%. (Coming Soon)</div>
                  </div>
                  <Switch disabled />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. BILLING TAB */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout Methods</CardTitle>
                <CardDescription>Manage your UPI and PayPal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-4 border rounded bg-muted/20">
                    <div className="text-sm font-bold">UPI ID</div>
                    <Input placeholder="username@oksbi" className="mt-2" />
                 </div>
                 <div className="p-4 border rounded bg-muted/20">
                    <div className="text-sm font-bold">PayPal Email</div>
                    <Input placeholder="email@example.com" className="mt-2" />
                 </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave}>Update Billing Info</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}