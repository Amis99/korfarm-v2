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
            AdminBoardSummary(
                boardId = board.id,
                boardType = board.boardType,
                orgScope = board.orgScope,
                status = board.status,
                postCount = postCount,
                createdAt = board.createdAt.toString(),
                updatedAt = board.updatedAt.toString()
            )
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
            orgScope = request.orgScope ?: "public",
            status = request.status ?: "active",
            createdAt = now,
            updatedAt = now
        )
        boardRepository.save(entity)
        return ApiResponse(success = true, data = AdminBoardSummary(
            boardId = entity.id,
            boardType = entity.boardType,
            orgScope = entity.orgScope,
            status = entity.status,
            postCount = 0,
            createdAt = entity.createdAt.toString(),
            updatedAt = entity.updatedAt.toString()
        ))
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
        request.orgScope?.let { board.orgScope = it }
        request.status?.let { board.status = it }
        board.updatedAt = LocalDateTime.now()
        boardRepository.save(board)
        val postCount = postRepository.findByBoardIdOrderByCreatedAtDesc(board.id).count { it.status != "deleted" }
        return ApiResponse(success = true, data = AdminBoardSummary(
            boardId = board.id,
            boardType = board.boardType,
            orgScope = board.orgScope,
            status = board.status,
            postCount = postCount,
            createdAt = board.createdAt.toString(),
            updatedAt = board.updatedAt.toString()
        ))
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
    val orgScope: String,
    val status: String,
    val postCount: Int,
    val createdAt: String,
    val updatedAt: String
)

data class AdminBoardCreateRequest(
    val boardId: String,
    val boardType: String,
    val orgScope: String? = "public",
    val status: String? = "active"
)

data class AdminBoardUpdateRequest(
    val boardType: String? = null,
    val orgScope: String? = null,
    val status: String? = null
)
