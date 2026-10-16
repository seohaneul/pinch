import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  Home as HomeIcon,
  Ticket,
  Plane,
  Plus,
  RotateCcw,
  Check,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react-native';
import type { CurrencyCode } from '../../utils/settlementUtils';
import { CURRENCY_SYMBOLS, DEFAULT_EXCHANGE_RATES } from '../../utils/settlementUtils';
import { useWalletStore } from '../../store/useWalletStore';

interface CategoryBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  tripTitle?: string;
  tripId: string;
  currency: CurrencyCode;
  exchangeRate: number;
  initialBudgets: Record<string, number>;
  onSave: (budgets: Record<string, number>) => void;
}

const CATEGORY_ITEMS: {
  key: string;
  label: string;
  icon: any;
  color: string;
  bg: string;
  defaultAmount: number;
}[] = [
  { key: 'FOOD', label: '식비', icon: Utensils, color: '#FF6B6B', bg: '#FFF1F2', defaultAmount: 400000 },
  { key: 'LODGING', label: '숙소', icon: HomeIcon, color: '#A29BFE', bg: '#F5F3FF', defaultAmount: 600000 },
  { key: 'FLIGHT', label: '항공권', icon: Plane, color: '#0284C7', bg: '#F0F9FF', defaultAmount: 450000 },
  { key: 'TRANSPORT', label: '교통', icon: Car, color: '#4ECDC4', bg: '#F0FDFA', defaultAmount: 250000 },
  { key: 'SHOPPING', label: '쇼핑', icon: ShoppingBag, color: '#FF9F1C', bg: '#FFFBEB', defaultAmount: 350000 },
  { key: 'ACTIVITY', label: '관광/체험', icon: Ticket, color: '#3B82F6', bg: '#EFF6FF', defaultAmount: 150000 },
  { key: 'OTHER', label: '기타/예비비', icon: Coins, color: '#6B7280', bg: '#F3F4F6', defaultAmount: 100000 },
];

export const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  visible,
  onClose,
  tripTitle,
  tripId,
  currency,
  exchangeRate,
  initialBudgets,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [budgets, setBudgets] = useState<Record<string, number>>(initialBudgets);

  const {
    getTourPackages,
    addTourPackage,
    removeTourPackage,
    getCustomBudgets,
    addCustomBudget,
    removeCustomBudget,
    updateCustomBudget,
  } = useWalletStore();

  const tourPackages = getTourPackages(tripId);
  const customBudgets = getCustomBudgets(tripId);

  // Tour/Package Section Expand state
  const [isTourSectionExpanded, setIsTourSectionExpanded] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourAmount, setNewTourAmount] = useState('');

  // Custom budget add state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomAmount, setNewCustomAmount] = useState('');

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets, visible]);

  const handleUpdateAmount = (categoryKey: string, newAmount: number) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryKey]: Math.max(newAmount, 0),
    }));
  };

  const handleAddQuickAmount = (categoryKey: string, delta: number) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] || 0) + delta,
    }));
  };

  // Calculate sum of base categories + custom budgets
  const totalCustomAmount = customBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalBudgetKrw =
    Object.values(budgets).reduce((sum, val) => sum + (val || 0), 0) + totalCustomAmount;
  const effectiveRate = exchangeRate || DEFAULT_EXCHANGE_RATES[currency] || 1;
  const totalBudgetForeign =
    currency === 'KRW' ? totalBudgetKrw : Math.round(totalBudgetKrw / effectiveRate);

  // Add Tour / Package handler
  const handleAddTourPackage = () => {
    if (!newTourName.trim()) {
      Alert.alert('알림', '투어 또는 패키지명을 입력해주세요.');
      return;
    }
    const num = parseInt(newTourAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (num <= 0) {
      Alert.alert('알림', '예상 금액을 입력해주세요.');
      return;
    }

    addTourPackage(tripId, {
      name: newTourName.trim(),
      amount: num,
    });

    // Update local ACTIVITY budget immediately
    const totalTours = [...tourPackages, { id: 'temp', trip_id: tripId, name: newTourName, amount: num }]
      .reduce((s, t) => s + t.amount, 0);
    const updatedActivity = Math.max(budgets.ACTIVITY || 0, totalTours);
    setBudgets((prev) => ({ ...prev, ACTIVITY: updatedActivity }));

    setNewTourName('');
    setNewTourAmount('');
    Alert.alert('투어/패키지 등록 완료 🎟️', `"${newTourName.trim()}" (${num.toLocaleString()}원)이 관광/체험 예산에 반영되었습니다.`);
  };

  // Add Custom Budget Category handler
  const handleAddCustomBudget = () => {
    if (!newCustomName.trim()) {
      Alert.alert('알림', '항목명을 입력해주세요 (예: 여행자보험, eSIM 등).');
      return;
    }
    const num = parseInt(newCustomAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (num <= 0) {
      Alert.alert('알림', '예산 금액을 입력해주세요.');
      return;
    }

    addCustomBudget(tripId, {
      name: newCustomName.trim(),
      amount: num,
      color: '#06B6D4',
    });

    setNewCustomName('');
    setNewCustomAmount('');
    setIsAddingCustom(false);
    Alert.alert('직접 추가 완료 ✨', `"${newCustomName.trim()}" 항목(${num.toLocaleString()}원)이 예산에 추가되었습니다.`);
  };

  const handleSave = () => {
    onSave(budgets);
    Alert.alert('예산 설정 완료 💳', '카테고리별 여행 예산이 성공적으로 저장되었습니다.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Coins size={18} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={styles.title}>카테고리별 예산 설정 💰</Text>
              </View>
              <Text style={styles.subtitle}>
                {tripTitle ? `[${tripTitle}] ` : ''}항공권, 숙소, 투어/패키지 및 직접 항목 계획
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Planned Total Overview Box */}
          <View style={styles.overviewBox}>
            <View>
              <Text style={styles.overviewLabel}>총 계획 예산 합계</Text>
              <View style={styles.overviewAmountRow}>
                <Text style={styles.overviewAmountKrw}>
                  {totalBudgetKrw.toLocaleString()}
                </Text>
                <Text style={styles.overviewUnit}>원</Text>
              </View>
            </View>

            {currency !== 'KRW' && (
              <View style={styles.foreignBadge}>
                <Text style={styles.foreignBadgeText}>
                  ≈ {CURRENCY_SYMBOLS[currency]}
                  {totalBudgetForeign.toLocaleString()} {currency}
                </Text>
              </View>
            )}
          </View>

          {/* Category Input Rows */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollList}>
            {CATEGORY_ITEMS.map((item) => {
              const currentVal = budgets[item.key] || 0;
              const foreignVal =
                currency === 'KRW'
                  ? currentVal
                  : Math.round(currentVal / effectiveRate);
              const IconComp = item.icon;
              const isActivity = item.key === 'ACTIVITY';

              return (
                <View key={item.key} style={styles.catCard}>
                  <View style={styles.catHeader}>
                    <View style={styles.catHeaderLeft}>
                      <View style={[styles.catIconWrap, { backgroundColor: item.bg }]}>
                        <IconComp size={16} color={item.color} />
                      </View>
                      <View>
                        <Text style={styles.catLabel}>{item.label}</Text>
                        {currency !== 'KRW' && (
                          <Text style={styles.catForeignText}>
                            ≈ {CURRENCY_SYMBOLS[currency]}
                            {foreignVal.toLocaleString()} {currency}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Numeric Input */}
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={currentVal > 0 ? currentVal.toLocaleString() : ''}
                        onChangeText={(txt) => {
                          const num = parseInt(txt.replace(/[^0-9]/g, ''), 10) || 0;
                          handleUpdateAmount(item.key, num);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                        style={styles.numericInput}
                      />
                      <Text style={styles.inputWon}>원</Text>
                    </View>
                  </View>

                  {/* Quick increment buttons */}
                  <View style={styles.quickBtnRow}>
                    <TouchableOpacity
                      onPress={() => handleAddQuickAmount(item.key, 50000)}
                      style={styles.quickBtn}
                    >
                      <Text style={styles.quickBtnText}>+5만</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAddQuickAmount(item.key, 100000)}
                      style={styles.quickBtn}
                    >
                      <Text style={styles.quickBtnText}>+10만</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAddQuickAmount(item.key, 200000)}
                      style={styles.quickBtn}
                    >
                      <Text style={styles.quickBtnText}>+20만</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUpdateAmount(item.key, 0)}
                      style={[styles.quickBtn, styles.quickResetBtn]}
                    >
                      <RotateCcw size={10} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  {/* SPECIAL SUB-SECTION: Tourism/Activity Tour & Package sub-list */}
                  {isActivity && (
                    <View style={styles.subTourContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsTourSectionExpanded(!isTourSectionExpanded)}
                        style={styles.subTourHeader}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ticket size={13} color="#2563EB" style={{ marginRight: 5 }} />
                          <Text style={styles.subTourHeaderText}>
                            투어 & 패키지 세부 추가 ({tourPackages.length}개 등록됨)
                          </Text>
                        </View>
                        {isTourSectionExpanded ? (
                          <ChevronUp size={15} color="#2563EB" />
                        ) : (
                          <ChevronDown size={15} color="#2563EB" />
                        )}
                      </TouchableOpacity>

                      {isTourSectionExpanded && (
                        <View style={styles.subTourBody}>
                          <Text style={styles.subTourDesc}>
                            입장권, 데이투어, 패키지를 추가하면 관광/체험 예산에 합산 확인됩니다.
                          </Text>

                          {/* Existing Tour Items */}
                          {tourPackages.map((tp) => (
                            <View key={tp.id} style={styles.tourItemRow}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.tourItemName}>{tp.name}</Text>
                                {tp.memo && (
                                  <Text style={styles.tourItemMemo} numberOfLines={1}>
                                    {tp.memo}
                                  </Text>
                                )}
                              </View>
                              <Text style={styles.tourItemAmount}>
                                {tp.amount.toLocaleString()}원
                              </Text>
                              <TouchableOpacity
                                onPress={() => removeTourPackage(tripId, tp.id)}
                                style={styles.tourDeleteBtn}
                              >
                                <Trash2 size={13} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))}

                          {/* Add New Tour Inline Form */}
                          <View style={styles.newTourForm}>
                            <TextInput
                              value={newTourName}
                              onChangeText={setNewTourName}
                              placeholder="투어/패키지명 (예: 디즈니씨 자유이용권)"
                              placeholderTextColor="#94A3B8"
                              style={styles.newTourInputName}
                            />
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                              <TextInput
                                value={newTourAmount}
                                onChangeText={setNewTourAmount}
                                placeholder="금액 (예: 88000)"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                style={styles.newTourInputAmount}
                              />
                              <TouchableOpacity
                                onPress={handleAddTourPackage}
                                style={styles.addTourBtn}
                              >
                                <Plus size={14} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.addTourBtnText}>투어 추가</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* CUSTOM BUDGET ITEMS LIST (정해진 항목 외 직접 추가한 예산들) */}
            {customBudgets.length > 0 && (
              <View style={styles.customSectionWrap}>
                <View style={styles.customSectionTitleRow}>
                  <Tag size={14} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.customSectionTitle}>
                    직접 추가한 맞춤 예산 항목 ({customBudgets.length})
                  </Text>
                </View>

                {customBudgets.map((cb) => (
                  <View key={cb.id} style={[styles.catCard, { borderColor: '#CFFAFE' }]}>
                    <View style={styles.catHeader}>
                      <View style={styles.catHeaderLeft}>
                        <View style={[styles.catIconWrap, { backgroundColor: '#ECFEFF' }]}>
                          <Sparkles size={16} color="#06B6D4" />
                        </View>
                        <View>
                          <Text style={styles.catLabel}>{cb.name}</Text>
                          <Text style={styles.catForeignText}>직접 추가 항목</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.inputWrap}>
                          <TextInput
                            value={cb.amount > 0 ? cb.amount.toLocaleString() : ''}
                            onChangeText={(txt) => {
                              const num = parseInt(txt.replace(/[^0-9]/g, ''), 10) || 0;
                              updateCustomBudget(tripId, cb.id, num);
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#94A3B8"
                            style={styles.numericInput}
                          />
                          <Text style={styles.inputWon}>원</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeCustomBudget(tripId, cb.id)}
                          style={{ marginLeft: 8, padding: 6 }}
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* BUTTON TO ADD CUSTOM BUDGET ITEM */}
            {!isAddingCustom ? (
              <TouchableOpacity
                onPress={() => setIsAddingCustom(true)}
                style={styles.addCustomCardBtn}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.addCustomCardBtnText}>
                  정해진 항목 외 예산 직접 추가하기 (eSIM, 여행자보험 등)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCustomBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.addCustomBoxTitle}>새 예산 항목 직접 추가 📝</Text>
                  <TouchableOpacity onPress={() => setIsAddingCustom(false)}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={newCustomName}
                  onChangeText={setNewCustomName}
                  placeholder="항목 이름 (예: 데이터 eSIM, 여행자보험, 기념품)"
                  placeholderTextColor="#94A3B8"
                  style={styles.customInputText}
                />
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <TextInput
                    value={newCustomAmount}
                    onChangeText={setNewCustomAmount}
                    placeholder="예산 금액 (원)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    style={[styles.customInputText, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomBudget}
                    style={styles.confirmAddCustomBtn}
                  >
                    <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.confirmAddCustomBtnText}>추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={styles.saveBtn}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>
              총 {totalBudgetKrw.toLocaleString()}원 예산 저장하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewBox: {
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  overviewAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overviewAmountKrw: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  overviewUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 3,
  },
  foreignBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  foreignBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  scrollList: {
    maxHeight: 460,
    marginTop: 4,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  catForeignText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 110,
    justifyContent: 'flex-end',
  },
  numericInput: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    padding: 0,
    minWidth: 65,
  },
  inputWon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  quickBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
  },
  quickBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickResetBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subTourContainer: {
    marginTop: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  subTourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subTourHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  subTourBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E0F2FE',
  },
  subTourDesc: {
    fontSize: 10,
    color: '#0284C7',
    marginBottom: 8,
    lineHeight: 14,
  },
  tourItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  tourItemName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  tourItemMemo: {
    fontSize: 9.5,
    color: '#64748B',
  },
  tourItemAmount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    marginRight: 6,
  },
  tourDeleteBtn: {
    padding: 4,
  },
  newTourForm: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  newTourInputName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 4,
  },
  newTourInputAmount: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    padding: 0,
  },
  addTourBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTourBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customSectionWrap: {
    marginTop: 8,
    marginBottom: 6,
  },
  customSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  customSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0891B2',
  },
  addCustomCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#7DD3FC',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  addCustomCardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  addCustomBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  addCustomBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  customInputText: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  confirmAddCustomBtn: {
    backgroundColor: '#0891B2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmAddCustomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
