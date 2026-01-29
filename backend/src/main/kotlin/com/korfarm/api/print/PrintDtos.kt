package com.korfarm.api.print

import jakarta.validation.constraints.NotBlank

data class PrintJobRequest(
    @field:NotBlank val fileUrl: String,
    val jobType: String? = null,
    val printerName: String? = null,
    val copies: Int? = null
)

data class PrintJobResponseData(
    val jobId: String,
    val status: String,
    val serverPrint: Boolean
)
