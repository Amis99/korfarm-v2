# 프로모드(Pro Mode) 상세 보고서

---

## 1. 개요

프로모드는 **유료 구독 회원 전용** 순차 학습 시스템으로, 챕터 단위로 학습을 진행하고 테스트를 통과해야 다음 챕터가 열리는 구조입니다.

---

## 2. 아키텍처

### 페이지 구조 (3단계 네비게이션)

```
/pro-mode                          → ProModePage     (챕터 목록)
/pro-mode/chapter/{chapterId}      → ProChapterPage  (아이템 목록)
/pro-mode/chapter/{chapterId}/test → ProTestPage     (테스트 응시)
```

모든 라우트는 `ProtectedRoute` + lazy loading 적용.

### DB 테이블 (5개)

| 테이블 | 역할 |
|--------|------|
| `pro_chapters` | 챕터 정의 (레벨, 순서, 제목, 영상URL) |
| `pro_chapter_items` | 챕터별 학습 아이템 (6가지 타입) |
| `pro_progress` | 사용자별 아이템 완료 기록 + 씨앗 보상 |
| `pro_chapter_tests` | 챕터별 테스트 버전 (시험지 매핑) |
| `pro_test_sessions` | 테스트 응시 세션 (인쇄~채점) |

### 주요 파일 경로

**프론트엔드:**

- `frontend/src/pages/ProModePage.jsx` — 챕터 목록
- `frontend/src/pages/ProChapterPage.jsx` — 챕터 내 아이템 목록
- `frontend/src/pages/ProTestPage.jsx` — 테스트 응시 (상태 머신)
- `frontend/src/pages/AdminProPage.jsx` — 관리자 챕터/아이템/테스트 관리
- `frontend/src/styles/pro-mode.css` — 프로모드 전용 스타일

**백엔드:**

- `backend/src/main/kotlin/com/korfarm/api/pro/ProController.kt` — 학생용 API
- `backend/src/main/kotlin/com/korfarm/api/pro/AdminProController.kt` — 관리자 API
- `backend/src/main/kotlin/com/korfarm/api/pro/ProModeService.kt` — 핵심 비즈니스 로직
- `backend/src/main/kotlin/com/korfarm/api/pro/ProTestSessionService.kt` — 테스트 세션 관리
- `backend/src/main/kotlin/com/korfarm/api/pro/ProEntities.kt` — JPA 엔티티
- `backend/src/main/kotlin/com/korfarm/api/pro/ProDtos.kt` — 요청/응답 DTO
- `backend/src/main/kotlin/com/korfarm/api/pro/ProRepositories.kt` — 데이터 접근 계층

---

## 3. 구독 검증

### 백엔드

모든 프로 API에서 `SubscriptionService.requireActive(userId)` 호출:

```kotlin
fun requireActive(userId: String) {
    val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
        ?: throw ApiException("PAYMENT_REQUIRED", "subscription required", HttpStatus.PAYMENT_REQUIRED)
    if (!isEntitled(current)) {
        throw ApiException("PAYMENT_REQUIRED", "subscription required", HttpStatus.PAYMENT_REQUIRED)
    }
}

fun isEntitled(subscription: SubscriptionEntity): Boolean {
    val now = LocalDateTime.now()
    return subscription.endAt.isAfter(now) &&
           (subscription.status == "active" || subscription.status == "canceled")
}
```

- `subscriptions` 테이블에서 최신 구독 조회
- `endAt > now` + `status in ("active", "canceled")` → 유효
- 미보유/만료 → `PAYMENT_REQUIRED` (402) 예외

### 프론트엔드

`ProModePage`에서 402 에러 감지 → `needSubscription=true` → 구독 페이지 유도:

```jsx
.catch((e) => {
  if (isPaymentRequired(e)) {
    setNeedSubscription(true);
  }
})
```

---

## 4. 챕터 시스템

### 접근 제어 (잠금/해제)

- **첫 챕터**: 항상 접근 가능
- **2번째 이후**: 이전 챕터 테스트를 **통과**해야만 해제
- 백엔드에서 `isAccessible` 플래그로 전달

```kotlin
val isAccessible = if (index == 0) {
    true
} else {
    val prevChapter = chapters[index - 1]
    testSessions.containsKey(prevChapter.id)
}
```

### 진행률

```
progressPercent = (완료 아이템 수 / 전체 아이템 수) × 100
```

### 상태 표시

| 상태 | 조건 | UI |
|------|------|----|
| passed | `isTestPassed=true` | 초록 배지 "통과", 좌측 초록 보더 |
| current | `isAccessible=true` | 노란 배지 "진행중" |
| locked | `isAccessible=false` | 회색 배지 "잠김", 50% 투명도 |

### 챕터 DTO

```kotlin
data class ProChapterSummary(
    val chapterId: String,
    val levelId: String,
    val bookNumber: Int,
    val chapterNumber: Int,
    val globalChapterNumber: Int,
    val title: String,
    val description: String?,
    val videoUrl: String?,
    val progressPercent: Int,
    val isTestPassed: Boolean,
    val isAccessible: Boolean
)
```

---

## 5. 학습 아이템 시스템

### 6가지 타입

| 타입 | 분류 | 씨앗 보상 | 아이콘 색상 |
|------|------|----------|------------|
| reading (독해) | 기본 | seed_rice (쌀) | 파랑 |
| vocab (어휘) | 기본 | seed_wheat (밀) | 노랑 |
| background (배경지식) | 기본 | seed_corn (옥수수) | 초록 |
| logic (논리사고력) | 기본 | seed_grape (포도) | 보라 |
| answer (모범답안) | 고급 | 없음 | 핑크 |
| test (테스트) | 고급 | 없음 | 빨강 |

### 잠금 규칙

- **기본 4개**: 항상 접근 가능
- **고급 2개** (answer, test): 기본 4개를 **모두** 완료해야 해제

```kotlin
private val baseTypes = setOf("reading", "vocab", "background", "logic")
private val advancedTypes = setOf("answer", "test")

val isLocked = if (advancedTypes.contains(item.type)) {
    !allBaseCompleted
} else {
    false
}
```

### 씨앗 보상 (SeedRewardPolicy)

사용자 레벨과 콘텐츠 레벨 차이로 보상량 결정:

| 레벨 차이 | 씨앗 수 |
|-----------|---------|
| +2 이상 (쉬운 콘텐츠) | 5개 |
| +1 | 4개 |
| 0 (동일 레벨) | 3개 |
| -1 | 2개 |
| -2 이하 (어려운 콘텐츠) | 1개 |

씨앗 타입 매핑:

```kotlin
private val itemSeedTypeMap = mapOf(
    "reading" to "seed_rice",
    "vocab" to "seed_wheat",
    "background" to "seed_corn",
    "logic" to "seed_grape"
)
```

### 아이템 DTO

```kotlin
data class ProChapterItemView(
    val itemId: String,
    val type: String,
    val contentId: String?,
    val order: Int,
    val isLocked: Boolean,
    val isCompleted: Boolean,
    val completedAt: LocalDateTime?,
    val score: Int?
)
```

### 네비게이션

- 학습 아이템 → `/learning/{contentId}?proChapter={chapterId}&proItemId={itemId}`
- 테스트 → `/pro-mode/chapter/{chapterId}/test`
- 학습 완료 후 `POST /v1/pro/progress/complete` → 원래 챕터 페이지로 복귀

---

## 6. 테스트 시스템

### 응시 흐름 (4단계 상태 머신)

```
ready → printed → omr_input → result
```

| Phase | 화면 | API |
|-------|------|-----|
| **ready** | 안내 (60분 제한, 70점 통과, 남은 버전 수) | `GET /v1/pro/chapters/{id}/test-status` |
| **printed** | PDF 인쇄 + 카운트다운 타이머 | `POST /v1/pro/test/print` |
| **omr_input** | 문항별 객관식 버블/서술형 입력 | `GET /v1/test-storage/{testId}/questions` |
| **result** | 점수 + 통과/실패 + 다음 행동 | `POST /v1/pro/test/submit` |

### 테스트 규칙

- **제한 시간**: 60분 (`omrDeadline = now + 60분`)
- **통과 기준**: 100점 환산 기준 **70점 이상**
- **채점**: 객관식만 자동 채점, 서술형은 별도
- **버전 시스템**: 챕터당 여러 버전 등록 가능, 미응시 버전 자동 배정

```kotlin
const val PASS_SCORE = 70
const val TIME_LIMIT_MINUTES = 60L
```

### 테스트 출력 흐름 (printTest)

```
1. 기본 4개 완료 확인 (미완료 → LOCKED 에러)
2. 이미 통과한 챕터 확인 (통과 → ALREADY_PASSED 에러)
3. 활성 세션 확인
   - 있고 유효 → 기존 세션 정보 반환
   - 있지만 만료 → "expired" 업데이트 후 새 세션 생성
   - 없음 → 새 세션 생성
4. 미응시 버전 자동 배정
5. 세션 생성 (status="printed", omr_deadline=now+60분)
6. 응답 반환 { sessionId, testId, pdfFileId, omrDeadline, remainingMinutes }
```

### 채점 흐름 (submitOmr)

```
1. 세션 존재/소유권/상태 확인
2. 시간 초과 확인 (omrDeadline < now → "expired")
3. TestService.submitOmr() 호출 → 객관식 자동 채점
4. 점수 환산: scorePercent = (score * 100) / totalPoints
5. 판정: scorePercent >= 70 → passed, else → failed
6. 통과 시 test 아이템 완료 기록 (ProProgressEntity)
7. nextAction 결정
```

### 실패 시 nextAction

| 조건 | nextAction | UI |
|------|------------|----|
| 통과 | `next_chapter` | "챕터 목록으로" 버튼 |
| 실패 + 남은 버전 있음 | `retry_available` | "재응시하기" 버튼 |
| 실패 + 버전 소진 | `no_more_versions` | "학습 복습하기" 안내 |

### 테스트 관련 DTO

```kotlin
data class ProTestPrintResponse(
    val sessionId: String,
    val testId: String,
    val pdfFileId: String?,
    val omrDeadline: LocalDateTime,
    val remainingMinutes: Long,
    val totalQuestions: Int,
    val totalPoints: Int
)

data class ProTestSubmitResponse(
    val score: Int,
    val totalPoints: Int,
    val passed: Boolean,
    val nextAction: String
)

data class ProTestStatusResponse(
    val activeSession: ProTestSessionView?,
    val history: List<ProTestSessionView>,
    val remainingVersions: Int,
    val isTestPassed: Boolean
)
```

---

## 7. API 엔드포인트 전체 목록

### 학생용 (ProController)

| 메서드 | 경로 | 설명 | 구독 검증 |
|--------|------|------|----------|
| GET | `/v1/pro/chapters` | 챕터 목록 (진행률, 접근성) | 필수 |
| GET | `/v1/pro/chapters/{id}/items` | 아이템 목록 (잠금, 완료 상태) | 필수 |
| POST | `/v1/pro/progress/complete` | 아이템 완료 + 씨앗 보상 | 필수 |
| GET | `/v1/pro/chapters/{id}/test-status` | 테스트 상태 (활성 세션, 이력) | 필수 |
| POST | `/v1/pro/test/print` | 테스트 세션 생성 (PDF 배정) | 필수 |
| POST | `/v1/pro/test/submit` | OMR 제출 + 채점 | 필수 |

### 관리자용 (AdminProController)

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/v1/admin/pro/chapters` | 챕터 생성 | HQ_ADMIN |
| PUT | `/v1/admin/pro/chapters/{id}` | 챕터 수정 | HQ_ADMIN |
| GET | `/v1/admin/pro/chapters` | 챕터 목록 (레벨 필터) | HQ_ADMIN |
| POST | `/v1/admin/pro/chapters/{id}/items` | 아이템 설정 (전체 교체) | HQ_ADMIN |
| POST | `/v1/admin/pro/chapters/{id}/tests` | 테스트 버전 등록 | HQ_ADMIN |

---

## 8. 데이터 흐름 종합

```
[StartPage] → "프로 모드" 카드 클릭
    ↓
[ProModePage]
    ├─ GET /v1/pro/chapters (구독 검증 포함)
    ├─ 챕터 테이블 렌더링 (진행률, 상태 배지, 영상 버튼)
    └─ 챕터 클릭 → isAccessible 확인
        ↓
[ProChapterPage]
    ├─ GET /v1/pro/chapters/{id}/items
    ├─ 6개 아이템 카드 렌더링
    └─ 아이템 클릭
        ├─ 학습 아이템 → [LearningRunnerPage]
        │   ├─ ?proChapter=...&proItemId=... (컨텍스트 보존)
        │   ├─ 학습 완료 → POST /v1/pro/progress/complete
        │   └─ 돌아가기 → /pro-mode/chapter/{id}
        └─ test 아이템 → [ProTestPage]
            ├─ ready → printed → omr_input → result
            ├─ 통과 → 다음 챕터 잠금 해제
            └─ 실패 → 재응시 또는 복습 유도
```

### 컨텍스트 보존 (쿼리 파라미터)

```jsx
// ProChapterPage에서 학습 진입
navigate(`/learning/${item.contentId}?proChapter=${chapterId}&proItemId=${item.itemId}`);

// LearningRunnerPage에서 복원
const proChapter = searchParams.get("proChapter");
const proItemId = searchParams.get("proItemId");
const exitPath = proChapter ? `/pro-mode/chapter/${proChapter}` : "/farm-mode";

// 학습 완료 시
if (proItemId) {
    apiPost("/v1/pro/progress/complete", { itemId: proItemId });
}
navigate(exitPath);
```

---

## 9. CSS 디자인 시스템

### 색상 변수 (`pro-mode.css`)

```css
--pro-green: #22c55e;    /* 통과 상태 */
--pro-orange: #f59e0b;   /* 경고 */
--pro-red: #ef4444;      /* 실패/에러 */
--pro-dark: #1e293b;     /* 기본 텍스트 */
--pro-muted: #64748b;    /* 보조 텍스트 */
--pro-border: #e2e8f0;   /* 보더 */
--pro-bg: #f8fafc;       /* 배경 */
--pro-white: #fff;       /* 흰색 */
--pro-accent: #3b82f6;   /* 강조 (파랑) */
```

### 주요 UI 요소

| 요소 | 클래스 | 설명 |
|------|--------|------|
| 챕터 테이블 | `.pro-table` | 둥근 모서리(12px), 그림자 |
| 챕터 행 | `.pro-row.passed/current/locked` | 상태별 스타일 |
| 상태 배지 | `.pro-badge.passed/current/locked` | 색상 구분 |
| 진행률 바 | `.pro-progress-bar` + `.pro-progress-fill` | 80px, 6px 높이, 초록 |
| 아이템 카드 | `.pro-item` + 타입별 클래스 | 호버 효과, 잠금 투명도 |
| 테스트 타이머 | `.pro-test-timer` + `.warning` | 48px, 5분 미만 시 빨간 펄스 |
| 결과 카드 | `.pro-result-card.passed/failed` | 상단 보더 색상 구분 |

### 반응형

- **768px 이하**: 진행률/영상 열 숨김, 3열 → 1열 그리드
- **480px 이하**: 패딩 축소, 아이콘 크기 축소

---

## 10. DB 엔티티 상세

### pro_chapters

```kotlin
@Entity @Table(name = "pro_chapters")
class ProChapterEntity(
    @Id var id: String,                          // IdGenerator.newId("chapt")
    @Column(name = "level_id") var levelId: String,
    @Column(name = "book_number") var bookNumber: Int,
    @Column(name = "chapter_number") var chapterNumber: Int,
    @Column(name = "global_chapter_number") var globalChapterNumber: Int,
    var title: String,
    var description: String?,
    @Column(name = "video_url") var videoUrl: String?,
    var status: String = "active",
    @Column(name = "created_at") var createdAt: LocalDateTime,
    @Column(name = "updated_at") var updatedAt: LocalDateTime
)
```

### pro_chapter_items

```kotlin
@Entity @Table(name = "pro_chapter_items",
    uniqueConstraints = [UniqueConstraint(columnNames = ["chapter_id", "type"])])
class ProChapterItemEntity(
    @Id var id: String,                          // IdGenerator.newId("pci")
    @Column(name = "chapter_id") var chapterId: String,
    var type: String,                            // reading/vocab/background/logic/answer/test
    @Column(name = "content_id") var contentId: String?,
    @Column(name = "item_order") var itemOrder: Int,
    @Column(name = "created_at") var createdAt: LocalDateTime,
    @Column(name = "updated_at") var updatedAt: LocalDateTime
)
```

### pro_progress

```kotlin
@Entity @Table(name = "pro_progress",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "item_id"])])
class ProProgressEntity(
    @Id var id: String,                          // IdGenerator.newId("pp")
    @Column(name = "user_id") var userId: String,
    @Column(name = "chapter_id") var chapterId: String,
    @Column(name = "item_id") var itemId: String,
    var completed: Boolean = false,
    @Column(name = "completed_at") var completedAt: LocalDateTime?,
    var score: Int?,
    @Column(name = "seed_reward") var seedReward: Int = 0,
    @Column(name = "seed_type") var seedType: String?,
    @Column(name = "created_at") var createdAt: LocalDateTime,
    @Column(name = "updated_at") var updatedAt: LocalDateTime
)
```

### pro_test_sessions

```kotlin
@Entity @Table(name = "pro_test_sessions")
class ProTestSessionEntity(
    @Id var id: String,                          // IdGenerator.newId("pts")
    @Column(name = "user_id") var userId: String,
    @Column(name = "test_id") var testId: String,
    @Column(name = "chapter_id") var chapterId: String,
    @Column(name = "chapter_test_id") var chapterTestId: String,
    @Column(name = "printed_at") var printedAt: LocalDateTime?,
    @Column(name = "omr_deadline") var omrDeadline: LocalDateTime?,
    var status: String = "printed",              // printed/passed/failed/expired
    var score: Int?,
    @Column(name = "submission_id") var submissionId: String?,
    @Column(name = "created_at") var createdAt: LocalDateTime,
    @Column(name = "updated_at") var updatedAt: LocalDateTime
)
```

### pro_chapter_tests

```kotlin
@Entity @Table(name = "pro_chapter_tests",
    uniqueConstraints = [UniqueConstraint(columnNames = ["chapter_id", "version"])])
class ProChapterTestEntity(
    @Id var id: String,                          // IdGenerator.newId("pct")
    @Column(name = "chapter_id") var chapterId: String,
    var version: Int,
    @Column(name = "test_paper_id") var testPaperId: String,
    var status: String = "active",
    @Column(name = "created_at") var createdAt: LocalDateTime,
    @Column(name = "updated_at") var updatedAt: LocalDateTime
)
```

---

## 11. Repository 메서드

```kotlin
interface ProChapterRepo : JpaRepository<ProChapterEntity, String> {
    fun findByLevelIdAndStatusOrderByGlobalChapterNumberAsc(levelId: String, status: String): List<ProChapterEntity>
    fun findByStatusOrderByGlobalChapterNumberAsc(status: String): List<ProChapterEntity>
    fun findByLevelIdOrderByGlobalChapterNumberAsc(levelId: String): List<ProChapterEntity>
}

interface ProChapterItemRepo : JpaRepository<ProChapterItemEntity, String> {
    fun findByChapterIdOrderByItemOrderAsc(chapterId: String): List<ProChapterItemEntity>
    fun deleteByChapterId(chapterId: String)
}

interface ProProgressRepo : JpaRepository<ProProgressEntity, String> {
    fun findByUserIdAndChapterId(userId: String, chapterId: String): List<ProProgressEntity>
    fun findByUserIdAndItemId(userId: String, itemId: String): ProProgressEntity?
    fun findByUserIdAndChapterIdIn(userId: String, chapterIds: List<String>): List<ProProgressEntity>
    fun findByUserIdAndCompletedTrueAndCompletedAtBetween(userId: String, start: LocalDateTime, end: LocalDateTime): List<ProProgressEntity>
}

interface ProTestSessionRepo : JpaRepository<ProTestSessionEntity, String> {
    fun findByUserIdAndChapterId(userId: String, chapterId: String): List<ProTestSessionEntity>
    fun findByUserIdAndChapterIdAndStatusIn(userId: String, chapterId: String, statuses: List<String>): List<ProTestSessionEntity>
    fun findByUserIdAndStatusInAndCreatedAtBetween(userId: String, statuses: List<String>, start: LocalDateTime, end: LocalDateTime): List<ProTestSessionEntity>
}

interface ProChapterTestRepo : JpaRepository<ProChapterTestEntity, String> {
    fun findByChapterIdAndStatusOrderByVersionAsc(chapterId: String, status: String): List<ProChapterTestEntity>
    fun findByChapterIdAndVersion(chapterId: String, version: Int): ProChapterTestEntity?
}
```

---

## 12. 마이그레이션 이력

| 파일 | 내용 |
|------|------|
| V0002__seed.sql | `feature.paid.pro_mode` 플래그 등록 (비활성 기본값) |
| V0018__add_video_url.sql | `pro_chapters` 테이블에 `video_url VARCHAR(512) NULL` 컬럼 추가 |

---

## 13. 관리자 기능 (AdminProPage)

### 챕터 관리

```javascript
// 챕터 생성
apiPost("/v1/admin/pro/chapters", {
  levelId: "russell1",
  bookNumber: 1,
  chapterNumber: 1,
  globalChapterNumber: 1,
  title: "챕터 제목",
  description: "설명",
  videoUrl: "https://..."
})

// 챕터 수정
apiPut(`/v1/admin/pro/chapters/${chapterId}`, {
  title, description, status, videoUrl
})
```

### 아이템 설정

```javascript
apiPost(`/v1/admin/pro/chapters/${chapterId}/items`, {
  items: [
    { type: "reading", contentId: "content_xxx", order: 1 },
    { type: "vocab", contentId: "content_yyy", order: 2 },
    { type: "background", contentId: "content_zzz", order: 3 },
    { type: "logic", contentId: "content_aaa", order: 4 },
    { type: "answer", contentId: "content_bbb", order: 5 },
    { type: "test", contentId: null, order: 6 }
  ]
})
```

### 테스트 버전 등록

```javascript
apiPost(`/v1/admin/pro/chapters/${chapterId}/tests`, {
  version: 1,
  testPaperId: "test-xxx"
})
```

---

## 14. 핵심 특징 요약

| 항목 | 설명 |
|------|------|
| 구독 검증 | 모든 프로 API 호출 전 SubscriptionService.requireActive() 필수 |
| 챕터 순서화 | globalChapterNumber로 모든 챕터의 학습 순서 결정 |
| 아이템 타입 | 기본 4개(독해/어휘/배경지식/논리) + 고급 2개(모범답안/테스트) |
| 씨앗 보상 | 기본 아이템만 지급, 사용자 레벨과 콘텐츠 레벨 차이로 개수 결정 |
| 테스트 버전 | 챕터당 여러 버전 등록 가능, 미응시 버전 자동 배정 |
| 통과 기준 | 100점 기준 70점 이상 |
| 테스트 시간 제한 | 60분 타임아웃 (omrDeadline) |
| 자동 채점 | 객관식만 자동 채점, 서술형은 별도 처리 |
| 진행 추적 | pro_progress 테이블로 사용자별 아이템 완료 기록 |
| DB 콘텐츠 연동 | pro_chapter_items.contentId → contents.id 직접 참조 |
| 컨텍스트 보존 | 쿼리 파라미터(proChapter, proItemId)로 학습 후 원래 페이지 복귀 |
