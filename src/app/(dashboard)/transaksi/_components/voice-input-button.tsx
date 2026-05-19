'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

type Props = {
  onParsed: (result: VoiceParseResult) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export default function VoiceInputButton({ onParsed, onError, disabled }: Props) {
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
  const processedTranscriptRef = useRef('');

  const handleProcess = useCallback(async (text: string) => {
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
    } catch {
      const msg = 'Gagal memproses suara.';
      onError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  }, [onError, onParsed, resetTranscript]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!finalTranscript) {
      processedTranscriptRef.current = '';
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

  if (isProcessing || isStarting) {
    const label =
      recordingState === 'requesting-permission'
        ? 'Meminta izin...'
        : isProcessing
          ? 'Memproses...'
          : 'Menyiapkan...';

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

  return (
    <div className="flex flex-col items-start gap-1 w-full">
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={disabled || recordingState === 'stopping'}
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

      {isListening && transcript.length > 0 && (
        <p className="text-[11px] text-muted-foreground italic leading-tight px-1 max-w-full truncate">
          Mendengar: {transcript}
        </p>
      )}
    </div>
  );
}
