import type { CurrencyCode } from '../utils/settlementUtils';
import { DEFAULT_EXCHANGE_RATES } from '../utils/settlementUtils';

export interface ExchangeRateResult {
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
  source: 'live' | 'cached' | 'fallback';
}

/**
 * Fetch real-time foreign exchange rates from open ExchangeRate API
 * Base: KRW, calculates accurate multipliers for JPY (1 JPY = X KRW), USD, and EUR.
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRateResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Exchange rate API responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      const usdToKrw = Number(data.rates.KRW);
      const usdToJpy = Number(data.rates.JPY);
      const usdToEur = Number(data.rates.EUR);

      const jpyToKrw = Number((usdToKrw / usdToJpy).toFixed(2));
      const eurToKrw = Number((usdToKrw / usdToEur).toFixed(1));
      const roundedUsdToKrw = Number(usdToKrw.toFixed(1));

      const updatedRates: Record<CurrencyCode, number> = {
        KRW: 1,
        JPY: jpyToKrw,
        USD: roundedUsdToKrw,
        EUR: eurToKrw,
      };

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
      rates: DEFAULT_EXCHANGE_RATES,
      lastUpdated: '기본 환율 기준',
      source: 'fallback',
    };
  }
}
