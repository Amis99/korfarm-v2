import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/pro-mode.css";
import "../styles/answer-key.css";

// 정답 인라인 표시 (객관식/OX/단답형)
function CompactAnswers({ items }) {
  const hasQuestions = items.some((it) => it.question);

  return (
    <div className="ak-compact">
      {items.map((item, i) => (
        <span key={i} className="ak-compact-item">
          {item.num && <span className="ak-compact-num">{item.num}.</span>}
          {hasQuestions && item.question && (
            <span className="ak-compact-q">
              {item.question}
              {" → "}
            </span>
          )}
          <span className="ak-compact-ans">{item.answer}</span>
        </span>
      ))}
    </div>
  );
}

// 해설 접기/펼치기 블록
function Explanations({ items }) {
  const withExpl = items.filter((it) => it.explanation);
  if (withExpl.length === 0) return null;

  return (
    <details className="ak-details">
      <summary className="ak-details-summary">해설</summary>
      <div className="ak-details-body">
        {withExpl.map((item, i) => (
          <div key={i} className="ak-expl-row">
            {item.num && <span className="ak-expl-num">{item.num}.</span>}
            <span className="ak-expl-text">{item.explanation}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

// 빈칸 채우기 (문자열 정답)
function FillAnswer({ items }) {
  return (
    <div className="ak-fill">
      {items.map((item, i) => (
        <p key={i} className="ak-fill-text">
          {item.answer}
        </p>
      ))}
    </div>
  );
}

// 서술형/글쓰기 (모범답안)
function EssayAnswers({ items }) {
  return (
    <div className="ak-essays">
      {items.map((item, i) => (
        <div key={i} className="ak-essay-item">
          {item.num && <span className="ak-essay-num">{item.num}.</span>}
          {item.question && <p className="ak-essay-q">{item.question}</p>}
          <div className="ak-essay-ans">{item.answer}</div>
        </div>
      ))}
    </div>
  );
}

// 그룹 렌더러
function AnswerGroup({ group }) {
  const { title, type, items } = group;

  return (
    <div className="ak-group">
      {title && <h4 className="ak-group-title">{title}</h4>}

      {type === "choice" || type === "ox" || type === "short" || type === "nested" ? (
        <>
          <CompactAnswers items={items} />
          <Explanations items={items} />
        </>
      ) : type === "fill" ? (
        <FillAnswer items={items} />
      ) : type === "essay" ? (
        <EssayAnswers items={items} />
      ) : (
        <>
          <CompactAnswers items={items} />
          <Explanations items={items} />
        </>
      )}
    </div>
  );
}

// 기존 데이터 호환 (label + items 구조)
function LegacyItems({ items }) {
  return (
    <div className="ak-group">
      <div className="ak-compact">
        {items.map((item, i) => (
          <span key={i} className="ak-compact-item">
            <span className="ak-compact-num">{item.number || item.num}.</span>
            <span className="ak-compact-ans">
              {item.answer || item.modelAnswer || ""}
            </span>
          </span>
        ))}
      </div>
      {items.some((it) => it.explanation) && (
        <details className="ak-details">
          <summary className="ak-details-summary">해설</summary>
          <div className="ak-details-body">
            {items
              .filter((it) => it.explanation)
              .map((item, i) => (
                <div key={i} className="ak-expl-row">
                  <span className="ak-expl-num">
                    {item.number || item.num}.
                  </span>
                  <span className="ak-expl-text">{item.explanation}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

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

      <div className="pro-body ak-body">
        {data?.title && <h2 className="ak-page-title">{data.title}</h2>}

        {sections.length === 0 && (
          <div className="pro-center">
            <p>정답과 해설 데이터가 아직 등록되지 않았습니다.</p>
          </div>
        )}

        {sections.map((section, si) => (
          <section key={si} className="ak-section">
            <h3 className="ak-section-title">
              {section.title || section.label}
            </h3>

            {section.groups
              ? section.groups.map((group, gi) => (
                  <AnswerGroup key={gi} group={group} />
                ))
              : section.items
                ? <LegacyItems items={section.items} />
                : null}
          </section>
        ))}
      </div>
    </div>
  );
}

export default ProAnswerKeyPage;
