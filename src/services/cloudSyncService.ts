import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import type { Trip, Place, ScheduleItem } from '../types';
import type { ExpenseItem } from '../utils/settlementUtils';

const STORAGE_KEY_CLOUD_BACKUP = 'pinch_cloud_local_snapshot';
const STORAGE_KEY_LAST_SYNC = 'pinch_last_cloud_sync_time';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  isRemote: boolean;
}

export interface CloudBackupData {
  userId: string;
  trips: Trip[];
  places: Place[];
  scheduleItems: ScheduleItem[];
  expenses: any[];
  savedAt: string;
  version: string;
}

/**
 * 마지막 클라우드 동기화 시간 조회
 */
export async function getLastSyncTime(): Promise<string> {
  try {
    const time = await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
    return time || '동기화 기록 없음';
  } catch {
    return '동기화 기록 없음';
  }
}

/**
 * 로컬 전체 여행 데이터를 Supabase 클라우드에 실시간 백업/동기화
 */
export async function syncToCloud(params: {
  userId?: string;
  trips: Trip[];
  places: Place[];
  scheduleItems: ScheduleItem[];
  expenses: any[];
}): Promise<CloudSyncResult> {
  const timestamp = new Date().toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const effectiveUserId = params.userId || 'guest_user';
  const payload: CloudBackupData = {
    userId: effectiveUserId,
    trips: params.trips,
    places: params.places,
    scheduleItems: params.scheduleItems,
    expenses: params.expenses,
    savedAt: timestamp,
    version: '1.2.0',
  };

  // 1. 항상 로컬 스냅샷에 즉시 안전 저장 (오프라인 무중단 보호)
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CLOUD_BACKUP, JSON.stringify(payload));
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, `${timestamp} (로컬 캐시)`);
  } catch (err) {
    console.log('[CloudSync] Local snapshot error:', err);
  }

  // 2. Supabase가 설정되어 있고 네트워크 사용 가능 시 클라우드 전송
  if (isSupabaseConfigured()) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const targetUid = authData?.user?.id || effectiveUserId;

      const { error } = await supabase
        .from('user_sync_backups')
        .upsert(
          {
            user_id: targetUid,
            backup_data: payload,
            trip_count: params.trips.length,
            place_count: params.places.length,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (!error) {
        await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, `${timestamp} (클라우드 동기화 완료)`);
        return {
          success: true,
          message: 'Supabase 클라우드에 안전하게 동기화되었습니다! ☁️',
          timestamp,
          isRemote: true,
        };
      }
    } catch (err: any) {
      console.log('[CloudSync] Remote upload failed, keeping local snapshot:', err.message);
    }
  }

  return {
    success: true,
    message: '로컬 안전 스냅샷이 저장되었습니다. (클라우드 대기 중)',
    timestamp,
    isRemote: false,
  };
}

/**
 * Supabase 클라우드에서 최신 데이터를 다운로드하여 복원
 */
export async function syncFromCloud(userId?: string): Promise<{
  success: boolean;
  data?: CloudBackupData;
  message: string;
}> {
  // 1. 원격 클라우드 우선 조회
  if (isSupabaseConfigured()) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const targetUid = authData?.user?.id || userId || 'guest_user';

      const { data, error } = await supabase
        .from('user_sync_backups')
        .select('backup_data')
        .eq('user_id', targetUid)
        .maybeSingle();

      if (!error && data?.backup_data) {
        return {
          success: true,
          data: data.backup_data as CloudBackupData,
          message: 'Supabase 클라우드에서 최신 여행 데이터를 불러왔습니다! 🎉',
        };
      }
    } catch (err: any) {
      console.log('[CloudSync] Remote fetch failed, trying local snapshot:', err);
    }
  }

  // 2. 로컬 스냅샷 폴백
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CLOUD_BACKUP);
    if (raw) {
      const parsed = JSON.parse(raw) as CloudBackupData;
      return {
        success: true,
        data: parsed,
        message: `로컬 백업 스냅샷(${parsed.savedAt})에서 데이터를 복원했습니다.`,
      };
    }
  } catch (err) {
    // Ignore
  }

  return {
    success: false,
    message: '복원할 수 있는 클라우드 백업 데이터가 존재하지 않습니다.',
  };
}
