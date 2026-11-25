import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, RefreshCw, Search, X } from '@/components/common/CustomIcons';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAmountInput } from '../../utils/formatUtils';

interface CurrencyCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  defaultFromCurrency?: string;
}

const CURRENCY_KR_NAMES: Record<string, string> = {
  KRW: '대한민국 원',
  JPY: '일본 엔',
  USD: '미국 달러',
  EUR: '유럽 유로',
  VND: '베트남 동',
  THB: '태국 바트',
  TWD: '대만 달러',
  HKD: '홍콩 달러',
  SGD: '싱가포르 달러',
  PHP: '필리핀 페소',
  IDR: '인도네시아 루피아',
  GBP: '영국 파운드',
  CHF: '스위스 프랑',
  AUD: '호주 달러',
  CNY: '중국 위안',
  CAD: '캐나다 달러',
  NZD: '뉴질랜드 달러',
  MYR: '말레이시아 링깃',
  TRY: '튀르키예 리라',
  AED: '아랍에미리트 디르함',
  INR: '인도 루피',
  MXN: '멕시코 페소',
  BRL: '브라질 헤알',
  CZK: '체코 코루나',
  HUF: '헝가리 포린트',
  PLN: '폴란드 즈워티',
  SEK: '스웨덴 크로나',
  NOK: '노르웨이 크로네',
  DKK: '덴마크 크로네',
  MOP: '마카오 파타카',
  KHR: '캄보디아 리엘',
  LAK: '라오스 킵',
  MNT: '몽골 투그릭',
  EGP: '이집트 파운드',
  ZAR: '남아공 랜드',
};

const PRIORITY_ORDER = [
  'KRW',
  'JPY',
  'USD',
  'EUR',
  'VND',
  'THB',
  'TWD',
  'HKD',
  'SGD',
  'PHP',
  'IDR',
  'GBP',
  'CHF',
  'AUD',
  'CNY',
  'CAD',
  'NZD',
  'MYR',
  'TRY',
  'AED',
];

export const CurrencyCalculatorModal: React.FC<CurrencyCalculatorModalProps> = ({
  visible,
  onClose,
  defaultFromCurrency = 'JPY',
}) => {
  const insets = useSafeAreaInsets();
  const { allExchangeRates, lastExchangeRateUpdate, isUpdatingRates, refreshLiveExchangeRates } =
    useWalletStore();

  const [fromCurrency, setFromCurrency] = useState(
    defaultFromCurrency === 'KRW' ? 'USD' : defaultFromCurrency
  );
  const [toCurrency, setToCurrency] = useState('KRW');
  const [amountInput, setAmountInput] = useState('1000');
  const [pickingSide, setPickingSide] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    const initialFrom = defaultFromCurrency === 'KRW' ? 'USD' : defaultFromCurrency;
    setFromCurrency(initialFrom);
    setToCurrency('KRW');
    setAmountInput(initialFrom === 'VND' || initialFrom === 'IDR' ? '100,000' : initialFrom === 'JPY' ? '1,000' : '100');
    setPickingSide(null);
    setSearchQuery('');
  }, [visible, defaultFromCurrency]);

  const currencyList = useMemo(() => {
    const keys = Object.keys(allExchangeRates || {});
    const prioritySet = new Set(PRIORITY_ORDER);
    const prioritized = PRIORITY_ORDER.filter((code) => keys.includes(code));
    const others = keys.filter((code) => !prioritySet.has(code)).sort();
    return [...prioritized, ...others];
  }, [allExchangeRates]);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currencyList;
    return currencyList.filter((code) => {
      const label = (CURRENCY_KR_NAMES[code] || '').toLowerCase();
      return code.toLowerCase().includes(q) || label.includes(q);
    });
  }, [currencyList, searchQuery]);

  const numericAmount = useMemo(() => {
    const cleaned = amountInput.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  // allExchangeRates stores 1 <CUR> = X KRW
  const fromKrwRate = allExchangeRates[fromCurrency] || 1;
  const toKrwRate = allExchangeRates[toCurrency] || 1;
  const convertedAmount = useMemo(() => {
    if (numericAmount <= 0 || !toKrwRate) return 0;
    const krwValue = numericAmount * fromKrwRate;
    return krwValue / toKrwRate;
  }, [numericAmount, fromKrwRate, toKrwRate]);

  const formattedConverted = useMemo(() => {
    if (convertedAmount === 0) return '0';
    if (toCurrency === 'KRW' || toCurrency === 'JPY' || toCurrency === 'VND' || toCurrency === 'IDR') {
      return Math.round(convertedAmount).toLocaleString();
    }
    return convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [convertedAmount, toCurrency]);

  const unitRateText = useMemo(() => {
    const baseUnit = fromCurrency === 'VND' || fromCurrency === 'IDR' || fromCurrency === 'JPY' ? 100 : 1;
    const result = (baseUnit * fromKrwRate) / toKrwRate;
    const decimals = toCurrency === 'KRW' && result >= 100 ? 0 : result >= 10 ? 1 : 2;
    return `${baseUnit.toLocaleString()} ${fromCurrency} ≈ ${result.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} ${toCurrency}`;
  }, [fromCurrency, toCurrency, fromKrwRate, toKrwRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleRefresh = async () => {
    const ok = await refreshLiveExchangeRates();
    if (!ok) {
      Alert.alert('환율 조회 실패', '실시간 환율을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.');
    }
  };

  const handleQuickPreset = (val: number) => {
    setAmountInput(val.toLocaleString());
  };

  const quickPresets =
    fromCurrency === 'VND' || fromCurrency === 'IDR'
      ? [10000, 50000, 100000, 500000]
      : fromCurrency === 'KRW'
        ? [10000, 50000, 100000, 500000]
        : fromCurrency === 'JPY'
          ? [500, 1000, 5000, 10000]
          : [10, 50, 100, 500];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>실시간 환율 계산기</Text>
              <Text style={styles.subtitle}>
                전 세계 {currencyList.length}개 통화 지원 · {lastExchangeRateUpdate || '실시간'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                disabled={isUpdatingRates}
                style={styles.iconBtn}
                activeOpacity={0.75}
              >
                <RefreshCw size={16} color="#1B2A4A" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.75}>
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          {pickingSide ? (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerTopRow}>
                <Text style={styles.pickerTitle}>
                  {pickingSide === 'from' ? '보유 통화 선택' : '변환할 통화 선택'}
                </Text>
                <TouchableOpacity onPress={() => setPickingSide(null)}>
                  <Text style={styles.pickerBackText}>돌아가기</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="통화 코드 또는 국가명 (예: VND, 베트남, 캐나다)"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  autoCapitalize="characters"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item}
                style={{ maxHeight: 300 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: code }) => {
                  const selected =
                    (pickingSide === 'from' && fromCurrency === code) ||
                    (pickingSide === 'to' && toCurrency === code);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        if (pickingSide === 'from') {
                          setFromCurrency(code);
                        } else {
                          setToCurrency(code);
                        }
                        setPickingSide(null);
                      }}
                      style={[styles.currencyRow, selected && styles.currencyRowActive]}
                    >
                      <View>
                        <Text style={styles.currencyCode}>{code}</Text>
                        <Text style={styles.currencyName}>
                          {CURRENCY_KR_NAMES[code] || `${code} 통화`}
                        </Text>
                      </View>
                      <Text style={styles.currencyRateHint}>
                        {code === 'KRW'
                          ? '1원'
                          : allExchangeRates[code] < 1
                            ? `100 ${code} ≈ ${(allExchangeRates[code] * 100).toFixed(1)}원`
                            : `1 ${code} ≈ ${Math.round(allExchangeRates[code]).toLocaleString()}원`}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <>
              {/* From Box */}
              <View style={styles.currencyCard}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    setSearchQuery('');
                    setPickingSide('from');
                  }}
                  style={styles.currencySelectorBtn}
                >
                  <Text style={styles.selectorCode}>{fromCurrency}</Text>
                  <Text style={styles.selectorName} numberOfLines={1}>
                    {CURRENCY_KR_NAMES[fromCurrency] || fromCurrency} ▾
                  </Text>
                </TouchableOpacity>

                <TextInput
                  value={amountInput}
                  onChangeText={(txt) => setAmountInput(formatAmountInput(txt, true))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  style={styles.amountInput}
                />
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {quickPresets.map((val) => (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.75}
                    onPress={() => handleQuickPreset(val)}
                    style={styles.presetPill}
                  >
                    <Text style={styles.presetText}>{val.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Swap & Unit Rate */}
              <View style={styles.swapRow}>
                <Text style={styles.unitRateText}>{unitRateText}</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handleSwap} style={styles.swapBtn}>
                  <ArrowRight size={14} color="#1B2A4A" />
                  <Text style={styles.swapBtnText}>통화 바꾸기</Text>
                </TouchableOpacity>
              </View>

              {/* To Box */}
              <View style={[styles.currencyCard, styles.resultCard]}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => {
                    setSearchQuery('');
                    setPickingSide('to');
                  }}
                  style={styles.currencySelectorBtn}
                >
                  <Text style={styles.selectorCode}>{toCurrency}</Text>
                  <Text style={styles.selectorName} numberOfLines={1}>
                    {CURRENCY_KR_NAMES[toCurrency] || toCurrency} ▾
                  </Text>
                </TouchableOpacity>

                <Text style={styles.resultText} numberOfLines={1} adjustsFontSizeToFit>
                  {formattedConverted}
                </Text>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#EEF2F8',
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  currencySelectorBtn: {
    minWidth: 110,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  selectorCode: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1B2A4A',
  },
  selectorName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'right',
    paddingVertical: 0,
  },
  resultText: {
    flex: 1,
    fontSize: 23,
    fontWeight: '900',
    color: '#1B2A4A',
    textAlign: 'right',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unitRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
  },
  swapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  pickerContainer: {
    paddingBottom: 8,
  },
  pickerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  pickerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  currencyRowActive: {
    backgroundColor: '#EEF2F8',
  },
  currencyCode: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  currencyName: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  currencyRateHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
});
