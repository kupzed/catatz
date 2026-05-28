"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { processVoiceInput } from "@/actions/voice-action";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mic, MicOff, Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import type { VoiceParseResult } from "@/types/voice-parser";

// ─── Platform helpers (client-side only) ─────────────────────────────────────

function detectIOSPWA(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ios = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  const standalone =
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  return ios && standalone;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  onParsed: (result: VoiceParseResult) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoiceInputButton({
  onParsed,
  onError,
  disabled,
}: Props) {
  const {
    isListening,
    isStarting,
    recordingState,
    transcript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isIOSPWA, setIsIOSPWA] = useState(false);
  const processedTranscriptRef = useRef("");

  // Deteksi platform di client side
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsIOSPWA(detectIOSPWA());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // ── Process transcript setelah listening selesai ────────────────────────

  const handleProcess = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Tidak ada suara yang terdeteksi.");
        return;
      }

      setIsProcessing(true);
      try {
        const result = await processVoiceInput(text);
        if (result.success && result.data) {
          onParsed(result.data);
        } else {
          const msg = result.error ?? "Gagal memproses suara.";
          onError(msg);
          toast.error(msg);
        }
      } catch {
        const msg = "Gagal memproses suara.";
        onError(msg);
        toast.error(msg);
      } finally {
        setIsProcessing(false);
        resetTranscript();
      }
    },
    [onError, onParsed, resetTranscript],
  );

  // Tampilkan error dari hook sebagai toast
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Proses transcript saat listening selesai
  useEffect(() => {
    if (!finalTranscript) {
      processedTranscriptRef.current = "";
      return;
    }

    if (isListening || processedTranscriptRef.current === finalTranscript) {
      return;
    }

    processedTranscriptRef.current = finalTranscript;
    const timeoutId = window.setTimeout(() => {
      void handleProcess(finalTranscript);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isListening, finalTranscript, handleProcess]);

  function handleToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // ── Render: tidak didukung ─────────────────────────────────────────────

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="h-8 gap-1.5 text-muted-foreground"
            >
              <Mic className="h-3.5 w-3.5" />
              Voice Input
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Browser tidak mendukung voice input</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ── Render: loading / processing ───────────────────────────────────────

  if (isProcessing || isStarting) {
    let label = "Menyiapkan...";
    if (recordingState === "requesting-permission") label = "Meminta izin...";
    else if (isProcessing) label = "Memproses...";
    // Untuk iOS PWA berikan label yang lebih informatif saat starting
    else if (recordingState === "starting" && isIOSPWA) {
      label = "Menghubungkan mikrofon...";
    }

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="h-8 gap-1.5"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {label}
      </Button>
    );
  }

  // ── Render: iOS PWA info banner ─────────────────────────────────────────
  // Tampilkan info ringan bahwa mode ini mungkin kurang stabil, tanpa
  // memblokir user dari mencoba fitur.

  const showIOSPWAHint = isIOSPWA && !isListening && !isProcessing;

  // ── Render: normal ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <div className="flex items-center gap-2 w-full">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={disabled || recordingState === "stopping"}
          className={`h-8 gap-1.5 transition-all duration-200 ${
            isListening ? "animate-pulse" : ""
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              Tap untuk berhenti
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              Voice Input
            </>
          )}
        </Button>

        {/* Info tooltip untuk iOS PWA */}
        {showIOSPWAHint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors"
                  aria-label="Informasi voice input iOS"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64 text-xs" side="bottom">
                <p>
                  Voice input di mode PWA (Add to Home Screen) iOS mungkin
                  membutuhkan izin ulang. Jika gagal, coba buka di Safari biasa.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Transcript live */}
      {isListening && transcript.length > 0 && (
        <p className="text-[11px] text-muted-foreground italic leading-tight px-1 max-w-full truncate">
          Mendengar: {transcript}
        </p>
      )}

      {/* Error inline yang spesifik untuk iOS PWA — selain toast */}
      {error && isIOSPWA && (
        <div className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400 w-full">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="leading-snug">
            <span>{error}</span>
            {(error.includes("Pengaturan") || error.includes("Safari")) && (
              <span className="block mt-1 text-amber-600 dark:text-amber-500">
                Atau gunakan Safari biasa untuk fitur voice input yang lebih
                stabil.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
