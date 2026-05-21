-- ============================================================
-- V0149: 테스트 정보 생성 (OCR) 기능 — 시험지 소스 칼럼 + OCR draft 테이블
-- ============================================================
--
-- 사용자 결정 (2026-05-21):
--   - OCR 엔진: Claude Vision Sonnet (기존 채팅 OCR 인프라 재사용)
--   - 데이터 모델: 기존 test_papers 재사용 + source 칼럼으로 구분
--   - 비용: OCR 페이지당 1자몽 (기존 OCR 정책)
--   - 학생 OMR 응시 가능 (지문·문항 텍스트 미노출, OMR 답안만 입력)
--   - 어드민 대리 OMR 입력도 그대로 지원
--
-- 흐름:
--   1) 어드민 시험지·정답 파일 업로드
--   2) Claude Vision OCR → ocr_test_drafts 에 preview 저장 (페이지당 1자몽 차감)
--   3) 어드민 검수·수정 후 확정 → test_papers + test_questions row INSERT (source='ocr_generated')
--   4) TestAnalysisService 자동 호출 — 영역·세부영역·주제·역량 벡터·약점·선택지 패턴 분석
--   5) 학생 OMR 응시 (지문·문항 텍스트 미노출 화면) 또는 어드민 대리 OMR
--   6) 채점·통계·학습 계획표 셀 sync 기존 흐름 그대로

-- ─────────────────────────────────────────────────────────────
-- 1. test_papers.source 칼럼 — 시험지 출처 구분
-- ─────────────────────────────────────────────────────────────
ALTER TABLE test_papers
  ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'manual' AFTER status;

-- 기존 row 는 모두 'manual' (어드민 수동 등록). default 가 자동 적용됨.
-- 향후 OCR 생성 시험은 'ocr_generated' 로 INSERT.

CREATE INDEX idx_test_papers_source ON test_papers (source);

-- ─────────────────────────────────────────────────────────────
-- 2. ocr_test_drafts 테이블 — OCR preview·검수 대기 데이터
-- ─────────────────────────────────────────────────────────────
-- 확정 전 임시 보관. 어드민이 수정·검수 후 confirm 시 test_papers/test_questions 로 INSERT.
-- 확정 후 또는 일정 기간 미사용 시 cleanup.
CREATE TABLE ocr_test_drafts (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NULL,            -- 작성 시점의 admin 기관 (null 이면 본사)
  created_by VARCHAR(64) NOT NULL,    -- admin user id
  status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending / confirmed / abandoned / failed
  -- 업로드된 원본 파일
  source_file_id VARCHAR(64) NULL,    -- 시험지 PDF/이미지
  answer_file_id VARCHAR(64) NULL,    -- 정답·해설 PDF/이미지 (선택)
  page_count INT NOT NULL DEFAULT 0,  -- OCR 처리 페이지 수 (자몽 차감 기준)
  -- OCR + Claude 결과 (지문/문항/선택지/정답 JSON)
  payload_json LONGTEXT NULL,
  -- 어드민 메모·검수 노트
  admin_note TEXT NULL,
  -- 확정 후 생성된 test_paper id (있으면 confirmed 상태)
  confirmed_test_paper_id VARCHAR(64) NULL,
  -- 자몽 차감 추적
  grapefruit_deducted INT NOT NULL DEFAULT 0,
  -- 에러 메시지 (status='failed' 인 경우)
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ocr_drafts_created_by (created_by, status),
  INDEX idx_ocr_drafts_org (org_id, status),
  INDEX idx_ocr_drafts_status (status, created_at)
);
