package com.korfarm.api.textbook

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.auth.AuthService.Companion.ORG_HQ_ID
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.files.FileService
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.OrgScopeResolver
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class TextbookService(
    private val textbookRepository: TextbookRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val orgScopeResolver: OrgScopeResolver,
    private val objectMapper: ObjectMapper,
    private val pdfService: TextbookPdfService,
    private val fileService: FileService,
) {
    private val isoFmt: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    // ─── 권한 검증 ────────────────────────────────────────────────

    /**
     * 어드민이 교재에 접근 가능한지 검증.
     * HQ_ADMIN: 모든 교재 OK
     * ORG_ADMIN: 자기 active 멤버십 orgId 교재만. "org_hq" 교재는 항상 차단(사용자 정책).
     */
    fun verifyAdminAccess(textbookId: String, callerId: String): TextbookEntity {
        val entity = textbookRepository.findById(textbookId).orElseThrow {
            ApiException("NOT_FOUND", "textbook not found", HttpStatus.NOT_FOUND)
        }
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return entity
        if (entity.orgId == ORG_HQ_ID) {
            throw ApiException(
                "FORBIDDEN", "본사 교재에 접근할 수 없습니다.", HttpStatus.FORBIDDEN
            )
        }
        val myOrgs = orgMembershipRepository
            .findByUserIdAndStatus(callerId, "active").map { it.orgId }
        if (entity.orgId !in myOrgs) {
            throw ApiException(
                "FORBIDDEN", "본인 기관 외 교재에 접근할 수 없습니다.", HttpStatus.FORBIDDEN
            )
        }
        return entity
    }

    // ─── 목록 ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun listForAdmin(callerId: String): List<TextbookSummary> {
        val rows = if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            textbookRepository.findAllByOrderByCreatedAtDesc()
        } else {
            // 사용자 정책: 기관 관리자는 본인 기관 교재만. 본사 교재(org_hq) 는 리스트에서 제외.
            val myOrgs = orgMembershipRepository
                .findByUserIdAndStatus(callerId, "active").map { it.orgId }
                .filter { it != ORG_HQ_ID }
            if (myOrgs.isEmpty()) emptyList()
            else textbookRepository.findByOrgIdInOrderByCreatedAtDesc(myOrgs)
        }
        return rows.map { it.toSummary() }
    }

    // ─── 생성 ────────────────────────────────────────────────────

    @Transactional
    fun create(request: TextbookCreateRequest, callerId: String): TextbookDetail {
        // orgId 위장 방어: HQ_ADMIN 자유 / ORG_ADMIN 본인 active 멤버십 강제.
        // textbooks.org_id 는 NOT NULL 이므로 HQ 가 null 보내면 ORG_HQ_ID fallback.
        val orgId = orgScopeResolver.resolveCallerOrgId(callerId, request.orgId) ?: ORG_HQ_ID

        val payloadJson = objectMapper.writeValueAsString(request.payload ?: emptyMap<String, Any>())
        val sourceJson = request.sourceJson?.let { objectMapper.writeValueAsString(it) }

        val entity = TextbookEntity(
            id = IdGenerator.newId("tb"),
            orgId = orgId,
            title = request.title.trim().ifBlank {
                throw ApiException("BAD_REQUEST", "교재 제목이 필요합니다.", HttpStatus.BAD_REQUEST)
            },
            series = request.series,
            level = request.level,
            volume = request.volume,
            payloadJson = payloadJson,
            sourceJson = sourceJson,
            status = "draft",
            createdBy = callerId,
        )
        val saved = textbookRepository.save(entity)
        return saved.toDetail()
    }

    // ─── 단건 조회 (편집기용) ────────────────────────────────────

    @Transactional(readOnly = true)
    fun getDetail(textbookId: String, callerId: String): TextbookDetail {
        val entity = verifyAdminAccess(textbookId, callerId)
        return entity.toDetail()
    }

    // ─── 메타 수정 ───────────────────────────────────────────────

    @Transactional
    fun updateMeta(textbookId: String, request: TextbookUpdateRequest, callerId: String): TextbookDetail {
        val entity = verifyAdminAccess(textbookId, callerId)
        request.title?.trim()?.takeIf { it.isNotBlank() }?.let { entity.title = it }
        request.series?.let { entity.series = it }
        request.level?.let { entity.level = it }
        request.volume?.let { entity.volume = it }
        request.status?.let { entity.status = it }
        entity.updatedAt = LocalDateTime.now()
        return textbookRepository.save(entity).toDetail()
    }

    // ─── 본문(payload) 수정 ─────────────────────────────────────

    @Transactional
    fun updatePayload(textbookId: String, request: TextbookPayloadRequest, callerId: String): TextbookDetail {
        val entity = verifyAdminAccess(textbookId, callerId)
        entity.payloadJson = objectMapper.writeValueAsString(request.payload)
        entity.updatedAt = LocalDateTime.now()
        return textbookRepository.save(entity).toDetail()
    }

    // ─── 삭제 ────────────────────────────────────────────────────

    @Transactional
    fun delete(textbookId: String, callerId: String) {
        val entity = verifyAdminAccess(textbookId, callerId)
        textbookRepository.delete(entity)
    }

    // ─── PDF 생성 ─────────────────────────────────────────────

    /**
     * 학생용 + 정답·해설 PDF 두 개를 typst 로 빌드 → S3 저장 → file id 갱신.
     * 학생용 purpose = "textbook_pdf" (broadCommunity OK)
     * 정답·해설 purpose = "textbook_answer_pdf" (broadCommunity 제외 — 관리자 전용)
     */
    @Transactional
    fun generatePdf(textbookId: String, callerId: String): TextbookPdfResult {
        val entity = verifyAdminAccess(textbookId, callerId)
        val baseTitle = entity.title.ifBlank { "textbook" }

        val studentBytes = pdfService.generateStudent(entity)
        val studentFileId = fileService.saveBinary(
            ownerUserId = callerId,
            purpose = "textbook_pdf",
            filename = "${baseTitle}_학생용.pdf",
            mime = "application/pdf",
            data = studentBytes,
        )
        entity.studentPdfFileId = studentFileId

        val answerBytes = pdfService.generateAnswer(entity)
        val answerFileId = fileService.saveBinary(
            ownerUserId = callerId,
            purpose = "textbook_answer_pdf",
            filename = "${baseTitle}_정답해설.pdf",
            mime = "application/pdf",
            data = answerBytes,
        )
        entity.answerPdfFileId = answerFileId
        entity.updatedAt = LocalDateTime.now()
        textbookRepository.save(entity)

        return TextbookPdfResult(
            textbookId = entity.id,
            studentFileId = studentFileId,
            studentDownloadUrl = "/v1/files/$studentFileId/download",
            answerFileId = answerFileId,
            answerDownloadUrl = "/v1/files/$answerFileId/download",
        )
    }

    // ─── 변환 헬퍼 ───────────────────────────────────────────────

    private fun TextbookEntity.toSummary() = TextbookSummary(
        textbookId = id,
        orgId = orgId,
        title = title,
        series = series,
        level = level,
        volume = volume,
        status = status,
        studentPdfFileId = studentPdfFileId,
        answerPdfFileId = answerPdfFileId,
        createdBy = createdBy,
        createdAt = createdAt.format(isoFmt),
        updatedAt = updatedAt.format(isoFmt),
        hq = orgId == ORG_HQ_ID,
    )

    private fun TextbookEntity.toDetail(): TextbookDetail {
        val payload: Any? = try {
            objectMapper.readValue(payloadJson, Any::class.java)
        } catch (_: Exception) { null }
        return TextbookDetail(
            textbookId = id,
            orgId = orgId,
            title = title,
            series = series,
            level = level,
            volume = volume,
            status = status,
            studentPdfFileId = studentPdfFileId,
            answerPdfFileId = answerPdfFileId,
            payload = payload,
            createdBy = createdBy,
            createdAt = createdAt.format(isoFmt),
            updatedAt = updatedAt.format(isoFmt),
            hq = orgId == ORG_HQ_ID,
        )
    }
}
