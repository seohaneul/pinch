export type SupportedCurrency = 'JPY' | 'USD' | 'EUR' | 'KRW';

/**
 * 시간 입력 시 숫자만 입력해도 자동으로 [:] 콜론을 삽입하는 포매터 (예: "0930" -> "09:30")
 * 백스페이스 시 콜론에 걸리지 않도록 3자리 이상일 때만 콜론을 결합합니다.
 */
export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    if (digits.length === 2) {
      const hh = Math.min(23, parseInt(digits, 10));
      return hh.toString().padStart(2, '0');
    }
    return digits;
  }

  let hhNum = parseInt(digits.slice(0, 2), 10);
  if (hhNum > 23) hhNum = 23;
  const hh = hhNum.toString().padStart(2, '0');

  let mmRaw = digits.slice(2);
  if (mmRaw.length === 1) {
    if (parseInt(mmRaw, 10) > 5) {
      mmRaw = `0${mmRaw}`;
    }
  } else if (mmRaw.length === 2) {
    const mmNum = Math.min(59, parseInt(mmRaw, 10));
    mmRaw = mmNum.toString().padStart(2, '0');
  }

  return `${hh}:${mmRaw}`;
}

/**
 * 금액 입력 시 숫자만 입력해도 자동으로 천 단위 콤마 [,]를 삽입하는 포매터 (예: "15000" -> "15,000")
 */
export function formatAmountInput(raw: string, allowDecimal = false): string {
  if (allowDecimal) {
    const cleanedRaw = raw.replace(/[^0-9.]/g, '');
    if (!cleanedRaw) return '';
    const parts = cleanedRaw.split('.');
    const intPart = parts[0].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 1) {
      return `${intPart || '0'}.${parts[1].slice(0, 2)}`;
    }
    return intPart;
  }
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const cleaned = digits.replace(/^0+(?=\d)/, '');
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 콤마가 포함된 금액 문자열을 숫자로 변환
 */
export function parseAmountInput(formatted: string): number {
  const digits = formatted.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(digits);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 여행지(국가/도시)에 따라 현지 기준 통화를 자동으로 판별
 */
export function resolveCurrencyByDestination(
  destination: string,
  country?: string
): SupportedCurrency {
  const q = `${destination || ''} ${country || ''}`.toLowerCase();

  if (
    q.includes('일본') ||
    q.includes('도쿄') ||
    q.includes('오사카') ||
    q.includes('교토') ||
    q.includes('후쿠오카') ||
    q.includes('삿포로') ||
    q.includes('오키나와') ||
    q.includes('나고야') ||
    q.includes('유후인') ||
    q.includes('홋카이도') ||
    q.includes('tokyo') ||
    q.includes('osaka') ||
    q.includes('fukuoka') ||
    q.includes('kyoto') ||
    q.includes('sapporo') ||
    q.includes('okinawa')
  ) {
    return 'JPY';
  }

  if (
    q.includes('대한민국') ||
    q.includes('한국') ||
    q.includes('제주') ||
    q.includes('서울') ||
    q.includes('부산') ||
    q.includes('강릉') ||
    q.includes('속초') ||
    q.includes('경주') ||
    q.includes('여수') ||
    q.includes('전주') ||
    q.includes('양양') ||
    q.includes('seoul') ||
    q.includes('jeju') ||
    q.includes('busan')
  ) {
    return 'KRW';
  }

  if (
    q.includes('유럽') ||
    q.includes('프랑스') ||
    q.includes('파리') ||
    q.includes('이탈리아') ||
    q.includes('로마') ||
    q.includes('피렌체') ||
    q.includes('베네치아') ||
    q.includes('스페인') ||
    q.includes('바르셀로나') ||
    q.includes('마드리드') ||
    q.includes('독일') ||
    q.includes('포르투갈') ||
    q.includes('오스트리아') ||
    q.includes('체코') ||
    q.includes('프라하') ||
    q.includes('런던') ||
    q.includes('영국') ||
    q.includes('스위스') ||
    q.includes('paris') ||
    q.includes('rome') ||
    q.includes('barcelona') ||
    q.includes('london')
  ) {
    return 'EUR';
  }

  return 'USD';
}

export function getCurrencyDisplayInfo(code: SupportedCurrency): {
  code: SupportedCurrency;
  symbol: string;
  label: string;
} {
  switch (code) {
    case 'JPY':
      return { code: 'JPY', symbol: '¥ JPY', label: '일본 엔화 (자동 설정)' };
    case 'EUR':
      return { code: 'EUR', symbol: '€ EUR', label: '유럽 유로 (자동 설정)' };
    case 'KRW':
      return { code: 'KRW', symbol: '₩ KRW', label: '대한민국 원 (자동 설정)' };
    case 'USD':
    default:
      return { code: 'USD', symbol: '$ USD', label: '미국 달러 / 현지 통화 환산 (자동 설정)' };
  }
}

