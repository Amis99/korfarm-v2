import { apiGet } from "./adminApi";

/**
 * AI 출제 잡 폴링.
 * @param {string} jobId
 * @param {number} maxTries 최대 시도 횟수 (기본 150 → 2초 × 150 = 5분)
 * @param {number} intervalMs 폴링 간격 (기본 2000ms)
 * @returns 잡 결과(result) 객체
 */
export async function pollJob(jobId, maxTries = 150, intervalMs = 2000) {
  for (let i = 0; i < maxTries; i++) {
    const job = await apiGet(`/v1/admin/ai-gen/jobs/${jobId}`);
    if (job?.status === "completed") {
      return job.result ?? {};
    }
    if (job?.status === "failed") {
      throw new Error(job.errorMessage || "AI 호출 실패");
    }
    // queued / running → 대기
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("AI 응답 시간 초과 (5분)");
}
