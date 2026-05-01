package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

/**
 * 본사 관리자 — 게시판 자체 관리 (CRUD)
 * /v1/admin/board-management
 *
 * 기존 학습자료 게시글 승인은 /v1/admin/boards/materials (AdminBoardController)에 있음
 */
@RestController
@RequestMapping("/v1/admin/board-management")
class AdminBoardManageController(
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository
) {
    @GetMapping
    fun listAllBoards(): ApiResponse<List<AdminBoardSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val boards = boardRepository.findAll().sortedBy { it.boardType }
        val data = boards.map { board ->
            val postCount = postRepository.findByBoardIdOrderByCreatedAtDesc(board.id).count { it.status != "deleted" }
            board.toAdminSummary(postCount)
        }
        return ApiResponse(success = true, data = data)
    }

    @PostMapping
    @Transactional
    fun createBoard(@Valid @RequestBody request: AdminBoardCreateRequest): ApiResponse<AdminBoardSummary> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        if (request.boardId.isBlank() || request.boardType.isBlank()) {
            throw ApiException("INVALID", "boardId, boardType 필수", HttpStatus.BAD_REQUEST)
        }
        if (boardRepository.findById(request.boardId).isPresent) {
            throw ApiException("CONFLICT", "이미 존재하는 게시판 ID입니다", HttpStatus.CONFLICT)
        }
        val now = LocalDateTime.now()
        val entity = BoardEntity(
            id = request.boardId,
            boardType = request.boardType,
            orgScope = null,  // 폐기됨
            status = request.status ?: "active",
            viewMinRole = normalizeRole(request.viewMinRole, "FREE"),
            writeMinRole = normalizeRole(request.writeMinRole, "FREE"),
            commentMinRole = normalizeRole(request.commentMinRole, "FREE"),
            createdAt = now,
            updatedAt = now
        )
        boardRepository.save(entity)
        return ApiResponse(success = true, data = entity.toAdminSummary(0))
    }

    @PatchMapping("/{boardId}")
    @Transactional
    fun updateBoard(
        @PathVariable boardId: String,
        @Valid @RequestBody request: AdminBoardUpdateRequest
    ): ApiResponse<AdminBoardSummary> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val board = boardRepository.findById(boardId).orElseThrow {
            ApiException("NOT_FOUND", "게시판 없음", HttpStatus.NOT_FOUND)
        }
        request.boardType?.let { if (it.isNotBlank()) board.boardType = it }
        request.status?.let { board.status = it }
        request.viewMinRole?.let { board.viewMinRole = normalizeRole(it, board.viewMinRole) }
        request.writeMinRole?.let { board.writeMinRole = normalizeRole(it, board.writeMinRole) }
        request.commentMinRole?.let { board.commentMinRole = normalizeRole(it, board.commentMinRole) }
        board.updatedAt = LocalDateTime.now()
        boardRepository.save(board)
        val postCount = postRepository.findByBoardIdOrderByCreatedAtDesc(board.id).count { it.status != "deleted" }
        return ApiResponse(success = true, data = board.toAdminSummary(postCount))
    }

    private fun normalizeRole(value: String?, default: String): String {
        val v = value?.uppercase() ?: return default
        return if (v in setOf("FREE", "PAID", "ORG_ADMIN", "HQ_ADMIN")) v else default
    }

    private fun BoardEntity.toAdminSummary(postCount: Int): AdminBoardSummary {
        return AdminBoardSummary(
            boardId = id,
            boardType = boardType,
            status = status,
            viewMinRole = viewMinRole,
            writeMinRole = writeMinRole,
            commentMinRole = commentMinRole,
            postCount = postCount,
            createdAt = createdAt.toString(),
            updatedAt = updatedAt.toString()
        )
    }

    @DeleteMapping("/{boardId}")
    @Transactional
    fun deleteBoard(@PathVariable boardId: String): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val board = boardRepository.findById(boardId).orElseThrow {
            ApiException("NOT_FOUND", "게시판 없음", HttpStatus.NOT_FOUND)
        }
        // 게시글이 남아있으면 비활성화만 (논리적 삭제), 없으면 물리 삭제
        val activePostCount = postRepository.findByBoardIdOrderByCreatedAtDesc(board.id).count { it.status != "deleted" }
        if (activePostCount > 0) {
            board.status = "inactive"
            board.updatedAt = LocalDateTime.now()
            boardRepository.save(board)
            return ApiResponse(success = true, data = mapOf("deleted" to false, "deactivated" to true, "remainingPosts" to activePostCount))
        }
        boardRepository.delete(board)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }
}

data class AdminBoardSummary(
    val boardId: String,
    val boardType: String,
    val status: String,
    val viewMinRole: String,
    val writeMinRole: String,
    val commentMinRole: String,
    val postCount: Int,
    val createdAt: String,
    val updatedAt: String
)

data class AdminBoardCreateRequest(
    val boardId: String,
    val boardType: String,
    val status: String? = "active",
    val viewMinRole: String? = "FREE",
    val writeMinRole: String? = "FREE",
    val commentMinRole: String? = "FREE"
)

data class AdminBoardUpdateRequest(
    val boardType: String? = null,
    val status: String? = null,
    val viewMinRole: String? = null,
    val writeMinRole: String? = null,
    val commentMinRole: String? = null
)
