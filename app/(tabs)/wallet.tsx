import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useTripStore } from '../../src/store/useTripStore';
import {
  Wallet,
  Plus,
  CreditCard,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Utensils,
  Car,
  Home as HomeIcon,
  ShoppingBag,
} from 'lucide-react-native';

export default function WalletScreen() {
  const { getActiveTrip, expenses, deleteExpense } = useTripStore();
  const activeTrip = getActiveTrip();

  // Calculate statistics
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const budget = activeTrip?.budget || 500000;
  const budgetUsagePercent = Math.min(Math.round((totalAmount / budget) * 100), 100);

  // 1/N settlement calculation logic
  const members = activeTrip?.members || [];
  const perPersonTarget = members.length > 0 ? Math.round(totalAmount / members.length) : 0;

  const memberBalances = members.map((member) => {
    const paidTotal = expenses
      .filter((e) => e.payerId === member.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = paidTotal - perPersonTarget;
    return {
      ...member,
      paidTotal,
      balance,
    };
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Utensils size={16} color="#FF6B6B" />;
      case 'transport':
        return <Car size={16} color="#4ECDC4" />;
      case 'stay':
        return <HomeIcon size={16} color="#A29BFE" />;
      default:
        return <ShoppingBag size={16} color="#FF9F1C" />;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="여행 가계부 💳"
        subtitle="투명하고 손쉬운 1/N 정산"
        rightAction={
          <TouchableOpacity className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Plus size={20} color="#FF6B6B" />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Total Spending & Budget Progress */}
        <View className="p-4 mx-4 mt-4 bg-surface rounded-3xl border border-borderLine shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-mutedText">총 지출 금액</Text>
            <Badge label={`예산의 ${budgetUsagePercent}% 사용`} variant="secondary" />
          </View>

          <Text className="text-3xl font-extrabold text-darkText mb-3">
            {totalAmount.toLocaleString()} <Text className="text-lg font-bold">원</Text>
          </Text>

          {/* Progress bar */}
          <View className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-mutedText">
              목표 예산: {budget.toLocaleString()}원
            </Text>
            <Text className="text-xs font-bold color-primary">
              남은 예산: {Math.max(budget - totalAmount, 0).toLocaleString()}원
            </Text>
          </View>
        </View>

        {/* 1/N Settlement Breakdown per Member */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <PieChart size={18} color="#FF6B6B" className="mr-1" />
              <Text className="text-lg font-bold text-darkText ml-1">1/N 정산 현황</Text>
            </View>
            <Text className="text-xs text-mutedText">1인당 {perPersonTarget.toLocaleString()}원</Text>
          </View>

          <Card className="p-3">
            {memberBalances.map((mb, idx) => (
              <View
                key={mb.id}
                className={`flex-row items-center justify-between py-2.5 ${
                  idx < memberBalances.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: mb.color || '#FF6B6B' }}
                  >
                    <Text className="text-xs font-bold text-white">{mb.name[0]}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-darkText">{mb.name}</Text>
                    <Text className="text-[11px] text-mutedText">
                      결제금액: {mb.paidTotal.toLocaleString()}원
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  {mb.balance > 0 ? (
                    <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-lg">
                      <ArrowUpRight size={14} color="#10B981" />
                      <Text className="text-xs font-bold text-emerald-600 ml-0.5">
                        +{mb.balance.toLocaleString()}원 받기
                      </Text>
                    </View>
                  ) : mb.balance < 0 ? (
                    <View className="flex-row items-center bg-rose-50 px-2 py-1 rounded-lg">
                      <ArrowDownRight size={14} color="#EF4444" />
                      <Text className="text-xs font-bold text-rose-500 ml-0.5">
                        {Math.abs(mb.balance).toLocaleString()}원 보낼 돈
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs font-bold text-gray-400">정산 완료</Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Expense History List */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-darkText">지출 내역 ({expenses.length}건)</Text>
            <TouchableOpacity className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full">
              <Plus size={14} color="#FF6B6B" />
              <Text className="text-xs font-bold color-primary ml-1">지출 추가</Text>
            </TouchableOpacity>
          </View>

          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const payer = members.find((m) => m.id === expense.payerId);
              return (
                <Card key={expense.id} className="mb-2.5 p-3 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center mr-3">
                      {getCategoryIcon(expense.category)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-darkText mb-0.5" numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text className="text-[11px] text-mutedText">
                        {expense.date} · {payer ? `${payer.name} 결제` : '결제'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-base font-extrabold text-darkText ml-2">
                    {expense.amount.toLocaleString()}원
                  </Text>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<CreditCard size={28} color="#FF6B6B" />}
              title="지출 내역이 없습니다"
              description="여행 중 결제한 내역을 등록하면 자동으로 1/N 정산금이 계산됩니다."
              actionButton={<Button title="첫 지출 등록하기" onPress={() => {}} size="sm" />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
