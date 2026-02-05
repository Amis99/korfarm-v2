package com.korfarm.api.shop

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/shop")
class AdminShopController(
    private val shopService: ShopService,
    private val featureFlagService: FeatureFlagService
) {
    @PostMapping("/products")
    fun createProduct(@Valid @RequestBody request: AdminProductRequest): ApiResponse<ProductView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        return ApiResponse(success = true, data = shopService.createProduct(request))
    }

    @GetMapping("/products")
    fun products(): ApiResponse<List<ProductView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        return ApiResponse(success = true, data = shopService.listProductsAdmin())
    }

    @PatchMapping("/products/{productId}")
    fun updateProduct(
        @PathVariable productId: String,
        @Valid @RequestBody request: AdminProductRequest
    ): ApiResponse<ProductView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        return ApiResponse(success = true, data = shopService.updateProduct(productId, request))
    }

    @DeleteMapping("/products/{productId}")
    fun deleteProduct(@PathVariable productId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        shopService.deleteProduct(productId)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    @GetMapping("/orders")
    fun orders(): ApiResponse<List<AdminOrderView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        return ApiResponse(success = true, data = shopService.listOrdersAdmin())
    }

    @PatchMapping("/orders/{orderId}")
    fun updateOrderStatus(
        @PathVariable orderId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.shop.mall")
        val status = body["status"]
            ?: throw com.korfarm.api.common.ApiException(
                "BAD_REQUEST", "status is required", org.springframework.http.HttpStatus.BAD_REQUEST
            )
        shopService.updateOrderStatus(orderId, status)
        return ApiResponse(success = true, data = mapOf("orderId" to orderId, "status" to status))
    }
}

