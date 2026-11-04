import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTripStore } from '../../src/store/useTripStore';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useSavedLinkStore } from '../../src/store/useSavedLinkStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import { useClipboardListener } from '../../src/hooks/useClipboardListener';
import { ClipboardToast } from '../../src/components/places/ClipboardToast';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
import { CreateTripModal } from '../../src/components/trip/CreateTripModal';
import { LinkPlacesModal } from '../../src/components/places/LinkPlacesModal';
import { PlaceSearchModal } from '../../src/components/places/PlaceSearchModal';
import type { SavedLink } from '../../src/types';
import { resolveDestinationCoverImage } from '../../src/services/destinationSearchService';
import {
  Bookmark,
  Wallet,
  ChevronDown,
  ClipboardPaste,
  ArrowRight,
  Plane,
  Hotel,
  Plus,
  Edit3,
  Share2,
  Search,
} from '@/components/common/CustomIcons';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [urlInput, setUrlInput] = useState('');
  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [wizardEditMode, setWizardEditMode] = useState(false);
  const [wizardInitialStep, setWizardInitialStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLinkForPlaces, setSelectedLinkForPlaces] = useState<SavedLink | null>(null);
  const [placeSearchVisible, setPlaceSearchVisible] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);

  const { currentTrip, scheduleItems, getTripFlight, getDayLodging } = useTripStore();
  const { places } = usePlaceStore();
  const { isExtractingLink, addLinkFromUrl } = useSavedLinkStore();
  const { getTotalKrw } = useWalletStore();
  const { detectedUrl, dismissDetectedUrl } = useClipboardListener();

  const currentTripId = currentTrip?.id || 't_first';
  const currentTripScheduleItems = scheduleItems.filter(
    (s) => !s.trip_id || s.trip_id === currentTripId
  );
  const tripPlaces = places.filter((p) => {
    if (currentTripId === 't_tokyo') {
      return !p.trip_id || p.trip_id === 't_tokyo';
    }
    return p.trip_id === currentTripId;
  });

  const tripFlight = getTripFlight(currentTripId);
  const tripLodging = currentTrip?.lodging || getDayLodging(1);
  const totalKrw = getTotalKrw(currentTripId);
  const dayCount = currentTrip?.schedules?.length || 1;
  const memberCount = currentTrip?.members?.length || 1;

  const calculateDDay = (startDate?: string) => {
    if (!startDate) return 'D-Day';
    const target = new Date(startDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const openEditTripAtStep = (stepNum: 1 | 2 | 3 | 4 = 1) => {
    setWizardEditMode(true);
    setWizardInitialStep(stepNum);
    setWizardVisible(true);
  };

  const openCreateNewTrip = () => {
    setWizardEditMode(false);
    setWizardInitialStep(1);
    setWizardVisible(true);
  };

  const handleExtract = async (urlToExtract?: string) => {
    const targetUrl = (urlToExtract || urlInput).trim();
    if (!targetUrl) {
      Alert.alert('알림', '추출할 인스타그램, 유튜브, 블로그 링크를 입력해주세요.');
      return;
    }

    const newSavedLink = await addLinkFromUrl(targetUrl, currentTripId);
    if (newSavedLink) {
      setUrlInput('');
      dismissDetectedUrl();
      setSelectedLinkForPlaces(newSavedLink);
    } else {
      Alert.alert('알림', '링크를 분석하지 못했습니다. 올바른 주소인지 확인해주세요.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().length > 0) {
        setUrlInput(text.trim());
      } else {
        Alert.alert('알림', '클립보드에 복사된 텍스트가 없습니다.');
      }
    } catch {
      Alert.alert('오류', '클립보드를 읽어오지 못했습니다.');
    }
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        title: `${currentTrip?.title || '핀치 여행'} 초대`,
        message: `[PINCHI] ${currentTrip?.title || '여행'} (${currentTrip?.startDate} ~ ${currentTrip?.endDate})\n여행지: ${currentTrip?.destination}\n저장한 스팟 ${tripPlaces.length}곳 · 일정 ${currentTripScheduleItems.length}개`,
      });
    } catch {
      // ignore
    }
  };

  const coverUri =
    !coverImageError && currentTrip?.coverImage
      ? currentTrip.coverImage
      : resolveDestinationCoverImage(currentTrip?.destination || '도쿄');

  const hasFlight = !!tripFlight?.outbound?.flightNumber;
  const hasLodging = !!tripLodging?.name;

  return (
    <View style={styles.screen}>
      {/* 클립보드 링크 감지 토스트 */}
      {detectedUrl ? (
        <View style={{ paddingTop: Math.max(insets.top, 12) }}>
          <ClipboardToast
            url={detectedUrl}
            onPinch={(url: string) => handleExtract(url)}
            onDismiss={dismissDetectedUrl}
          />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {/* ==================== 1. 상단 화이트 헤더 & 히어로 섹션 (레퍼런스 4 스타일) ==================== */}
        <View style={[styles.topWhiteSection, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
          {/* 상단바: 좌측 여행 선택 드롭다운 / 우측 새 여행 & 수정 버튼 */}
          <View style={styles.topHeaderBar}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setTripSwitcherVisible(true)}
              style={styles.tripDropdownBtn}
            >
              <Text style={styles.tripDropdownText} numberOfLines={1}>
                {currentTrip?.destination || '여행지 선택'}
              </Text>
              <ChevronDown size={20} color="#111827" />
            </TouchableOpacity>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setPlaceSearchVisible(true)}
                style={styles.headerIconBtn}
              >
                <Search size={19} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => openEditTripAtStep(1)}
                style={styles.headerIconBtn}
              >
                <Edit3 size={19} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={openCreateNewTrip}
                style={styles.headerIconBtn}
              >
                <Plus size={21} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 히어로 요약: 좌측 원형 썸네일 + 우측 3단 타이포 (레퍼런스 4 구조) */}
          <View style={styles.heroProfileRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openEditTripAtStep(1)}
              style={styles.heroCircleFrame}
            >
              <Image
                source={{ uri: coverUri }}
                style={styles.heroCircleImg}
                onError={() => setCoverImageError(true)}
              />
            </TouchableOpacity>

            <View style={styles.heroTextCol}>
              <Text style={styles.heroDateLine} numberOfLines={1}>
                {currentTrip?.startDate?.replace(/-/g, '.')} -{' '}
                {currentTrip?.endDate?.slice(5).replace(/-/g, '.')} ·{' '}
                {dayCount > 1 ? `${dayCount - 1}박 ${dayCount}일` : '당일치기'} (
                {calculateDDay(currentTrip?.startDate)})
              </Text>

              <Text style={styles.heroTitleLine} numberOfLines={1}>
                {currentTrip?.title || '나의 첫 여행'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openEditTripAtStep(1)}
                style={styles.heroEditableLine}
              >
                <Text style={styles.heroEditableText} numberOfLines={1}>
                  {hasFlight ? tripFlight?.outbound?.flightNumber : '항공편 미정'} ·{' '}
                  {hasLodging ? tripLodging?.name : '숙소 미정'} · 동행 {memberCount}명
                </Text>
                <Edit3 size={13} color="#9CA3AF" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ==================== 2. 그레이 대시보드 피드 (레퍼런스 4 스타일) ==================== */}
        <View style={styles.grayBodySection}>
          {/* 4개 퀵 상태 카드 Row (미설정 시 점선 + 느낌표 배지, 설정 시 화이트 솔리드) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickCardsRow}
          >
            {/* 1) 항공편 카드 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openEditTripAtStep(3)}
              style={[styles.quickSquareCard, !hasFlight && styles.quickSquareCardDashed]}
            >
              <View style={styles.quickIconWrap}>
                <Plane size={24} color="#1B2A4A" />
                {!hasFlight && (
                  <View style={styles.alertDotBadge}>
                    <Text style={styles.alertDotBadgeText}>!</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.quickCardLabel, !hasFlight && styles.quickCardLabelMuted]}
                numberOfLines={2}
              >
                {hasFlight
                  ? `항공편\n${tripFlight?.outbound?.flightNumber}`
                  : '항공편을\n등록해주세요'}
              </Text>
            </TouchableOpacity>

            {/* 2) 숙소 카드 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openEditTripAtStep(4)}
              style={[styles.quickSquareCard, !hasLodging && styles.quickSquareCardDashed]}
            >
              <View style={styles.quickIconWrap}>
                <Hotel size={24} color="#1B2A4A" />
                {!hasLodging && (
                  <View style={styles.alertDotBadge}>
                    <Text style={styles.alertDotBadgeText}>!</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.quickCardLabel, !hasLodging && styles.quickCardLabelMuted]}
                numberOfLines={2}
              >
                {hasLodging ? `숙소\n${tripLodging?.name}` : '숙소 정보를\n입력해주세요'}
              </Text>
            </TouchableOpacity>

            {/* 3) 보관함 카드 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/places')}
              style={styles.quickSquareCard}
            >
              <View style={styles.quickIconWrap}>
                <Bookmark size={24} color="#1B2A4A" />
              </View>
              <Text style={styles.quickCardLabel} numberOfLines={2}>
                {`저장 스팟\n${tripPlaces.length}곳`}
              </Text>
            </TouchableOpacity>

            {/* 4) 가계부 카드 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/wallet')}
              style={styles.quickSquareCard}
            >
              <View style={styles.quickIconWrap}>
                <Wallet size={24} color="#1B2A4A" />
              </View>
              <Text style={styles.quickCardLabel} numberOfLines={2}>
                {totalKrw > 0 ? `지출 내역\n₩${totalKrw.toLocaleString()}` : '가계부·정산\n관리하기'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ==================== 메인 카드 1: 내 여행 일정 & 동선 ==================== */}
          <View style={styles.mainFeatureCard}>
            <Text style={styles.featureCardTitle}>내 여행 일정 & 동선</Text>
            <Text style={styles.featureCardBlueSub}>
              {currentTripScheduleItems.length > 0
                ? `총 ${currentTripScheduleItems.length}개의 스팟이 일자별 동선에 등록되어 있어요.`
                : '보관함의 스팟을 담아 최적의 여행 코스를 완성해보세요.'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/planner')}
              style={styles.featureImageBox}
            >
              <Image
                source={{ uri: coverUri }}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureImageCaptionBar}>
                <Text style={styles.featureImageCaptionText} numberOfLines={1}>
                  {currentTrip?.title || '나의 여행'} ({dayCount}일 일정 · 스팟{' '}
                  {currentTripScheduleItems.length}곳)
                </Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/planner')}
              style={styles.outlinedActionBtn}
            >
              <Text style={styles.outlinedActionBtnText}>일정 및 동선 플래너 열기</Text>
            </TouchableOpacity>
          </View>

          {/* ==================== 메인 카드 2: SNS 링크 스팟 추출 ==================== */}
          <View style={styles.mainFeatureCard}>
            <Text style={styles.featureCardTitle}>링크로 스팟 핀치하기</Text>
            <Text style={styles.featureCardBlueSub}>
              인스타그램 · 유튜브 · 블로그 링크에서 장소를 자동 추출해보세요.
            </Text>

            <View style={styles.linkInputBox}>
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://www.instagram.com/reel/..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.linkTextInput}
              />
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handlePasteFromClipboard}
                style={styles.pasteMiniBtn}
              >
                <ClipboardPaste size={14} color="#1B2A4A" />
                <Text style={styles.pasteMiniBtnText}>붙여넣기</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isExtractingLink}
              onPress={() => handleExtract()}
              style={[styles.outlinedActionBtn, isExtractingLink && { opacity: 0.6 }]}
            >
              <Text style={styles.outlinedActionBtnText}>
                {isExtractingLink ? '링크에서 장소 분석 중...' : '링크 분석하고 스팟 담기'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPlaceSearchVisible(true)}
              style={[styles.outlinedActionBtn, { marginTop: 8, backgroundColor: '#1B2A4A' }]}
            >
              <Text style={[styles.outlinedActionBtnText, { color: '#FFFFFF' }]}>
                지도에서 위치 직접 검색하기
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================== 메인 카드 3: 여행 설정 & 관리 ==================== */}
          <View style={styles.mainFeatureCard}>
            <Text style={styles.featureCardTitle}>여행 설정 및 동행자</Text>
            <Text style={styles.featureCardBlueSub}>
              여행 국가, 날짜, 항공편, 숙소 정보를 언제든 수정할 수 있어요.
            </Text>

            <View style={styles.infoSummaryList}>
              <View style={styles.infoSummaryRow}>
                <Text style={styles.infoSummaryKey}>여행지 · 기간</Text>
                <Text style={styles.infoSummaryVal}>
                  {currentTrip?.destination} ({currentTrip?.startDate?.slice(5)} ~{' '}
                  {currentTrip?.endDate?.slice(5)})
                </Text>
              </View>
              <View style={styles.infoSummaryRow}>
                <Text style={styles.infoSummaryKey}>항공편</Text>
                <Text style={styles.infoSummaryVal}>
                  {hasFlight
                    ? `${tripFlight?.outbound?.departureAirport} → ${tripFlight?.outbound?.arrivalAirport} (${tripFlight?.outbound?.flightNumber})`
                    : '미등록 (나중에 설정 가능)'}
                </Text>
              </View>
              <View style={styles.infoSummaryRow}>
                <Text style={styles.infoSummaryKey}>숙소 · 동행</Text>
                <Text style={styles.infoSummaryVal}>
                  {hasLodging ? tripLodging?.name : '숙소 미등록'} · 멤버 {memberCount}명
                </Text>
              </View>
            </View>

            <View style={styles.dualBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openEditTripAtStep(1)}
                style={[styles.outlinedActionBtn, { flex: 1, marginTop: 0 }]}
              >
                <Text style={styles.outlinedActionBtnText}>여행 정보 수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleShareTrip}
                style={styles.shareSquareBtn}
              >
                <Share2 size={18} color="#1B2A4A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 여행 전환 모달 */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />

      {/* 스텝별 여행 추가 / 수정 위저드 모달 */}
      <CreateTripModal
        visible={wizardVisible}
        editTrip={wizardEditMode ? currentTrip : null}
        initialStep={wizardInitialStep}
        onClose={() => setWizardVisible(false)}
        onCreated={() => setWizardVisible(false)}
      />

      {/* 링크 추출 장소 선택 모달 */}
      <LinkPlacesModal
        visible={!!selectedLinkForPlaces}
        savedLink={selectedLinkForPlaces}
        onClose={() => setSelectedLinkForPlaces(null)}
      />

      {/* 레퍼런스 5번 스타일 풀스크린 지도 장소 검색 */}
      <PlaceSearchModal
        visible={placeSearchVisible}
        onClose={() => setPlaceSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  topWhiteSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF2',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tripDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '72%',
  },
  tripDropdownText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCircleFrame: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.2,
    borderColor: '#1B2A4A',
    padding: 3,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
  },
  heroCircleImg: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: '#E5E7EB',
  },
  heroTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  heroDateLine: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  heroTitleLine: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroEditableLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroEditableText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    flexShrink: 1,
  },
  grayBodySection: {
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  quickCardsRow: {
    paddingBottom: 18,
    gap: 10,
  },
  quickSquareCard: {
    width: 96,
    height: 106,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickSquareCardDashed: {
    backgroundColor: '#EDEFF3',
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: '#C5CBD6',
    shadowOpacity: 0,
    elevation: 0,
  },
  quickIconWrap: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDotBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDotBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  quickCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15.5,
  },
  quickCardLabelMuted: {
    color: '#8D99AE',
  },
  mainFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  featureCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  featureCardBlueSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B50AA',
    marginTop: 5,
    marginBottom: 14,
  },
  featureImageBox: {
    height: 172,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  featureImageCaptionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27, 42, 74, 0.84)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureImageCaptionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  outlinedActionBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  linkInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 8,
    height: 48,
  },
  linkTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
  },
  pasteMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pasteMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1B2A4A',
  },
  infoSummaryList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  infoSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSummaryKey: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  infoSummaryVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    maxWidth: '68%',
    textAlign: 'right',
  },
  dualBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareSquareBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
