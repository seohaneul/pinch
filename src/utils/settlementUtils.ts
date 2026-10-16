export type CurrencyCode = 'KRW' | 'JPY' | 'USD' | 'EUR';

export interface WalletMember {
  id: string;
  name: string;
  avatar_url?: string;
  color?: string;
}

export type WalletCategory =
  | 'FOOD'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'LODGING'
  | 'ACTIVITY'
  | 'FLIGHT'
  | 'OTHER'
  | (string & {});

export interface ExpenseItem {
  id: string;
  trip_id: string;
  schedule_id?: string;
  place_name?: string;
  title: string;
  paid_by: string; // Member id
  currency: CurrencyCode;
  amount: number; // In local currency
  exchange_rate: number; // Base KRW multiplier (e.g., JPY: 9.15, USD: 1380.0)
  krw_amount: number; // Computed: Math.round(amount * exchange_rate)
  split_members: string[]; // Member ids sharing this cost
  category: WalletCategory;
  created_at: string;
}

export interface SettlementTransaction {
  id: string;
  from: WalletMember;
  to: WalletMember;
  amount_krw: number;
  is_settled?: boolean;
}

export interface MemberBalance {
  member: WalletMember;
  paid_krw: number;
  owed_krw: number;
  net_krw: number;
}

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  KRW: 1,
  JPY: 9.15,     // 1 JPY = 9.15 KRW (100엔 = 915원)
  USD: 1380.0,   // 1 USD = 1,380 KRW
  EUR: 1490.0,   // 1 EUR = 1,490 KRW
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KRW: '₩',
  JPY: '¥',
  USD: '$',
  EUR: '€',
};

/**
 * Format local currency with appropriate symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === 'KRW' || currency === 'JPY') {
    return `${sym}${Math.round(amount).toLocaleString()}`;
  }
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert local currency amount to KRW using exchange rate
 */
export function convertToKrw(amount: number, currency: CurrencyCode, rate?: number): number {
  const r = rate !== undefined ? rate : DEFAULT_EXCHANGE_RATES[currency];
  return Math.round(amount * r);
}

/**
 * Calculate net balances for each member
 */
export function calculateMemberBalances(
  members: WalletMember[],
  expenses: ExpenseItem[]
): MemberBalance[] {
  const balancesMap: Record<string, { paid: number; owed: number }> = {};

  members.forEach((m) => {
    balancesMap[m.id] = { paid: 0, owed: 0 };
  });

  expenses.forEach((expense) => {
    // Credit payer
    if (balancesMap[expense.paid_by]) {
      balancesMap[expense.paid_by].paid += expense.krw_amount;
    }

    // Debit split members
    const splitCount = expense.split_members.length;
    if (splitCount > 0) {
      const share = expense.krw_amount / splitCount;
      expense.split_members.forEach((memberId) => {
        if (balancesMap[memberId]) {
          balancesMap[memberId].owed += share;
        }
      });
    }
  });

  return members.map((member) => {
    const data = balancesMap[member.id] || { paid: 0, owed: 0 };
    const paid_krw = Math.round(data.paid);
    const owed_krw = Math.round(data.owed);
    const net_krw = paid_krw - owed_krw;

    return {
      member,
      paid_krw,
      owed_krw,
      net_krw,
    };
  });
}

/**
 * Minimum Cash Flow Algorithm
 * Resolves debts between members with the minimal number of transactions
 */
export function calculateMinCashFlowSettlement(
  members: WalletMember[],
  expenses: ExpenseItem[]
): SettlementTransaction[] {
  const balances = calculateMemberBalances(members, expenses);

  // Separate debtors (net < 0) and creditors (net > 0)
  type PersonNet = { member: WalletMember; net: number };
  const debtors: PersonNet[] = [];
  const creditors: PersonNet[] = [];

  balances.forEach((b) => {
    if (b.net_krw < -1) {
      debtors.push({ member: b.member, net: b.net_krw });
    } else if (b.net_krw > 1) {
      creditors.push({ member: b.member, net: b.net_krw });
    }
  });

  const transactions: SettlementTransaction[] = [];
  let txnId = 1;

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors ascending (most negative first)
    debtors.sort((a, b) => a.net - b.net);
    // Sort creditors descending (most positive first)
    creditors.sort((a, b) => b.net - a.net);

    const debtor = debtors[0];
    const creditor = creditors[0];

    // Settle the minimum of what debtor owes and creditor is owed
    const settleAmount = Math.min(-debtor.net, creditor.net);
    const roundedSettle = Math.round(settleAmount);

    if (roundedSettle > 0) {
      transactions.push({
        id: `tx_${txnId++}`,
        from: debtor.member,
        to: creditor.member,
        amount_krw: roundedSettle,
        is_settled: false,
      });
    }

    debtor.net += settleAmount;
    creditor.net -= settleAmount;

    if (Math.abs(debtor.net) < 1) {
      debtors.shift();
    }
    if (Math.abs(creditor.net) < 1) {
      creditors.shift();
    }
  }

  return transactions;
}

/**
 * Format settlement card text for KakaoTalk / WhatsApp sharing
 */
export function formatSettlementShareText(
  tripTitle: string,
  totalKrw: number,
  memberBalances: MemberBalance[],
  transactions: SettlementTransaction[]
): string {
  const lines: string[] = [];

  lines.push(`✈️ [${tripTitle}] 핀치 1/N 정산서`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`💰 총 여행 지출: ${totalKrw.toLocaleString()}원`);
  lines.push(`👥 참여 인원: ${memberBalances.length}명`);
  lines.push('');

  lines.push('📊 개인별 정산 내역:');
  memberBalances.forEach((b) => {
    if (b.net_krw > 0) {
      lines.push(` • ${b.member.name}: +${b.net_krw.toLocaleString()}원 받기 (결제 ${b.paid_krw.toLocaleString()}원)`);
    } else if (b.net_krw < 0) {
      lines.push(` • ${b.member.name}: ${Math.abs(b.net_krw).toLocaleString()}원 보내기 (소비 ${b.owed_krw.toLocaleString()}원)`);
    } else {
      lines.push(` • ${b.member.name}: 정산 완료 (0원)`);
    }
  });
  lines.push('');

  lines.push('💸 스마트 송금 안내 (최소 송금 경로):');
  if (transactions.length === 0) {
    lines.push(' • 모두 정산이 완료되었습니다! 🎉');
  } else {
    transactions.forEach((tx, idx) => {
      lines.push(` ${idx + 1}. ${tx.from.name} ➡️ ${tx.to.name}: ${tx.amount_krw.toLocaleString()}원`);
    });
  }
  lines.push('');
  lines.push('핀치(Pinch)로 간편하고 투명하게 여행 정산 완료! ✨');

  return lines.join('\n');
}
