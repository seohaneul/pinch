import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
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
  UploadCloud,
  DownloadCloud,
  Key,
  X,
  Check,
} from 'lucide-react-native';
import {
  backupDataToSupabase,
  restoreDataFromSupabase,
  getCustomSupabaseConfig,
  saveCustomSupabaseConfig,
} from '../../src/services/supabaseSyncService';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [cloudSync, setCloudSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('로컬 저장 완료');
  
  // Supabase Config Modal
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const { places, resetToDefaults: resetPlaces } = usePlaceStore();
  const { trips, resetToDefaults: resetTrips } = useTripStore();
  const { expenses, resetToDefaults: resetWallet } = useWalletStore();

  useEffect(() => {
    getCustomSupabaseConfig().then((cfg) => {
      if (cfg) {
        setSupabaseUrl(cfg.url);
        setSupabaseKey(cfg.anonKey);
      }
    });
  }, []);

  const handleBackupToCloud = async () => {
    setIsSyncing(true);
    const result = await backupDataToSupabase(trips, places, expenses);
    setIsSyncing(false);
    setLastSyncTime(result.timestamp);
    Alert.alert(
      result.success ? '클라우드 백업 성공! ☁️' : '백업 알림',
      result.message
    );
  };

  const handleRestoreFromCloud = async () => {
    Alert.alert(
      '클라우드 데이터 복원',
      '클라우드에 저장된 최신 백업 데이터를 불러와 현재 기기의 일정을 덮어씌우시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원하기',
          style: 'default',
          onPress: async () => {
            setIsSyncing(true);
            const result = await restoreDataFromSupabase();
            setIsSyncing(false);
            if (result.success && result.data) {
              setLastSyncTime(result.data.savedAt || '방금 전');
              Alert.alert('복원 완료! 🎉', result.message);
            } else {
              Alert.alert('복원 안내', result.message);
            }
          },
        },
      ]
    );
  };

  const handleSaveSupabaseConfig = async () => {
    await saveCustomSupabaseConfig(supabaseUrl, supabaseKey);
    setConfigModalVisible(false);
    Alert.alert('설정 저장 완료', 'Supabase 접속 정보가 로컬 보안 저장소에 등록되었습니다.');
  };

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
        subtitle="개인 설정 및 클라우드 동기화"
        showLogo={false}
        rightAction={
          <TouchableOpacity
            onPress={() => setConfigModalVisible(true)}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            accessibilityLabel="Supabase 설정"
          >
            <Key size={18} color="#2B2D42" />
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
            <Cloud size={20} color="#3B82F6" className="mb-1" />
            <Text className="text-base font-extrabold text-darkText">동기화</Text>
            <Text className="text-[11px] text-mutedText font-medium">Supabase</Text>
          </View>
        </View>

        {/* Supabase Cloud Sync Center Card */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-bold text-mutedText mb-2 px-1 uppercase tracking-wider">
            클라우드 데이터 동기화 (Supabase)
          </Text>

          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center mr-2.5">
                  <Cloud size={18} color="#0D9488" />
                </View>
                <View>
                  <Text className="text-sm font-extrabold text-darkText">Supabase 클라우드 상태</Text>
                  <Text className="text-[11px] text-mutedText">
                    최근 상태: {lastSyncTime}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setConfigModalVisible(true)}
                className="bg-gray-100 px-2.5 py-1 rounded-lg flex-row items-center"
              >
                <Key size={11} color="#475569" className="mr-1" />
                <Text className="text-[11px] font-bold text-gray-700">키 설정</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-1">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleBackupToCloud}
                disabled={isSyncing}
                className="flex-1 bg-secondary py-3 rounded-xl flex-row items-center justify-center shadow-xs"
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <UploadCloud size={15} color="#FFF" className="mr-1.5" />
                    <Text className="text-xs font-bold text-white">클라우드 백업</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRestoreFromCloud}
                disabled={isSyncing}
                className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center border border-gray-200"
              >
                <DownloadCloud size={15} color="#475569" className="mr-1.5" />
                <Text className="text-xs font-bold text-gray-700">백업 복원</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Preferences & App Settings */}
        <View className="px-4 mt-6">
          <Text className="text-sm font-bold text-mutedText mb-2 px-1 uppercase tracking-wider">
            앱 설정
          </Text>

          <Card className="p-0 overflow-hidden">
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
                <Text className="text-sm font-bold text-danger">로그아웃</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E0" />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Supabase Key Setup Modal */}
      <Modal visible={configModalVisible} animationType="slide" transparent={true} onRequestClose={() => setConfigModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[32px] p-5 pb-8">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View>
                <Text className="text-lg font-bold text-darkText">Supabase 클라우드 설정 ⚡</Text>
                <Text className="text-xs text-mutedText">나만의 Supabase 프로젝트를 연동하세요</Text>
              </View>
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <Text className="text-xs font-bold text-darkText mb-1.5">Project URL</Text>
              <TextInput
                value={supabaseUrl}
                onChangeText={setSupabaseUrl}
                placeholder="https://xyzcompany.supabase.co"
                autoCapitalize="none"
                className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs text-darkText mb-3"
              />

              <Text className="text-xs font-bold text-darkText mb-1.5">Anon Public Key</Text>
              <TextInput
                value={supabaseKey}
                onChangeText={setSupabaseKey}
                placeholder="eyJhbGciOi..."
                autoCapitalize="none"
                className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs text-darkText mb-4"
              />

              <TouchableOpacity
                onPress={handleSaveSupabaseConfig}
                className="bg-primary py-3.5 rounded-2xl items-center justify-center shadow-sm"
              >
                <Text className="text-sm font-bold text-white">설정 저장 및 연결</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
