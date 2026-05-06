"use client";

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
import { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

interface ConfirmDialogProps {
  children: ReactNode;
  title?: string;
  description?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  children,
  title = "Apakah Anda yakin?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  onConfirm,
  variant = "destructive",
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            variant={variant === "destructive" ? "default" : variant}
            className={
              variant === "destructive" 
                ? "bg-rose-600 text-white hover:bg-rose-500 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700" 
                : undefined
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
