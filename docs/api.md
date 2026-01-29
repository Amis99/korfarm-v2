# API 스켈레톤

기획서 기준의 최소 API 목록을 실제 경로로 정리한 스켈레톤이다. 인증은 `Authorization: Bearer <token>` 기준이다.

## 공통
- `GET /v1/health` 상태 확인
- `GET /v1/auth/me` 내 정보/권한 조회

## 인증
- `POST /v1/auth/signup` 회원가입
- `POST /v1/auth/login` 로그인
- `POST /v1/auth/logout` 로그아웃

## 무료 학습
- `GET /v1/learning/daily-quiz` 오늘의 퀴즈 조회
- `POST /v1/learning/daily-quiz/submit` 퀴즈 제출
- `GET /v1/learning/daily-reading` 오늘의 독해 조회
- `POST /v1/learning/daily-reading/submit` 독해 제출

## 경제
- `GET /v1/inventory` 인벤토리 조회
- `POST /v1/harvest/craft` 수확 제작
- `GET /v1/ledger` 장부 조회

## 시즌/랭킹
- `GET /v1/seasons/current` 현재 시즌 조회
- `GET /v1/seasons/:seasonId/harvest-rankings` 수확 랭킹 조회
- `GET /v1/seasons/:seasonId/duel-rankings` 대결 랭킹 조회
- `GET /v1/seasons/:seasonId/awards` 시즌 수상 조회

## 대결 모드 (HTTP)
- `POST /v1/duel/rooms` 대기실 생성
- `GET /v1/duel/rooms` 대기실 목록/방 코드 조회
- `POST /v1/duel/rooms/:roomId/join` 대기실 입장
- `POST /v1/duel/rooms/:roomId/leave` 대기실 퇴장
- `POST /v1/duel/queue/join` 빠른 대결 큐 입장
- `POST /v1/duel/queue/leave` 빠른 대결 큐 퇴장
- `GET /v1/duel/stats` 전적 조회
- `GET /v1/duel/leaderboards` 대결 랭킹 조회

## 대결 모드 (WebSocket)
- `WS /v1/duel/ws`
  - `match.join` 경기 입장
  - `match.question` 문항 수신
  - `match.answer` 답안 제출
  - `match.state` 생존자/탈락 상태 브로드캐스트
  - `match.finish` 종료/정산 결과
  - `match.reconnect` 재접속 처리

## 유료 학습
- `GET /v1/pro-mode/levels` 프로 모드 레벨 목록
- `GET /v1/pro-mode/chapters/:chapterId` 챕터 상세
- `POST /v1/pro-mode/chapters/:chapterId/submit` 챕터 제출
- `GET /v1/farm-modes` 농장별 모드 목록
- `POST /v1/farm-modes/:modeId/submit` 농장별 모드 제출
- `GET /v1/writing/prompts` 글쓰기 과제 프롬프트
- `POST /v1/writing/submit` 글쓰기 제출
- `GET /v1/tests` 테스트 창고 목록
- `POST /v1/tests/:testId/submit` 테스트 제출
- `GET /v1/harvest-ledger` ?? ?? ??

## 과제
- `GET /v1/assignments` 과제 목록
- `GET /v1/assignments/:assignmentId` 과제 상세
- `POST /v1/assignments/:assignmentId/submit` 과제 제출
- `GET /v1/assignments/:assignmentId/progress` 과제 진행률

## 게시판
- `GET /v1/boards` 게시판 목록
- `GET /v1/boards/:boardId/posts` 게시글 목록
- `POST /v1/boards/:boardId/posts` 게시글 작성
- `GET /v1/posts/:postId` 게시글 조회
- `PATCH /v1/posts/:postId` 게시글 수정
- `DELETE /v1/posts/:postId` 게시글 삭제
- `POST /v1/posts/:postId/comments` 댓글 작성
- `DELETE /v1/comments/:commentId` 댓글 삭제
- `POST /v1/reports` 신고

## 파일
- `POST /v1/files/presign` 업로드 프리사인드 URL 발급
- `GET /v1/files/:fileId/download` 다운로드 URL 발급

## 쇼핑몰
- `GET /v1/shop/products` 상품 목록
- `GET /v1/shop/products/:productId` 상품 상세
- `POST /v1/shop/orders` 주문 생성
- `GET /v1/shop/orders/:orderId` 주문 상세
- `GET /v1/shop/orders` 주문 목록

## 결제/구독
- `POST /v1/payments/checkout` 유료 회원 전환 결제
- `GET /v1/subscription` 구독 상태 조회
- `POST /v1/subscription/cancel` 구독 해지
- `POST /v1/payments/shop` 쇼핑몰 결제

## 관리자 (ORG_ADMIN/HQ_ADMIN)
- `POST /v1/admin/orgs` 기관 생성 (HQ_ADMIN)
- `PATCH /v1/admin/orgs/:orgId` 기관 수정 (HQ_ADMIN)
- `POST /v1/admin/orgs/:orgId/deactivate` 기관 비활성화 (HQ_ADMIN)
- `POST /v1/admin/orgs/:orgId/admins` 기관 관리자 계정 생성
- `POST /v1/admin/students` 학생 계정 생성/초대
- `PATCH /v1/admin/students/:userId` 학생 정보 수정
- `POST /v1/admin/students/:userId/disable` 학생 비활성화
- `POST /v1/admin/classes` 수강반 생성
- `PATCH /v1/admin/classes/:classId` 수강반 수정
- `POST /v1/admin/classes/:classId/students` 수강반 학생 등록
- `POST /v1/admin/content/import` 학습 데이터 JSON 업로드/검증
- `GET /v1/admin/content/:contentId/preview` 학습 미리 보기
- `POST /v1/admin/assignments` 과제 생성/발행
- `PATCH /v1/admin/assignments/:assignmentId` 과제 수정
- `POST /v1/admin/assignments/:assignmentId/close` 과제 종료
- `GET /v1/admin/assignments/overview` 과제 현황 조회
- `POST /v1/admin/writing/:submissionId/feedback` 글쓰기 첨삭
- `POST /v1/admin/tests` 테스트 PDF 업로드
- `POST /v1/admin/tests/:testId/answers` 정답 입력
- `POST /v1/admin/tests/:testId/grade` 채점/분석
- `POST /v1/admin/boards/materials/:postId/approve` 자료 게시판 승인
- `POST /v1/admin/boards/materials/:postId/reject` 자료 게시판 반려
- `POST /v1/admin/duel/seasons` 대결 시즌 설정
- `POST /v1/admin/duel/snapshots` 대결 수상 스냅샷 생성
- `POST /v1/admin/duel/recalculate` 전적 재집계
- `GET /v1/admin/flags` 플래그 조회
- `PATCH /v1/admin/flags/:flagKey` 플래그 수정

## 쇼핑몰 관리자 (HQ_ADMIN)
- `POST /v1/admin/shop/products` 상품 등록
- `PATCH /v1/admin/shop/products/:productId` 상품 수정
- `DELETE /v1/admin/shop/products/:productId` 상품 삭제
- `GET /v1/admin/shop/orders` 주문 현황
- `GET /v1/admin/payments` 결제 현황

## Parent links
- `POST /v1/parents/links/request` 학부모 연결 요청
- `GET /v1/parents/links` 학부모 연결 목록
- `POST /v1/students/links/confirm` 학생 승인
- `GET /v1/admin/parents/links` 관리자 연결 목록
- `POST /v1/admin/parents/links` 관리자 연결 생성
- `POST /v1/admin/parents/links/:linkId/approve` 관리자 승인
- `POST /v1/admin/parents/links/:linkId/reject` 관리자 반려
- `DELETE /v1/admin/parents/links/:linkId` 연결 해제
