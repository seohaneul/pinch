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
  Plus,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react-native';
import type { CurrencyCode, WalletCategory } from '../../utils/settlementUtils';
import { CURRENCY_SYMBOLS, DEFAULT_EXCHANGE_RATES } from '../../utils/settlementUtils';

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

  const totalBudgetKrw = Object.values(budgets).reduce((sum, val) => sum + (val || 0), 0);
  const effectiveRate = exchangeRate || DEFAULT_EXCHANGE_RATES[currency] || 1;
  const totalBudgetForeign =
    currency === 'KRW' ? totalBudgetKrw : Math.round(totalBudgetKrw / effectiveRate);

  const handleSave = () => {
    onSave(budgets);
    Alert.alert('예산 설정 완료 💳', '카테고리별 여행 예산이 성공적으로 저장되었습니다.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop touchable to dismiss */}
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
                {tripTitle ? `[${tripTitle}] ` : ''}항목마다 얼마가 들지 계획해보세요
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
                </View>
              );
            })}
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
    maxHeight: '88%',
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
    maxHeight: 380,
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
    minWidth: 120,
    justifyContent: 'flex-end',
  },
  numericInput: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    padding: 0,
    minWidth: 70,
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
