package com.korfarm.api.questionbank

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/question-bank")
class AdminQuestionBankController(
    private val questionBankService: QuestionBankService,
    private val featureFlagService: FeatureFlagService
) {
    private fun requireAdmin(): String {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
    }

    // ── 임포트 ──

    @PostMapping("/import")
    fun importRecords(@Valid @RequestBody request: QbImportRequest): ApiResponse<QbImportResult> {
        val userId = requireAdmin()
        val data = questionBankService.importRecords(request, userId)
        return ApiResponse(success = true, data = data)
    }

    // ── 레코드 CRUD ──

    @GetMapping("/records")
    fun listRecords(
        @RequestParam(required = false) area: String?,
        @RequestParam(required = false) sub_area: String?,
        @RequestParam(required = false) source_type: String?,
        @RequestParam(required = false) status: String?
    ): ApiResponse<List<RecordSummaryView>> {
        requireAdmin()
        val data = questionBankService.listRecords(area, sub_area, source_type, status)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/records/{id}")
    fun getRecord(@PathVariable id: String): ApiResponse<RecordDetailView> {
        requireAdmin()
        val data = questionBankService.getRecordDetail(id)
        return ApiResponse(success = true, data = data)
    }

    @PutMapping("/records/{id}")
    fun updateRecord(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateRecordRequest
    ): ApiResponse<RecordDetailView> {
        val userId = requireAdmin()
        val data = questionBankService.updateRecord(id, request, userId)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/records/{id}")
    fun archiveRecord(@PathVariable id: String): ApiResponse<Map<String, Boolean>> {
        requireAdmin()
        questionBankService.archiveRecord(id)
        return ApiResponse(success = true, data = mapOf("archived" to true))
    }

    // ── 내보내기 ──

    @PostMapping("/export")
    fun exportRecords(@Valid @RequestBody request: QbExportRequest): ApiResponse<List<Map<String, Any?>>> {
        requireAdmin()
        val data = questionBankService.exportRecords(request.record_ids)
        return ApiResponse(success = true, data = data)
    }

    // ── 코드표 ──

    @GetMapping("/codes")
    fun getAllCodes(): ApiResponse<List<CodeGroupView>> {
        requireAdmin()
        val data = questionBankService.getAllCodes()
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/codes/groups")
    fun createCodeGroup(@Valid @RequestBody request: CreateCodeGroupRequest): ApiResponse<CodeGroupView> {
        requireAdmin()
        val data = questionBankService.createCodeGroup(request)
        return ApiResponse(success = true, data = data)
    }

    @PutMapping("/codes/groups/{id}")
    fun updateCodeGroup(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateCodeGroupRequest
    ): ApiResponse<CodeGroupView> {
        requireAdmin()
        val data = questionBankService.updateCodeGroup(id, request)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/codes/values")
    fun createCodeValue(@Valid @RequestBody request: CreateCodeValueRequest): ApiResponse<CodeValueView> {
        requireAdmin()
        val data = questionBankService.createCodeValue(request)
        return ApiResponse(success = true, data = data)
    }

    @PutMapping("/codes/values/{id}")
    fun updateCodeValue(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateCodeValueRequest
    ): ApiResponse<CodeValueView> {
        requireAdmin()
        val data = questionBankService.updateCodeValue(id, request)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/codes/values/{id}")
    fun deactivateCodeValue(@PathVariable id: String): ApiResponse<Map<String, Boolean>> {
        requireAdmin()
        questionBankService.deactivateCodeValue(id)
        return ApiResponse(success = true, data = mapOf("deactivated" to true))
    }
}
