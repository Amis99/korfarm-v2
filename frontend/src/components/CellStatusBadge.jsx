const LABELS = {
  pending: "미수행",
  submitted: "제출",
  approved: "승인",
  rejected: "거부",
  grading: "채점중",
  passed: "통과",
  retry: "재시",
  failed: "미통과",
};

export default function CellStatusBadge({ status, score, assetKind }) {
  const label = LABELS[status] || status;
  const cls = `cell-badge ${status}${assetKind === "test" ? " test-kind" : ""}`;
  return (
    <span className={cls}>
      {label}
      {score != null && ` ${score}점`}
    </span>
  );
}
