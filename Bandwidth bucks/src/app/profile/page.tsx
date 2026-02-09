"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useUser();
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">My Profile</h1>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary text-center">
          <CardHeader>
            <div className="relative w-24 h-24 mx-auto mb-4">
               {/* యూజర్ సెలెక్ట్ చేసిన అవతార్ ఇక్కడ కనిపిస్తుంది */}
               <Image 
                 src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                 alt="Profile" 
                 fill 
                 className="rounded-full border-4 border-primary/20 object-cover"
               />
            </div>
            <CardTitle className="text-2xl">{user?.displayName || "User"}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              <Shield className="w-3 h-3 mr-1" /> Verified Member
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
             <div className="p-3 border rounded flex items-center gap-3">
               <User className="text-muted-foreground" />
               <div><p className="font-bold">Name</p><p className="text-sm">{user?.displayName}</p></div>
             </div>
             <div className="p-3 border rounded flex items-center gap-3">
               <Mail className="text-muted-foreground" />
               <div><p className="font-bold">Email</p><p className="text-sm">{user?.email}</p></div>
             </div>
             <Link href="/settings" className="block mt-4">
                <Button variant="outline" className="w-full">Edit Profile</Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}