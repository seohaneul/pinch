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
import { useAuthStore } from '../../src/store/useAuthStore';
import { useClipboardListener } from '../../src/hooks/useClipboardListener';
import { ClipboardToast } from '../../src/components/places/ClipboardToast';
import { TripSwitcherModal } from '../../src/components/trip/TripSwitcherModal';
import { LinkPlacesModal } from '../../src/components/places/LinkPlacesModal';
import type { SavedLink } from '../../src/types';
import {
  Sparkles,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Bookmark,
  Map,
  Wallet,
  Users,
  ChevronRight,
  ClipboardPaste,
  ArrowRight,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [urlInput, setUrlInput] = useState('');
  const [tripSwitcherVisible, setTripSwitcherVisible] = useState(false);
  const [selectedLinkForPlaces, setSelectedLinkForPlaces] = useState<SavedLink | null>(null);

  const { user } = useAuthStore();
  const { currentTrip, scheduleItems } = useTripStore();
  const { places } = usePlaceStore();
  const { isExtractingLink, addLinkFromUrl } = useSavedLinkStore();
  const { detectedUrl, dismissDetectedUrl } = useClipboardListener();

  // Active trip's schedule items & places
  const currentTripId = currentTrip?.id || 't_tokyo';
  const currentTripScheduleItems = scheduleItems.filter(
    (s) => !s.trip_id || s.trip_id === currentTripId
  );
  const tripPlaces = places.filter((p) => {
    if (currentTripId === 't_tokyo') {
      return !p.trip_id || p.trip_id === 't_tokyo';
    }
    return p.trip_id === currentTripId;
  });

  // D-Day calculation
  const calculateDDay = (startDate?: string) => {
    if (!startDate) return 'D-Day';
    const target = new Date(startDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  const handleExtract = async (urlToExtract?: string) => {
    const targetUrl = urlToExtract || urlInput;
    if (!targetUrl.trim()) {
      Alert.alert('알림', '인스타그램, 유튜브 등 SNS 링크를 입력해주세요.');
      return;
    }

    const activeTripId = currentTrip?.id || 't_tokyo';
    const newSavedLink = await addLinkFromUrl(targetUrl.trim(), activeTripId);
    if (newSavedLink) {
      setUrlInput('');
      dismissDetectedUrl();
      setSelectedLinkForPlaces(newSavedLink);
      Alert.alert(
        '링크 핀치 성공! ✈️',
        `"${newSavedLink.title}" 링크가 저장되었습니다.\n포함된 장소 ${newSavedLink.extractedPlaces.length}곳 중 원하는 장소를 담아보세요!`
      );
    } else {
      Alert.alert('오류', '링크를 분석하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setUrlInput(text.trim());
        handleExtract(text.trim());
      } else {
        Alert.alert('클립보드 확인', '클립보드에 복사된 링크가 없습니다.');
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleInviteCompanion = async () => {
    try {
      await Share.share({
        title: '핀치 (Pinch) 동행자 초대',
        message: `✈️ ${currentTrip?.title || '여행'} 계획에 함께 참여해보세요!\n인스타그램/유튜브 링크만 넣으면 동선이 자동으로 짜여요.\nhttps://pinch-travel.app/trip/${currentTrip?.id || 'tokyo'}`,
      });
    } catch (error) {
      // Ignore
    }
  };

  const nickname = user?.nickname || '여행자';
  const dayScheduleCount = currentTrip?.schedules?.length || 3;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Top Cute Pinch Logo + Welcome Greeting */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <View style={styles.pinchLogoBadge}>
              <MapPin size={18} color="#FF6B6B" fill="#FF6B6B" />
            </View>
            <View style={styles.brandBadge}>
              <Sparkles size={11} color="#FF6B6B" />
              <Text style={styles.brandBadgeText}>Pinch</Text>
            </View>
          </View>

          <Text style={styles.welcomeTitle}>
            {nickname}님, 다음 여행을{'\n'}계획해 볼까요? ✈️
          </Text>
          <Text style={styles.welcomeSubtitle}>
            SNS에서 본 핫플 링크를 핀치하면 최단 동선이 완성돼요!
          </Text>
        </View>

        {/* Clipboard Toast Banner */}
        {detectedUrl && (
          <View style={styles.clipboardBannerWrap}>
            <ClipboardToast
              url={detectedUrl}
              onPinch={() => handleExtract(detectedUrl)}
              onDismiss={dismissDetectedUrl}
            />
          </View>
        )}

        {/* 2. Primary Action: Prominent "Quick Pinch" Link Input Bar */}
        <View style={styles.quickPinchCard}>
          <View style={styles.quickPinchHeader}>
            <View style={styles.linkIconWrap}>
              <LinkIcon size={15} color="#FF6B6B" />
            </View>
            <Text style={styles.quickPinchTitle}>Quick Pinch (링크로 장소 추가)</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>스마트 파싱</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="릴스/쇼츠/블로그 링크 붙여넣기"
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePasteClipboard}
              style={styles.pasteBtn}
              accessibilityLabel="클립보드 붙여넣기"
            >
              <ClipboardPaste size={14} color="#6B7280" />
              <Text style={styles.pasteBtnText}>붙여넣기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleExtract()}
              disabled={isExtractingLink}
              style={[styles.pinchActionBtn, isExtractingLink && styles.btnDisabled]}
            >
              <Text style={styles.pinchActionBtnText}>
                {isExtractingLink ? '분석 중...' : '핀치 🤏'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Active Trip Card */}
        {currentTrip && (
          <View style={styles.activeTripSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>진행 중인 여행 계획 🗺️</Text>
              <TouchableOpacity
                onPress={() => setTripSwitcherVisible(true)}
                style={styles.tripSwitchPill}
              >
                <Text style={styles.tripSwitchPillText}>여행 변경</Text>
                <ChevronRight size={12} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/planner')}
              style={styles.tripCard}
            >
              <Image
                source={{
                  uri:
                    currentTrip.coverImage ||
                    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
                }}
                style={styles.tripCoverImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />

              {/* Floating D-Day Badge */}
              <View style={styles.ddayBadge}>
                <Text style={styles.ddayText}>{calculateDDay(currentTrip.startDate)}</Text>
              </View>

              {/* Card Bottom Details */}
              <View style={styles.tripCardContent}>
                <View style={styles.destinationRow}>
                  <MapPin size={12} color="#FFFFFF" />
                  <Text style={styles.destinationText}>{currentTrip.destination}</Text>
                  <Calendar size={12} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  <Text style={styles.dateText}>
                    {currentTrip.startDate.slice(5).replace('-', '.')} ~{' '}
                    {currentTrip.endDate.slice(5).replace('-', '.')}
                  </Text>
                </View>

                <Text style={styles.tripTitleText} numberOfLines={1}>
                  {currentTrip.title}
                </Text>

                {/* Quick Stats Pill */}
                <View style={styles.statsPillRow}>
                  <View style={styles.statsPill}>
                    <Bookmark size={11} color="#FF6B6B" />
                    <Text style={styles.statsPillText}>저장 장소 {tripPlaces.length}개</Text>
                  </View>
                  <View style={styles.statsPill}>
                    <Map size={11} color="#34D399" />
                    <Text style={styles.statsPillText}>
                      Day 1~{dayScheduleCount} 동선 ({currentTripScheduleItems.length}스팟)
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Action Shortcuts (2x2 Grid) */}
        <View style={styles.shortcutsSection}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>

          <View style={styles.gridContainer}>
            {/* Shortcut 1: Places */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/places')}
              style={styles.gridItem}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.12)' }]}>
                <Bookmark size={20} color="#FF6B6B" fill="#FF6B6B" />
              </View>
              <Text style={styles.gridTitle}>장소 보관함</Text>
              <Text style={styles.gridSubtitle}>인스타/블로그에서 핀치한 곳</Text>
              <View style={styles.gridArrow}>
                <ArrowRight size={13} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Shortcut 2: Planner */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/planner')}
              style={styles.gridItem}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                <Map size={20} color="#2A9D8F" />
              </View>
              <Text style={styles.gridTitle}>동선 플래너</Text>
              <Text style={styles.gridSubtitle}>날짜별 지도 & 시간표 짜기</Text>
              <View style={styles.gridArrow}>
                <ArrowRight size={13} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Shortcut 3: Budget / Wallet */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/wallet')}
              style={styles.gridItem}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(255, 159, 28, 0.15)' }]}>
                <Wallet size={20} color="#F77F00" />
              </View>
              <Text style={styles.gridTitle}>여행 예산서</Text>
              <Text style={styles.gridSubtitle}>예상 경비 & 1/N 정산 보기</Text>
              <View style={styles.gridArrow}>
                <ArrowRight size={13} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Shortcut 4: Invite Companion */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleInviteCompanion}
              style={styles.gridItem}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(162, 155, 254, 0.18)' }]}>
                <Users size={20} color="#6C5CE7" />
              </View>
              <Text style={styles.gridTitle}>동행자 초대</Text>
              <Text style={styles.gridSubtitle}>친구와 함께 링크 모으기</Text>
              <View style={styles.gridArrow}>
                <ArrowRight size={13} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Trip Switcher & Create Modal */}
      <TripSwitcherModal
        visible={tripSwitcherVisible}
        onClose={() => setTripSwitcherVisible(false)}
      />

      {/* 링크 속 장소 확인 및 골라 담기 모달 */}
      <LinkPlacesModal
        visible={Boolean(selectedLinkForPlaces)}
        savedLink={selectedLinkForPlaces}
        onClose={() => setSelectedLinkForPlaces(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  topHeader: {
    marginTop: 4,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pinchLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
    marginLeft: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
  },
  clipboardBannerWrap: {
    marginBottom: 16,
  },
  quickPinchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  quickPinchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickPinchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  aiBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    paddingVertical: 4,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 3,
  },
  pinchActionBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pinchActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activeTripSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tripSwitchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    marginRight: 2,
  },
  tripCard: {
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tripCoverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  ddayBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ddayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  tripCardContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  destinationText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  dateText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  tripTitleText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
  },
  statsPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  statsPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 4,
  },
  shortcutsSection: {
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 15,
  },
  gridArrow: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
});
