"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/actions/profile-action";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteAccount();
      // Jika error, aksi tetap dilanjutkan oleh server tapi karena return action tidak throw catch native
      if (res && !res.success) {
        toast.error(res.error || "Gagal menghapus akun.");
        setIsDeleting(false);
      }
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga.");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-500/20">
      <CardHeader>
        <CardTitle className="text-lg text-red-500 flex items-center gap-2">
          Danger Zone
        </CardTitle>
        <CardDescription>
          Area berbahaya untuk pengaturan akun permanen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Delete Account<br />
            <span className="font-normal">Menghapus akun akan menghapus seluruh data yang terkait dengan akun ini. Tindakan ini tidak dapat dibatalkan.</span>
          </p>

          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setConfirmText(""); // Reset text on close
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Peringatan Bahaya
                </DialogTitle>
                <DialogDescription className="pt-2 text-foreground">
                  Anda akan menghapus akun CatatZ beserta <strong>seluruh data</strong> di dalamnya secara permanen.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="text-sm text-muted-foreground bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Profile, Pengaturan, dan Sesi Anda.</li>
                    <li>Semua data Transaksi, Rekening, dan Kategori.</li>
                    <li>Semua catatan Hutang, Piutang, Cicilan, dan Budget.</li>
                  </ul>
                  <p className="mt-2 font-medium text-red-500">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-medium">
                    Ketik <span className="font-bold text-red-500 select-none">DELETE</span> untuk melanjutkan.
                  </label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Ketik DELETE"
                    className="focus-visible:ring-red-500"
                    autoComplete="off"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button 
                  variant="destructive"
                  disabled={!isConfirmValid || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Menghapus..." : "Hapus Akun Saya"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
