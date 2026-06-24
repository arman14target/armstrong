"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n/t";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function formatSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return t("speech.micDenied");
    case "no-speech":
      return t("speech.noSpeech");
    case "audio-capture":
      return t("speech.noMic");
    case "network":
      return t("speech.network");
    case "aborted":
      return "";
    default:
      return t("speech.failed");
  }
}

function normalizeAudioLevel(samples: Uint8Array): number {
  if (samples.length === 0) {
    return 0;
  }

  let sum = 0;
  for (const value of samples) {
    sum += value;
  }

  const average = sum / samples.length;
  return Math.min(1, average / 96);
}

export function formatRecordingTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function useSpeechToText(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [bufferText, setBufferText] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const bufferRef = useRef("");
  const interimRef = useRef("");
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopAnalyzer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;

    setAudioLevel(0);
    setElapsedMs(0);
  }, []);

  const startAnalyzer = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext();
      audioContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const samples = new Uint8Array(analyser.frequencyBinCount);
      startedAtRef.current = Date.now();
      setElapsedMs(0);

      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 100);

      const measure = () => {
        const node = analyserRef.current;
        if (!node) {
          return;
        }

        node.getByteFrequencyData(samples);
        setAudioLevel(normalizeAudioLevel(samples));
        rafRef.current = requestAnimationFrame(measure);
      };

      measure();
    } catch {
      setError(t("speech.micDenied"));
    }
  }, []);

  const finalizeSession = useCallback(() => {
    const combined = `${bufferRef.current} ${interimRef.current}`.trim();
    bufferRef.current = "";
    interimRef.current = "";
    setBufferText("");
    setInterimText("");

    if (combined) {
      onTranscriptRef.current(combined);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalChunk += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalChunk) {
        const nextBuffer = `${bufferRef.current} ${finalChunk}`.trim();
        bufferRef.current = nextBuffer;
        setBufferText(nextBuffer);
      }

      interimRef.current = interim.trim();
      setInterimText(interim.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        finalizeSession();
      }

      const message = formatSpeechError(event.error);
      if (message) {
        setError(message);
      }
      setListening(false);
      stopAnalyzer();
    };

    recognition.onend = () => {
      finalizeSession();
      setListening(false);
      stopAnalyzer();
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.abort();
      recognitionRef.current = null;
      stopAnalyzer();
    };
  }, [finalizeSession, stopAnalyzer]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    setError(null);
    bufferRef.current = "";
    interimRef.current = "";
    setBufferText("");
    setInterimText("");

    await startAnalyzer();

    try {
      recognition.start();
      setListening(true);
    } catch {
      stopAnalyzer();
      setListening(false);
    }
  }, [startAnalyzer, stopAnalyzer]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }

    void start();
  }, [listening, start, stop]);

  const previewText = `${bufferText}${bufferText && interimText ? " " : ""}${interimText}`.trim();

  return {
    supported,
    listening,
    error,
    interimText,
    previewText: listening ? previewText : "",
    elapsedMs,
    audioLevel,
    start,
    stop,
    toggle,
    clearError: () => setError(null),
  };
}
