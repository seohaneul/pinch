import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ExternalLink, Plus, Check, MapPin, Sparkles, Star } from 'lucide-react-native';
import type { SavedLink, ExtractedPlaceItem, Place } from '../../types';
import { usePlaceStore } from '../../store/usePlaceStore';
import { useTripStore } from '../../store/useTripStore';
import { PlaceDetailModal } from './PlaceDetailModal';

interface LinkPlacesModalProps {
  visible: boolean;
  savedLink: SavedLink | null;
  onClose: () => void;
  onPlaceAdded?: (placeName: string) => void;
}

export const LinkPlacesModal: React.FC<LinkPlacesModalProps> = ({
  visible,
  savedLink,
  onClose,
  onPlaceAdded,
}) => {
  const insets = useSafeAreaInsets();
  const { places, addPlace } = usePlaceStore();
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = React.useState<ExtractedPlaceItem | null>(null);
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  if (!savedLink) return null;

  // 이미 현재 여행의 장소보관함에 담겨있는지 확인하는 함수
  const isPlaceInPocket = (name: string) => {
    const targetTripId = savedLink?.trip_id || useTripStore.getState().currentTrip?.id;
    return places.some((p) => {
      const matchTrip = !targetTripId || p.trip_id === targetTripId;
      return matchTrip && p.name.trim().toLowerCase() === name.trim().toLowerCase();
    });
  };

  // 원본 링크 웹 브라우저/앱 열기
  const handleOpenSourceUrl = async () => {
    if (!savedLink.url) return;
    try {
      const supported = await Linking.canOpenURL(savedLink.url);
      if (supported) {
        await Linking.openURL(savedLink.url);
      } else {
        Alert.alert('알림', '링크를 열 수 없습니다.');
      }
    } catch {
      Linking.openURL(savedLink.url);
    }
  };

  // 개별 장소를 장소 보관함에 담기
  const handleAddSinglePlace = (item: ExtractedPlaceItem) => {
    if (isPlaceInPocket(item.name)) {
      Alert.alert('알림', '이미 장소 보관함에 저장된 장소입니다.');
      return;
    }

    const targetTripId = savedLink.trip_id || useTripStore.getState().currentTrip?.id || 't_tokyo';

    const newPlace: Place = {
      id: `place_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      trip_id: targetTripId,
      name: item.name,
      address: item.address,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      memo: `${item.memo} (출처: ${savedLink.title})`,
      snsUrl: savedLink.url,
      imageUrl: item.imageUrl || savedLink.thumbnailUrl,
      rating: item.rating || 4.8,
      isPinned: true,
      createdAt: new Date().toISOString(),
      tags: item.tags || ['핫플'],
      sourcePlatform: savedLink.platform,
    };

    const success = addPlace(newPlace, targetTripId);
    if (success) {
      if (onPlaceAdded) onPlaceAdded(item.name);
      Alert.alert('장소 핀치 완료! 📌', `"${item.name}" 장소가 장소 보관함에 담겼습니다.`);
    }
  };

  // 전체 장소 한 번에 담기
  const handleAddAllPlaces = () => {
    const targetTripId = savedLink.trip_id || useTripStore.getState().currentTrip?.id || 't_tokyo';
    let addedCount = 0;
    savedLink.extractedPlaces.forEach((item, idx) => {
      if (!isPlaceInPocket(item.name)) {
        const newPlace: Place = {
          id: `place_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
          trip_id: targetTripId,
          name: item.name,
          address: item.address,
          category: item.category,
          latitude: item.latitude,
          longitude: item.longitude,
          memo: `${item.memo} (출처: ${savedLink.title})`,
          snsUrl: savedLink.url,
          imageUrl: item.imageUrl || savedLink.thumbnailUrl,
          rating: item.rating || 4.8,
          isPinned: true,
          createdAt: new Date().toISOString(),
          tags: item.tags || ['핫플'],
          sourcePlatform: savedLink.platform,
        };
        addPlace(newPlace, targetTripId);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      Alert.alert('일괄 핀치 완료! 🎉', `총 ${addedCount}개의 장소를 보관함에 담았습니다.`);
    } else {
      Alert.alert('알림', '모든 장소가 이미 보관함에 저장되어 있습니다.');
    }
  };

  const getCategoryLabel = (category: string) => {
    const upper = category.toUpperCase();
    switch (upper) {
      case 'CAFE':
        return '☕ 카페';
      case 'RESTAURANT':
        return '🍴 맛집';
      case 'ATTRACTION':
        return '📸 명소';
      case 'LODGING':
        return '🏨 숙소';
      case 'SHOPPING':
        return '🛍️ 쇼핑';
      default:
        return '📍 장소';
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return '📸 인스타그램 릴스';
      case 'youtube':
        return '🎥 유튜브 숏츠';
      case 'naver':
        return '📗 네이버 블로그';
      default:
        return '🔗 SNS 링크';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Backdrop touchable to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>{getPlatformLabel(savedLink.platform)}</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {savedLink.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Source Link Banner */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenSourceUrl}
            style={styles.sourceUrlBanner}
          >
            <View style={styles.sourceBannerLeft}>
              <ExternalLink size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
              <Text style={styles.sourceBannerText} numberOfLines={1}>
                해당 릴스/블로그 원본 바로가기
              </Text>
            </View>
            <Text style={styles.sourceArrowText}>열기 ➔</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>
                발견된 장소 <Text style={{ color: '#FF6B6B' }}>{savedLink.extractedPlaces.length}곳</Text>
              </Text>
              <TouchableOpacity onPress={handleAddAllPlaces} activeOpacity={0.7} style={styles.addAllBtn}>
                <Sparkles size={12} color="#FF6B6B" style={{ marginRight: 4 }} />
                <Text style={styles.addAllBtnText}>전체 한 번에 담기</Text>
              </TouchableOpacity>
            </View>

            {/* Extracted Places List */}
            {savedLink.extractedPlaces.map((item, index) => {
              const inPocket = isPlaceInPocket(item.name);
              const imgKey = item.id || `ep_${index}`;
              const isFailed = failedImages[imgKey];

              return (
                <TouchableOpacity
                  key={item.id || index}
                  activeOpacity={0.88}
                  onPress={() => setSelectedPlaceForDetail(item)}
                  style={styles.placeCard}
                >
                  <Image
                    source={{
                      uri:
                        (!isFailed && item.imageUrl)
                          ? item.imageUrl
                          : 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
                    }}
                    style={styles.placeThumb}
                    resizeMode="cover"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [imgKey]: true }))
                    }
                  />
                  <View style={styles.placeInfo}>
                    <View style={styles.placeTitleRow}>
                      <Text style={styles.categoryBadge}>{getCategoryLabel(item.category)}</Text>
                      {item.rating ? (
                        <View style={styles.ratingBadge}>
                          <Star size={10} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                          <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.placeName} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={styles.placeAddress} numberOfLines={1}>
                      <MapPin size={10} color="#94A3B8" /> {item.address}
                    </Text>

                    {item.memo ? (
                      <Text style={styles.placeMemo} numberOfLines={2}>
                        {item.memo}
                      </Text>
                    ) : null}

                    {/* Button */}
                    <View style={{ marginTop: 8 }}>
                      {inPocket ? (
                        <View style={styles.savedBadge}>
                          <Check size={12} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.savedBadgeText}>장소보관함에 담김</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddSinglePlace(item);
                          }}
                          style={styles.addSingleBtn}
                        >
                          <Plus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.addSingleBtnText}>보관함에 담기</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 장소 상세 설명 모달 (PlaceDetailModal) */}
      <PlaceDetailModal
        visible={Boolean(selectedPlaceForDetail)}
        place={selectedPlaceForDetail}
        onClose={() => setSelectedPlaceForDetail(null)}
        isSavedInPocket={selectedPlaceForDetail ? isPlaceInPocket(selectedPlaceForDetail.name) : false}
        onSaveToPocket={(targetItem) => {
          handleAddSinglePlace(targetItem);
        }}
      />
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
    maxHeight: '92%',
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 22,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sourceUrlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sourceBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  sourceArrowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B6B',
    marginLeft: 6,
  },
  scrollBody: {
    marginBottom: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  addAllBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  placeThumb: {
    width: 88,
    height: 104,
    borderRadius: 12,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  placeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  placeMemo: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  addSingleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  addSingleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
});
