import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  convertToKrw,
  formatCurrency,
  calculateMemberBalances,
  calculateMinCashFlowSettlement,
  formatSettlementShareText,
} from '../src/utils/settlementUtils';
import type {
  WalletMember,
  ExpenseItem,
} from '../src/utils/settlementUtils';

describe('Smart Wallet & Settlement Engine (FN-WAL)', () => {
  const members: WalletMember[] = [
    { id: 'm1', name: '민지', color: '#FF6B6B' },
    { id: 'm2', name: '수현', color: '#4ECDC4' },
    { id: 'm3', name: '도윤', color: '#FFE66D' },
  ];

  describe('convertToKrw & formatCurrency (FN-WAL-001)', () => {
    it('converts JPY 9,000 at default rate (9.15) to 82,350 KRW', () => {
      const krw = convertToKrw(9000, 'JPY');
      assert.strictEqual(krw, 82350);
    });

    it('converts USD 50 at default rate (1380.0) to 69,000 KRW', () => {
      const krw = convertToKrw(50, 'USD');
      assert.strictEqual(krw, 69000);
    });

    it('converts EUR 100 at default rate (1490.0) to 149,000 KRW', () => {
      const krw = convertToKrw(100, 'EUR');
      assert.strictEqual(krw, 149000);
    });

    it('supports custom dynamic exchange rates', () => {
      // 1 JPY = 9.50 KRW custom rate
      const krw = convertToKrw(10000, 'JPY', 9.5);
      assert.strictEqual(krw, 95000);
    });

    it('formats currencies with proper symbols and digit separators', () => {
      assert.strictEqual(formatCurrency(50000, 'KRW'), '₩50,000');
      assert.strictEqual(formatCurrency(3200, 'JPY'), '¥3,200');
      assert.strictEqual(formatCurrency(45.5, 'USD'), '$45.50');
      assert.strictEqual(formatCurrency(89.99, 'EUR'), '€89.99');
    });
  });

  describe('Min Cash Flow Settlement Algorithm (FN-WAL-004)', () => {
    it('Case 1: Simple 2 people (A pays 10,000 for A & B -> B pays A 5,000)', () => {
      const pairMembers: WalletMember[] = [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ];
      const expenses: ExpenseItem[] = [
        {
          id: 'e1',
          trip_id: 't1',
          title: 'Lunch',
          paid_by: 'a',
          currency: 'KRW',
          amount: 10000,
          exchange_rate: 1,
          krw_amount: 10000,
          split_members: ['a', 'b'],
          category: 'FOOD',
          created_at: new Date().toISOString(),
        },
      ];

      const balances = calculateMemberBalances(pairMembers, expenses);
      const aBal = balances.find((b) => b.member.id === 'a')!;
      const bBal = balances.find((b) => b.member.id === 'b')!;

      assert.strictEqual(aBal.net_krw, 5000, 'A should be owed 5,000 KRW');
      assert.strictEqual(bBal.net_krw, -5000, 'B should owe 5,000 KRW');

      const txns = calculateMinCashFlowSettlement(pairMembers, expenses);
      assert.strictEqual(txns.length, 1);
      assert.strictEqual(txns[0].from.id, 'b');
      assert.strictEqual(txns[0].to.id, 'a');
      assert.strictEqual(txns[0].amount_krw, 5000);
    });

    it('Case 2: 3 people complex (M1 pays 90k, M2 pays 30k, M3 pays 0k, all split 3 ways)', () => {
      const expenses: ExpenseItem[] = [
        {
          id: 'e1',
          trip_id: 't1',
          title: 'Dinner',
          paid_by: 'm1',
          currency: 'KRW',
          amount: 90000,
          exchange_rate: 1,
          krw_amount: 90000,
          split_members: ['m1', 'm2', 'm3'],
          category: 'FOOD',
          created_at: new Date().toISOString(),
        },
        {
          id: 'e2',
          trip_id: 't1',
          title: 'Taxi',
          paid_by: 'm2',
          currency: 'KRW',
          amount: 30000,
          exchange_rate: 1,
          krw_amount: 30000,
          split_members: ['m1', 'm2', 'm3'],
          category: 'TRANSPORT',
          created_at: new Date().toISOString(),
        },
      ];

      // Total = 120,000 KRW. Per person share = 40,000 KRW.
      // M1 net = 90,000 - 40,000 = +50,000 KRW
      // M2 net = 30,000 - 40,000 = -10,000 KRW
      // M3 net = 0 - 40,000 = -40,000 KRW
      const balances = calculateMemberBalances(members, expenses);
      const m1 = balances.find((b) => b.member.id === 'm1')!;
      const m2 = balances.find((b) => b.member.id === 'm2')!;
      const m3 = balances.find((b) => b.member.id === 'm3')!;

      assert.strictEqual(m1.net_krw, 50000);
      assert.strictEqual(m2.net_krw, -10000);
      assert.strictEqual(m3.net_krw, -40000);

      const txns = calculateMinCashFlowSettlement(members, expenses);
      // Strictly <= N-1 (<= 2 transactions)
      assert.strictEqual(txns.length, 2);

      // Verify that M3 pays M1 40,000 and M2 pays M1 10,000
      const txFromM3 = txns.find((t) => t.from.id === 'm3')!;
      assert.strictEqual(txFromM3.to.id, 'm1');
      assert.strictEqual(txFromM3.amount_krw, 40000);

      const txFromM2 = txns.find((t) => t.from.id === 'm2')!;
      assert.strictEqual(txFromM2.to.id, 'm1');
      assert.strictEqual(txFromM2.amount_krw, 10000);
    });

    it('Case 3: All zero / equal spend results in 0 transactions', () => {
      const expenses: ExpenseItem[] = [
        {
          id: 'e1',
          trip_id: 't1',
          title: 'Item 1',
          paid_by: 'm1',
          currency: 'KRW',
          amount: 30000,
          exchange_rate: 1,
          krw_amount: 30000,
          split_members: ['m1', 'm2', 'm3'],
          category: 'FOOD',
          created_at: new Date().toISOString(),
        },
        {
          id: 'e2',
          trip_id: 't1',
          title: 'Item 2',
          paid_by: 'm2',
          currency: 'KRW',
          amount: 30000,
          exchange_rate: 1,
          krw_amount: 30000,
          split_members: ['m1', 'm2', 'm3'],
          category: 'FOOD',
          created_at: new Date().toISOString(),
        },
        {
          id: 'e3',
          trip_id: 't1',
          title: 'Item 3',
          paid_by: 'm3',
          currency: 'KRW',
          amount: 30000,
          exchange_rate: 1,
          krw_amount: 30000,
          split_members: ['m1', 'm2', 'm3'],
          category: 'FOOD',
          created_at: new Date().toISOString(),
        },
      ];

      const txns = calculateMinCashFlowSettlement(members, expenses);
      assert.strictEqual(txns.length, 0);
    });

    it('Edge Case: Empty expenses list', () => {
      const txns = calculateMinCashFlowSettlement(members, []);
      assert.strictEqual(txns.length, 0);
      const balances = calculateMemberBalances(members, []);
      balances.forEach((b) => assert.strictEqual(b.net_krw, 0));
    });

    it('Edge Case: Empty split_members array does not throw or produce NaN/Infinity', () => {
      const badExpense: ExpenseItem = {
        id: 'bad_1',
        trip_id: 't1',
        title: 'Zero Split',
        paid_by: 'm1',
        currency: 'KRW',
        amount: 20000,
        exchange_rate: 1,
        krw_amount: 20000,
        split_members: [], // empty!
        category: 'OTHER',
        created_at: new Date().toISOString(),
      };

      assert.doesNotThrow(() => {
        const balances = calculateMemberBalances(members, [badExpense]);
        balances.forEach((b) => {
          assert.ok(!isNaN(b.net_krw));
          assert.ok(isFinite(b.net_krw));
        });
      });
    });
  });

  describe('formatSettlementShareText (FN-WAL-005)', () => {
    it('generates a clean markdown string formatted for messenger apps', () => {
      const balances = [
        { member: members[0], paid_krw: 90000, owed_krw: 40000, net_krw: 50000 },
        { member: members[1], paid_krw: 30000, owed_krw: 40000, net_krw: -10000 },
        { member: members[2], paid_krw: 0, owed_krw: 40000, net_krw: -40000 },
      ];
      const txns = [
        { id: 'tx_1', from: members[2], to: members[0], amount_krw: 40000 },
        { id: 'tx_2', from: members[1], to: members[0], amount_krw: 10000 },
      ];

      const text = formatSettlementShareText('도쿄 3박 4일 여행', 120000, balances, txns);
      assert.ok(text.includes('도쿄 3박 4일 여행'));
      assert.ok(text.includes('120,000원'));
      assert.ok(text.includes('민지: +50,000원 받기'));
      assert.ok(text.includes('수현: 10,000원 보내기'));
      assert.ok(text.includes('도윤 ➡️ 민지: 40,000원'));
      assert.ok(text.includes('수현 ➡️ 민지: 10,000원'));
      assert.ok(text.includes('핀치(Pinch)'));
    });
  });
});
