'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(audioTrack?: MediaStreamTrack): void;
  stop(): void;
  abort(): void;
}

type ISpeechRecognitionConstructor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

export type VoiceRecordingState =
  | 'idle'
  | 'requesting-permission'
  | 'starting'
  | 'listening'
  | 'stopping';

export type UseVoiceInputReturn = {
  isListening: boolean;
  isStarting: boolean;
  recordingState: VoiceRecordingState;
  transcript: string;
  finalTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
};

function getSpeechRecognitionAPI() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getSpeechRecognitionSupportSnapshot() {
  return Boolean(getSpeechRecognitionAPI());
}

function subscribeToSpeechRecognitionSupport() {
  return () => {};
}

function getIOSStandaloneContext() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };
  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  const isStandalone =
    navigatorWithStandalone.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  return isIOS && isStandalone;
}

async function getMicrophonePermissionState() {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    !navigator.permissions.query
  ) {
    return null;
  }

  try {
    const status = await (
      navigator.permissions.query as (
        permissionDesc: { name: string },
      ) => Promise<PermissionStatus>
    )({ name: 'microphone' });

    return status.state;
  } catch {
    return null;
  }
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.onended = null;
    track.stop();
  });
}

function getMediaErrorMessage(error: unknown, isIOSStandalone: boolean) {
  if (!(error instanceof DOMException)) {
    return 'Mikrofon tidak dapat diakses. Coba lagi.';
  }

  const iosPermissionMessage =
    'Izin mikrofon dibatasi di mode Add to Home Screen. Buka pengaturan Safari/iOS, izinkan mikrofon untuk CatatZ, lalu coba lagi.';

  const messages: Record<string, string> = {
    NotAllowedError: isIOSStandalone
      ? iosPermissionMessage
      : 'Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser.',
    SecurityError: 'Voice input membutuhkan koneksi HTTPS yang aman.',
    NotFoundError: 'Mikrofon tidak ditemukan di perangkat ini.',
    NotReadableError:
      'Mikrofon sedang dipakai aplikasi lain atau tidak dapat dibaca.',
    AbortError: 'Akses mikrofon terhenti sebelum voice input dimulai.',
    InvalidStateError: 'Voice input sudah aktif. Hentikan dulu lalu coba lagi.',
    OverconstrainedError:
      'Mikrofon perangkat tidak cocok dengan konfigurasi yang diminta.',
    TypeError: 'Browser tidak menyediakan akses mikrofon yang valid.',
  };

  return messages[error.name] ?? 'Mikrofon tidak dapat diakses. Coba lagi.';
}

function getSpeechErrorMessage(error: string) {
  const messages: Record<string, string> = {
    'no-speech': 'Tidak ada suara yang terdeteksi. Coba lagi.',
    'audio-capture': 'Mikrofon tidak dapat diakses.',
    'not-allowed': getIOSStandaloneContext()
      ? 'Izin mikrofon dibatasi di mode Add to Home Screen. Izinkan mikrofon untuk CatatZ di pengaturan Safari/iOS.'
      : 'Izin mikrofon ditolak. Aktifkan di pengaturan browser.',
    network: 'Koneksi diperlukan untuk voice input.',
    'service-not-allowed': 'Layanan speech tidak tersedia.',
    'language-not-supported':
      'Bahasa Indonesia belum didukung oleh layanan speech browser ini.',
    'phrases-not-supported':
      'Browser tidak mendukung konfigurasi speech tambahan.',
    aborted: '',
  };

  return messages[error] ?? `Kesalahan voice input: ${error}`;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [recordingState, setRecordingState] =
    useState<VoiceRecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const isSupported = useSyncExternalStore(
    subscribeToSpeechRecognitionSupport,
    getSpeechRecognitionSupportSnapshot,
    () => false,
  );
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const recordingStateRef = useRef<VoiceRecordingState>('idle');

  const setState = useCallback((state: VoiceRecordingState) => {
    recordingStateRef.current = state;
    setRecordingState(state);
  }, []);

  const clearStartTimeout = useCallback(() => {
    if (startTimeoutRef.current !== null) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      clearStartTimeout();
      setState('listening');
    };

    recognition.onaudiostart = () => {
      clearStartTimeout();
      setState('listening');
    };

    recognition.onaudioend = () => {
      if (recordingStateRef.current === 'listening') {
        setState('stopping');
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) setTranscript(interim);
      if (final) {
        setFinalTranscript((prev) => (prev + ' ' + final).trim());
        setTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearStartTimeout();

      const isExpectedAbort =
        event.error === 'aborted' &&
        (recordingStateRef.current === 'stopping' ||
          recordingStateRef.current === 'idle');
      const message = getSpeechErrorMessage(event.error);

      if (message && !isExpectedAbort) setError(message);

      cleanupMedia();
      setState('idle');
    };

    recognition.onend = () => {
      clearStartTimeout();
      cleanupMedia();
      setState('idle');
    };

    recognitionRef.current = recognition;

    return () => {
      clearStartTimeout();

      try {
        recognition.abort();
      } catch {}

      cleanupMedia();
      recognitionRef.current = null;
    };
  }, [cleanupMedia, clearStartTimeout, setState]);

  const startListening = useCallback(() => {
    void (async () => {
      const recognition = recognitionRef.current;
      if (!recognition || recordingStateRef.current !== 'idle') return;

      setError(null);
      setTranscript('');

      if (!window.isSecureContext) {
        setError('Voice input membutuhkan koneksi HTTPS yang aman.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Browser tidak menyediakan akses mikrofon.');
        return;
      }

      const isIOSStandalone = getIOSStandaloneContext();

      try {
        setState('requesting-permission');

        const permissionState = await getMicrophonePermissionState();
        if (permissionState === 'denied') {
          setError(
            isIOSStandalone
              ? 'Izin mikrofon dibatasi di mode Add to Home Screen. Izinkan mikrofon untuk CatatZ di pengaturan Safari/iOS.'
              : 'Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser.',
          );
          setState('idle');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
        const [audioTrack] = stream.getAudioTracks();

        if (!audioTrack || audioTrack.readyState !== 'live') {
          stopMediaStream(stream);
          setError('Mikrofon tidak aktif. Coba pilih mikrofon lain.');
          setState('idle');
          return;
        }

        mediaStreamRef.current = stream;
        audioTrack.onended = () => {
          if (recordingStateRef.current !== 'idle') {
            setError('Mikrofon terputus. Coba aktifkan voice input lagi.');

            try {
              recognition.abort();
            } catch {}

            cleanupMedia();
            setState('idle');
          }
        };

        setState('starting');
        clearStartTimeout();
        startTimeoutRef.current = window.setTimeout(() => {
          if (recordingStateRef.current === 'starting') {
            setError(
              isIOSStandalone
                ? 'Mikrofon tidak merespons di mode Add to Home Screen. Tutup CatatZ dari app switcher lalu buka lagi.'
                : 'Mikrofon tidak merespons. Coba lagi.',
            );

            try {
              recognition.abort();
            } catch {}

            cleanupMedia();
            setState('idle');
          }
        }, 4000);

        try {
          recognition.start(audioTrack);
        } catch (startError) {
          if (
            startError instanceof DOMException &&
            startError.name === 'InvalidStateError'
          ) {
            throw startError;
          }

          recognition.start();
        }
      } catch (startError) {
        clearStartTimeout();
        cleanupMedia();
        setError(getMediaErrorMessage(startError, isIOSStandalone));
        setState('idle');
      }
    })();
  }, [cleanupMedia, clearStartTimeout, setState]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || recordingStateRef.current === 'idle') return;

    setState('stopping');

    try {
      recognitionRef.current.stop();
    } catch {
      cleanupMedia();
      setState('idle');
    }
  }, [cleanupMedia, setState]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  const isListening = recordingState === 'listening';
  const isStarting =
    recordingState === 'requesting-permission' ||
    recordingState === 'starting';

  return {
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
  };
}
