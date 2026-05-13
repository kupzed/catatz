'use client';

import { useState, useEffect } from 'react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { processVoiceInput } from '@/actions/voice-action';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { VoiceParseResult } from '@/types/voice-parser';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

type Props = {
  onParsed: (result: VoiceParseResult) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function VoiceInputButton({ onParsed, onError, disabled }: Props) {
  const {
    isListening,
    transcript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  const [isProcessing, setIsProcessing] = useState(false);

  // Show hook-level errors as toasts
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // When user stops speaking and final transcript is available → send to Gemini
  useEffect(() => {
    if (!isListening && finalTranscript) {
      handleProcess(finalTranscript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, finalTranscript]);

  async function handleProcess(text: string) {
    if (!text.trim()) {
      toast.error('Tidak ada suara yang terdeteksi.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processVoiceInput(text);
      if (result.success && result.data) {
        onParsed(result.data);
      } else {
        const msg = result.error ?? 'Gagal memproses suara.';
        onError(msg);
        toast.error(msg);
      }
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  }

  function handleToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // ── Render: NOT_SUPPORTED ──────────────────────────────────
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

  // ── Render: PROCESSING ────────────────────────────────────
  if (isProcessing) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="h-8 gap-1.5"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Memproses...
      </Button>
    );
  }

  // ── Render: LISTENING / IDLE ──────────────────────────────
  return (
    <div className="flex flex-col items-start gap-1 w-full">
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={disabled}
        className={`h-8 gap-1.5 transition-all duration-200 ${
          isListening ? 'animate-pulse' : ''
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

      {/* Interim transcript preview */}
      {isListening && transcript.length > 0 && (
        <p className="text-[11px] text-muted-foreground italic leading-tight px-1 max-w-full truncate">
          🎙 {transcript}
        </p>
      )}
    </div>
  );
}
