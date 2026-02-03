package com.korfarm.api.common

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ApiResponse<Any>> {
        logger.warn("API error: {} - {}", ex.code, ex.message)
        val body = ApiResponse<Any>(
            success = false,
            error = ApiError(code = ex.code, message = ex.message)
        )
        return ResponseEntity.status(ex.status).body(body)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Any>> {
        val message = ex.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "invalid_request"
        logger.warn("Validation error: {}", message)
        val body = ApiResponse<Any>(
            success = false,
            error = ApiError(code = "VALIDATION_ERROR", message = message)
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnknown(ex: Exception): ResponseEntity<ApiResponse<Any>> {
        logger.error("Unhandled error", ex)
        val body = ApiResponse<Any>(
            success = false,
            error = ApiError(code = "INTERNAL_ERROR", message = ex.message ?: "error")
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body)
    }
}
