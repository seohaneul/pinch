import { useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { detectSnsPlatform } from '../services/parserService';

// 세션 내 이미 닫은 URL을 공유해 홈/보관함 중복 팝업 방지 및 다른 URL 재감지 허용
const sharedDismissedUrls = new Set<string>();

export function useClipboardListener() {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  const checkClipboard = useCallback(async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const text = await Clipboard.getStringAsync();
      if (!text) return;

      const trimmed = text.trim();
      if (sharedDismissedUrls.has(trimmed)) {
        if (detectedUrl === trimmed) setDetectedUrl(null);
        return;
      }

      const platform = detectSnsPlatform(trimmed);
      if (platform !== 'manual' && trimmed !== detectedUrl) {
        setDetectedUrl(trimmed);
      }
    } catch {
      // Ignore clipboard read errors in unsupported environments
    }
  }, [detectedUrl]);

  useEffect(() => {
    checkClipboard();
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkClipboard();
      }
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkClipboard();
      }
    }, 4000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkClipboard]);

  const dismissDetectedUrl = useCallback(() => {
    if (detectedUrl) {
      sharedDismissedUrls.add(detectedUrl);
    }
    setDetectedUrl(null);
  }, [detectedUrl]);

  return {
    detectedUrl,
    checkClipboard,
    dismissDetectedUrl,
  };
}
