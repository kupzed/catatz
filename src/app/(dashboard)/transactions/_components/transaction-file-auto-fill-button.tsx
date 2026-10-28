"use client";

import { useEffect, useRef, useState } from "react";
import { FileSearch, Loader2, WifiOff } from "lucide-react";
import { processTransactionFile } from "@/actions/transaction-file-action";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useTranslation } from "@/i18n/use-translation";
import type { FileAutoFillResult } from "@/types/transaction-parser";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "pdf",
]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

type Props = {
  onParsed: (result: FileAutoFillResult) => void;
  onError: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
};

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export default function TransactionFileAutoFillButton({
  onParsed,
  onError,
  onBusyChange,
  disabled,
}: Props) {
  const { dict } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    onBusyChange?.(isProcessing);
  }, [isProcessing, onBusyChange]);

  useEffect(() => {
    return () => onBusyChange?.(false);
  }, [onBusyChange]);

  function reportError(message: string) {
    onError(message);
  }

  async function handleFile(file: File) {
    if (!isOnline) {
      reportError(dict.transactions.ai.fileOffline);
      return;
    }

    if (
      !ALLOWED_EXTENSIONS.has(getExtension(file.name)) &&
      !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
    ) {
      reportError(dict.transactions.ai.fileInvalidType);
      return;
    }

    if (file.size === 0) {
      reportError(dict.transactions.ai.fileEmpty);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      reportError(dict.transactions.ai.fileTooLarge);
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await processTransactionFile(formData);

      if (result.success && result.data) {
        onParsed(result.data);
      } else {
        reportError(result.error ?? dict.transactions.ai.fileFailed);
      }
    } catch {
      reportError(dict.transactions.ai.fileFailedRetry);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-w-0 w-full flex-col items-start gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 w-full gap-1 px-2 text-xs sm:px-4 sm:text-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isProcessing || !isOnline}
        aria-label={dict.transactions.ai.fileAria}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isOnline ? (
          <FileSearch className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        {isProcessing ? dict.transactions.ai.fileAnalyzing : dict.transactions.ai.fileButton}
      </Button>

      {fileName && (
        <p className="max-w-full break-all px-1 text-[11px] leading-snug text-muted-foreground">
          {isProcessing ? dict.transactions.ai.fileProcessing : dict.transactions.ai.fileLast}: {fileName}
        </p>
      )}
      {!isOnline && (
        <p className="px-1 text-[11px] leading-snug text-muted-foreground">
          {dict.transactions.ai.fileInternetRequired}
        </p>
      )}
    </div>
  );
}
