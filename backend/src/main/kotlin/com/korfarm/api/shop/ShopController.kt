package com.korfarm.api.shop

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/shop")
class ShopController(
    private val shopService: ShopService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/products")
    fun products(): ApiResponse<List<ProductView>> {
        featureFlagService.requireEnabled("feature.shop.mall", SecurityUtils.currentUserId())
        return ApiResponse(success = true, data = shopService.listProducts())
    }

    @GetMapping("/products/{productId}")
    fun product(@PathVariable productId: String): ApiResponse<ProductView> {
        featureFlagService.requireEnabled("feature.shop.mall", SecurityUtils.currentUserId())
        return ApiResponse(success = true, data = shopService.getProduct(productId))
    }

    @PostMapping("/orders")
    fun createOrder(@Valid @RequestBody request: OrderCreateRequest): ApiResponse<OrderView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.shop.mall", userId)
        return ApiResponse(success = true, data = shopService.createOrder(userId, request))
    }

    @GetMapping("/orders")
    fun orders(): ApiResponse<List<OrderView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.shop.mall", userId)
        return ApiResponse(success = true, data = shopService.listOrders(userId))
    }

    @GetMapping("/orders/{orderId}")
    fun order(@PathVariable orderId: String): ApiResponse<OrderView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.shop.mall", userId)
        return ApiResponse(success = true, data = shopService.getOrder(userId, orderId))
    }
}

