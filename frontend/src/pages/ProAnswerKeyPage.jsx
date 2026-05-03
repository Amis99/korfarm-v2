import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import AnswerKeyView from "../components/answer-key/AnswerKeyView";
import "../styles/pro-mode.css";
import "../styles/answer-key.css";

function ProAnswerKeyPage() {
  const { chapterId } = useParams();
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !chapterId) return;
    setLoading(true);
    apiGet(`/v1/pro/chapters/${chapterId}/answer-key`)
      .then((res) => {
        let payload = res.payload;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch {
            // 파싱 실패 시 그대로
          }
        }
        setData({ ...res, payload });
      })
      .catch((err) =>
        setError(err.message || "정답과 해설을 불러올 수 없습니다.")
      )
      .finally(() => setLoading(false));
  }, [isLoggedIn, chapterId]);

  if (loading) {
    return (
      <div className="pro">
        <div className="pro-loading">불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pro">
        <div className="pro-topbar">
          <div className="pro-topbar-inner">
            <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
              <span className="material-symbols-outlined">arrow_back</span>
              학습 목록
            </Link>
            <h1 className="pro-topbar-title">정답과 해설</h1>
          </div>
        </div>
        <div className="pro-body">
          <p className="pro-test-error">{error}</p>
        </div>
      </div>
    );
  }

  const sections =
    data?.payload?.payload?.sections || data?.payload?.sections || [];
  const pdfFileId = data?.pdfFileId || data?.pdf_file_id || null;

  // PDF 단순화 — pdfFileId 가 있으면 iframe 으로 PDF 표시 (기존 비주얼 무시)
  if (pdfFileId) {
    const token = sessionStorage.getItem("korfarm_token");
    const apiBase = import.meta.env.VITE_API_BASE || "";
    const pdfUrl = `${apiBase}/v1/files/${pdfFileId}/download${token ? `?token=${token}` : ""}`;
    return (
      <div className="pro">
        <div className="pro-topbar no-print">
          <div className="pro-topbar-inner">
            <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
              <span className="material-symbols-outlined">arrow_back</span>
              학습 목록
            </Link>
            <h1 className="pro-topbar-title">{data?.title || "정답과 해설"}</h1>
            <a href={pdfUrl} download className="pro-back" style={{ marginLeft: "auto" }}>
              <span className="material-symbols-outlined">download</span>
              다운로드
            </a>
          </div>
        </div>
        <div className="pro-body" style={{ padding: 0 }}>
          <iframe
            src={pdfUrl}
            title={data?.title || "정답과 해설"}
            style={{ width: "100%", height: "calc(100vh - 60px)", border: "none", background: "#525659" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pro">
      <div className="pro-topbar no-print">
        <div className="pro-topbar-inner">
          <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
            <span className="material-symbols-outlined">arrow_back</span>
            학습 목록
          </Link>
          <h1 className="pro-topbar-title">정답과 해설</h1>
          <button className="ak-print-btn" onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span>
            인쇄
          </button>
        </div>
      </div>

      <div className="pro-body">
        {data?.title && <h2 className="ak-page-title">{data.title}</h2>}
        <AnswerKeyView sections={sections} />
      </div>
    </div>
  );
}

export default ProAnswerKeyPage;
