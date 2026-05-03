package com.korfarm.api.learningdb

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 학습 자료 DB — 영역·세부영역별 raw 자료 관리.
 * 운영 데이터·콘텐츠·테스트·사용자 데이터는 모두 별도 메뉴 — 본 컨트롤러에서 노출하지 않음.
 */
@RestController
@RequestMapping("/v1/admin/learning-data")
class AdminLearningDbController(
    private val service: AdminLearningDbService
) {
    @GetMapping("/meta")
    fun meta(): ApiResponse<LearningDataMetaDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.listMeta())
    }

    @GetMapping("/tree")
    fun tree(): ApiResponse<LearningDataNodeDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.tree())
    }

    @GetMapping("/file")
    fun read(@RequestParam path: String): ApiResponse<Any> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.readFile(path))
    }

    @PutMapping("/file")
    fun save(
        @RequestParam path: String,
        @RequestBody body: Any?
    ): ApiResponse<FileSaveResultDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.saveFile(path, body))
    }

    @DeleteMapping("/file")
    fun delete(@RequestParam path: String): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val deleted = service.deleteFile(path)
        return ApiResponse(success = true, data = mapOf("deleted" to deleted))
    }

    @PostMapping("/import")
    fun importBatch(@RequestBody request: FileImportRequestDto): ApiResponse<FileImportResultDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.importBatch(request))
    }
}
