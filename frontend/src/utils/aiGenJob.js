import { apiGet } from "./adminApi";

/**
 * AI 출제 잡 폴링.
 * - 504/일시 네트워크 에러는 최대 3회 연속까지 무시하고 다음 사이클에서 재시도
 * - status="completed" 면 결과 반환, "failed" 면 즉시 throw
 *
 * @param {string} jobId
 * @param {number} maxTries 최대 시도 횟수 (기본 150 → 2초 × 150 = 5분)
 * @param {number} intervalMs 폴링 간격 (기본 2000ms)
 * @returns 잡 결과(result) 객체
 */
export async function pollJob(jobId, maxTries = 150, intervalMs = 2000) {
  let consecutiveErrors = 0;
  let lastErr = null;
  for (let i = 0; i < maxTries; i++) {
    try {
      const job = await apiGet(`/v1/admin/ai-gen/jobs/${jobId}`);
      consecutiveErrors = 0;
      if (job?.status === "completed") {
        return job.result ?? {};
      }
      if (job?.status === "failed") {
        throw new Error(job.errorMessage || "AI 호출 실패");
      }
      // queued / running → 대기
    } catch (err) {
      // 잡 실패는 위에서 throw — 여기서는 네트워크/HTTP 에러만 카운트
      const msg = err?.message || "";
      const isTransient = /50[234]|HTTP|네트워크|fetch|Network|JSON이 아닌|시간 초과/i.test(msg);
      if (!isTransient) throw err;
      consecutiveErrors++;
      lastErr = err;
      if (consecutiveErrors >= 5) {
        // 5회 연속 실패 → 진짜 문제로 간주
        throw new Error(`폴링 5회 연속 실패: ${msg}`);
      }
      // transient 에러는 대기 후 재시도
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(lastErr?.message || "AI 응답 시간 초과 (5분)");
}
