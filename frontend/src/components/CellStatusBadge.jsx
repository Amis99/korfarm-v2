const LABELS_BY_TYPE = {
  korfarm: {
    unassigned: "배정 전",
    pending: "미수행",
    in_progress: "진행중",
    completed: "완료",
  },
  activity: {
    unassigned: "배부 전",
    pending: "미수행",
    submitted: "제출",
    partial: "일부 완료",
    completed: "완료",
  },
  test: {
    pending: "응시 전",
    scored: "채점됨",
    retry: "재시험",
    passed: "통과",
  },
  writing: {
    unassigned: "배정 전",
    pending: "글쓰기 시작",
    submitted: "작성 완료(첨삭 대기)",
    reviewed: "첨삭 완료",
  },
};

const FALLBACK_LABELS = {
  unassigned: "미배정",
  pending: "미수행",
  in_progress: "진행중",
  submitted: "제출",
  partial: "일부 완료",
  completed: "완료",
  scored: "채점됨",
  passed: "통과",
  retry: "재시험",
  reviewed: "첨삭 완료",
};

export default function CellStatusBadge({ status, score, assetType, assetKind }) {
  const typeLabels = LABELS_BY_TYPE[assetType] || {};
  const label = typeLabels[status] || FALLBACK_LABELS[status] || status;
  const isTest = assetType === "test" || assetKind === "test";

  // 테스트: 점수가 있으면 점수 중심으로 표시
  if (isTest && score != null && status !== "pending") {
    return (
      <span className={`cell-badge ${status} test-kind`}>
        <span>{score}점</span>
        {(status === "retry" || status === "passed") && (
          <span className="cell-verdict">{status === "passed" ? "통과" : "재시험"}</span>
        )}
      </span>
    );
  }

  const cls = `cell-badge ${status}${isTest ? " test-kind" : ""}`;
  return (
    <span className={cls}>
      {label}
      {score != null && ` ${score}점`}
    </span>
  );
}
