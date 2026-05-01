package com.korfarm.api.wisdom

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.CreateWisdomPostRequest
import com.korfarm.api.files.FileRepository
import com.korfarm.api.files.FileService
import com.korfarm.api.studyplan.StudyPlanCellRepository
import com.korfarm.api.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.slf4j.LoggerFactory
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime

@Service
class WisdomService(
    private val postRepository: WisdomPostRepository,
    private val attachmentRepository: WisdomAttachmentRepository,
    private val feedbackRepository: WisdomFeedbackRepository,
    private val likeRepository: WisdomLikeRepository,
    private val commentRepository: WisdomCommentRepository,
    private val fileRepository: FileRepository,
    private val userRepository: UserRepository,
    private val aiWisdomClient: AiWisdomClient,
    private val studyPlanCellRepository: StudyPlanCellRepository,
    private val aiFeedbackJobRepository: AiFeedbackJobRepository,
    private val aiFeedbackJobService: AiFeedbackJobService,
    @Value("\${app.upload.dir:./uploads}") private val uploadDir: String
) {
    private val log = LoggerFactory.getLogger(WisdomService::class.java)
    @Transactional(readOnly = true)
    fun listPosts(levelId: String, topicKey: String?, currentUserId: String?): WisdomPostListResponse {
        // Check if user has written a post in this level+topic (for view restriction)
        val hasMyPost = if (currentUserId != null && topicKey != null) {
            postRepository.existsByLevelIdAndTopicKeyAndUserIdAndStatus(levelId, topicKey, currentUserId, "active")
        } else if (currentUserId != null && topicKey == null) {
            // When no topic filter, check if user has any post in this level
            true
        } else {
            false
        }

        // If topic is selected and user hasn't written → return empty list
        if (topicKey != null && !hasMyPost) {
            return WisdomPostListResponse(hasMyPost = false, posts = emptyList())
        }

        val posts = if (topicKey != null) {
            postRepository.findByLevelIdAndTopicKeyAndStatusOrderByCreatedAtDesc(levelId, topicKey, "active")
        } else {
            val allPosts = postRepository.findByLevelIdAndStatusOrderByCreatedAtDesc(levelId, "active")
            // 전체 주제 조회 시, 사용자가 실제로 볼 수 있는 글만 필터링
            // (본인 글 + 본인이 글을 쓴 주제의 다른 글)
            if (currentUserId != null) {
                val myTopicKeys = allPosts.filter { it.userId == currentUserId }.map { it.topicKey }.toSet()
                allPosts.filter { it.userId == currentUserId || it.topicKey in myTopicKeys }
            } else {
                allPosts
            }
        }
        val postIds = posts.map { it.id }
        val feedbackMap = if (postIds.isNotEmpty()) {
            feedbackRepository.findByPostIdIn(postIds).associateBy { it.postId }
        } else emptyMap()

        val likesByPost = if (postIds.isNotEmpty()) {
            likeRepository.findByPostIdIn(postIds).groupBy { it.postId }
        } else emptyMap()

        val commentCountByPost = if (postIds.isNotEmpty()) {
            commentRepository.findByPostIdInAndStatus(postIds, "active").groupBy { it.postId }
        } else emptyMap()

        val summaries = posts.map { post ->
            val isOwn = post.userId == currentUserId
            val likes = likesByPost[post.id] ?: emptyList()
            WisdomPostSummary(
                postId = post.id,
                levelId = post.levelId,
                topicKey = post.topicKey,
                topicLabel = post.topicLabel,
                submissionType = post.submissionType,
                isOwn = isOwn,
                authorName = if (isOwn) getUserName(post.userId) else null,
                hasFeedback = feedbackMap.containsKey(post.id),
                likeCount = likes.size,
                isLikedByMe = currentUserId != null && likes.any { it.userId == currentUserId },
                commentCount = (commentCountByPost[post.id] ?: emptyList()).size,
                createdAt = post.createdAt
            )
        }
        return WisdomPostListResponse(hasMyPost = hasMyPost, posts = summaries)
    }

    @Transactional(readOnly = true)
    fun myPosts(userId: String): List<WisdomPostSummary> {
        val posts = postRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "active")
        val postIds = posts.map { it.id }
        val feedbackMap = if (postIds.isNotEmpty()) {
            feedbackRepository.findByPostIdIn(postIds).associateBy { it.postId }
        } else emptyMap()

        val likesByPost = if (postIds.isNotEmpty()) {
            likeRepository.findByPostIdIn(postIds).groupBy { it.postId }
        } else emptyMap()

        val commentCountByPost = if (postIds.isNotEmpty()) {
            commentRepository.findByPostIdInAndStatus(postIds, "active").groupBy { it.postId }
        } else emptyMap()

        return posts.map { post ->
            val likes = likesByPost[post.id] ?: emptyList()
            WisdomPostSummary(
                postId = post.id,
                levelId = post.levelId,
                topicKey = post.topicKey,
                topicLabel = post.topicLabel,
                submissionType = post.submissionType,
                isOwn = true,
                authorName = getUserName(post.userId),
                hasFeedback = feedbackMap.containsKey(post.id),
                likeCount = likes.size,
                isLikedByMe = likes.any { it.userId == userId },
                commentCount = (commentCountByPost[post.id] ?: emptyList()).size,
                createdAt = post.createdAt
            )
        }
    }

    @Transactional
    fun createPost(userId: String, request: CreateWisdomPostRequest): WisdomPostDetail {
        // 학습 계획표 셀 연동: planCellId 가 있으면 본인 셀인지 검증 후 연결
        val planCell = request.planCellId?.let { cellId ->
            val cell = studyPlanCellRepository.findById(cellId).orElseThrow {
                ApiException("NOT_FOUND", "study plan cell not found", HttpStatus.NOT_FOUND)
            }
            if (cell.userId != userId) {
                throw ApiException("FORBIDDEN", "본인의 셀이 아닙니다", HttpStatus.FORBIDDEN)
            }
            cell
        }

        val post = WisdomPostEntity(
            id = IdGenerator.newId("wis"),
            userId = userId,
            levelId = request.levelId,
            topicKey = request.topicKey,
            topicLabel = request.topicLabel,
            submissionType = request.submissionType,
            content = request.content,
            status = "active",
            planCellId = planCell?.id
        )
        postRepository.save(post)

        // 셀 상태 갱신: submitted + submission_count++
        if (planCell != null) {
            planCell.status = "submitted"
            planCell.submissionCount += 1
            studyPlanCellRepository.save(planCell)
        }

        val attachments = attachFiles(post.id, userId, request.attachmentIds)

        return WisdomPostDetail(
            postId = post.id,
            levelId = post.levelId,
            topicKey = post.topicKey,
            topicLabel = post.topicLabel,
            submissionType = post.submissionType,
            content = post.content,
            isOwn = true,
            authorName = getUserName(userId),
            attachments = attachments,
            feedback = null,
            likeCount = 0,
            isLikedByMe = false,
            comments = emptyList(),
            createdAt = post.createdAt
        )
    }

    @Transactional(readOnly = true)
    fun getPost(postId: String, currentUserId: String?): WisdomPostDetail {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.status != "active") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }

        val isOwn = post.userId == currentUserId

        // View restriction: must have own post in same level+topic, or be the author
        if (!isOwn && currentUserId != null) {
            val hasMyPost = postRepository.existsByLevelIdAndTopicKeyAndUserIdAndStatus(
                post.levelId, post.topicKey, currentUserId, "active"
            )
            if (!hasMyPost) {
                throw ApiException("FORBIDDEN", "글을 작성해야 다른 사람의 글을 볼 수 있습니다.", HttpStatus.FORBIDDEN)
            }
        }

        val attachments = attachmentRepository.findByPostId(post.id).map { it.toView() }
        val feedback = feedbackRepository.findByPostId(post.id)?.toView()
        val likeCount = likeRepository.countByPostId(post.id).toInt()
        val isLikedByMe = if (currentUserId != null) {
            likeRepository.findByPostIdAndUserId(post.id, currentUserId) != null
        } else false
        val comments = listComments(post.id, currentUserId)

        return WisdomPostDetail(
            postId = post.id,
            levelId = post.levelId,
            topicKey = post.topicKey,
            topicLabel = post.topicLabel,
            submissionType = post.submissionType,
            content = post.content,
            isOwn = isOwn,
            authorName = if (isOwn) getUserName(post.userId) else null,
            attachments = attachments,
            feedback = feedback,
            likeCount = likeCount,
            isLikedByMe = isLikedByMe,
            comments = comments,
            createdAt = post.createdAt
        )
    }

    @Transactional
    fun deletePost(postId: String, userId: String) {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        post.status = "deleted"
        postRepository.save(post)
    }

    // --- Like ---

    @Transactional
    fun toggleLike(postId: String, userId: String): Boolean {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.status != "active") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }

        // View restriction check
        val hasMyPost = postRepository.existsByLevelIdAndTopicKeyAndUserIdAndStatus(
            post.levelId, post.topicKey, userId, "active"
        )
        if (!hasMyPost) {
            throw ApiException("FORBIDDEN", "글을 작성해야 좋아요를 남길 수 있습니다.", HttpStatus.FORBIDDEN)
        }

        val existing = likeRepository.findByPostIdAndUserId(postId, userId)
        return if (existing != null) {
            likeRepository.deleteByPostIdAndUserId(postId, userId)
            false
        } else {
            likeRepository.save(WisdomLikeEntity(
                id = IdGenerator.newId("wlk"),
                postId = postId,
                userId = userId
            ))
            true
        }
    }

    // --- Comment ---

    @Transactional(readOnly = true)
    fun listComments(postId: String, currentUserId: String?): List<WisdomCommentView> {
        val comments = commentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(postId, "active")
        return comments.map { c ->
            val isOwn = c.userId == currentUserId
            WisdomCommentView(
                commentId = c.id,
                isOwn = isOwn,
                authorName = if (isOwn) getUserName(c.userId) else null,
                content = c.content,
                createdAt = c.createdAt
            )
        }
    }

    @Transactional
    fun createComment(postId: String, userId: String, content: String): WisdomCommentView {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.status != "active") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }

        // View restriction check
        val hasMyPost = postRepository.existsByLevelIdAndTopicKeyAndUserIdAndStatus(
            post.levelId, post.topicKey, userId, "active"
        )
        if (!hasMyPost) {
            throw ApiException("FORBIDDEN", "글을 작성해야 댓글을 남길 수 있습니다.", HttpStatus.FORBIDDEN)
        }

        val comment = WisdomCommentEntity(
            id = IdGenerator.newId("wcm"),
            postId = postId,
            userId = userId,
            content = content,
            status = "active"
        )
        commentRepository.save(comment)
        return WisdomCommentView(
            commentId = comment.id,
            isOwn = true,
            authorName = getUserName(userId),
            content = comment.content,
            createdAt = comment.createdAt
        )
    }

    @Transactional
    fun deleteComment(commentId: String, userId: String, isAdmin: Boolean) {
        val comment = commentRepository.findById(commentId).orElseThrow {
            ApiException("NOT_FOUND", "comment not found", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && comment.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        comment.status = "deleted"
        commentRepository.save(comment)
    }

    // --- Admin ---

    @Transactional(readOnly = true)
    fun adminListPosts(levelId: String?, topicKey: String?): List<AdminWisdomPostSummary> {
        val posts = when {
            levelId != null && topicKey != null ->
                postRepository.findByLevelIdAndTopicKeyOrderByCreatedAtDesc(levelId, topicKey)
            levelId != null ->
                postRepository.findByLevelIdOrderByCreatedAtDesc(levelId)
            else ->
                postRepository.findAll().sortedByDescending { it.createdAt }
        }
        val postIds = posts.map { it.id }
        val feedbackMap = if (postIds.isNotEmpty()) {
            feedbackRepository.findByPostIdIn(postIds).associateBy { it.postId }
        } else emptyMap()

        return posts.map { post ->
            AdminWisdomPostSummary(
                postId = post.id,
                levelId = post.levelId,
                topicKey = post.topicKey,
                topicLabel = post.topicLabel,
                submissionType = post.submissionType,
                authorId = post.userId,
                authorName = getUserName(post.userId),
                hasFeedback = feedbackMap.containsKey(post.id),
                status = post.status,
                createdAt = post.createdAt
            )
        }
    }

    @Transactional(readOnly = true)
    fun adminGetPost(postId: String): AdminWisdomPostDetail {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val attachments = attachmentRepository.findByPostId(post.id).map { it.toView() }
        val feedback = feedbackRepository.findByPostId(post.id)?.toView()

        // Admin sees all comments with real names
        val comments = commentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(post.id, "active").map { c ->
            WisdomCommentView(
                commentId = c.id,
                isOwn = false,
                authorName = getUserName(c.userId),
                content = c.content,
                createdAt = c.createdAt
            )
        }

        return AdminWisdomPostDetail(
            postId = post.id,
            levelId = post.levelId,
            topicKey = post.topicKey,
            topicLabel = post.topicLabel,
            submissionType = post.submissionType,
            content = post.content,
            authorId = post.userId,
            authorName = getUserName(post.userId),
            attachments = attachments,
            feedback = feedback,
            comments = comments,
            status = post.status,
            createdAt = post.createdAt
        )
    }

    @Transactional
    fun adminCreateFeedback(postId: String, reviewerId: String, comment: String, correction: String?): WisdomFeedbackView {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val existing = feedbackRepository.findByPostId(postId)
        val savedFeedback = if (existing != null) {
            existing.reviewerId = reviewerId
            existing.comment = comment
            existing.correction = correction
            feedbackRepository.save(existing)
            existing
        } else {
            val feedback = WisdomFeedbackEntity(
                id = IdGenerator.newId("wfb"),
                postId = post.id,
                reviewerId = reviewerId,
                comment = comment,
                correction = correction
            )
            feedbackRepository.save(feedback)
            feedback
        }

        // 학습 계획표 셀 연동: 첨삭 등록되면 cell.status='reviewed' 로 갱신
        post.planCellId?.let { cellId ->
            studyPlanCellRepository.findById(cellId).ifPresent { cell ->
                cell.status = "reviewed"
                cell.reviewedBy = reviewerId
                cell.reviewedAt = LocalDateTime.now()
                studyPlanCellRepository.save(cell)
            }
        }

        return savedFeedback.toView()
    }

    // --- Helpers ---

    private fun attachFiles(postId: String, userId: String, attachmentIds: List<String>): List<WisdomAttachmentView> {
        if (attachmentIds.isEmpty()) return emptyList()
        val files = fileRepository.findAllById(attachmentIds).associateBy { it.id }
        if (files.size != attachmentIds.size) {
            throw ApiException("INVALID_ATTACHMENT", "invalid attachment", HttpStatus.BAD_REQUEST)
        }
        return attachmentIds.map { fileId ->
            val file = files[fileId]!!
            if (file.ownerId != userId) {
                throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
            }
            val entity = WisdomAttachmentEntity(
                id = IdGenerator.newId("watt"),
                postId = postId,
                fileId = file.id,
                name = file.id,
                mime = file.mime,
                size = file.size
            )
            attachmentRepository.save(entity)
            entity.toView()
        }
    }

    private fun getUserName(userId: String): String? {
        return userRepository.findById(userId).orElse(null)?.name
    }

    private fun WisdomAttachmentEntity.toView() = WisdomAttachmentView(
        fileId = fileId, name = name, mime = mime, size = size
    )

    private fun WisdomFeedbackEntity.toView() = WisdomFeedbackView(
        feedbackId = id,
        reviewerName = getUserName(reviewerId),
        comment = comment,
        correction = correction,
        createdAt = createdAt
    )

    // ─── AI 첨삭 ───────────────────────────────────────

    fun generateAiFeedback(postId: String, requesterId: String): AiFeedbackResult {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "글을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val text = post.content
        if (text.isNullOrBlank()) {
            throw ApiException("NO_CONTENT", "글 내용이 없습니다. 파일 업로드 글은 먼저 OCR 변환이 필요합니다.", HttpStatus.BAD_REQUEST)
        }
        return aiWisdomClient.generateFeedback(text, post.levelId, post.topicLabel, requesterId)
    }

    /**
     * AI 첨삭 비동기 enqueue.
     * 동일 post 에 PENDING/RUNNING job 이 있으면 그 jobId 재사용 (중복 호출 방지).
     */
    @Transactional
    fun enqueueAiFeedback(postId: String, requesterId: String): AiFeedbackJobEnqueueResponse {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "글을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (post.content.isNullOrBlank()) {
            throw ApiException("NO_CONTENT", "글 내용이 없습니다. 파일 업로드 글은 먼저 OCR 변환이 필요합니다.", HttpStatus.BAD_REQUEST)
        }
        // 진행 중인 job 재사용
        val existing = aiFeedbackJobRepository.findFirstByPostIdAndStatusInOrderByCreatedAtDesc(
            postId,
            listOf(AiFeedbackJobStatus.PENDING, AiFeedbackJobStatus.RUNNING)
        )
        if (existing != null) {
            return AiFeedbackJobEnqueueResponse(jobId = existing.id, status = existing.status)
        }
        val job = AiFeedbackJobEntity(
            id = IdGenerator.newId("aifb"),
            postId = postId,
            requestedBy = requesterId,
            status = AiFeedbackJobStatus.PENDING
        )
        aiFeedbackJobRepository.save(job)
        // 트랜잭션 커밋 후 비동기 실행하도록 외부 빈에 위임
        aiFeedbackJobService.runJob(job.id)
        return AiFeedbackJobEnqueueResponse(jobId = job.id, status = job.status)
    }

    @Transactional(readOnly = true)
    fun getAiFeedbackJob(jobId: String): AiFeedbackJobStatusResponse {
        val job = aiFeedbackJobRepository.findById(jobId).orElseThrow {
            ApiException("NOT_FOUND", "AI 첨삭 작업을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        return AiFeedbackJobStatusResponse(
            jobId = job.id,
            status = job.status,
            comment = job.resultComment,
            correction = job.resultCorrection,
            errorMessage = job.errorMessage,
            completedAt = job.completedAt
        )
    }

    fun ocrPost(postId: String, requesterId: String): OcrResult {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "글을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val attachments = attachmentRepository.findByPostId(post.id)
        if (attachments.isEmpty()) {
            throw ApiException("NO_ATTACHMENT", "첨부파일이 없습니다", HttpStatus.BAD_REQUEST)
        }
        val imageTypes = setOf("image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf")
        val imageAttachments = attachments.filter { it.mime in imageTypes }
        if (imageAttachments.isEmpty()) {
            throw ApiException("NO_IMAGE", "이미지 또는 PDF 첨부파일이 없습니다", HttpStatus.BAD_REQUEST)
        }
        val uploadPath = Paths.get(uploadDir)
        val imageDataList = imageAttachments.mapNotNull { att ->
            val filePath = uploadPath.resolve(att.fileId)
            if (Files.exists(filePath)) {
                Pair(Files.readAllBytes(filePath), att.mime)
            } else {
                log.warn("첨부파일 없음: fileId={}", att.fileId)
                null
            }
        }
        if (imageDataList.isEmpty()) {
            throw ApiException("FILE_NOT_FOUND", "서버에 파일이 존재하지 않습니다", HttpStatus.NOT_FOUND)
        }
        return aiWisdomClient.ocrManuscript(imageDataList, requesterId)
    }

    @Transactional
    fun ocrAndSaveContent(postId: String, requesterId: String): OcrResult {
        val result = ocrPost(postId, requesterId)
        if (result.text.isNotBlank()) {
            val post = postRepository.findById(postId).orElseThrow {
                ApiException("NOT_FOUND", "글을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
            }
            post.content = result.text
            postRepository.save(post)
        }
        return result
    }

    @Transactional
    fun batchAiFeedback(postIds: List<String>, reviewerId: String): List<AiBatchResultItem> {
        // 같은 레벨끼리 묶어 처리 (캐시 적중률 최대화)
        val posts = postRepository.findAllById(postIds).associateBy { it.id }
        val sortedIds = postIds
            .mapNotNull { id -> posts[id]?.let { id to it } }
            .sortedBy { it.second.levelId }

        return sortedIds.map { (postId, post) ->
            try {
                if (post.content.isNullOrBlank()) {
                    return@map AiBatchResultItem(postId, "skipped", "글 내용 없음 (OCR 필요)")
                }
                val existingFeedback = feedbackRepository.findByPostId(postId)
                if (existingFeedback != null) {
                    return@map AiBatchResultItem(postId, "skipped", "이미 첨삭 완료")
                }
                val result = aiWisdomClient.generateFeedback(post.content!!, post.levelId, post.topicLabel, reviewerId)
                val feedback = WisdomFeedbackEntity(
                    id = IdGenerator.newId("wfb"),
                    postId = postId,
                    reviewerId = reviewerId,
                    comment = result.comment,
                    correction = result.correction
                )
                feedbackRepository.save(feedback)
                // 학습 계획표 셀 연동: 첨삭 시 cell.status='reviewed'
                post.planCellId?.let { cellId ->
                    studyPlanCellRepository.findById(cellId).ifPresent { cell ->
                        cell.status = "reviewed"
                        cell.reviewedBy = reviewerId
                        cell.reviewedAt = LocalDateTime.now()
                        studyPlanCellRepository.save(cell)
                    }
                }
                AiBatchResultItem(postId, "ok")
            } catch (e: Exception) {
                log.error("일괄 첨삭 실패: postId={}", postId, e)
                AiBatchResultItem(postId, "error", e.message)
            }
        }
    }
}
