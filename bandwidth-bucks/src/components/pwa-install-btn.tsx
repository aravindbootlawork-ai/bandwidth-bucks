"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PWAInstallBtn() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isInstalled) {
      toast({ title: "Already Installed", description: "App is running in standalone mode." });
      return;
    }
    
    if (!deferredPrompt) {
      // Prompt లేకపోయినా బటన్ చూపిస్తున్నాం కాబట్టి, క్లిక్ చేస్తే మెసేజ్ ఇద్దాం
      toast({ 
        title: "Install from Browser", 
        description: "Click the install icon (Computer/Down Arrow) in your address bar." 
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // --- మార్పు ఇక్కడే: కండిషన్ తీసేసాను, ఇప్పుడు ఎప్పుడూ కనిపిస్తుంది ---
  // if (!deferredPrompt || isInstalled) return null; 

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleInstall} 
      className="hidden md:flex gap-2 border-primary text-primary hover:bg-primary/10 font-bold"
    >
      {isInstalled ? <CheckCircle2 className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
      {isInstalled ? "Installed" : "Install App"}
    </Button>
  );
}