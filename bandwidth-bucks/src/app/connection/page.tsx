
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Laptop, Smartphone, Monitor, Signal, RefreshCw, ShieldCheck, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function ConnectionPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Connection Status Updated",
        description: userData?.isSharing ? "Active node detected." : "No active nodes detected. Please start sharing from the dashboard.",
      });
    }, 1500);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "desktop": return <Monitor className="w-5 h-5" />;
      case "mobile": return <Smartphone className="w-5 h-5" />;
      case "laptop": return <Laptop className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  // Simulated active devices based on sharing state
  const devices = userData?.isSharing ? [
    {
      id: "primary-node",
      name: "Current Web Session",
      type: "desktop",
      ip: "157.34.12.92",
      location: "Bangalore, IN",
      speed: "1.2 MB/s",
      status: "online"
    }
  ] : [];

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-secondary">Connection Center</h1>
            <p className="text-muted-foreground">Monitor and manage your active bandwidth sharing devices.</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Nodes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-primary/20 bg-primary/5 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Signal className="w-5 h-5 text-primary" />
              Network Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Global Status</span>
              <Badge variant={userData?.isSharing ? "default" : "secondary"} className={userData?.isSharing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                {userData?.isSharing ? "Active" : "Idle"}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Nodes</span>
              <span className="font-bold">{devices.length} / 1</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Avg. Latency</span>
              <span className="font-bold">{userData?.isSharing ? "42 ms" : "-- ms"}</span>
            </div>
            <div className="pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              All connections are encrypted
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>A list of devices currently contributing to your earnings.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-4">Device</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Throughput</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <tr key={device.id} className="hover:bg-accent/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {getDeviceIcon(device.type)}
                              </div>
                              <span className="font-medium">{device.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{device.ip}</td>
                          <td className="px-6 py-4 text-muted-foreground">{device.location}</td>
                          <td className="px-6 py-4 font-semibold">{device.speed}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                              <span className="capitalize text-xs">{device.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-4 py-8">
                            <Monitor className="w-12 h-12 opacity-20" />
                            <div className="space-y-2">
                              <p className="text-lg font-bold text-secondary">No devices connected</p>
                              <p className="text-sm">Install our node software on your other devices to maximize your earnings.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                              <Button className="gap-2">
                                <Smartphone className="w-4 h-4" />
                                Download Android APK
                              </Button>
                              <Button variant="secondary" className="gap-2">
                                <Laptop className="w-4 h-4" />
                                Download Windows Node
                              </Button>
                            </div>
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
      </div>
    </div>
  );
}
