import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import { getLearningById } from "../data/learning/learningCatalog";
import "../styles/start.css";

const TYPE_ICON = {
  farm: "agriculture",
  pro: "military_tech",
  writing: "edit_note",
};
const TYPE_LABEL = {
  farm: "농장 학습",
  pro: "프로 학습",
  writing: "글쓰기",
};

function getStatusInfo(assignment, progress) {
  const now = new Date();
  const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const completed = progress?.completed;

  if (completed) return { label: "완료", color: "#4caf50", key: "completed" };
  if (assignment.status === "closed") return { label: "마감됨", color: "#999", key: "closed" };
  if (due && due < now) return { label: "기한 초과", color: "#999", key: "overdue" };
  if (due) {
    const diff = due - now;
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) return { label: "마감 임박", color: "#f44336", key: "urgent" };
  }
  return { label: "진행중", color: "#ff9800", key: "active" };
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/assignments")
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setAssignments(list);
        const pMap = {};
        await Promise.all(
          list.map(async (a) => {
            const id = a.assignmentId || a.assignment_id;
            if (!id) return;
            try {
              const prog = await apiGet(`/v1/assignments/${id}/progress`);
              pMap[id] = prog;
            } catch {}
          })
        );
        setProgressMap(pMap);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (assignment) => {
    const id = assignment.assignmentId || assignment.assignment_id;
    const type = assignment.assignmentType || assignment.assignment_type;
    const progress = progressMap[id];

    if (progress?.completed) return;

    if (type === "writing") {
      navigate(`/writing?assignmentId=${id}`);
      return;
    }

    // farm/pro: payload에서 contentIds 가져와서 첫 번째 콘텐츠로 이동
    if (assignment.payload?.contentIds?.length > 0) {
      const firstContentId = assignment.payload.contentIds[0];
      const learning = getLearningById(firstContentId);
      if (learning) {
        navigate(`/learn/${learning.id}?assignmentId=${id}`);
        return;
      }
    }

    // detail API 호출로 payload 가져오기
    apiGet(`/v1/assignments/${id}`)
      .then((detail) => {
        const contentIds = detail?.payload?.contentIds;
        if (contentIds?.length > 0) {
          const learning = getLearningById(contentIds[0]);
          if (learning) {
            navigate(`/learn/${learning.id}?assignmentId=${id}`);
            return;
          }
        }
        // fallback: 농장 모드로 이동
        navigate(type === "pro" ? "/pro-mode" : "/farm-mode");
      })
      .catch(() => {
        navigate(type === "pro" ? "/pro-mode" : "/farm-mode");
      });
  };

  return (
    <div className="start-page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Link
            to="/start"
            style={{ color: "var(--earth-brown)", display: "flex", alignItems: "center" }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 6 }}>
              shopping_basket
            </span>
            과제 바구니
          </h1>
        </div>

        {loading && (
          <p style={{ textAlign: "center", color: "#8a7468", padding: 40 }}>
            과제를 불러오는 중...
          </p>
        )}

        {!loading && assignments.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a7468" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, opacity: 0.4, display: "block", marginBottom: 12 }}
            >
              task_alt
            </span>
            <p>배정된 과제가 없습니다.</p>
          </div>
        )}

        {assignments.map((a) => {
          const id = a.assignmentId || a.assignment_id;
          const type = a.assignmentType || a.assignment_type;
          const progress = progressMap[id];
          const statusInfo = getStatusInfo(a, progress);
          const isCompleted = statusInfo.key === "completed";

          return (
            <div
              key={id}
              className="start-card"
              style={{
                cursor: isCompleted ? "default" : "pointer",
                opacity: isCompleted ? 0.6 : 1,
                marginBottom: 12,
                position: "relative",
              }}
              onClick={() => handleClick(a)}
            >
              {isCompleted && (
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    fontSize: 28,
                    color: "#4caf50",
                  }}
                >
                  check_circle
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="badge"
                  style={{
                    background: statusInfo.color,
                    fontSize: 11,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {TYPE_ICON[type] || "task"}
                  </span>
                  {TYPE_LABEL[type] || type}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: statusInfo.color,
                    fontWeight: 700,
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{a.title}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {a.dueAt ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#8a7468" }}>
                    마감: {fmtDate(a.dueAt)}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "#8a7468" }}>마감일 없음</p>
                )}
                {!isCompleted && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--meadow-dark)",
                      fontWeight: 700,
                    }}
                  >
                    시작하기 &rarr;
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AssignmentsPage;
