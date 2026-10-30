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
import { useTranslation } from "@/i18n/use-translation";

export function DeleteAccountSection() {
  const { dict } = useTranslation();
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
        toast.error(res.error || dict.settings.deleteAccount.toasts.failed);
        setIsDeleting(false);
      }
    } catch {
      toast.error(dict.settings.deleteAccount.toasts.unexpected);
      setIsDeleting(false);
    }
  };

  const promptParts = dict.settings.deleteAccount.inputPrompt.split("{keyword}");

  return (
    <Card className="border-semantic-down/20">
      <CardHeader>
        <CardTitle className="text-lg text-semantic-down flex items-center gap-2">
          {dict.settings.deleteAccount.dangerZoneTitle}
        </CardTitle>
        <CardDescription>
          {dict.settings.deleteAccount.dangerZoneDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            {dict.settings.deleteAccount.title}<br />
            <span className="font-normal">{dict.settings.deleteAccount.rowDesc}</span>
          </p>

          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setConfirmText(""); // Reset text on close
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full sm:w-auto gap-2 bg-semantic-down/10 text-semantic-down hover:bg-semantic-down/20 rounded-full">
                <Trash2 className="w-4 h-4" />
                {dict.settings.deleteAccount.deleteButton}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle className="text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {dict.settings.deleteAccount.dialogTitle}
                </DialogTitle>
                <DialogDescription className="pt-2 text-foreground">
                  {dict.settings.deleteAccount.dialogDesc}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="text-sm text-muted-foreground bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  <ul className="list-disc list-inside space-y-1">
                    <li>{dict.settings.deleteAccount.dataList1}</li>
                    <li>{dict.settings.deleteAccount.dataList2}</li>
                    <li>{dict.settings.deleteAccount.dataList3}</li>
                  </ul>
                  <p className="mt-2 font-medium text-red-500">{dict.settings.deleteAccount.cannotUndo}</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-medium">
                    {promptParts[0]}
                    <span className="font-bold text-red-500 select-none">DELETE</span>
                    {promptParts[1] ?? ""}
                  </label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={dict.settings.deleteAccount.confirmInputPlaceholder}
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
                  {dict.common.cancel}
                </Button>
                <Button 
                  variant="destructive"
                  disabled={!isConfirmValid || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? dict.settings.deleteAccount.deletingButton : dict.settings.deleteAccount.confirmButton}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
