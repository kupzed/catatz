"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

// ─── Web Speech API types ─────────────────────────────────────────────────────

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
  // audioTrack param hanya ada di Chrome; iOS WebKit tidak mendukungnya
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

// ─── Public types ─────────────────────────────────────────────────────────────

export type VoiceRecordingState =
  | "idle"
  | "requesting-permission"
  | "starting"
  | "listening"
  | "stopping";

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

// ─── Platform detection helpers ───────────────────────────────────────────────

function getSpeechRecognitionAPI(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getSpeechRecognitionSupportSnapshot(): boolean {
  return Boolean(getSpeechRecognitionAPI());
}

function subscribeToSpeechRecognitionSupport() {
  return () => {};
}

/**
 * Deteksi apakah aplikasi berjalan di iOS (iPhone/iPad/iPod).
 */
function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

/**
 * Deteksi apakah aplikasi berjalan dalam mode standalone (Add to Home Screen).
 */
function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Deteksi iOS PWA (Add to Home Screen) — mode yang paling bermasalah untuk voice.
 * Di sini getUserMedia + SpeechRecognition TIDAK bisa berjalan bersamaan karena
 * WebKit mengalokasikan mic secara eksklusif untuk SpeechRecognition.
 */
function isIOSPWA(): boolean {
  return isIOS() && isStandaloneMode();
}

// ─── Stream / media helpers ───────────────────────────────────────────────────

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.onended = null;
    track.stop();
  });
}

// ─── Error message factories ──────────────────────────────────────────────────

function getMediaErrorMessage(error: unknown): string {
  const iosPWA = isIOSPWA();

  if (!(error instanceof DOMException)) {
    return "Mikrofon tidak dapat diakses. Coba lagi.";
  }

  const messages: Record<string, string> = {
    NotAllowedError: iosPWA
      ? "Izin mikrofon diperlukan. Buka Pengaturan → Safari → Mikrofon, lalu izinkan akses untuk situs ini."
      : "Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser.",
    SecurityError: "Voice input membutuhkan koneksi HTTPS yang aman.",
    NotFoundError: "Mikrofon tidak ditemukan di perangkat ini.",
    NotReadableError: iosPWA
      ? "Mikrofon sedang dipakai. Tutup aplikasi lain yang menggunakan mikrofon, lalu coba lagi."
      : "Mikrofon sedang dipakai aplikasi lain atau tidak dapat dibaca.",
    AbortError: "Akses mikrofon terhenti sebelum voice input dimulai.",
    InvalidStateError: "Voice input sudah aktif. Hentikan dulu lalu coba lagi.",
    OverconstrainedError:
      "Mikrofon perangkat tidak cocok dengan konfigurasi yang diminta.",
    TypeError: "Browser tidak menyediakan akses mikrofon yang valid.",
  };

  return messages[error.name] ?? "Mikrofon tidak dapat diakses. Coba lagi.";
}

function getSpeechErrorMessage(error: string): string {
  const iosPWA = isIOSPWA();

  const messages: Record<string, string> = {
    "no-speech":
      "Tidak ada suara yang terdeteksi. Coba bicara lebih dekat ke mikrofon.",
    "audio-capture": iosPWA
      ? "Mikrofon tidak dapat diakses di mode PWA. Coba buka aplikasi di Safari biasa (bukan dari layar utama)."
      : "Mikrofon tidak dapat diakses.",
    "not-allowed": iosPWA
      ? "Izin mikrofon diperlukan. Buka Pengaturan → Safari → Mikrofon, lalu izinkan akses untuk situs ini."
      : "Izin mikrofon ditolak. Aktifkan di pengaturan browser.",
    network: "Koneksi internet diperlukan untuk voice input.",
    "service-not-allowed": iosPWA
      ? "Layanan speech tidak tersedia di mode PWA iOS. Coba buka di Safari biasa."
      : "Layanan speech tidak tersedia.",
    "language-not-supported":
      "Bahasa Indonesia belum didukung oleh layanan speech browser ini.",
    aborted: "",
  };

  return messages[error] ?? `Kesalahan voice input: ${error}`;
}

// ─── Permission check ─────────────────────────────────────────────────────────

async function getMicrophonePermissionState(): Promise<PermissionState | null> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return null;
  }

  try {
    const status = await (
      navigator.permissions.query as (desc: {
        name: string;
      }) => Promise<PermissionStatus>
    )({ name: "microphone" });
    return status.state;
  } catch {
    return null;
  }
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useVoiceInput(): UseVoiceInputReturn {
  const [recordingState, setRecordingState] =
    useState<VoiceRecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isSupported = useSyncExternalStore(
    subscribeToSpeechRecognitionSupport,
    getSpeechRecognitionSupportSnapshot,
    () => false,
  );

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  // mediaStreamRef dipakai HANYA untuk permission check; di iOS PWA harus di-stop
  // sebelum recognition.start() dipanggil agar WebKit tidak bertabrakan.
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const recordingStateRef = useRef<VoiceRecordingState>("idle");

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

  // ── Setup SpeechRecognition ────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      clearStartTimeout();
      setState("listening");
    };

    recognition.onaudiostart = () => {
      clearStartTimeout();
      setState("listening");
    };

    recognition.onaudioend = () => {
      if (recordingStateRef.current === "listening") {
        setState("stopping");
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

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
        setFinalTranscript((prev) => (prev + " " + final).trim());
        setTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearStartTimeout();
      // Selalu cleanup stream saat error — penting untuk iOS PWA agar mic dilepas
      cleanupMedia();

      const isExpectedAbort =
        event.error === "aborted" &&
        (recordingStateRef.current === "stopping" ||
          recordingStateRef.current === "idle");

      const message = getSpeechErrorMessage(event.error);
      if (message && !isExpectedAbort) setError(message);

      setState("idle");
    };

    recognition.onend = () => {
      clearStartTimeout();
      // Pastikan stream dilepas juga saat recognition berakhir normal
      cleanupMedia();
      setState("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      clearStartTimeout();
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      cleanupMedia();
      recognitionRef.current = null;
    };
  }, [cleanupMedia, clearStartTimeout, setState]);

  // ── startListening ────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    void (async () => {
      const recognition = recognitionRef.current;
      if (!recognition || recordingStateRef.current !== "idle") return;

      setError(null);
      setTranscript("");

      if (!window.isSecureContext) {
        setError("Voice input membutuhkan koneksi HTTPS yang aman.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Browser tidak menyediakan akses mikrofon.");
        return;
      }

      const iosPWA = isIOSPWA();
      const ios = isIOS();

      try {
        setState("requesting-permission");

        // Cek permission state terlebih dahulu (tidak semua browser support)
        const permissionState = await getMicrophonePermissionState();
        if (permissionState === "denied") {
          const msg =
            iosPWA || ios
              ? "Izin mikrofon ditolak. Buka Pengaturan → Safari → Mikrofon dan izinkan akses untuk situs ini."
              : "Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser.";
          setError(msg);
          setState("idle");
          return;
        }

        // ── Minta akses mic via getUserMedia ──────────────────────────────
        // Tujuan: memastikan user sudah memberi izin sebelum recognition.start()
        // Di iOS PWA: setelah getUserMedia berhasil, HARUS stop stream-nya dulu
        // sebelum recognition.start() karena WebKit tidak bisa share mic.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });

        if (iosPWA || ios) {
          // ── iOS / iOS PWA: lepas stream segera setelah permission granted ──
          // WebKit SpeechRecognition mengambil mic secara eksklusif; jika stream
          // masih aktif saat recognition.start() dipanggil, mic akan di-mute atau
          // recognition gagal dengan error 'audio-capture'.
          stopMediaStream(stream);
          mediaStreamRef.current = null;
        } else {
          // ── Non-iOS: simpan stream, pantau jika putus ─────────────────────
          const [audioTrack] = stream.getAudioTracks();

          if (!audioTrack || audioTrack.readyState !== "live") {
            stopMediaStream(stream);
            setError("Mikrofon tidak aktif. Coba pilih mikrofon lain.");
            setState("idle");
            return;
          }

          mediaStreamRef.current = stream;

          audioTrack.onended = () => {
            if (recordingStateRef.current !== "idle") {
              setError("Mikrofon terputus. Coba aktifkan voice input lagi.");
              try {
                recognition.abort();
              } catch {
                /* ignore */
              }
              cleanupMedia();
              setState("idle");
            }
          };
        }

        // ── Pindah ke state 'starting' dan pasang timeout ────────────────
        setState("starting");
        clearStartTimeout();

        // iOS PWA butuh waktu lebih lama untuk inisialisasi speech engine
        // setelah getUserMedia stream dilepas.
        const startTimeoutMs = iosPWA ? 8000 : ios ? 6000 : 4000;

        startTimeoutRef.current = window.setTimeout(() => {
          if (recordingStateRef.current === "starting") {
            const msg = iosPWA
              ? "Mikrofon tidak merespons. Tutup CatatZ dari app switcher, buka lagi, lalu coba voice input."
              : ios
                ? "Mikrofon tidak merespons. Pastikan izin mikrofon sudah diberikan di Pengaturan, lalu coba lagi."
                : "Mikrofon tidak merespons. Coba lagi.";
            setError(msg);
            try {
              recognition.abort();
            } catch {
              /* ignore */
            }
            cleanupMedia();
            setState("idle");
          }
        }, startTimeoutMs);

        // ── Mulai recognition ─────────────────────────────────────────────
        // Di iOS/iOS PWA: jangan kirim audioTrack, biarkan WebKit mengelola
        // mic-nya sendiri setelah stream kita lepas.
        if (ios || iosPWA) {
          recognition.start();
        } else {
          // Di non-iOS: coba kirim audioTrack (Chrome support), fallback ke tanpa
          const [audioTrack] = stream.getAudioTracks();
          try {
            recognition.start(audioTrack);
          } catch (startError) {
            if (
              startError instanceof DOMException &&
              startError.name === "InvalidStateError"
            ) {
              throw startError;
            }
            recognition.start();
          }
        }
      } catch (startError) {
        clearStartTimeout();
        cleanupMedia();
        setError(getMediaErrorMessage(startError));
        setState("idle");
      }
    })();
  }, [cleanupMedia, clearStartTimeout, setState]);

  // ── stopListening ─────────────────────────────────────────────────────────

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || recordingStateRef.current === "idle") return;

    setState("stopping");
    try {
      recognitionRef.current.stop();
    } catch {
      cleanupMedia();
      setState("idle");
    }
  }, [cleanupMedia, setState]);

  // ── resetTranscript ───────────────────────────────────────────────────────

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const isListening = recordingState === "listening";
  const isStarting =
    recordingState === "requesting-permission" || recordingState === "starting";

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
