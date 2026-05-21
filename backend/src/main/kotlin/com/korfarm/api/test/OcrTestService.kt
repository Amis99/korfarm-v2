package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiCallHelper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.files.FileRepository
import com.korfarm.api.files.FileService
import com.korfarm.api.grapefruit.GrapefruitService
import com.korfarm.api.org.OrgMembershipRepository
import org.apache.pdfbox.Loader
import org.apache.pdfbox.io.RandomAccessReadBuffer
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.Base64

/**
 * 테스트 정보 생성 (OCR) 서비스 — V0149 (2026-05-21).
 *
 * 흐름:
 *  1) generate(): 시험지·정답 파일 → Claude Vision Sonnet → JSON payload draft 저장
 *     - 페이지당 1자몽 차감 (기존 "wisdom-ocr" 정책 재사용)
 *  2) confirm(): 어드민 검수 후 → test_papers + test_questions INSERT (source='ocr_generated')
 *  3) (옵션) analyze(): TestAnalysisService 호출로 분석 데이터 attach
 *
 * 사용자 결정 (2026-05-21):
 *  - OCR 엔진: Claude Vision Sonnet (기존 채팅 OCR 인프라 재사용, 추가 의존성 0)
 *  - 데이터 모델: 기존 test_papers + source 칼럼
 *  - 학생 OMR 가능, 어드민 대리 OMR 도 가능
 */
@Service
class OcrTestService(
    private val ocrDraftRepo: OcrTestDraftRepository,
    private val testPaperRepo: TestPaperRepo,
    private val testQuestionRepo: TestQuestionRepo,
    private val fileService: FileService,
    private val fileRepository: FileRepository,
    private val aiCallHelper: AiCallHelper,
    private val grapefruitService: GrapefruitService,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(OcrTestService::class.java)

    companion object {
        private const val MODEL = "claude-sonnet-4-6"
        private const val OCR_KIND = "wisdom-ocr"  // 페이지당 1자몽 — 기존 OCR 정책 재사용
        private const val MAX_TOKENS = 16384

        private val SYSTEM_PROMPT = """당신은 한국 국어 시험지(중·고등) 분석 전문가입니다.
첨부된 시험지(PDF/이미지)와 (선택적) 정답·해설 파일을 보고 JSON 으로 추출하세요.
원문자 ①②③④⑤ · (1)(2)(3) 기호를 정확히 인식하고, 박스·표 안 텍스트도 누락 없이 잡으세요.
응답은 반드시 ```json``` 코드블록으로만 감싸 출력. 그 외 설명 텍스트 금지.""".trimIndent()

        private val USER_PROMPT = """다음 스키마로 추출:
- title: 시험지 제목
- level_id: 'saussure1' / 'frege1' / 'russell1' / 'wittgenstein1' 등 또는 빈 문자열
- total_questions: 총 문항 수
- total_points: 총점 (없으면 0)
- time_limit_minutes: 시간 제한 (분, 기본 60)
- passages: [{id:'p1', text:'지문 본문', domain:'독서|문학|화법과작문|언어와매체', sub_domain:'세부 분야'}]
- questions: [
    {
      number: 1,
      type: '객관식' | '서술형',
      passage_id: 'p1' (해당 지문 id, 없으면 null),
      stem: '문제 발문',
      choices: [{id:'c1', text:'선택지'}, {id:'c2', text:'...'}, ...],
      answer_id: 'c1' (정답 파일에서 확인. 없으면 추정 가능 시만),
      points: 5,
      explanation: '정답·해설 텍스트 (정답 파일에 있을 때만)'
    }
  ]

```json
{ ... }
```""".trimIndent()
    }

    /**
     * 시험지 등록 시작.
     *  - 파일 모드 (sourceFileId): Claude Vision OCR + 페이지당 1자몽 차감
     *  - 텍스트 모드 (sourceText): Claude API text-only 구조화 + 자몽 차감 0
     *    (O-7 / 2026-05-21 — 사용자 결정: OCR 비용은 OCR 단계만, 텍스트 입력은 0자몽)
     *  - 둘 다 결과는 ocr_test_drafts 의 payload_json 으로 저장
     */
    @Transactional
    fun generate(
        adminId: String,
        sourceFileId: String?,
        answerFileId: String?,
        sourceText: String?,
        answerText: String?,
    ): OcrTestDraftEntity {
        val orgMembership = orgMembershipRepository.findByUserIdAndStatus(adminId, "active").firstOrNull()
            ?: throw ApiException("FORBIDDEN", "기관 정보가 없습니다.", HttpStatus.FORBIDDEN)
        val orgId = orgMembership.orgId

        val useTextMode = !sourceText.isNullOrBlank()
        val useFileMode = !sourceFileId.isNullOrBlank()
        if (!useTextMode && !useFileMode) {
            throw ApiException("BAD_REQUEST", "시험지 파일 또는 텍스트를 입력해 주세요.", HttpStatus.BAD_REQUEST)
        }

        // 파일 모드 페이지 카운트 + OCR 자몽 차감
        var pageCount = 0
        var grapefruitDeducted = 0
        var sourceBytes: ByteArray? = null
        var sourceMime: String = "text/plain"
        if (useFileMode) {
            sourceBytes = fileService.readBytes(sourceFileId!!)
                ?: throw ApiException("NOT_FOUND", "시험지 파일을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
            sourceMime = fileRepository.findById(sourceFileId).orElse(null)?.mime ?: "application/octet-stream"
            pageCount = countPages(sourceMime, sourceBytes)
            if (pageCount <= 0) throw ApiException("BAD_REQUEST", "페이지를 인식할 수 없습니다.", HttpStatus.BAD_REQUEST)
            repeat(pageCount) {
                grapefruitService.spendOrg(orgId, OCR_KIND, null, "OCR 시험지 생성")
            }
            grapefruitDeducted = pageCount
        }
        // 텍스트 모드는 OCR 자몽 차감 0 — 사용자 결정 (2026-05-21)

        // Claude 호출 — 모드별 content 구성
        val content = mutableListOf<Map<String, Any?>>()
        content.add(aiCallHelper.textBlock(USER_PROMPT))
        if (useTextMode) {
            content.add(aiCallHelper.textBlock("[시험지 본문 — 텍스트 입력]\n\n${sourceText!!.trim()}"))
            if (!answerText.isNullOrBlank()) {
                content.add(aiCallHelper.textBlock("[정답·해설 — 텍스트 입력]\n\n${answerText.trim()}"))
            }
        } else {
            content.add(aiCallHelper.textBlock("[시험지 파일]"))
            content.add(buildFileBlock(sourceMime, sourceBytes!!))
            if (answerFileId != null) {
                val ansBytes = fileService.readBytes(answerFileId)
                val ansMime = fileRepository.findById(answerFileId).orElse(null)?.mime ?: "application/octet-stream"
                if (ansBytes != null) {
                    content.add(aiCallHelper.textBlock("[정답·해설 파일 — answer_id 와 explanation 채우는 데 사용]"))
                    content.add(buildFileBlock(ansMime, ansBytes))
                }
            }
        }

        val result = try {
            aiCallHelper.callMultimodal(
                model = MODEL,
                systemBlocks = listOf(mapOf("type" to "text", "text" to SYSTEM_PROMPT)),
                userContent = content,
                maxTokens = MAX_TOKENS,
            )
        } catch (e: Exception) {
            logger.warn("OCR Claude 호출 실패: adminId={} error={} mode={}", adminId, e.message, if (useTextMode) "text" else "file")
            return ocrDraftRepo.save(
                OcrTestDraftEntity(
                    id = IdGenerator.newId("otd"),
                    orgId = orgId, createdBy = adminId, status = "failed",
                    sourceFileId = sourceFileId, answerFileId = answerFileId,
                    pageCount = pageCount, grapefruitDeducted = grapefruitDeducted,
                    errorMessage = "Claude 호출 실패: ${e.message}",
                )
            )
        }

        val payloadJson = extractJsonBlock(result.text)
        return ocrDraftRepo.save(
            OcrTestDraftEntity(
                id = IdGenerator.newId("otd"),
                orgId = orgId, createdBy = adminId, status = "pending",
                sourceFileId = sourceFileId, answerFileId = answerFileId,
                pageCount = pageCount, payloadJson = payloadJson,
                grapefruitDeducted = grapefruitDeducted,
            )
        )
    }

    /** OCR 확정 — payload 를 test_papers + test_questions 로 INSERT. source='ocr_generated'. */
    @Transactional
    fun confirm(draftId: String, adminId: String, editedPayloadJson: String?): TestPaperEntity {
        val draft = ocrDraftRepo.findById(draftId).orElseThrow {
            ApiException("NOT_FOUND", "OCR draft 를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        if (draft.status != "pending") {
            throw ApiException("BAD_REQUEST", "이미 확정·폐기된 draft 입니다.", HttpStatus.BAD_REQUEST)
        }
        // 권한: 생성자 본인 + 같은 기관 ORG_ADMIN
        val adminOrgs = orgMembershipRepository.findByUserIdAndStatus(adminId, "active").map { it.orgId }
        if (draft.createdBy != adminId && (draft.orgId == null || draft.orgId !in adminOrgs)) {
            throw ApiException("FORBIDDEN", "다른 기관의 OCR draft 입니다.", HttpStatus.FORBIDDEN)
        }

        val payloadJson = editedPayloadJson?.takeIf { it.isNotBlank() } ?: draft.payloadJson
            ?: throw ApiException("BAD_REQUEST", "payload 가 비어 있습니다.", HttpStatus.BAD_REQUEST)

        @Suppress("UNCHECKED_CAST")
        val payload = objectMapper.readValue(payloadJson, Map::class.java) as Map<String, Any?>
        val title = (payload["title"] as? String)?.takeIf { it.isNotBlank() } ?: "OCR 생성 시험"
        val levelId = (payload["level_id"] as? String)?.takeIf { it.isNotBlank() }
        val totalQuestions = (payload["total_questions"] as? Number)?.toInt() ?: 0
        val totalPoints = (payload["total_points"] as? Number)?.toInt() ?: 0
        val timeLimit = (payload["time_limit_minutes"] as? Number)?.toInt()

        val testPaperId = IdGenerator.newId("test")
        testPaperRepo.save(
            TestPaperEntity(
                id = testPaperId, orgId = draft.orgId, title = title,
                levelId = levelId, totalQuestions = totalQuestions, totalPoints = totalPoints,
                timeLimitMinutes = timeLimit, status = "open",
                source = "ocr_generated", payloadJson = payloadJson,
                pdfFileId = draft.sourceFileId, answerPdfFileId = draft.answerFileId,
            )
        )

        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()
        val passageById = passages.associateBy { (it["id"] as? String) ?: "" }

        questions.forEach { q ->
            val number = (q["number"] as? Number)?.toInt() ?: return@forEach
            val passageId = q["passage_id"] as? String
            val passage = passageId?.let { passageById[it] }
            @Suppress("UNCHECKED_CAST")
            val choices = q["choices"] as? List<Map<String, Any?>>
            testQuestionRepo.save(
                TestQuestionEntity(
                    id = IdGenerator.newId("tq"),
                    testId = testPaperId,
                    number = number,
                    type = q["type"] as? String ?: "객관식",
                    stem = q["stem"] as? String,
                    passage = passage?.get("text") as? String,
                    domain = passage?.get("domain") as? String,
                    subDomain = passage?.get("sub_domain") as? String,
                    points = (q["points"] as? Number)?.toInt() ?: 5,
                    choicesJson = choices?.let { objectMapper.writeValueAsString(it) },
                    correctAnswer = q["answer_id"] as? String,
                    intent = q["explanation"] as? String,
                )
            )
        }

        draft.status = "confirmed"
        draft.confirmedTestPaperId = testPaperId
        ocrDraftRepo.save(draft)

        return testPaperRepo.findById(testPaperId).orElseThrow {
            ApiException("INTERNAL", "test_paper 저장 후 조회 실패", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /** draft 조회 — 어드민 검수 화면용. */
    @Transactional(readOnly = true)
    fun getDraft(draftId: String, adminId: String): OcrTestDraftEntity {
        val draft = ocrDraftRepo.findById(draftId).orElseThrow {
            ApiException("NOT_FOUND", "OCR draft 를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val adminOrgs = orgMembershipRepository.findByUserIdAndStatus(adminId, "active").map { it.orgId }
        if (draft.createdBy != adminId && (draft.orgId == null || draft.orgId !in adminOrgs)) {
            throw ApiException("FORBIDDEN", "다른 기관의 OCR draft 입니다.", HttpStatus.FORBIDDEN)
        }
        return draft
    }

    /** 미확정 draft 목록 (기관별 또는 작성자 본인). */
    @Transactional(readOnly = true)
    fun listPendingDrafts(adminId: String): List<OcrTestDraftEntity> {
        val orgIds = orgMembershipRepository.findByUserIdAndStatus(adminId, "active").map { it.orgId }
        val orgDrafts = orgIds.flatMap { ocrDraftRepo.findByOrgIdAndStatusOrderByCreatedAtDesc(it, "pending") }
        val myDrafts = ocrDraftRepo.findByCreatedByAndStatusOrderByCreatedAtDesc(adminId, "pending")
        return (orgDrafts + myDrafts).distinctBy { it.id }
    }

    // ─── 내부 헬퍼 ───

    private fun buildFileBlock(mime: String, bytes: ByteArray): Map<String, Any?> {
        val base64 = Base64.getEncoder().encodeToString(bytes)
        return if (mime == "application/pdf") {
            aiCallHelper.pdfBlock(base64)
        } else {
            val effectiveMime = if (mime.startsWith("image/")) mime else "image/jpeg"
            aiCallHelper.imageBlock(base64, effectiveMime)
        }
    }

    private fun countPages(mime: String, bytes: ByteArray): Int {
        return if (mime == "application/pdf") {
            try {
                Loader.loadPDF(RandomAccessReadBuffer(bytes)).use { it.numberOfPages }
            } catch (e: Exception) {
                logger.warn("PDF 페이지 카운트 실패: ${e.message}")
                1
            }
        } else 1
    }

    private fun extractJsonBlock(text: String): String {
        val regex = Regex("```(?:json)?\\s*([\\s\\S]+?)\\s*```", RegexOption.IGNORE_CASE)
        val match = regex.find(text)
        return match?.groupValues?.get(1)?.trim()
            ?: text.trim().let { if (it.startsWith("{") || it.startsWith("[")) it else "{}" }
    }
}
