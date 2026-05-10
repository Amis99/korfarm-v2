# 코덱스 인계 — 3대 채팅 Vision 이미지 OCR 추가

> 작성: 2026-05-10 / 작업자: 코덱스
> 사용자 결정 정책 박힘 — Claude(메인 창)는 직접 관여 X

---

## 1. 작업 개요

국어농장v2 의 3대 채팅에 이미지 첨부 + Vision 다이렉트 OCR/이해 기능 추가.

대상 채팅:
1. **AI 비서** (운영자 — `/admin`) — `OperatorAgentService`
2. **AI 튜터** (학생 — `/my/tutor`) — `TutorService`
3. **포도 커뮤니티 AI** — 채팅방(`AiChatService` + `PodoHarness`) + 게시판(`PodoBoardService`, 이미 부분 구현됨)

---

## 2. 사용자 결정 정책 (반드시 준수)

| 항목 | 정책 |
|---|---|
| 차감 | **모두 무과금** (자몽 0). 채팅은 차감 없음이 이미 결정 |
| 방식 | **Vision 다이렉트** — Claude 가 이미지를 직접 본다. 별도 OCR 서버 X |
| 범위 | **3곳 동시 적용** |
| **OCR 한도 (개인)** | 월 **20건** (학생/학부모) |
| **OCR 한도 (기관)** | 월 **100건** (ORG_ADMIN) |
| **OCR 한도 (포도)** | 사용자당 **하루 5건** |
| 한도 초과 행동 | "이번 달 OCR 한도 N건 모두 사용했어요" 안내 + 텍스트만 turn 진행 (텍스트 응답은 정상 처리). 자몽 차감 없음 |
| 형식 | jpeg / png / webp / gif. SVG · PDF · 다른 포맷 거부 |
| 크기 | 1장 ≤10MB raw, 다운스케일 후 1568×1568 fit + JPEG q85 |
| 1턴 첨부 수 | ≤4장 |

---

## 3. 신규 / 수정 파일 일람

### 백엔드 신규
- `backend/src/main/kotlin/com/korfarm/api/chat/VisionImagePreparer.kt` — 공용 헬퍼
- `backend/src/main/kotlin/com/korfarm/api/chat/OcrUsageLogEntity.kt` + `OcrUsageLogRepository.kt` — 한도 카운터
- `backend/src/main/resources/db/migration/V0133__ocr_usage_log.sql`

### 백엔드 수정
- `backend/src/main/kotlin/com/korfarm/api/agent/OperatorAgentService.kt`
- `backend/src/main/kotlin/com/korfarm/api/agent/OperatorAgentController.kt`
- `backend/src/main/kotlin/com/korfarm/api/tutor/TutorService.kt`
- `backend/src/main/kotlin/com/korfarm/api/tutor/TutorController.kt`
- `backend/src/main/kotlin/com/korfarm/api/chat/PodoHarness.kt`
- `backend/src/main/kotlin/com/korfarm/api/chat/AiChatService.kt`
- `backend/src/main/kotlin/com/korfarm/api/board/PodoBoardService.kt` — `VisionImagePreparer` 통합

### 프론트 신규
- `frontend/src/components/chat/AttachedImageStrip.jsx` — 3채팅 공용

### 프론트 수정
- `frontend/src/pages/AdminPage.jsx` — AI 비서 채팅
- `frontend/src/pages/MyTutorPage.jsx` — AI 튜터 채팅
- `frontend/src/components/chat/MessageInput.jsx` — 포도 채팅 (이미 이미지 업로드 가능, 트리거 힌트만 보강)
- `frontend/src/pages/CommunityChatPage.jsx` — placeholder 동적화 (선택)

---

## 4. DB 마이그레이션 (V0133)

```sql
-- V0133__ocr_usage_log.sql
-- 채팅 OCR(Vision) 사용 기록 — 한도 체크용
-- 자몽 차감 0 정책이지만 남용 방지로 도수 제한.
CREATE TABLE ocr_usage_log (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  channel VARCHAR(16) NOT NULL,         -- 'agent' / 'tutor' / 'podo_chat' / 'podo_board'
  org_id VARCHAR(64) DEFAULT NULL,      -- channel='agent' 일 때 기관 ID
  image_count INT NOT NULL DEFAULT 1,   -- 한 turn 의 이미지 수
  occurred_at DATETIME(6) NOT NULL,
  KEY idx_user_time (user_id, occurred_at),
  KEY idx_org_time (org_id, occurred_at),
  KEY idx_channel_user_day (channel, user_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

한도 체크 쿼리 (서비스 레이어):
- 개인: `SELECT SUM(image_count) FROM ocr_usage_log WHERE user_id=? AND channel='tutor' AND occurred_at >= DATE_FORMAT(NOW(),'%Y-%m-01')` ≥ 20 → 거부
- 기관: `SELECT SUM(image_count) FROM ocr_usage_log WHERE org_id=? AND channel='agent' AND occurred_at >= DATE_FORMAT(NOW(),'%Y-%m-01')` ≥ 100 → 거부
- 포도 채팅: `SELECT SUM(image_count) FROM ocr_usage_log WHERE user_id=? AND channel='podo_chat' AND occurred_at >= CURDATE()` ≥ 5 → 거부 (포도는 텍스트로만 응답하고 한도 초과 안내)

---

## 5. 단계별 구현 순서

### 단계 1 — `VisionImagePreparer.kt` 공용 헬퍼 (1h)

```kotlin
@Component
class VisionImagePreparer(
    private val fileService: FileService,
    private val chatThumbnailService: ChatThumbnailService,
) {
    private val ALLOWED_MIME = setOf("image/jpeg", "image/png", "image/webp", "image/gif")
    private val MAX_DIM = 1568
    private val MAX_RAW_BYTES = 10 * 1024 * 1024  // 10MB

    fun prepareFromFileId(fileId: String, expectedOwnerId: String): PreparedImage {
        val file = fileService.findById(fileId) ?: throw ApiException("NOT_FOUND", "...", HttpStatus.NOT_FOUND)
        if (file.ownerId != expectedOwnerId) throw ApiException("FORBIDDEN", "본인 파일만", HttpStatus.FORBIDDEN)
        if (file.mime !in ALLOWED_MIME) throw ApiException("INVALID_IMAGE_MIME", "지원하지 않는 형식: ${file.mime}", HttpStatus.BAD_REQUEST)
        val bytes = fileService.readBytes(fileId)
        if (bytes.size > MAX_RAW_BYTES) throw ApiException("IMAGE_TOO_LARGE", "10MB 초과", HttpStatus.BAD_REQUEST)
        val src = ImageIO.read(ByteArrayInputStream(bytes))
            ?: throw ApiException("INVALID_IMAGE", "이미지 디코딩 실패", HttpStatus.BAD_REQUEST)
        // 다운스케일 (ChatThumbnailService 의 fitInBox 로직 차용)
        val resized = downscale(src, MAX_DIM)
        val out = ByteArrayOutputStream()
        ImageIO.write(resized, "jpeg", out)  // 항상 JPEG q85 로 통일
        return PreparedImage(out.toByteArray(), "image/jpeg", fileId)
    }

    fun toClaudeImageBlock(prepared: PreparedImage): Map<String, Any> = mapOf(
        "type" to "image",
        "source" to mapOf(
            "type" to "base64",
            "media_type" to prepared.mime,
            "data" to Base64.getEncoder().encodeToString(prepared.bytes),
        ),
    )
}

data class PreparedImage(val bytes: ByteArray, val mime: String, val sourceFileId: String)
```

검증: 5MB JPEG / 10MB PNG / SVG / .exe 폴리글랏 / 작은 이미지 5케이스 단위 테스트.

### 단계 2 — OCR 한도 카운터 인프라 (30m)

`OcrUsageLogEntity`, `OcrUsageLogRepository` 신규. `OcrLimitChecker` 서비스 신설:

```kotlin
@Service
class OcrLimitChecker(private val ocrUsageRepo: OcrUsageLogRepository) {
    fun checkAndCount(userId: String, channel: String, imageCount: Int, orgId: String? = null) {
        val (used, limit) = when (channel) {
            "agent" -> {
                if (orgId == null) throw ApiException("BAD_REQUEST", "orgId required", HttpStatus.BAD_REQUEST)
                ocrUsageRepo.sumImageCountByOrgIdAndChannelSinceMonthStart(orgId, "agent") to 100
            }
            "tutor" -> ocrUsageRepo.sumImageCountByUserIdAndChannelSinceMonthStart(userId, "tutor") to 20
            "podo_chat" -> ocrUsageRepo.sumImageCountByUserIdAndChannelSinceDayStart(userId, "podo_chat") to 5
            else -> 0 to Int.MAX_VALUE  // podo_board 무제한 (게시판 OCR 은 자동댓글이라 별개)
        }
        if (used + imageCount > limit) {
            throw ApiException("OCR_LIMIT_EXCEEDED", "OCR 한도 초과 ($used/$limit). 이번 달 한도를 모두 사용했어요.", HttpStatus.TOO_MANY_REQUESTS)
        }
        ocrUsageRepo.save(OcrUsageLogEntity(
            id = IdGenerator.newId("ocr"),
            userId = userId, channel = channel, orgId = orgId,
            imageCount = imageCount, occurredAt = LocalDateTime.now()
        ))
    }
}
```

호출자(서비스 레이어)는 `imageFileIds.isNotEmpty()` 일 때 turn 시작 직전 호출.

### 단계 3 — 포도 채팅방 vision 트리거 (1h)

- `AiChatService.collectAttachedImagesForTrigger(trigger): List<ChatMessageEntity>` 신규 — 직전 ≤3개 같은 사용자 image 메시지 (60초 이내).
- `AiChatService.respondAsync` — 트리거 직전에 OCR 한도 체크(`OcrLimitChecker.checkAndCount(userId, "podo_chat", N)`). 한도 초과면 텍스트만으로 진행하고 안내문 추가.
- `PodoHarness.generate(triggerMessage, attachedImageBlocks: List<Map<String,Any>> = emptyList())` 시그니처 확장. messages 첫 user content 를 `attachedImageBlocks + textBlock` 로.

검증: 로컬 community 방에 이미지 + "포도야" 트리거 → 포도가 이미지 분석 댓글. 5건 초과 시 안내 후 텍스트만.

### 단계 4 — AI 튜터 (2h)

- `TutorTurnRequest.imageFileIds: List<String>` 추가.
- `TutorService.processTurn(... imageFileIds = emptyList())` 시그니처 확장.
- 분기: `imageFileIds.isEmpty()` 면 기존 path. 아니면:
  1. `OcrLimitChecker.checkAndCount(userId, "tutor", imageFileIds.size)`
  2. 각 fileId → `visionImagePreparer.prepareFromFileId(fileId, userId)` (권한 위반 → 400)
  3. `userContent = imageBlocks + listOf(textBlock)`
  4. DB 저장: `saveMessageTx(role="user", content=userText, toolUseJson=mapper.writeValueAsString(mapOf("images" to imageFileIds.map{...})))`
- `buildApiHistory` — toolUseJson 의 images 가 있으면 `prepareFromFileId` 다시 호출해 image 블록 복원.
- `MessageView` 응답에 `images: List<{fileId, thumbnailUrl}>` 추가.

검증: (a) 텍스트만 회귀 없음 (b) 이미지+텍스트 → 답변 + user 버블에 이미지 (c) history 다시 로드 시 이미지 재복원 (d) 5MB+ 다운스케일 (e) PDF → 400 (f) 한도 초과 → 400.

### 단계 5 — AI 비서 (1.5h)

단계 4 와 동일. 차이점:
- `OcrLimitChecker.checkAndCount(userId, "agent", imageFileIds.size, orgId=...)` — 기관 한도(월 100).
- 도구 호출이 있는 turn 에서 첫 호출에만 이미지 포함, 이후 tool_use loop 에서는 이미지 없이 진행.

### 단계 6 — 포도 게시판 다운스케일 통합 (30m)

`PodoBoardService.tryAutoComment` 의 `FileService.readBytes` 직접 호출을 `VisionImagePreparer` 경유로 교체. 5MB 이상 게시글 이미지도 안전.

게시판은 OCR 한도 체크 X (자동 댓글이라 사용자 의도 한도 아님).

### 단계 7 — 프론트 첨부 UI (1h)

`AttachedImageStrip.jsx` 신규:
```jsx
function AttachedImageStrip({ images, onRemove, disabled }) {
  if (!images?.length) return null;
  return (
    <div className="attached-image-strip">
      {images.map(img => (
        <div key={img.fileId} className="attached-image-item">
          <img src={img.previewUrl} alt={img.name} />
          {!disabled && <button onClick={() => onRemove(img.fileId)}>✕</button>}
        </div>
      ))}
    </div>
  );
}
```

`AdminPage.jsx` / `MyTutorPage.jsx` 첨부 흐름:
1. 입력 영역 좌측에 📎 버튼 + `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>`
2. 파일 선택 → 클라이언트 1차 검증 (10MB, mime) → `apiPost("/v1/files/presign", {purpose:"chat-vision", filename, mime, size})` → multipart upload (`MessageInput.jsx` 의 패턴 참조)
3. 받은 fileId 를 `attachedImages` state 에 추가
4. `sendMessage` body 에 `imageFileIds: attachedImages.map(a => a.fileId)` 포함
5. 성공 시 `setAttachedImages([])`

메시지 렌더링: user 버블에 `m.images?.map(img => <img src={`${API_BASE}/v1/files/${img.fileId}/download`} />)` 추가.

`MessageInput.jsx` (포도): 이미 이미지 업로드 가능. placeholder 동적화만 (선택).

### 단계 8 — 빌드·검증·배포 (30m)

```bash
cd backend && ./gradlew build
cd frontend && npm run build
# 정상 통과 확인 후
EC2_HOST=43.200.104.102 bash scripts/deploy-backend.sh
CF_DISTRIBUTION_ID=E29A5UX2VDFB4I bash scripts/deploy-frontend.sh
```

라이브 검증:
1. AI 비서 채팅 — 운영자가 이미지 첨부 + 답변
2. AI 튜터 채팅 — 학생이 학습지 사진 + 풀이
3. 포도 채팅 — 이미지 + "포도야 이거 뭐야?" → 분석
4. 포도 게시판 자동댓글 — 5MB+ 이미지도 정상
5. 한도 초과 케이스 — 안내 메시지 정상

---

## 6. 충돌 금지 영역 (다른 코덱스 작업)

- 비트겐슈타인 프로 모드 학습 콘텐츠 생성 — `contents.level_id LIKE 'wittgenstein%'`
- 학습 콘텐츠 영역·세부영역·주제 분류 — `content_classifications`
- 대결 모드 UI/UX 정비 — `/duel*` 페이지

→ 본 OCR 작업과 영역 안 겹침. 다만 **`PodoBoardService` 와 `FileService` 는 다른 작업과 공유**되므로 동시 수정 X. Claude(메인 창) 는 본 작업에 손대지 않음.

---

## 7. 인수인계 체크리스트

- [ ] 단계 1: `VisionImagePreparer` 단위 테스트 5케이스 통과
- [ ] 단계 2: `ocr_usage_log` 마이그레이션 적용 + `OcrLimitChecker` 동작 확인
- [ ] 단계 3: 포도 채팅방 vision — 이미지+트리거 → 분석 / 한도 초과 → 안내
- [ ] 단계 4: AI 튜터 vision — 이미지+텍스트, history 복원, mime 거부, 한도 거부
- [ ] 단계 5: AI 비서 vision — 도구 호출 turn 과 vision 공존 / 기관 한도
- [ ] 단계 6: 포도 게시판 다운스케일
- [ ] 단계 7: 프론트 3채팅 첨부 UI / `AttachedImageStrip` 공용
- [ ] `npm run build` 통과
- [ ] `./gradlew build` 통과
- [ ] AWS 배포 (백엔드 + 프론트엔드) + 라이브 검증

---

## 8. 위험·미정

1. **history 복원 시 매 turn 이미지 base64 재인코딩** — 8턴 이미지 4장이면 32회 S3 read + JPEG encode. v1 OK, v2 에서 in-memory LRU cache(TTL=10분) 추가.
2. **prompt caching** — 현재 system 만 cache_control. user 메시지 캐싱은 v2.
3. **OCR 결과 텍스트 별도 캐시 X** — 같은 이미지 여러 턴 동안 매번 모델이 다시 봄. 토큰 비용 ↑. v2 에서 OCR 텍스트 추출 후 텍스트만 history 에 저장.
4. **이미지 응답 (생성)** — v1 입력만. 출력은 텍스트.
5. **운영자가 학생 첨부 보는 권한** — v1 안 봄. 운영자는 본인 첨부만.
6. **PodoHarness.generateForBoardWithImages 와의 통합** — 기존 패턴이 살아있어 vision content 빌드 헬퍼를 분리해 양쪽이 공유하면 깔끔.

---

## 9. Claude(메인 창) 측 약속

- 본 작업의 모든 파일 직접 수정 X (사전 협의 없으면).
- Vision · OCR · 채팅 첨부 영역 전체 코덱스 단독 진행.
- 사용자가 명시 지시하면 그때만 손댐.
