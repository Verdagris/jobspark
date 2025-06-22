"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseAutoInterviewReturn {
  isWaitingForResponse: boolean;
  silenceDetected: boolean;
  startWaitingForResponse: () => void;
  stopWaitingForResponse: () => void;
  resetSilenceDetection: () => void;
  onSilenceDetected: (callback: () => void) => void;
  detectSilence: (transcript: string, isListening: boolean) => void;
}

export const useAutoInterview = (
  silenceThreshold: number = 2000, // 2 seconds of silence
  minResponseLength: number = 10 // Minimum characters for a valid response
): UseAutoInterviewReturn => {
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [silenceDetected, setSilenceDetected] = useState(false);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCallbackRef = useRef<(() => void) | null>(null);
  const lastTranscriptLengthRef = useRef(0);

  const startWaitingForResponse = useCallback(() => {
    setIsWaitingForResponse(true);
    setSilenceDetected(false);
    lastTranscriptLengthRef.current = 0;
  }, []);

  const stopWaitingForResponse = useCallback(() => {
    setIsWaitingForResponse(false);
    setSilenceDetected(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceDetection = useCallback(() => {
    setSilenceDetected(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const onSilenceDetected = useCallback((callback: () => void) => {
    silenceCallbackRef.current = callback;
  }, []);

  const detectSilence = useCallback(
    (transcript: string, isListening: boolean) => {
      if (!isWaitingForResponse || !isListening) return;

      const currentLength = transcript.trim().length;

      // If transcript is growing, reset silence timer
      if (currentLength > lastTranscriptLengthRef.current) {
        lastTranscriptLengthRef.current = currentLength;
        resetSilenceDetection();

        // Start new silence timer
        silenceTimerRef.current = setTimeout(() => {
          if (currentLength >= minResponseLength) {
            setSilenceDetected(true);
            if (silenceCallbackRef.current) {
              silenceCallbackRef.current();
            }
          }
        }, silenceThreshold);
      }
    },
    [
      isWaitingForResponse,
      silenceThreshold,
      minResponseLength,
      resetSilenceDetection,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    isWaitingForResponse,
    silenceDetected,
    startWaitingForResponse,
    stopWaitingForResponse,
    resetSilenceDetection,
    onSilenceDetected,
    detectSilence,
  } as UseAutoInterviewReturn & {
    detectSilence: (transcript: string, isListening: boolean) => void;
  };
};
