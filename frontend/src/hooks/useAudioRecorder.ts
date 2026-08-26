import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioBase64: string | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ blob: Blob; base64: string; url: string } | null>;
  resetRecording: () => void;
  error: string | null;
}

/**
 * Robust Custom Hook for browser audio recording with automatic cleanup on unmount
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // Safe stream track release
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  // Cleanup on component unmount to prevent lingering microphone indicator
  useEffect(() => {
    return () => {
      cleanupStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [cleanupStream, audioUrl]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioBase64(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError(null);
    audioChunksRef.current = [];
    cleanupStream();
    if (timerRef.current) clearInterval(timerRef.current);
  }, [audioUrl, cleanupStream]);

  const startRecording = useCallback(async () => {
    try {
      resetRecording();
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Detect supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); // 200ms time slice
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[useAudioRecorder] Failed to start recording:', err);
      setError(err.message || 'Không thể truy cập microphone. Vui lòng cấp quyền.');
      cleanupStream();
    }
  }, [resetRecording, cleanupStream]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; base64: string; url: string } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        cleanupStream();
        resolve(null);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) || '';
          setAudioBlob(blob);
          setAudioBase64(base64);
          setAudioUrl(url);
          setIsRecording(false);
          cleanupStream();
          resolve({ blob, base64, url });
        };
        reader.onerror = () => {
          cleanupStream();
          resolve({ blob, base64: '', url });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [cleanupStream]);

  return {
    isRecording,
    recordingDuration,
    audioBlob,
    audioBase64,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    error,
  };
}
