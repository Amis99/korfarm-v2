package com.korfarm.api.print

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.File
import java.net.URI
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.util.concurrent.TimeUnit

@Service
class PrintService(
    private val printProperties: PrintProperties
) {
    fun enqueue(request: PrintJobRequest, userId: String?): PrintJobResponseData {
        val jobId = IdGenerator.newId("print")
        if (!printProperties.enabled || printProperties.command.isNullOrBlank()) {
            return PrintJobResponseData(jobId = jobId, status = "queued", serverPrint = false)
        }
        val tempFile = downloadFile(request.fileUrl, jobId)
        try {
            executePrintCommand(tempFile, request.printerName)
        } catch (error: Exception) {
            throw ApiException("PRINT_FAILED", "print failed", HttpStatus.INTERNAL_SERVER_ERROR)
        }
        return PrintJobResponseData(jobId = jobId, status = "submitted", serverPrint = true)
    }

    private fun downloadFile(fileUrl: String, jobId: String): File {
        val uri = URI(fileUrl)
        val tempFile = Files.createTempFile("korfarm-print-$jobId-", ".pdf").toFile()
        uri.toURL().openStream().use { input ->
            Files.copy(input, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
        return tempFile
    }

    private fun executePrintCommand(file: File, printerName: String?) {
        val resolvedCommand = printProperties.command
            ?.replace("{file}", file.absolutePath)
            ?.replace("{printer}", printerName ?: "")
            ?: return
        val isWindows = System.getProperty("os.name").lowercase().contains("win")
        val builder = if (isWindows) {
            ProcessBuilder("cmd", "/c", resolvedCommand)
        } else {
            ProcessBuilder("sh", "-c", resolvedCommand)
        }
        printProperties.workingDir?.let { builder.directory(File(it)) }
        builder.redirectErrorStream(true)
        val process = builder.start()
        val finished = process.waitFor(printProperties.timeoutSeconds, TimeUnit.SECONDS)
        if (!finished || process.exitValue() != 0) {
            throw ApiException("PRINT_FAILED", "print failed", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
