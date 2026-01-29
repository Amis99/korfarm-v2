package com.korfarm.api.system

import com.korfarm.api.common.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class HealthController {
    @GetMapping("/health")
    fun health(): ApiResponse<Map<String, String>> {
        return ApiResponse(success = true, data = mapOf("status" to "ok"))
    }
}
