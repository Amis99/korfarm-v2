import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import EngineShell from "../engine/core/EngineShell";
import {
  adaptDiagnosticQuestions,
  buildEngineContent,
  tierToTargetLevel,
} from "../utils/testToEngineAdapter";
import "../styles/diagnostic-v2.css";

function DiagnosticTestPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    const firstBatch = location.state?.firstBatch;
    if (firstBatch && firstBatch.length > 0) {
      const engineQuestions = adaptDiagnosticQuestions(firstBatch);
      const targetLevel = tierToTargetLevel(firstBatch[0]?.tier);
      setContent(
        buildEngineContent({
          title: `역량 진단 (${firstBatch.length}문항)`,
          questions: engineQuestions,
          timeLimitSec: 60 * 60,
          contentType: "DIAGNOSTIC",
          targetLevel,
        }),
      );
    } else {
      // 새로고침 등 → 세션 복원 불가
      apiGet(`/v1/diagnostic/sessions/${sessionId}`)
        .then((sess) => {
          if (sess.status !== "active") {
            navigate(`/diagnostic/v2/report/${sessionId}`);
          } else {
            navigate("/diagnostic/v2");
          }
        })
        .catch(() => navigate("/diagnostic/v2"));
    }
  }, [sessionId, navigate, location.state]);

  const handleFinish = async ({ records }) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      const responses = records
        .filter((r) => r.id && r.selectedId)
        .map((r) => ({ questionId: r.id, choice: r.selectedId }));
      await apiPost(`/v1/diagnostic/sessions/${sessionId}/respond`, {
        responses,
      });
      await apiPost(`/v1/diagnostic/sessions/${sessionId}/complete`);
      navigate(`/diagnostic/v2/report/${sessionId}`);
    } catch (err) {
      submittedRef.current = false;
      setError(err.message || "제출에 실패했습니다.");
    }
  };

  if (error) {
    return (
      <div className="diag-v2-loading">
        <p style={{ color: "#c53030" }}>{error}</p>
        <button onClick={() => navigate("/diagnostic/v2")}>돌아가기</button>
      </div>
    );
  }

  if (!content) {
    return <div className="diag-v2-loading">불러오는 중...</div>;
  }

  return (
    <EngineShell
      content={content}
      moduleKey="exam"
      onExit={() => navigate("/diagnostic/v2")}
      onFinish={handleFinish}
    />
  );
}

export default DiagnosticTestPage;
