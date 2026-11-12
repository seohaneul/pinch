import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from '@/components/common/CustomIcons';

interface CalendarRangePickerProps {
  visible: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 헬퍼: YYYY-MM-DD 문자열을 로컬 Date 객체로 안전하게 변환
function parseISODate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.includes('-')) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

// 헬퍼: Date 객체를 YYYY-MM-DD 문자열로 변환
function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 헬퍼: 두 날짜 간의 박/일 계산
function getDurationText(startStr: string, endStr: string): string {
  const s = parseISODate(startStr);
  const e = parseISODate(endStr);
  if (!s || !e) return '';
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '당일치기 여행 🏃';
  if (diffDays > 0) return `${diffDays}박 ${diffDays + 1}일 여행 ✈️`;
  return '';
}

// 헬퍼: 요일 포함 포맷 (예: 12.01 화)
function formatShortWithDay(dateStr: string): string {
  const d = parseISODate(dateStr);
  if (!d) return dateStr;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = WEEKDAYS[d.getDay()];
  return `${month}.${day} (${dayOfWeek})`;
}

export const CalendarRangePicker: React.FC<CalendarRangePickerProps> = ({
  visible,
  initialStartDate,
  initialEndDate,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();

  // 초기 시작일 기준으로 년/월 뷰 설정
  const defaultBaseDate = useMemo(() => {
    if (initialStartDate) {
      const parsed = parseISODate(initialStartDate);
      if (parsed) return parsed;
    }
    return new Date();
  }, [initialStartDate]);

  const [currentYear, setCurrentYear] = useState(defaultBaseDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(defaultBaseDate.getMonth()); // 0 ~ 11

  const [selectedStart, setSelectedStart] = useState<string>(initialStartDate || '');
  const [selectedEnd, setSelectedEnd] = useState<string>(initialEndDate || '');

  // 모달이 열릴 때 초기값 동기화
  React.useEffect(() => {
    if (visible) {
      if (initialStartDate) setSelectedStart(initialStartDate);
      if (initialEndDate) setSelectedEnd(initialEndDate);
      const parsed = parseISODate(initialStartDate || '');
      if (parsed) {
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
      }
    }
  }, [visible, initialStartDate, initialEndDate]);

  // 이전 달 이동
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // 다음 달 이동
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // 달력 그리드 데이터 생성
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = formatISODate(new Date());

    // 이전 달 빈 패딩
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        dateStr: `prev-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // 이번 달 날짜들
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const current = new Date(currentYear, currentMonth, d);
      const str = formatISODate(current);
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // 날짜 탭 핸들러
  const handleDayPress = (dateStr: string) => {
    // 1) 시작일과 종료일이 모두 있거나, 아무것도 없을 때 -> 새로운 시작일 설정
    if ((selectedStart && selectedEnd) || (!selectedStart && !selectedEnd)) {
      setSelectedStart(dateStr);
      setSelectedEnd('');
      return;
    }

    // 2) 시작일만 있는 상태
    if (selectedStart && !selectedEnd) {
      const s = parseISODate(selectedStart);
      const tapped = parseISODate(dateStr);
      if (!s || !tapped) return;

      if (tapped.getTime() < s.getTime()) {
        // 시작일보다 이전 날짜를 누르면 새로운 시작일로 변경
        setSelectedStart(dateStr);
        setSelectedEnd('');
      } else {
        // 시작일과 같거나 이후 날짜를 누르면 종료일 설정
        setSelectedEnd(dateStr);
      }
    }
  };

  // 확인 버튼
  const handleConfirm = () => {
    if (!selectedStart) return;
    const finalEnd = selectedEnd || selectedStart; // 종료일 선택 안했으면 당일로
    onConfirm(selectedStart, finalEnd);
    onClose();
  };

  const durationText = selectedStart && selectedEnd ? getDurationText(selectedStart, selectedEnd) : '';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <CalendarIcon size={20} color="#1B2A4A" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>여행 날짜 선택</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Date Summary Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryDateBox}>
              <Text style={styles.summaryLabel}>출발일</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.summaryValue, selectedStart ? styles.summaryActiveText : null]}
              >
                {selectedStart ? formatShortWithDay(selectedStart) : '선택해주세요'}
              </Text>
            </View>
            <View style={styles.summaryArrow}>
              <Text style={styles.summaryArrowText}>➔</Text>
              {durationText ? (
                <View style={styles.badge}>
                  <Text numberOfLines={1} style={styles.badgeText}>
                    {durationText}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.summaryDateBox, { alignItems: 'flex-end' }]}>
              <Text style={styles.summaryLabel}>도착일</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.summaryValue, selectedEnd ? styles.summaryActiveText : null]}
              >
                {selectedEnd
                  ? formatShortWithDay(selectedEnd)
                  : selectedStart
                    ? '도착일 탭'
                    : '선택해주세요'}
              </Text>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentYear}년 {currentMonth + 1}월
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, idx) => (
              <Text
                key={w}
                style={[
                  styles.weekdayText,
                  idx === 0 && styles.sundayText,
                  idx === 6 && styles.saturdayText,
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.gridContainer}>
            {calendarDays.map((item, index) => {
              if (!item.isCurrentMonth) {
                return <View key={item.dateStr || index} style={styles.dayCell} />;
              }

              const isStart = item.dateStr === selectedStart;
              const isEnd = item.dateStr === selectedEnd;
              const isSingleDayRange = isStart && isEnd;

              let isInRange = false;
              if (selectedStart && selectedEnd && item.dateStr > selectedStart && item.dateStr < selectedEnd) {
                isInRange = true;
              }

              const isHighlighted = isStart || isEnd;
              const isSunday = index % 7 === 0;
              const isSaturday = index % 7 === 6;

              return (
                <TouchableOpacity
                  key={item.dateStr}
                  activeOpacity={0.8}
                  onPress={() => handleDayPress(item.dateStr)}
                  style={[
                    styles.dayCell,
                    isInRange && styles.inRangeCell,
                    isStart && !isSingleDayRange && selectedEnd && styles.rangeStartCell,
                    isEnd && !isSingleDayRange && styles.rangeEndCell,
                  ]}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isHighlighted && styles.dayCircleHighlighted,
                      item.isToday && !isHighlighted && styles.todayCircle,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.dayText,
                        isSunday && styles.sundayText,
                        isSaturday && styles.saturdayText,
                        isInRange && styles.inRangeText,
                        isHighlighted && styles.highlightedText,
                        item.isToday && !isHighlighted && styles.todayText,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                    {isStart && (
                      <Text numberOfLines={1} style={styles.subDayLabel}>
                        {isSingleDayRange ? '당일' : '출발'}
                      </Text>
                    )}
                    {isEnd && !isSingleDayRange && (
                      <Text numberOfLines={1} style={styles.subDayLabel}>
                        도착
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedStart}
            activeOpacity={0.85}
            style={[styles.confirmBtn, !selectedStart && styles.confirmBtnDisabled]}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.confirmBtnText}>
              {selectedStart
                ? `${selectedStart} ~ ${selectedEnd || selectedStart} 선택 완료`
                : '날짜를 선택해 주세요'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#EEF2F8',
  },
  summaryDateBox: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  summaryActiveText: {
    color: '#1B2A4A',
    fontWeight: '800',
  },
  summaryArrow: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryArrowText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  badge: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 18,
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 6,
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  inRangeCell: {
    backgroundColor: '#EEF2F8',
  },
  rangeStartCell: {
    backgroundColor: '#EEF2F8',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  rangeEndCell: {
    backgroundColor: '#EEF2F8',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  dayCircle: {
    minWidth: 38,
    height: 44,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleHighlighted: {
    backgroundColor: '#1B2A4A',
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: '#1B2A4A',
  },
  dayText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  todayText: {
    color: '#1B2A4A',
    fontWeight: '800',
  },
  inRangeText: {
    color: '#1B2A4A',
    fontWeight: '700',
  },
  highlightedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subDayLabel: {
    fontSize: 9,
    lineHeight: 11,
    marginTop: 1,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2A4A',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 14,
    elevation: 3,
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  confirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
