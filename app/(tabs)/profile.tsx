import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { Header } from '../../src/components/common/Header';
import { Card, Badge } from '../../src/components/common/Card';
import { usePlaceStore } from '../../src/store/usePlaceStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useWalletStore } from '../../src/store/useWalletStore';
import {
  User,
  Settings,
  Bell,
  Shield,
  Smartphone,
  Cloud,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
  LogOut,
  Share2,
  RotateCcw,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [cloudSync, setCloudSync] = React.useState(true);
  
  const { places, resetToDefaults: resetPlaces } = usePlaceStore();
  const { trips, resetToDefaults: resetTrips } = useTripStore();
  const { resetToDefaults: resetWallet } = useWalletStore();

  const handleResetAllData = () => {
    Alert.alert(
      '데이터 초기화 및 예시 복원',
      '저장된 모든 장소, 일정, 가계부 지출을 초기화하고 [도쿄 3박 4일 감성 여행] 공식 예시 데이터로 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원하기',
          style: 'destructive',
          onPress: () => {
            resetPlaces();
            resetTrips();
            resetWallet();
            Alert.alert('복원 완료! 🎉', '도쿄 여행 공식 핫플, 일정 및 가계부 예시 데이터가 복원되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="마이페이지 👤"
        subtitle="개인 설정 및 여행 통계"
        showLogo={false}
        rightAction={
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Settings size={20} color="#2B2D42" />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* User Profile Card */}
        <View className="p-4 mx-4 mt-4 bg-surface rounded-3xl border border-borderLine shadow-sm flex-row items-center">
          <View className="relative mr-4">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop' }}
              className="w-16 h-16 rounded-full border-2 border-primary"
            />
            <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary items-center justify-center border border-white">
              <Sparkles size={10} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-bold text-darkText mr-2">여행가 핀치</Text>
              <Badge label="PRO 멤버" variant="primary" />
            </View>
            <Text className="text-xs text-mutedText" numberOfLines={1}>
              링크만 던지면 핫플만 핀치! 📍
            </Text>
            <Text className="text-[11px] color-primary font-semibold mt-1">
              pinch_traveler@example.com
            </Text>
          </View>
        </View>

        {/* Travel Stats Grid */}
        <View className="flex-row px-4 mt-4 justify-between">
          <View className="flex-1 mr-2 bg-surface p-3.5 rounded-2xl border border-borderLine items-center">
            <MapPin size={20} color="#FF6B6B" className="mb-1" />
            <Text className="text-base font-extrabold text-darkText">{places.length}</Text>
            <Text className="text-[11px] text-mutedText font-medium">수집 핫플</Text>
          </View>

          <View className="flex-1 mx-1 bg-surface p-3.5 rounded-2xl border border-borderLine items-center">
            <Heart size={20} color="#4ECDC4" className="mb-1" />
            <Text className="text-base font-extrabold text-darkText">{trips.length}</Text>
            <Text className="text-[11px] text-mutedText font-medium">내 여행</Text>
          </View>

          <View className="flex-1 ml-2 bg-surface p-3.5 rounded-2xl border border-borderLine items-center">
            <Share2 size={20} color="#FFE66D" className="mb-1" />
            <Text className="text-base font-extrabold text-darkText">12</Text>
            <Text className="text-[11px] text-mutedText font-medium">동선 공유</Text>
          </View>
        </View>

        {/* Preferences & App Settings */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-bold text-mutedText mb-2 px-1 uppercase tracking-wider">
            앱 설정
          </Text>

          <Card className="p-0 overflow-hidden">
            {/* Supabase Cloud Sync */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1 mr-3">
                <Cloud size={18} color="#4ECDC4" className="mr-3" />
                <View>
                  <Text className="text-sm font-bold text-darkText">Supabase 클라우드 동기화</Text>
                  <Text className="text-[11px] text-mutedText">모든 기기에서 실시간 데이터 유지</Text>
                </View>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={setCloudSync}
                trackColor={{ false: '#E2E8F0', true: '#4ECDC4' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Notification push */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center flex-1 mr-3">
                <Bell size={18} color="#FF6B6B" className="mr-3" />
                <View>
                  <Text className="text-sm font-bold text-darkText">알림 및 푸시 수신</Text>
                  <Text className="text-[11px] text-mutedText">여행 동선 업데이트 & 정산 알림</Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E2E8F0', true: '#FF6B6B' }}
                thumbColor="#FFFFFF"
              />
            </View>

              {/* Device Info */}
              <TouchableOpacity className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <Smartphone size={18} color="#8D99AE" className="mr-3" />
                  <Text className="text-sm font-bold text-darkText">버전 정보</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-xs text-mutedText mr-2 font-medium">v1.0.0 (Expo SDK 57)</Text>
                  <ChevronRight size={16} color="#CBD5E0" />
                </View>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Data Reset & Demo Seeding */}
          <View className="px-4 mt-6">
            <Text className="text-sm font-bold text-mutedText mb-2 px-1 uppercase tracking-wider">
              테스트 & 데이터 관리
            </Text>

            <Card className="p-0 overflow-hidden">
              <TouchableOpacity
                onPress={handleResetAllData}
                className="flex-row items-center justify-between p-4 bg-rose-50/50"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <RotateCcw size={18} color="#FF6B6B" className="mr-3" />
                  <View>
                    <Text className="text-sm font-extrabold text-primary">
                      데이터 초기화 및 도쿄 여행 예시 복원
                    </Text>
                    <Text className="text-[11px] text-mutedText">
                      장소, 일정, 가계부 데이터를 초기 기본값으로 리셋
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </Card>
          </View>

        {/* Security & Support */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-bold text-mutedText mb-2 px-1 uppercase tracking-wider">
            계정 & 서비스
          </Text>

          <Card className="p-0 overflow-hidden">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Shield size={18} color="#8D99AE" className="mr-3" />
                <Text className="text-sm font-bold text-darkText">개인정보 처리방침</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E0" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <LogOut size={18} color="#E05353" className="mr-3" />
                <Text className="text-sm font-bold color-primary">로그아웃</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Branding Footer */}
        <View className="items-center mt-8 mb-4">
          <View className="flex-row items-center mb-1">
            <MapPin size={14} color="#FF6B6B" fill="#FF6B6B" />
            <Text className="text-xs font-extrabold text-darkText ml-1">Pinch (핀치)</Text>
          </View>
          <Text className="text-[10px] text-mutedText">
            © 2026 Pinch Travel Companion. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
