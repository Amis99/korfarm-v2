/**
 * 학습 계획표 셀 상태 뱃지 — 5단계 표준 라벨.
 *
 *  배정 전  : 자산만 추가됐을 뿐 아직 콘텐츠/주제/테스트 미배정
 *  미수행   : 배정 완료, 학생이 아직 시작 안 함
 *  미완료   : 마감 기한 지났는데 점검 완료가 아님 (회색)
 *  수행완료 : 학생이 끝냈으나 어드민 확인 전 (제출/응시/제출물 작성)
 *  점검완료 : 어드민 확인까지 끝난 상태 (초록 강조)
 *
 *  세부 내역(점수/코멘트/제출물·첨삭 결과 등)은 모달에서 표시.
 */

const STAGE = {
  unassigned: { label: "배정 전", cls: "stage-unassigned" },
  pending:    { label: "미수행",   cls: "stage-pending" },
  overdue:    { label: "미완료",   cls: "stage-overdue" },
  done:       { label: "수행완료", cls: "stage-done" },
  reviewed:   { label: "점검완료", cls: "stage-reviewed" },
};

/** status + isOverdue → 5단계 stage 분류 */
function classifyStage(status, isOverdue) {
  if (status === "unassigned") return STAGE.unassigned;
  // 점검 완료 (어드민 확인까지 끝남) — 만료여도 점검 완료가 우선
  if (status === "completed" || status === "passed" || status === "reviewed") {
    return STAGE.reviewed;
  }
  // 만료 + 미완료
  if (isOverdue) return STAGE.overdue;
  // 수행 완료 (학생이 끝냈으나 어드민 확인 전)
  if (
    status === "submitted" ||
    status === "scored" ||
    status === "in_progress" ||
    status === "retry" ||
    status === "partial"
  ) {
    return STAGE.done;
  }
  // 그 외 = 미수행
  return STAGE.pending;
}

export default function CellStatusBadge({ status, isOverdue }) {
  const stage = classifyStage(status, isOverdue);
  return <span className={`cell-stage ${stage.cls}`}>{stage.label}</span>;
}
