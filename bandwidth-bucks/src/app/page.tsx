
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet, Globe, ShieldCheck, Zap, Download, Laptop, Smartphone, CheckCircle2, Lock } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === "hero-bg");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span className="text-xl font-headline font-bold text-primary">BandwidthBucks</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">
            How it Works
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth/login">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center px-4">
          <div className="container grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary leading-tight">
                  Turn Your Idle Internet Into Real Cash
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                  BandwidthBucks allows you to securely monetize your unused internet bandwidth. Easy setup, real-time earnings, and fast payouts.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center lg:justify-start">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full min-[400px]:w-auto font-bold shadow-lg shadow-primary/20">
                    Start Earning Now
                  </Button>
                </Link>
                <Link href="#downloads">
                  <Button variant="outline" size="lg" className="w-full min-[400px]:w-auto font-bold">
                    Download Apps
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover"
                  priority
                  data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-20 bg-white flex justify-center px-4">
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl text-secondary">Simple 3-Step Setup</h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground">Monetizing your internet has never been this easy or secure.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Create Account",
                  description: "Sign up in seconds and get your unique referral code instantly."
                },
                {
                  step: "02",
                  title: "Run the Node",
                  description: "Download our app for Windows or Android to start sharing background bandwidth."
                },
                {
                  step: "03",
                  title: "Withdraw Earnings",
                  description: "Hit the threshold and withdraw directly to your UPI or PayPal account."
                }
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-2xl border bg-accent/5 hover:bg-accent/10 transition-colors">
                  <span className="text-5xl font-headline font-bold text-primary/10 absolute top-4 right-6">{item.step}</span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="w-full py-20 bg-secondary text-white flex justify-center px-4">
          <div className="container grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">Your Privacy is Our Priority</h2>
              <p className="text-secondary-foreground/80 leading-relaxed">
                We only use your unused bandwidth to help companies perform web indexing and data analysis. We never access your personal files, browsing history, or private data.
              </p>
              <div className="space-y-4">
                {[
                  "No access to personal data",
                  "Encrypted connection nodes",
                  "Automated privacy filters",
                  "Transparent usage monitoring"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Military Grade Encryption</h4>
                  <p className="text-xs text-white/60">AES-256 Protocol active for all nodes</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4 animate-pulse" />
                </div>
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>SECURE_TUNNEL_01</span>
                  <span>ENCRYPTED</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="downloads" className="w-full py-20 bg-white flex justify-center px-4">
          <div className="container space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-headline font-bold tracking-tighter text-secondary">Start Sharing Today</h2>
              <p className="text-muted-foreground max-w-[700px] mx-auto">
                Download our lightweight nodes for your devices. Run them in the background and watch your balance grow.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="group p-8 border rounded-2xl hover:border-primary hover:shadow-xl transition-all duration-300 bg-white">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Android App</h3>
                <p className="text-muted-foreground mb-6">Earn from your phone or tablet. Low battery impact, high earnings potential.</p>
                <Button className="w-full gap-2 font-bold shadow-md" size="lg">
                  <Download className="w-5 h-5" />
                  Download APK
                </Button>
              </div>
              <div className="group p-8 border rounded-2xl hover:border-secondary hover:shadow-xl transition-all duration-300 bg-white">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
                  <Laptop className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Windows Node</h3>
                <p className="text-muted-foreground mb-6">The most powerful way to earn. Install on your PC or laptop for maximum throughput.</p>
                <Button variant="secondary" className="w-full gap-2 font-bold shadow-md" size="lg">
                  <Download className="w-5 h-5" />
                  Download .EXE
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-12 bg-white flex flex-col items-center justify-center px-4">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link className="flex items-center justify-center gap-2" href="/">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xl font-headline font-bold text-primary">BandwidthBucks</span>
            </Link>
            <p className="text-xs text-muted-foreground text-center md:text-left">
              The world's first secure community-powered<br />bandwidth sharing network.
            </p>
          </div>
          <nav className="flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">Platform</span>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#how-it-works">How it Works</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#downloads">Downloads</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">Legal</span>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#">Terms</Link>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#">Privacy</Link>
            </div>
          </nav>
        </div>
        <div className="container mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-[10px] text-muted-foreground">© 2024 BandwidthBucks. All rights reserved.</p>
           <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-6 h-6 rounded-full bg-muted" />
           </div>
        </div>
      </footer>
    </div>
  );
}
