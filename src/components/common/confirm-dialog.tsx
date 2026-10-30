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
import { useTranslation } from "@/i18n/use-translation";

interface ConfirmDialogProps {
  children: ReactNode;
  title?: string;
  description?: string;
  onConfirm: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  children,
  title,
  description,
  onConfirm,
  variant = "destructive",
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const { dict } = useTranslation();
  const resolvedTitle = title ?? dict.dialog.confirmTitle;
  const resolvedDescription = description ?? dict.dialog.confirmDescription;
  const resolvedConfirmText = confirmText ?? dict.dialog.continue;
  const resolvedCancelText = cancelText ?? dict.common.cancel;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{resolvedCancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant={variant === "destructive" ? "default" : variant}
            className={
              variant === "destructive"
                ? "bg-rose-600 text-white hover:bg-rose-500 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-700"
                : undefined
            }
          >
            {resolvedConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
