"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/configs/supabase/client";
import { unlinkGoogleIdentity } from "@/actions/auth-action";
import { Loader2, Link2, Unlink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  providers?: string[];
};

export function ConnectedAccountSection({ providers = [] }: Props) {
  const isGoogleConnected = providers.includes("google");
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLinking(false);
    }
    // Jika sukses, browser akan otomatis ter-redirect ke Google
  };

  const handleUnlinkGoogle = async () => {
    setIsUnlinking(true);
    const res = await unlinkGoogleIdentity();
    
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error || "Gagal memutus tautan akun Google");
    }
    
    setIsUnlinking(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connected Account</CardTitle>
        <CardDescription>
          Kelola akun pihak ketiga yang terhubung dengan CatatZ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              {/* Google G Logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isGoogleConnected ? "Terhubung" : "Belum terhubung"}
              </p>
            </div>
          </div>
          
          <div className="shrink-0">
            {isGoogleConnected ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    {isUnlinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink className="w-4 h-4 mr-2" />}
                    Putuskan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Putuskan tautan Google?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda tidak akan bisa lagi login menggunakan akun Google ini. Pastikan Anda sudah mengatur kata sandi (password) jika ini adalah satu-satunya metode login Anda.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleUnlinkGoogle}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {isUnlinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Ya, Putuskan"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="h-8 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
              >
                {isLinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Hubungkan
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
