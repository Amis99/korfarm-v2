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
  unassigned:        { label: "배정 전",      cls: "stage-unassigned" },
  pending:           { label: "미수행",        cls: "stage-pending" },
  overdue:           { label: "미완료",        cls: "stage-overdue" },
  done:              { label: "수행완료",      cls: "stage-done" },
  reviewed:          { label: "점검완료",      cls: "stage-reviewed" },
  // 2026-05-21 — activity 자산 전용 단계 (학생 자기보고 + 관리자 확인)
  student_submitted: { label: "학생 수행 완료", cls: "stage-student-submitted" },
  student_partial:   { label: "학생 일부 완료", cls: "stage-student-partial" },
  admin_completed:   { label: "확인 완료",      cls: "stage-admin-completed" },
  admin_reviewed:    { label: "일부 확인",      cls: "stage-admin-reviewed" },
  disabled:          { label: "비활성",        cls: "stage-disabled" },
};

/** status + isOverdue (+ assetType) → stage 분류 */
function classifyStage(status, isOverdue, assetType) {
  if (status === "disabled") return STAGE.disabled;
  if (status === "unassigned") return STAGE.unassigned;
  // activity 자산: 4단계 분리 (학생 수행/일부 + 관리자 확인/일부확인)
  if (assetType === "activity") {
    if (status === "completed") return STAGE.admin_completed;
    if (status === "reviewed") return STAGE.admin_reviewed;
    if (status === "submitted") return STAGE.student_submitted;
    if (status === "partial") return STAGE.student_partial;
    if (isOverdue) return STAGE.overdue;
    return STAGE.pending;
  }
  // 기타 자산 (korfarm/test/writing) — 기존 5단계
  if (status === "completed" || status === "passed" || status === "reviewed") {
    return STAGE.reviewed;
  }
  if (isOverdue) return STAGE.overdue;
  if (
    status === "submitted" ||
    status === "scored" ||
    status === "in_progress" ||
    status === "retry" ||
    status === "partial"
  ) {
    return STAGE.done;
  }
  return STAGE.pending;
}

export default function CellStatusBadge({ status, isOverdue, assetType }) {
  const stage = classifyStage(status, isOverdue, assetType);
  return <span className={`cell-stage ${stage.cls}`}>{stage.label}</span>;
}
