"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/use-translation";
import type { ParsedTransactionResult } from "@/types/transaction-parser";

const VoiceInputButton = dynamic(() => import("./voice-input-button"), {
  ssr: false,
  loading: () => null,
});

const TransactionFileAutoFillButton = dynamic(
  () => import("./transaction-file-auto-fill-button"),
  {
    ssr: false,
    loading: () => null,
  },
);

type TransaksiAiSectionProps = {
  voiceBusy: boolean;
  fileBusy: boolean;
  onVoiceBusyChange: (busy: boolean) => void;
  onFileBusyChange: (busy: boolean) => void;
  onParsedResult: (result: ParsedTransactionResult, source: "suara" | "file") => void;
};

export function TransaksiAiSection({
  voiceBusy,
  fileBusy,
  onVoiceBusyChange,
  onFileBusyChange,
  onParsedResult,
}: TransaksiAiSectionProps) {
  const { dict } = useTranslation();

  return (
    <div className="space-y-3 rounded-card border border-primary/20 bg-primary/5 p-4">
      <Label className="text-xs text-primary flex items-center gap-1">
        <Sparkles className="h-3.5 w-3.5" /> {dict.transactions.ai.badge}
      </Label>
      <div className="grid grid-cols-2 items-start gap-2">
        <VoiceInputButton
          onParsed={(result) => onParsedResult(result, "suara")}
          onError={(msg) => toast.error(msg)}
          onBusyChange={onVoiceBusyChange}
          disabled={fileBusy}
        />
        <TransactionFileAutoFillButton
          onParsed={(result) => onParsedResult(result, "file")}
          onError={(msg) => toast.error(msg)}
          onBusyChange={onFileBusyChange}
          disabled={voiceBusy}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {dict.transactions.ai.hint}
      </p>
    </div>
  );
}
