import { useRef, useCallback, useEffect } from 'react';
import { LiveSessionManager } from '../services/liveService';

export const useLiveSession = () => {
  const sessionRef = useRef<LiveSessionManager | null>(null);

  const connect = useCallback(async (apiKey: string) => {
    // If already connected, do nothing or reconnect? For now, assume fresh connect.
    if (sessionRef.current) {
        sessionRef.current.disconnect();
    }

    try {
        sessionRef.current = new LiveSessionManager((buffer) => {
            // Optional: Hook for audio visualizer data
        });
        await sessionRef.current.connect(apiKey);
    } catch (e) {
        console.error("Live Connect Error", e);
        throw e;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sessionRef
  };
};