import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Header } from '../../src/components/common/Header';
import { Card, Badge, EmptyState } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useTripStore } from '../../src/store/useTripStore';
import {
  CurrencyCode,
  WalletCategory,
  formatCurrency,
  CURRENCY_SYMBOLS,
  convertToKrw,
} from '../../src/utils/settlementUtils';
import {
  Wallet,
  Receipt,
  Plus,
  Users,
  Share2,
  CheckCircle2,
  ArrowRight,
  Coins,
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  Home as HomeIcon,
  Ticket,
  Copy,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react-native';

const CATEGORIES: { key: WalletCategory; label: string; icon: any; color: string; bg: string }[] = [
  { key: 'FOOD', label: '식비', icon: Utensils, color: '#FF6B6B', bg: 'bg-rose-50' },
  { key: 'TRANSPORT', label: '교통', icon: Car, color: '#4ECDC4', bg: 'bg-teal-50' },
  { key: 'SHOPPING', label: '쇼핑', icon: ShoppingBag, color: '#FF9F1C', bg: 'bg-amber-50' },
  { key: 'LODGING', label: '숙소', icon: HomeIcon, color: '#A29BFE', bg: 'bg-purple-50' },
  { key: 'ACTIVITY', label: '관광/체험', icon: Ticket, color: '#3B82F6', bg: 'bg-blue-50' },
  { key: 'OTHER', label: '기타', icon: Coins, color: '#6B7280', bg: 'bg-gray-100' },
];

export default function WalletScreen() {
  const {
    expenses,
    members,
    activeTab,
    exchangeRates,
    setActiveTab,
    addExpense,
    deleteExpense,
    toggleTransactionSettled,
    getMemberBalances,
    getTransactions,
    getTotalKrw,
    generateShareText,
  } = useWalletStore();

  const { currentTrip, scheduleItems } = useTripStore();

  // Modal State for Adding Expense
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('JPY');
  const [category, setCategory] = useState<WalletCategory>('FOOD');
  const [paidBy, setPaidBy] = useState<string>(members[0]?.id || 'm1');
  const [splitMembers, setSplitMembers] = useState<string[]>(members.map((m) => m.id));
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Stats
  const totalKrw = getTotalKrw();
  const budget = currentTrip?.budget || 1200000;
  const budgetUsagePercent = Math.min(Math.round((totalKrw / budget) * 100), 100);

  const memberBalances = getMemberBalances();
  const transactions = getTransactions();

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategoryFilter === 'ALL') return true;
    return e.category === selectedCategoryFilter;
  });

  // Calculate Currency totals
  const jpyTotal = expenses
    .filter((e) => e.currency === 'JPY')
    .reduce((sum, e) => sum + e.amount, 0);
  const krwDirectTotal = expenses
    .filter((e) => e.currency === 'KRW')
    .reduce((sum, e) => sum + e.amount, 0);

  // Toggle Split Member in modal
  const handleToggleSplitMember = (memberId: string) => {
    if (splitMembers.includes(memberId)) {
      if (splitMembers.length === 1) {
        Alert.alert('알림', '최소 1명 이상의 정산 멤버가 필요합니다.');
        return;
      }
      setSplitMembers(splitMembers.filter((id) => id !== memberId));
    } else {
      setSplitMembers([...splitMembers, memberId]);
    }
  };

  // Toggle All Members
  const handleToggleAllMembers = () => {
    if (splitMembers.length === members.length) {
      setSplitMembers([paidBy]);
    } else {
      setSplitMembers(members.map((m) => m.id));
    }
  };

  // Handle Create Expense
  const handleSaveExpense = () => {
    if (!title.trim()) {
      Alert.alert('알림', '지출 항목명을 입력해주세요.');
      return;
    }

    const numAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('알림', '올바른 금액을 입력해주세요.');
      return;
    }

    if (splitMembers.length === 0) {
      Alert.alert('알림', '정산에 참여할 멤버를 선택해주세요.');
      return;
    }

    addExpense({
      trip_id: currentTrip?.id || 't_tokyo',
      place_name: selectedPlaceName || undefined,
      title: title.trim(),
      paid_by: paidBy,
      currency,
      amount: numAmount,
      exchange_rate: exchangeRates[currency] || 1,
      split_members: splitMembers,
      category,
    });

    // Reset Form
    setTitle('');
    setAmountStr('');
    setSelectedPlaceName('');
    setModalVisible(false);

    Alert.alert('지출 등록 완료 🎉', `"${title.trim()}" 지출이 등록되었습니다.`);
  };

  // Copy Settlement to Clipboard
  const handleCopyShareText = async () => {
    const text = generateShareText(currentTrip?.title || '핀치 도쿄 여행');
    await Clipboard.setStringAsync(text);
    Alert.alert(
      '정산서 복사 완료! 📋',
      '클립보드에 복사되었습니다.\n카카오톡이나 메신저 채팅방에 붙여넣어 멤버들에게 공유해보세요!'
    );
  };

  // Category Icon helper
  const renderCategoryIcon = (cat: WalletCategory, size = 18) => {
    const found = CATEGORIES.find((c) => c.key === cat) || CATEGORIES[5];
    const IconComp = found.icon;
    return <IconComp size={size} color={found.color} />;
  };

  // Live conversion in modal
  const enteredAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const liveKrwAmount = convertToKrw(enteredAmount, currency, exchangeRates[currency]);

  return (
    <View className="flex-1 bg-background">
      <Header
        title="여행 가계부 💳"
        subtitle="이중통화 실시간 환율 & 최소 송금 정산"
        rightAction={
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleCopyShareText}
              className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center"
              accessibilityLabel="정산서 복사"
            >
              <Share2 size={18} color="#4ECDC4" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
              accessibilityLabel="지출 추가"
            >
              <Plus size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Segmented Control Tabs */}
      <View style={tabStyles.container}>
        <View style={tabStyles.track}>
          <TouchableOpacity
            onPress={() => setActiveTab('expenses')}
            activeOpacity={0.8}
            style={[
              tabStyles.tab,
              activeTab === 'expenses' ? tabStyles.activeTab : tabStyles.inactiveTab,
            ]}
          >
            <Receipt
              size={16}
              color={activeTab === 'expenses' ? '#FF6B6B' : '#6B7280'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                tabStyles.tabText,
                activeTab === 'expenses' ? tabStyles.activeTabText : tabStyles.inactiveTabText,
              ]}
            >
              지출 내역 ({expenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('settlement')}
            activeOpacity={0.8}
            style={[
              tabStyles.tab,
              activeTab === 'settlement' ? tabStyles.activeTab : tabStyles.inactiveTab,
            ]}
          >
            <Users
              size={16}
              color={activeTab === 'settlement' ? '#FF6B6B' : '#6B7280'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                tabStyles.tabText,
                activeTab === 'settlement' ? tabStyles.activeTabText : tabStyles.inactiveTabText,
              ]}
            >
              1/N 정산 ({transactions.length}건 송금)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Total Spending & Dual Currency Dashboard */}
        <View className="p-4 mx-4 mt-3 bg-surface rounded-3xl border border-borderLine shadow-sm">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center">
              <Coins size={15} color="#FF6B6B" className="mr-1" />
              <Text className="text-xs font-bold text-mutedText">총 여행 지출</Text>
            </View>
            <Badge label={`예산의 ${budgetUsagePercent}% 소진`} variant="secondary" />
          </View>

          {/* Main KRW Amount */}
          <View className="flex-row items-baseline mb-2">
            <Text className="text-3xl font-extrabold text-darkText tracking-tight">
              {totalKrw.toLocaleString()}
            </Text>
            <Text className="text-lg font-bold text-darkText ml-1">원</Text>
          </View>

          {/* Dual Currency Sub-breakdown */}
          <View className="flex-row items-center flex-wrap gap-2 py-2 px-3 bg-gray-50 rounded-2xl mb-3">
            {jpyTotal > 0 && (
              <View className="flex-row items-center">
                <Text className="text-[11px] font-bold text-gray-500">엔화(JPY): </Text>
                <Text className="text-[11px] font-extrabold text-primary">
                  ¥{jpyTotal.toLocaleString()}
                </Text>
              </View>
            )}
            {krwDirectTotal > 0 && (
              <View className="flex-row items-center">
                <Text className="text-[11px] font-bold text-gray-500"> · 원화(KRW): </Text>
                <Text className="text-[11px] font-extrabold text-darkText">
                  ₩{krwDirectTotal.toLocaleString()}
                </Text>
              </View>
            )}
            <View className="ml-auto flex-row items-center">
              <Text className="text-[10px] text-mutedText">환율: 100엔 = 915원</Text>
            </View>
          </View>

          {/* Budget Progress Bar */}
          <View className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-mutedText">
              설정 예산: {budget.toLocaleString()}원
            </Text>
            <Text className="text-xs font-bold text-primary">
              남은 예산: {Math.max(budget - totalKrw, 0).toLocaleString()}원
            </Text>
          </View>
        </View>

        {/* TAB 1: EXPENSES LIST */}
        {activeTab === 'expenses' && (
          <View className="px-4 mt-5">
            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 6 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategoryFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full border ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-darkText border-darkText'
                    : 'bg-white border-borderLine'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategoryFilter === 'ALL' ? 'text-white' : 'text-mutedText'
                  }`}
                >
                  전체 ({expenses.length})
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const count = expenses.filter((e) => e.category === cat.key).length;
                const isSelected = selectedCategoryFilter === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setSelectedCategoryFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-full border flex-row items-center ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-white border-borderLine'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-darkText'
                      }`}
                    >
                      {cat.label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Expense Cards */}
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => {
                const payer = members.find((m) => m.id === expense.paid_by);
                const categoryObj = CATEGORIES.find((c) => c.key === expense.category);

                return (
                  <Card key={expense.id} className="mb-3 p-3.5">
                    <View className="flex-row items-start justify-between">
                      {/* Left: Category Icon + Details */}
                      <View className="flex-row items-start flex-1 mr-2">
                        <View
                          className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${
                            categoryObj?.bg || 'bg-gray-100'
                          }`}
                        >
                          {renderCategoryIcon(expense.category, 20)}
                        </View>

                        <View className="flex-1">
                          <Text
                            className="text-sm font-bold text-darkText mb-0.5 leading-snug"
                            numberOfLines={1}
                          >
                            {expense.title}
                          </Text>

                          {/* Itinerary Place Link Badge */}
                          {expense.place_name && (
                            <View className="flex-row items-center mb-1">
                              <MapPin size={11} color="#FF6B6B" />
                              <Text
                                className="text-[11px] font-bold text-primary ml-0.5"
                                numberOfLines={1}
                              >
                                {expense.place_name}
                              </Text>
                            </View>
                          )}

                          {/* Payer & Split info */}
                          <View className="flex-row items-center flex-wrap gap-1.5 mt-0.5">
                            <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded-md">
                              <View
                                className="w-3.5 h-3.5 rounded-full items-center justify-center mr-1"
                                style={{ backgroundColor: payer?.color || '#FF6B6B' }}
                              >
                                <Text className="text-[9px] font-bold text-white">
                                  {payer?.name[0] || 'P'}
                                </Text>
                              </View>
                              <Text className="text-[10px] font-bold text-darkText">
                                {payer?.name || '멤버'} 결제
                              </Text>
                            </View>

                            <Text className="text-[10px] text-mutedText">
                              {expense.split_members.length}명 분할
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Right: Dual Currency Amounts & Delete */}
                      <View className="items-end">
                        <Text className="text-base font-extrabold text-darkText">
                          {formatCurrency(expense.amount, expense.currency)}
                        </Text>
                        {expense.currency !== 'KRW' && (
                          <Text className="text-[11px] font-bold text-mutedText mt-0.5">
                            ≈ {expense.krw_amount.toLocaleString()}원
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('지출 삭제', `"${expense.title}" 항목을 삭제할까요?`, [
                              { text: '취소', style: 'cancel' },
                              {
                                text: '삭제',
                                style: 'destructive',
                                onPress: () => deleteExpense(expense.id),
                              },
                            ]);
                          }}
                          className="mt-2 p-1"
                          accessibilityLabel="지출 삭제"
                        >
                          <Trash2 size={14} color="#D1D5DB" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                icon={<Receipt size={32} color="#FF6B6B" />}
                title="지출 내역이 없습니다"
                description="여행 중 사용한 금액을 등록하면 실시간 환율과 1/N 정산이 자동으로 계산됩니다."
                actionButton={
                  <Button
                    title="지출 등록하기"
                    onPress={() => setModalVisible(true)}
                    size="sm"
                    icon={<Plus size={14} color="#FFF" />}
                  />
                }
              />
            )}
          </View>
        )}

        {/* TAB 2: 1/N SETTLEMENT */}
        {activeTab === 'settlement' && (
          <View className="px-4 mt-5">
            {/* Messenger Share Quick Banner */}
            <Card className="p-4 mb-4 bg-gradient-to-r from-rose-50 to-teal-50 border-primary/20">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-1">
                    <Sparkles size={16} color="#FF6B6B" />
                    <Text className="text-sm font-extrabold text-darkText ml-1.5">
                      카카오톡 메신저 원터치 공유
                    </Text>
                  </View>
                  <Text className="text-xs text-mutedText">
                    최소 송금 경로로 깔끔하게 포맷된 정산서를 복사합니다.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyShareText}
                  className="bg-primary px-3.5 py-2.5 rounded-2xl flex-row items-center shadow-sm"
                >
                  <Copy size={14} color="#FFF" />
                  <Text className="text-xs font-bold text-white ml-1.5">정산서 복사</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Smart Min-Cash-Flow Transaction Steps */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Wallet size={18} color="#FF6B6B" />
                  <Text className="text-base font-bold text-darkText ml-1.5">
                    스마트 최소 송금 경로 ({transactions.length}건)
                  </Text>
                </View>
                <Badge label="최소 횟수 알고리즘" variant="primary" />
              </View>

              {transactions.length > 0 ? (
                transactions.map((tx, idx) => {
                  return (
                    <Card
                      key={tx.id}
                      className={`mb-2.5 p-3.5 ${
                        tx.is_settled ? 'bg-gray-50 border-gray-200 opacity-60' : ''
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        {/* From Member */}
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-2"
                            style={{ backgroundColor: tx.from.color || '#FF6B6B' }}
                          >
                            <Text className="text-xs font-bold text-white">{tx.from.name[0]}</Text>
                          </View>
                          <View>
                            <Text className="text-xs font-bold text-darkText">{tx.from.name}</Text>
                            <Text className="text-[10px] text-rose-500 font-semibold">보내는 분</Text>
                          </View>
                        </View>

                        {/* Middle Arrow with Amount */}
                        <View className="items-center px-2">
                          <Text
                            className={`text-sm font-extrabold ${
                              tx.is_settled ? 'text-gray-400 line-through' : 'text-primary'
                            }`}
                          >
                            {tx.amount_krw.toLocaleString()}원
                          </Text>
                          <View className="flex-row items-center">
                            <View className="h-0.5 w-6 bg-primary/40" />
                            <ArrowRight size={14} color="#FF6B6B" />
                          </View>
                        </View>

                        {/* To Member */}
                        <View className="flex-row items-center flex-1 justify-end">
                          <View className="items-end mr-2">
                            <Text className="text-xs font-bold text-darkText">{tx.to.name}</Text>
                            <Text className="text-[10px] text-emerald-600 font-semibold">받는 분</Text>
                          </View>
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: tx.to.color || '#4ECDC4' }}
                          >
                            <Text className="text-xs font-bold text-white">{tx.to.name[0]}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Settlement Status Toggle */}
                      <TouchableOpacity
                        onPress={() => toggleTransactionSettled(tx.id)}
                        className="mt-2.5 pt-2 border-t border-gray-100 flex-row items-center justify-center"
                        style={{ opacity: tx.is_settled ? 0.8 : 1 }}
                      >
                        <CheckCircle2
                          size={14}
                          color={tx.is_settled ? '#10B981' : '#D1D5DB'}
                        />
                        <Text
                          className={`text-xs ml-1 font-bold ${
                            tx.is_settled ? 'text-emerald-600' : 'text-mutedText'
                          }`}
                        >
                          {tx.is_settled ? '송금 완료됨' : '송금 완료 표시하기'}
                        </Text>
                      </TouchableOpacity>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-4 items-center justify-center">
                  <CheckCircle2 size={32} color="#10B981" />
                  <Text className="text-sm font-bold text-darkText mt-2">
                    모든 정산이 완료되었습니다! 🎉
                  </Text>
                  <Text className="text-xs text-mutedText mt-1">
                    추가 지출이 발생하면 자동으로 송금 경로가 다시 계산됩니다.
                  </Text>
                </Card>
              )}
            </View>

            {/* Individual Member Balances */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-darkText">개인별 지출 및 정산 현황</Text>
                <Text className="text-xs text-mutedText">총 {members.length}명</Text>
              </View>

              <Card className="p-3">
                {memberBalances.map((mb, idx) => (
                  <View
                    key={mb.member.id}
                    className={`flex-row items-center justify-between py-2.5 ${
                      idx < memberBalances.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: mb.member.color || '#FF6B6B' }}
                      >
                        <Text className="text-xs font-bold text-white">{mb.member.name[0]}</Text>
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-darkText">{mb.member.name}</Text>
                        <Text className="text-[11px] text-mutedText">
                          결제 {mb.paid_krw.toLocaleString()}원 · 분할 {mb.owed_krw.toLocaleString()}원
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      {mb.net_krw > 0 ? (
                        <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-lg">
                          <ArrowUpRight size={14} color="#10B981" />
                          <Text className="text-xs font-bold text-emerald-600 ml-0.5">
                            +{mb.net_krw.toLocaleString()}원 받기
                          </Text>
                        </View>
                      ) : mb.net_krw < 0 ? (
                        <View className="flex-row items-center bg-rose-50 px-2 py-1 rounded-lg">
                          <ArrowDownRight size={14} color="#EF4444" />
                          <Text className="text-xs font-bold text-rose-500 ml-0.5">
                            {Math.abs(mb.net_krw).toLocaleString()}원 보내기
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
                          <Check size={12} color="#9CA3AF" />
                          <Text className="text-xs font-bold text-gray-500 ml-0.5">0원 (정산 완료)</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Expense Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-primary px-5 py-3.5 rounded-full flex-row items-center shadow-lg"
          style={{
            shadowColor: '#FF6B6B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          }}
          accessibilityLabel="지출 등록"
        >
          <Plus size={20} color="#FFF" />
          <Text className="text-sm font-extrabold text-white ml-1.5">지출 추가</Text>
        </TouchableOpacity>
      </View>

      {/* ADD EXPENSE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <Receipt size={20} color="#FF6B6B" />
                <Text className="text-lg font-extrabold text-darkText ml-1.5">새 지출 추가</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {/* Currency Selector & Amount Input */}
              <Text className="text-xs font-bold text-mutedText mb-1.5">금액 및 통화</Text>
              <View className="flex-row items-center gap-2 mb-2">
                {(['JPY', 'KRW', 'USD', 'EUR'] as CurrencyCode[]).map((cur) => (
                  <TouchableOpacity
                    key={cur}
                    onPress={() => setCurrency(cur)}
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      currency === cur
                        ? 'bg-primary border-primary'
                        : 'bg-white border-borderLine'
                    }`}
                  >
                    <Text
                      className={`text-xs font-extrabold ${
                        currency === cur ? 'text-white' : 'text-darkText'
                      }`}
                    >
                      {CURRENCY_SYMBOLS[cur]} {cur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <View className="bg-gray-50 border border-borderLine rounded-2xl px-4 py-3 flex-row items-center mb-1">
                <Text className="text-xl font-bold text-primary mr-2">
                  {CURRENCY_SYMBOLS[currency]}
                </Text>
                <TextInput
                  value={amountStr}
                  onChangeText={setAmountStr}
                  placeholder="0"
                  keyboardType="numeric"
                  className="flex-1 text-2xl font-extrabold text-darkText"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Live KRW conversion preview */}
              {currency !== 'KRW' && (
                <Text className="text-xs font-bold text-primary mb-4 px-1">
                  ≈ 실시간 환율 적용: {liveKrwAmount.toLocaleString()}원 (100엔당 915원)
                </Text>
              )}

              {/* Title Input */}
              <Text className="text-xs font-bold text-mutedText mb-1.5 mt-2">지출 내용</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="예: 푸글렌 도쿄 커피, 돈키호테 기념품"
                className="bg-gray-50 border border-borderLine rounded-2xl px-4 py-3 text-sm font-bold text-darkText mb-4"
                placeholderTextColor="#9CA3AF"
              />

              {/* Optional Itinerary Place Link */}
              {scheduleItems.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-mutedText mb-1.5">
                    일정 장소 연결 (선택)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedPlaceName('')}
                      className={`px-3 py-1.5 rounded-full border ${
                        !selectedPlaceName
                          ? 'bg-darkText border-darkText'
                          : 'bg-white border-borderLine'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          !selectedPlaceName ? 'text-white' : 'text-mutedText'
                        }`}
                      >
                        선택 안함
                      </Text>
                    </TouchableOpacity>

                    {scheduleItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedPlaceName(item.place_name)}
                        className={`px-3 py-1.5 rounded-full border flex-row items-center ${
                          selectedPlaceName === item.place_name
                            ? 'bg-primary border-primary'
                            : 'bg-white border-borderLine'
                        }`}
                      >
                        <MapPin
                          size={11}
                          color={selectedPlaceName === item.place_name ? '#FFF' : '#FF6B6B'}
                          className="mr-1"
                        />
                        <Text
                          className={`text-xs font-bold ${
                            selectedPlaceName === item.place_name ? 'text-white' : 'text-darkText'
                          }`}
                        >
                          {item.place_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Category Selector */}
              <Text className="text-xs font-bold text-mutedText mb-1.5">카테고리</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  const IconComp = cat.icon;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      className={`px-3 py-2 rounded-2xl border flex-row items-center ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'bg-white border-borderLine'
                      }`}
                    >
                      <IconComp
                        size={14}
                        color={isSelected ? '#FFF' : cat.color}
                        className="mr-1.5"
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-darkText'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Paid By (Payer) */}
              <Text className="text-xs font-bold text-mutedText mb-1.5">결제한 사람</Text>
              <View className="flex-row gap-2 mb-4">
                {members.map((m) => {
                  const isSelected = paidBy === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setPaidBy(m.id)}
                      className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center ${
                        isSelected
                          ? 'bg-darkText border-darkText'
                          : 'bg-white border-borderLine'
                      }`}
                    >
                      <View
                        className="w-4 h-4 rounded-full items-center justify-center mr-1.5"
                        style={{ backgroundColor: m.color || '#FF6B6B' }}
                      >
                        <Text className="text-[9px] font-bold text-white">{m.name[0]}</Text>
                      </View>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-darkText'
                        }`}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Split Members */}
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-mutedText">
                  함께 나눌 멤버 ({splitMembers.length}명)
                </Text>
                <TouchableOpacity onPress={handleToggleAllMembers}>
                  <Text className="text-xs font-bold text-primary">
                    {splitMembers.length === members.length ? '전체 해제' : '전체 선택'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 mb-6">
                {members.map((m) => {
                  const isChecked = splitMembers.includes(m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => handleToggleSplitMember(m.id)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl border items-center justify-center ${
                        isChecked
                          ? 'bg-primary/10 border-primary'
                          : 'bg-white border-borderLine'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-4 h-4 rounded-full items-center justify-center mr-1"
                          style={{ backgroundColor: m.color || '#FF6B6B' }}
                        >
                          <Text className="text-[9px] font-bold text-white">{m.name[0]}</Text>
                        </View>
                        <Text
                          className={`text-xs font-bold ${
                            isChecked ? 'text-primary' : 'text-mutedText'
                          }`}
                        >
                          {m.name}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-mutedText mt-0.5">
                        {isChecked && enteredAmount > 0
                          ? `1인 ${formatCurrency(
                              enteredAmount / splitMembers.length,
                              currency
                            )}`
                          : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit Button */}
              <Button
                title="지출 등록 완료"
                onPress={handleSaveExpense}
                variant="primary"
                size="lg"
                className="w-full"
              />
              <View className="h-6" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  inactiveTabText: {
    color: '#6B7280',
  },
});
