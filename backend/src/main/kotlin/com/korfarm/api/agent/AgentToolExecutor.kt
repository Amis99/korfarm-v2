package com.korfarm.api.agent

/**
 * AI 비서 함수 실행기.
 *
 * AgentToolRegistry 가 정의한 함수의 실제 구현은 이 인터페이스를 통해 위임됩니다.
 * A4 단계에서 OperatorAgentToolExecutorImpl 이 8개 함수를 모두 구현합니다.
 *
 * @param functionName  AgentToolRegistry 의 name (snake_case)
 * @param input         tool_use.input — Anthropic 모델이 채워준 인자
 * @param callerUserId  호출자 사용자 ID
 * @param callerRole    호출자 권한 (HQ_ADMIN / ORG_ADMIN)
 * @param callerOrgId   호출자 기관 ID (ORG_ADMIN 한정)
 * @return 결과 객체 — Jackson 으로 JSON 직렬화되어 모델에게 tool_result 로 전달
 */
data class AgentToolResult(
    val success: Boolean,
    val data: Any? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
)

interface AgentToolExecutor {
    fun execute(
        functionName: String,
        input: Map<String, Any?>,
        callerUserId: String,
        callerRole: String,
        callerOrgId: String?,
    ): AgentToolResult
}
