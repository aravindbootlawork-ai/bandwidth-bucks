"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function SignupForm() {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  // URL లో కోడ్ ఉంటే అది తీసుకుంటుంది, లేకపోతే ఖాళీగా ఉంటుంది (యూజర్ టైప్ చేయొచ్చు)
  const [referralCode, setReferralCode] = useState(urlRef || ""); 
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  // ఒకవేళ పేజీ లోడ్ అయ్యాక URL మారితే (rare case), బాక్స్ ని అప్‌డేట్ చేద్దాం
  useEffect(() => {
    if (urlRef) {
      setReferralCode(urlRef);
    }
  }, [urlRef]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Initialize user profile in Firestore
      if (db) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          authId: user.uid,
          firstName: name.split(" ")[0] || "",
          lastName: name.split(" ").slice(1).join(" ") || "",
          email: email,
          emailVerified: false,
          dateJoined: new Date().toISOString(),
          isAdmin: email === "stayconnectedtoearn@gmail.com",
          totalEarnings: 0,
          totalBandwidthUsed: 0,
          // ఇక్కడ మనం స్టేట్ లో ఉన్న కోడ్ ని వాడుతున్నాం
          referredBy: referralCode ? referralCode.toUpperCase() : null,
          kycVerified: false,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: "Account created!",
        description: "Welcome to BandwidthBucks. Start earning now!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
            <Globe className="w-7 h-7" />
          </div>
        </div>
        <CardTitle className="text-2xl font-headline font-bold text-primary">Create an account</CardTitle>
        <CardDescription>
          Join thousands earning daily with BandwidthBucks
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* --- కొత్త REFERRAL CODE INPUT FIELD --- */}
          <div className="grid gap-2">
            <Label htmlFor="referral" className="flex justify-between">
              Referral Code 
              <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
            </Label>
            <Input
              id="referral"
              placeholder="Ex: BW-5BHIVGFT"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />
          </div>
          {/* --------------------------------------- */}

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full font-bold" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-bold">
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-primary" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}