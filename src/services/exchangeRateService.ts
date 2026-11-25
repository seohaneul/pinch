import type { CurrencyCode } from '../utils/settlementUtils';
import { DEFAULT_EXCHANGE_RATES, SUPPORTED_CURRENCIES } from '../utils/settlementUtils';

export interface ExchangeRateResult {
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
  source: 'live' | 'cached' | 'fallback';
}

/**
 * Fetch real-time foreign exchange rates from open ExchangeRate API (Base: KRW).
 * Calculates accurate multipliers for 15 major travel currencies (1 <CUR> = X KRW).
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRateResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KRW', {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      const updatedRates: Record<CurrencyCode, number> = { ...DEFAULT_EXCHANGE_RATES, KRW: 1 };

      for (const code of SUPPORTED_CURRENCIES) {
        if (code === 'KRW') {
          updatedRates.KRW = 1;
          continue;
        }
        const krwToCode = Number(data.rates[code]);
        if (!Number.isFinite(krwToCode) || krwToCode <= 0) {
          continue;
        }
        const raw = 1 / krwToCode;
        const decimals = code === 'VND' || code === 'IDR' ? 4 : code === 'JPY' ? 2 : 1;
        updatedRates[code] = Number(raw.toFixed(decimals));
      }

      const now = new Date();
      const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      return {
        rates: updatedRates,
        lastUpdated: timeStr,
        source: 'live',
      };
    }

    throw new Error('Invalid rate payload');
  } catch (error) {
    console.warn('Failed to fetch live exchange rates, using fallback:', error);
    return {
      rates: { ...DEFAULT_EXCHANGE_RATES },
      lastUpdated: '기본 환율 기준',
      source: 'fallback',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
