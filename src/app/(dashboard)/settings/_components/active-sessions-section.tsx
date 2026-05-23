"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Laptop, Smartphone, Globe, LogOut } from "lucide-react";
import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "@/actions/session-action";
import { toast } from "sonner";
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
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type SessionInfo = {
  id: string;
  device_id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  last_active_at: string;
};

export function ActiveSessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    const res = await getActiveSessions();
    if (res.success && res.data) {
      setSessions(res.data.sessions);
      setCurrentDeviceId(res.data.current_device_id);
    } else {
      toast.error("Gagal memuat sesi aktif");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    const res = await revokeSession(id);
    if (res.success) {
      toast.success(res.message);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast.error(res.error || "Gagal mengakhiri sesi");
    }
    setRevokingId(null);
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    const res = await revokeAllOtherSessions();
    if (res.success) {
      toast.success(res.message);
      setSessions((prev) =>
        prev.filter((s) => s.device_id === currentDeviceId),
      );
    } else {
      toast.error(res.error || "Gagal mengakhiri sesi lain");
    }
    setIsRevokingAll(false);
  };

  const getDeviceIcon = (osName: string, deviceName: string) => {
    const lower = `${osName} ${deviceName}`.toLowerCase();
    if (
      lower.includes("ios") ||
      lower.includes("android") ||
      lower.includes("mobile")
    ) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Laptop className="w-5 h-5" />;
  };

  const currentSession = sessions.find((s) => s.device_id === currentDeviceId);
  const otherSessions = sessions.filter((s) => s.device_id !== currentDeviceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active Sessions</CardTitle>
        <CardDescription>
          Lihat dan kelola perangkat yang sedang login ke akun Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Tidak ada data sesi aktif.
          </div>
        ) : (
          <>
            {/* Current Device */}
            {currentSession && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  Current Device
                </h3>
                <div className="flex items-center justify-between gap-4 py-3 px-4 bg-surface-soft rounded-input border border-hairline border-l-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Laptop className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight truncate">
                        {currentSession.os || "Unknown OS"} •{" "}
                        {currentSession.browser || "Unknown Browser"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {currentSession.location || "Indonesia"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-medium text-semantic-up bg-semantic-up/10 px-2.5 py-0.5 rounded-full">
                    Aktif sekarang
                  </div>
                </div>
              </div>
            )}

            {/* Other Sessions */}
            {otherSessions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Other Sessions
                  </h3>
                  {otherSessions.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 text-sm px-3"
                        >
                          Logout All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Akhiri semua sesi lain?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Anda akan keluar dari semua perangkat lain yang
                            terhubung dengan akun ini. Perangkat saat ini akan
                            tetap aktif.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRevokeAll}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            {isRevokingAll ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              "Ya, Akhiri Semua"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <div className="space-y-2">
                  {otherSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 py-3 px-4 bg-surface-soft rounded-input border border-hairline"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-surface-strong flex items-center justify-center shrink-0">
                          {getDeviceIcon(
                            session.os || "",
                            session.device_name || "",
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">
                            {session.os || "Unknown OS"} •{" "}
                            {session.browser || "Unknown Browser"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Terakhir aktif{" "}
                            {formatDistanceToNow(
                              new Date(session.last_active_at),
                              { addSuffix: true, locale: id },
                            )}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Logout session"
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Akhiri sesi ini?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Perangkat ini akan segera dikeluarkan dari akun
                              Anda.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevoke(session.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              {revokingId === session.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                "Ya, Akhiri"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
