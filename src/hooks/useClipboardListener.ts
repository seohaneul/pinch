import { useState, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { detectSnsPlatform } from '../services/parserService';

export function useClipboardListener() {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [hasDismissed, setHasDismissed] = useState<boolean>(false);

  const checkClipboard = useCallback(async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const text = await Clipboard.getStringAsync();
      if (!text) return;

      const trimmed = text.trim();
      const platform = detectSnsPlatform(trimmed);

      if (platform !== 'manual' && trimmed !== detectedUrl && !hasDismissed) {
        setDetectedUrl(trimmed);
      }
    } catch (err) {
      // Ignore clipboard read errors in unsupported environments
    }
  }, [detectedUrl, hasDismissed]);

  useEffect(() => {
    checkClipboard();
    // Check when app regains focus
    const interval = setInterval(checkClipboard, 3000);
    return () => clearInterval(interval);
  }, [checkClipboard]);

  const dismissDetectedUrl = () => {
    setDetectedUrl(null);
    setHasDismissed(true);
  };

  return {
    detectedUrl,
    checkClipboard,
    dismissDetectedUrl,
  };
}
