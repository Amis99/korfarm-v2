package com.korfarm.api.print

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/print")
class PrintController(
    private val printService: PrintService
) {
    @PostMapping("/jobs")
    fun createJob(@Valid @RequestBody request: PrintJobRequest): ApiResponse<PrintJobResponseData> {
        val userId = SecurityUtils.currentUserId()
        val data = printService.enqueue(request, userId)
        return ApiResponse(success = true, data = data)
    }
}
