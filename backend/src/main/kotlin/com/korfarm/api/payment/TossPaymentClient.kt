package com.korfarm.api.payment

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.Base64

@Component
class TossPaymentClient(
    private val tossProperties: TossProperties,
    private val objectMapper: ObjectMapper
) {
    private val httpClient: HttpClient = HttpClient.newHttpClient()
    private val baseUrl = "https://api.tosspayments.com/v1/payments"

    private fun authHeader(): String {
        val encoded = Base64.getEncoder().encodeToString("${tossProperties.secretKey}:".toByteArray())
        return "Basic $encoded"
    }

    fun confirmPayment(paymentKey: String, orderId: String, amount: Int): Map<String, Any> {
        val body = mapOf("paymentKey" to paymentKey, "orderId" to orderId, "amount" to amount)
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/confirm"))
            .header("Authorization", authHeader())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        val result = objectMapper.readValue(response.body(), Map::class.java) as Map<String, Any>

        if (response.statusCode() !in 200..299) {
            val code = result["code"]?.toString() ?: "TOSS_ERROR"
            val message = result["message"]?.toString() ?: "결제 승인에 실패했습니다"
            throw ApiException(code, message, HttpStatus.BAD_GATEWAY)
        }
        return result
    }

    fun cancelPayment(paymentKey: String, cancelReason: String, cancelAmount: Int? = null): Map<String, Any> {
        val body = mutableMapOf<String, Any>("cancelReason" to cancelReason)
        if (cancelAmount != null) {
            body["cancelAmount"] = cancelAmount
        }
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl/$paymentKey/cancel"))
            .header("Authorization", authHeader())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        val result = objectMapper.readValue(response.body(), Map::class.java) as Map<String, Any>

        if (response.statusCode() !in 200..299) {
            val code = result["code"]?.toString() ?: "TOSS_ERROR"
            val message = result["message"]?.toString() ?: "결제 취소에 실패했습니다"
            throw ApiException(code, message, HttpStatus.BAD_GATEWAY)
        }
        return result
    }
}
