package com.korfarm.api.test

import jakarta.persistence.*
import java.time.LocalDateTime
import org.springframework.data.jpa.repository.JpaRepository

/**
 * V0149 (2026-05-21) — 테스트 정보 생성 (OCR) 의 확정 전 preview 데이터.
 *
 * 흐름:
 *  1. 어드민이 시험지 + 정답 파일 업로드 → OCR generate endpoint
 *     → Claude Vision 호출 → payload_json 에 지문/문항/선택지/정답 JSON 저장
 *     → status='pending', 페이지당 1자몽 차감
 *  2. 어드민이 preview 검수·수정 → OCR confirm endpoint
 *     → test_papers + test_questions INSERT (source='ocr_generated')
 *     → TestAnalysisService 자동 호출 (분석 데이터 attach)
 *     → status='confirmed', confirmed_test_paper_id 채움
 *  3. 학생이 시험 응시 (OMR 만 입력) / 어드민 대리 OMR 둘 다 가능
 */
@Entity
@Table(name = "ocr_test_drafts")
class OcrTestDraftEntity(
    @Id
    var id: String,

    @Column(name = "org_id")
    var orgId: String? = null,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(nullable = false)
    var status: String = "pending",     // pending / confirmed / abandoned / failed

    @Column(name = "source_file_id")
    var sourceFileId: String? = null,

    @Column(name = "answer_file_id")
    var answerFileId: String? = null,

    @Column(name = "page_count", nullable = false)
    var pageCount: Int = 0,

    @Column(name = "payload_json", columnDefinition = "LONGTEXT")
    var payloadJson: String? = null,

    @Column(name = "admin_note", columnDefinition = "TEXT")
    var adminNote: String? = null,

    @Column(name = "confirmed_test_paper_id")
    var confirmedTestPaperId: String? = null,

    @Column(name = "grapefruit_deducted", nullable = false)
    var grapefruitDeducted: Int = 0,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

interface OcrTestDraftRepository : JpaRepository<OcrTestDraftEntity, String> {
    fun findByCreatedByAndStatusOrderByCreatedAtDesc(createdBy: String, status: String): List<OcrTestDraftEntity>
    fun findByOrgIdAndStatusOrderByCreatedAtDesc(orgId: String, status: String): List<OcrTestDraftEntity>
}
