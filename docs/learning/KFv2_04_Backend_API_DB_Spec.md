# 국어농장 v2 백엔드 API 및 DB 규격서
기술 스택
- AWS EC2: SpringBoot, Kotlin, JDK 17
- AWS RDS: MySQL
- AWS S3: 콘텐츠 자산 저장소
- AWS EC2: Redis, 랭킹 저장
- AWS Amplify: React 프런트엔드 배포

## 1. 인증과 권한

### 1.1 사용자 유형
- 개인 사용자
- 유료 사용자
- 본사 관리자
- 제휴기관 관리자

### 1.2 권한 체크 포인트
- 콘텐츠 조회는 access.mode에 따라 제한
- 과제 바구니는 유료 사용자만
- 관리자 API는 role 기반

## 2. 핵심 도메인 엔티티

### 2.1 Content
- 콘텐츠 메타
- 콘텐츠 페이로드 JSON
- 자산 S3 key
- 상태, 버전

### 2.2 LearningSession
- 사용자의 학습 실행 기록
- 단계별 로그
- 결과 요약
- 씨앗 지급

### 2.3 SeedWallet
- 씨앗 종류별 보유 수량
- 씨앗 지급, 사용, 회수

### 2.4 Harvest
- 씨앗 10개로 작물 수확
- 비료가 있으면 3배 수확

### 2.5 Assignment
- 수강반, 학생에게 과제 배정
- 기한, 완료 상태

### 2.6 RankingSeason
- 시즌 시작, 종료
- 수확왕, 수집왕, 다승왕, 승률왕 등 집계

## 3. REST API 초안

### 3.1 콘텐츠 조회
- GET /api/v1/contents
  - query: level, area, subArea, tags, access
- GET /api/v1/contents/{contentId}
- GET /api/v1/contents/{contentId}/schema
  - 학습 유형별 JSON 스키마 반환

### 3.2 학습 실행
- POST /api/v1/sessions
  - body: contentId
  - return: sessionId, content payload
- POST /api/v1/sessions/{sessionId}/events
  - step log batch 업로드
- POST /api/v1/sessions/{sessionId}/finish
  - body: summary
  - return: seedRewardApplied

### 3.3 지갑과 수확
- GET /api/v1/wallet/seeds
- POST /api/v1/harvest
  - body: seedType, useFertilizer boolean
- GET /api/v1/harvestes
  - 작물 보유 현황

### 3.4 관리자 콘텐츠 등록
- POST /api/v1/admin/contents
  - meta + payload + asset references
- PUT /api/v1/admin/contents/{contentId}
- POST /api/v1/admin/contents/{contentId}/publish
- POST /api/v1/admin/contents/{contentId}/clone
- POST /api/v1/admin/assets/presign
  - S3 presigned URL 발급

### 3.5 과제
- POST /api/v1/admin/assignments
- GET /api/v1/admin/assignments/status
- GET /api/v1/me/assignments

### 3.6 리포트
- GET /api/v1/admin/students/{studentId}/card
- GET /api/v1/me/report

### 3.7 시즌 랭킹
- GET /api/v1/ranking/seasons/current
- GET /api/v1/ranking/seasons/{seasonId}/harvest-king
- GET /api/v1/ranking/seasons/{seasonId}/collector-king
- GET /api/v1/ranking/seasons/{seasonId}/duel-wins
- GET /api/v1/ranking/seasons/{seasonId}/duel-winrate

## 4. DB 테이블 초안

### 4.1 users
- user_id PK
- email
- password_hash
- role
- membership_status
- created_at

### 4.2 organizations
- org_id PK
- name
- type
- created_at

### 4.3 classes
- class_id PK
- org_id
- name
- created_at

### 4.4 class_members
- class_id
- user_id

### 4.5 contents
- content_id PK
- content_type
- version
- owner_type
- owner_id
- status
- title
- level
- area
- sub_area
- competencies JSON
- tags JSON
- access_mode
- seed_type
- seed_count
- time_limit_sec
- payload_json LONGTEXT
- assets_json LONGTEXT
- created_at, updated_at

### 4.6 learning_sessions
- session_id PK
- user_id
- content_id
- started_at
- finished_at
- status
- summary_json
- seed_reward_applied boolean

### 4.7 learning_session_events
- id PK
- session_id
- seq_no
- event_json
- created_at

### 4.8 seed_wallet
- user_id
- seed_type
- count
- updated_at

### 4.9 harvest_wallet
- user_id
- crop_type
- count
- updated_at

### 4.10 assignments
- assignment_id PK
- org_id
- class_id nullable
- user_id nullable
- content_id
- due_at
- status
- created_at

### 4.11 assignment_progress
- assignment_id
- user_id
- status
- started_at
- finished_at
- latest_session_id

### 4.12 seasons
- season_id PK
- starts_at
- ends_at
- name

### 4.13 season_rankings
- season_id
- rank_type
- level
- user_id
- score
- extra_json

## 5. Redis 사용
- 실시간 랭킹 집계는 Redis Sorted Set을 사용합니다.
- 시즌 종료 시 RDS에 스냅샷을 저장합니다.

## 6. 코딩 에이전트 지시문
- API는 OpenAPI 스펙으로 자동 문서화합니다.
- payload_json은 검증 후 저장합니다.
- 이벤트 로그는 배치 업로드를 기본으로 하고, 네트워크 불안정 시 재전송 가능해야 합니다.
