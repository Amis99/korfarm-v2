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

export default function CellStatusBadge({ status, score }) {
  const label = LABELS[status] || status;
  return (
    <span className={`cell-badge ${status}`}>
      {label}
      {score != null && ` ${score}점`}
    </span>
  );
}
