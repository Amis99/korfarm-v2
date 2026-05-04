import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import { apiGetCamel } from "../utils/adminApi";
import { normalizeModuleKey } from "../constants/contentTypes";
import PrintLayout from "../engine/core/PrintLayout";
import PassageMarkdown from "../components/PassageMarkdown";
import "../styles/learning-engine.css";

// 문제 유형 라벨 — study question 의 questionType 은 대문자
const STUDY_TYPE_LABEL = {
  MULTI_CHOICE: "객관식",
  OX: "OX",
  SHORT_ANSWER: "단답형",
  ESSAY: "서술형",
};

// 원문자 번호 (1~20). 그 이상은 그냥 숫자.
const CIRCLED_NUMS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
const circledNo = (n) => CIRCLED_NUMS[n] || `(${n + 1})`;

// Fisher-Yates shuffle (인쇄할 때마다 다른 순서)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 한 문제 한 세트 — 문제 stem + 선지/답란이 페이지 분할되지 않게 묶음
function StudyQuestionItem({ q }) {
  const type = (q.questionType || q.type || "").toUpperCase();
  const label = STUDY_TYPE_LABEL[type] || type || "문제";
  const stem = q.stem || q.prompt || q.question || q.title || "";
  const choices = Array.isArray(q.choices) ? q.choices : [];
  const condition = q.conditionContent || q.condition || "";

  // 객관식 선지를 매 인쇄마다 셔플 (정답 위치 랜덤화)
  const shuffledChoices =
    type === "MULTI_CHOICE" ? shuffleArray(choices) : choices;

  const itemStyle = {
    breakInside: "avoid",
    pageBreakInside: "avoid",
    marginBottom: 12,
    fontSize: 13,
  };
  const labelStyle = {
    display: "inline-block",
    padding: "1px 6px",
    background: "#eef2e8",
    color: "#2f7a3e",
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
    marginRight: 6,
    verticalAlign: "middle",
  };

  // OX 는 stem 바로 뒤에 같은 줄로 작은 박스 표시
  const isOX = type === "OX";

  return (
    <li style={itemStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, lineHeight: 1.6 }}>
        <span style={labelStyle}>{label}</span>
        <div style={{ flex: 1 }}>
          {/* stem + (OX 인 경우) 작은 O/X 박스 inline */}
          <PassageMarkdown className="study-stem-md">{stem}</PassageMarkdown>
          {isOX && (
            <span style={{ display: "inline-flex", gap: 6, marginLeft: 8, verticalAlign: "middle" }}>
              <span style={{
                display: "inline-block",
                width: 18, height: 18,
                border: "1.5px solid #333", borderRadius: 4,
                textAlign: "center", lineHeight: "15px",
                fontSize: 12, fontWeight: 700,
              }}>O</span>
              <span style={{
                display: "inline-block",
                width: 18, height: 18,
                border: "1.5px solid #333", borderRadius: 4,
                textAlign: "center", lineHeight: "15px",
                fontSize: 12, fontWeight: 700,
              }}>X</span>
            </span>
          )}
        </div>
      </div>

      {/* 객관식 — 셔플된 선지 + 원문자 번호 */}
      {type === "MULTI_CHOICE" && shuffledChoices.length > 0 && (
        <ul style={{ paddingLeft: 28, marginTop: 4, listStyle: "none" }}>
          {shuffledChoices.map((c, ci) => (
            <li key={c.id || ci} style={{ marginBottom: 2, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.5 }}>{circledNo(ci)}</span>
              <div style={{ flex: 1 }}>
                <PassageMarkdown>{c.text || c.label || (typeof c === "string" ? c : "")}</PassageMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 서술형 — <조건> 박스 + 답란 */}
      {type === "ESSAY" && (
        <>
          {condition && (
            <div style={{
              marginTop: 8, marginLeft: 28,
              padding: "8px 12px",
              border: "1.5px solid #555",
              borderRadius: 4,
              background: "#fafafa",
              fontSize: 12,
              lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#555", marginBottom: 4 }}>&lt;조건&gt;</div>
              <PassageMarkdown>{condition}</PassageMarkdown>
            </div>
          )}
          {q.modelAnswerMasked ? (
            <div style={{
              marginTop: 6, marginLeft: 28,
              padding: 8,
              border: "1px dashed #999",
              background: "#fff",
              fontSize: 13,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}>
              {q.modelAnswerMasked}
            </div>
          ) : (
            <div style={{ marginTop: 6, marginLeft: 28 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ borderBottom: "1px solid #999", height: 22 }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 단답형 — 한 줄 답란 */}
      {type === "SHORT_ANSWER" && (
        <div style={{
          borderBottom: "1px solid #555",
          height: 24,
          marginTop: 6,
          marginLeft: 28,
        }} />
      )}
    </li>
  );
}

// 내용 숙지 콘텐츠 인쇄 — 페이지별 본문 + 4유형 문제
function StudyContentPrint({ detail, pages }) {
  return (
    <div className="print-only print-layout">
      <header style={{ borderBottom: "2px solid #333", paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#666" }}>
          학교 [ &nbsp; ] &nbsp;&nbsp; 학년/반 [ &nbsp; ] &nbsp;&nbsp; 이름 [ &nbsp; ] &nbsp;&nbsp; 시작 [ : ]
        </div>
        <h1 style={{ fontSize: 22, margin: "8px 0 4px" }}>{detail?.title || "내용 숙지"}</h1>
        <div style={{ fontSize: 12, color: "#555" }}>
          {detail?.levelId || ""}
          {detail?.area && ` · ${detail.area}`}
          {detail?.subArea && ` · ${detail.subArea}`}
        </div>
      </header>
      {(pages || []).map((page, pi) => (
        <section key={page.id || pi} style={{ marginBottom: 18 }}>
          <h2 style={{
            fontSize: 16,
            borderLeft: "4px solid #2f7a3e",
            paddingLeft: 8,
            margin: "16px 0 8px",
            breakInside: "avoid",
            pageBreakAfter: "avoid",
          }}>
            페이지 {pi + 1}{page.title ? ` — ${page.title}` : ""}
          </h2>
          {page.markdown && (
            <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
              <PassageMarkdown>{page.markdown}</PassageMarkdown>
            </div>
          )}
          {Array.isArray(page.questions) && page.questions.length > 0 && (
            <ol style={{ paddingLeft: 22, listStyleType: "decimal" }}>
              {page.questions.map((q, qi) => (
                <StudyQuestionItem key={q.id || qi} q={q} qi={qi} />
              ))}
            </ol>
          )}
        </section>
      ))}
      {(!pages || pages.length === 0) && (
        <p style={{ color: "#666" }}>등록된 페이지가 없습니다. (콘텐츠 메타만 표시)</p>
      )}
    </div>
  );
}

/**
 * 어드민 PDF 인쇄 페이지
 * 라우트: /admin/print-content?ids=ID1,ID2,...
 *
 * 학습 계획표에서 배정된 농장 콘텐츠를 PDF 로 인쇄하기 위한 단독 페이지.
 * 각 contentId 의 학습 데이터를 fetch 한 후 PrintLayout 으로 시험지 형태 렌더,
 * 모두 로드되면 자동으로 window.print() 호출.
 *
 * 단일: ?ids=content_xxx
 * 일괄: ?ids=a,b,c (각 콘텐츠가 새 페이지로 분할)
 */
export default function AdminPrintContentPage() {
  const [params] = useSearchParams();
  const idsParam = params.get("ids") || params.get("id") || "";
  const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
  const [items, setItems] = useState([]); // [{ contentId, content, moduleKey, error }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    let alive = true;
    Promise.all(
      ids.map(async (id) => {
        try {
          // study_ 로 시작하면 내용 숙지 콘텐츠 — 별도 endpoint
          if (id.startsWith("study_")) {
            const detail = await apiGetCamel(`/v1/admin/study/contents/${encodeURIComponent(id)}`);
            const pages = await apiGetCamel(`/v1/admin/study/contents/${encodeURIComponent(id)}/pages`).catch(() => []);
            return { contentId: id, kind: "study", detail, pages: Array.isArray(pages) ? pages : [] };
          }
          // 일반 콘텐츠
          const data = await apiGet(`/v1/learning/content/${encodeURIComponent(id)}`);
          const moduleKeyRaw = data?.module_key || data?.moduleKey;
          const moduleKey = normalizeModuleKey(moduleKeyRaw) ||
            normalizeModuleKey(Array.isArray(data?.content_type) ? data.content_type[0] : data?.contentType);
          const content = {
            title: data?.title || "",
            targetLevel: data?.level_id || data?.levelId || "",
            payload: data?.content?.payload || data?.content || {},
          };
          return { contentId: id, kind: "general", content, moduleKey: moduleKey || "worksheet_quiz" };
        } catch (e) {
          return { contentId: id, error: e.message };
        }
      })
    ).then(arr => {
      if (alive) {
        setItems(arr);
        setLoading(false);
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  // 모두 로드된 후 인쇄 다이얼로그 자동 호출
  useEffect(() => {
    if (loading || items.length === 0) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [loading, items.length]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>학습 데이터를 불러오는 중…</div>;
  if (ids.length === 0) return <div style={{ padding: 40 }}>인쇄할 콘텐츠 ID 가 지정되지 않았습니다.</div>;

  return (
    <div className="admin-print-host">
      {/* 화면에서도 PrintLayout 이 보이게 — 학생 페이지에선 print-only 지만 어드민 인쇄용 페이지에선 항상 표시 */}
      <style>{`
        .admin-print-host .print-only { display: block !important; }
        @media print { .admin-print-host .no-print { display: none !important; } }
        /* 각 학습 콘텐츠가 새 페이지에서 시작 — 첫 콘텐츠 제외, 두 번째부터 page-break */
        .admin-print-host .print-item + .print-item { page-break-before: always; break-before: page; }
        /* 문제 stem 을 inline 으로 (OX 박스가 같은 줄에 붙도록) */
        .admin-print-host .study-stem-md, .admin-print-host .study-stem-md > p { display: inline; margin: 0; }
      `}</style>
      <div className="no-print" style={{ position: "sticky", top: 0, background: "#fff", padding: "8px 16px", borderBottom: "1px solid #eee", display: "flex", gap: 12, alignItems: "center" }}>
        <strong>PDF 인쇄 — {items.length}건</strong>
        <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          🖨 인쇄 / PDF 저장
        </button>
        <button onClick={() => window.close()} style={{ padding: "6px 14px", background: "none", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}>
          닫기
        </button>
      </div>
      {items.map((it, i) => (
        <div key={`${it.contentId}-${i}`} className="print-item">
          {it.error ? (
            <div style={{ padding: 24, color: "#c00" }}>
              <strong>{it.contentId}</strong> — 불러오기 실패: {it.error}
            </div>
          ) : it.kind === "study" ? (
            <StudyContentPrint detail={it.detail} pages={it.pages} />
          ) : (
            <PrintLayout moduleKey={it.moduleKey} content={it.content} />
          )}
        </div>
      ))}
    </div>
  );
}
