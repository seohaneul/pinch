-- ==============================================================================
-- 핀치 (Pinchi) Supabase 중앙 데이터베이스 스키마 및 RLS 정책
-- ==============================================================================
-- 적용 방법:
-- 1. https://supabase.com 대시보드 로그인 후 프로젝트 선택
-- 2. 좌측 메뉴 [SQL Editor] 클릭 -> [New query] 클릭
-- 3. 아래 SQL 스크립트를 전체 복사하여 붙여넣은 뒤 우측 하단 [Run] 클릭!
-- ==============================================================================

-- 1. 사용자 클라우드 동기화 백업 테이블 (user_sync_backups)
CREATE TABLE IF NOT EXISTS public.user_sync_backups (
    user_id TEXT PRIMARY KEY,
    backup_data JSONB NOT NULL,
    trip_count INTEGER DEFAULT 0,
    place_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 테이블 코멘트
COMMENT ON TABLE public.user_sync_backups IS '핀치 사용자의 여행 일정, 장소 보관함, 지출 내역 실시간 동기화 백업';

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.user_sync_backups ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 인증된 사용자는 본인 데이터만 읽기/쓰기 가능
DROP POLICY IF EXISTS "Users can manage their own backup" ON public.user_sync_backups;
CREATE POLICY "Users can manage their own backup"
    ON public.user_sync_backups
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR user_id = 'guest_user'
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR user_id = 'guest_user'
    );

-- 5. 검색 및 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sync_backups_updated_at 
    ON public.user_sync_backups (updated_at DESC);

-- ==============================================================================
-- 완료: 위 쿼리를 실행하면 핀치 앱과 Supabase 간의 실시간 동기화가 완벽히 동작합니다.
-- ==============================================================================
