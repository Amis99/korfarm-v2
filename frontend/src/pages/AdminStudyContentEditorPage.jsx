import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";
import { camelize } from "../utils/api";
import {
  STUDY_CONTENT_TEMPLATE,
  STUDY_QUESTIONS_TEMPLATE,
  AI_CHECKLIST_PROMPT,
  AI_QUESTION_PROMPT,
  downloadJsonFile,
  downloadTextFile,
} from "../constants/studyContentSchemas";
import "../styles/admin-detail.css";

const TABS = [
  { id: "markdown", label: "본문 (마크다운)" },
  { id: "checklist", label: "체크리스트" },
  { id: "questions", label: "문제" },
];

function AdminStudyContentEditorPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("markdown");
  const [showPreview, setShowPreview] = useState(false);

  // 편집 가능한 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [levelId, setLevelId] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [evalPoints, setEvalPoints] = useState([]);
  const [errorPatterns, setErrorPatterns] = useState([]);
  const [questions, setQuestions] = useState([]);

  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await apiGet(`/v1/admin/study/contents/${contentId}`);
      // adminApi는 응답을 변환하지 않으므로 명시적 camelize
      const data = camelize(raw);
      setContent(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setLevelId(data.levelId || "");
      setMarkdown(data.markdown || "");
      setEvalPoints(data.evalPoints || []);
      setErrorPatterns(data.errorPatterns || []);
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  // ── 본문/체크리스트 저장 ──
  const handleSaveMeta = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        title,
        description,
        levelId,
        markdown,
        evalPoints,
        errorPatterns,
      };
      await apiPut(`/v1/admin/study/contents/${contentId}`, body);
      alert("저장 완료");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── 문제 저장 (전체 교체) ──
  const handleSaveQuestions = async () => {
    if (questions.length < 5) {
      alert("문제는 최소 5개 이상이어야 합니다.");
      return;
    }
    if (questions.length > 2000) {
      alert("문제는 최대 2000개까지 가능합니다.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiPost(`/v1/admin/study/contents/${contentId}/questions:bulk`, { questions });
      alert("문제 저장 완료");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── 문제 JSON 업로드 ──
  const handleQuestionsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const list = Array.isArray(json) ? json : json.questions;
      if (!Array.isArray(list)) {
        alert("올바른 형식이 아닙니다. { questions: [...] } 또는 [...]");
        return;
      }
      setQuestions(list);
      alert(`${list.length}개 문제가 로드되었습니다. '저장' 버튼으로 DB에 반영하세요.`);
    } catch (err) {
      alert("JSON 파싱 실패: " + err.message);
    }
  };

  // ── 문제 1개 추가/삭제/수정 ──
  const handleAddQuestion = () => {
    const next = questions.length + 1;
    setQuestions([
      ...questions,
      {
        questionNo: next,
        questionType: "MULTI_CHOICE",
        stem: "",
        choices: [
          { id: "A", text: "", isCorrect: true },
          { id: "B", text: "", isCorrect: false },
          { id: "C", text: "", isCorrect: false },
          { id: "D", text: "", isCorrect: false },
          { id: "E", text: "", isCorrect: false },
        ],
        evalPointIdx: [],
        difficulty: 3,
      },
    ]);
  };

  const handleDeleteQuestion = (idx) => {
    if (!window.confirm("이 문제를 삭제하시겠습니까?")) return;
    const next = questions.filter((_, i) => i !== idx);
    next.forEach((q, i) => { q.questionNo = i + 1; });
    setQuestions(next);
  };

  const updateQuestion = (idx, updater) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = updater(next[idx]);
      return next;
    });
  };

  // ── 체크리스트 항목 추가/삭제 ──
  const addEvalPoint = () => setEvalPoints([...evalPoints, ""]);
  const removeEvalPoint = (i) => setEvalPoints(evalPoints.filter((_, j) => j !== i));
  const updateEvalPoint = (i, v) => {
    const next = [...evalPoints];
    next[i] = v;
    setEvalPoints(next);
  };
  const addErrorPattern = () => setErrorPatterns([...errorPatterns, ""]);
  const removeErrorPattern = (i) => setErrorPatterns(errorPatterns.filter((_, j) => j !== i));
  const updateErrorPattern = (i, v) => {
    const next = [...errorPatterns];
    next[i] = v;
    setErrorPatterns(next);
  };

  if (loading) return <AdminLayout><p>불러오는 중...</p></AdminLayout>;
  if (!content) return <AdminLayout><p>콘텐츠를 찾을 수 없습니다.</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <button type="button" className="admin-detail-btn secondary" onClick={() => navigate("/admin/study-content")}>
            ← 목록
          </button>
          <h1 style={{ marginLeft: 12 }}>{title || "(제목 없음)"}</h1>
          <span style={{ marginLeft: 12, color: "#888", fontSize: 13 }}>
            ID: {contentId} · 문제 {content.questionCount}개 · {content.visibility}
          </span>
        </div>

        {error && <div style={{ color: "#a00", marginBottom: 16 }}>{error}</div>}

        {/* 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "2px solid #ddd" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: activeTab === t.id ? "#fff" : "transparent",
                borderBottom: activeTab === t.id ? "3px solid #b06e30" : "3px solid transparent",
                fontWeight: activeTab === t.id ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 본문 탭 ── */}
        {activeTab === "markdown" && (
          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>제목</div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>설명</div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>레벨</div>
                <select value={levelId} onChange={(e) => setLevelId(e.target.value)} style={{ padding: 8 }}>
                  <option value="">선택 안함</option>
                  <option value="SAUSSURE_1">소쉬르1</option>
                  <option value="SAUSSURE_2">소쉬르2</option>
                  <option value="SAUSSURE_3">소쉬르3</option>
                  <option value="FREGE_1">프레게1</option>
                  <option value="FREGE_2">프레게2</option>
                  <option value="FREGE_3">프레게3</option>
                  <option value="RUSSELL_1">러셀1</option>
                  <option value="RUSSELL_2">러셀2</option>
                  <option value="RUSSELL_3">러셀3</option>
                  <option value="WITTGENSTEIN_1">비트겐슈타인1</option>
                  <option value="WITTGENSTEIN_2">비트겐슈타인2</option>
                  <option value="WITTGENSTEIN_3">비트겐슈타인3</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" className="admin-detail-btn secondary" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? "편집 모드" : "미리보기"}
              </button>
            </div>

            {showPreview ? (
              <div className="sc-markdown-body" style={{ padding: 16, minHeight: 400, background: "#fdfbf6", borderRadius: 8 }}>
                <Markdown>{markdown}</Markdown>
              </div>
            ) : (
              <textarea
                rows={20}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                style={{ width: "100%", padding: 12, fontFamily: "monospace", fontSize: 13 }}
              />
            )}

            <div style={{ marginTop: 12 }}>
              <button type="button" className="admin-detail-btn" onClick={handleSaveMeta} disabled={saving}>
                {saving ? "저장 중..." : "본문 + 메타 저장"}
              </button>
            </div>
          </div>
        )}

        {/* ── 체크리스트 탭 ── */}
        {activeTab === "checklist" && (
          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 16, padding: 12, background: "var(--admin-panel-light, #f5f9f3)", borderLeft: "4px solid #2d6a4f" }}>
              <strong>AI 체크리스트 생성 프롬프트</strong>
              <p style={{ fontSize: 13, color: "#3a4a3e", margin: "6px 0 10px" }}>
                아래 버튼으로 시스템 프롬프트를 다운로드 받은 후, 외부 ChatGPT/Claude에 본문과 함께 입력하면
                evalPoints/errorPatterns JSON을 받을 수 있습니다.
              </p>
              <button
                type="button"
                className="admin-detail-btn secondary"
                onClick={() => downloadTextFile(AI_CHECKLIST_PROMPT, "checklist_prompt.txt")}
              >
                📋 시스템 프롬프트 다운로드
              </button>
            </div>

            <h3>평가 포인트 (evalPoints) — 이 학습이 평가하는 항목들</h3>
            <p style={{ fontSize: 13, color: "#888" }}>각 문제는 이 인덱스를 참조합니다. 추가 후에는 인덱스가 어긋나지 않도록 주의하세요.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {evalPoints.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ minWidth: 28, color: "#888" }}>[{i}]</span>
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => updateEvalPoint(i, e.target.value)}
                    style={{ flex: 1, padding: 6 }}
                  />
                  <button type="button" onClick={() => removeEvalPoint(i)}>×</button>
                </div>
              ))}
              <button type="button" className="admin-detail-btn secondary" onClick={addEvalPoint}>＋ 평가 포인트 추가</button>
            </div>

            <h3>오답 패턴 (errorPatterns) — 학생들이 흔히 범하는 오류 유형</h3>
            <p style={{ fontSize: 13, color: "#888" }}>각 오답 선택지가 이 인덱스를 참조합니다.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {errorPatterns.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ minWidth: 28, color: "#888" }}>[{i}]</span>
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => updateErrorPattern(i, e.target.value)}
                    style={{ flex: 1, padding: 6 }}
                  />
                  <button type="button" onClick={() => removeErrorPattern(i)}>×</button>
                </div>
              ))}
              <button type="button" className="admin-detail-btn secondary" onClick={addErrorPattern}>＋ 오답 패턴 추가</button>
            </div>

            <button type="button" className="admin-detail-btn" onClick={handleSaveMeta} disabled={saving}>
              {saving ? "저장 중..." : "체크리스트 저장"}
            </button>
          </div>
        )}

        {/* ── 문제 탭 ── */}
        {activeTab === "questions" && (
          <div className="admin-card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 16, padding: 12, background: "var(--admin-panel-light, #f5f9f3)", borderLeft: "4px solid #2d6a4f" }}>
              <strong>AI 문제 생성 프롬프트</strong>
              <p style={{ fontSize: 13, color: "#3a4a3e", margin: "6px 0 10px" }}>
                시스템 프롬프트와 표준 스키마를 다운로드 받아 외부 AI에 사용하세요.
                생성된 JSON은 아래 '업로드' 버튼으로 가져올 수 있습니다.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-detail-btn secondary"
                  onClick={() => downloadTextFile(AI_QUESTION_PROMPT, "question_prompt.txt")}
                >
                  📋 시스템 프롬프트
                </button>
                <button
                  type="button"
                  className="admin-detail-btn secondary"
                  onClick={() => downloadJsonFile(STUDY_QUESTIONS_TEMPLATE, "study_questions_schema.json")}
                >
                  📄 스키마(예시) 다운로드
                </button>
                <button
                  type="button"
                  className="admin-detail-btn secondary"
                  onClick={() => downloadJsonFile(STUDY_CONTENT_TEMPLATE, "study_content_template.json")}
                >
                  📄 콘텐츠 템플릿 다운로드
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleQuestionsUpload}
                />
                <button
                  type="button"
                  className="admin-detail-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📤 문제 JSON 업로드
                </button>
                <button
                  type="button"
                  className="admin-detail-btn secondary"
                  onClick={() => downloadJsonFile({ questions }, `${title || "questions"}.json`)}
                >
                  📥 현재 문제 다운로드
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <strong>총 {questions.length}개 문제</strong>
              <span style={{ fontSize: 13, color: questions.length < 5 ? "#a00" : "#888" }}>
                (최소 5개 / 최대 2000개)
              </span>
              <button type="button" className="admin-detail-btn secondary" onClick={handleAddQuestion}>＋ 문제 추가</button>
              <button type="button" className="admin-detail-btn" onClick={handleSaveQuestions} disabled={saving}>
                {saving ? "저장 중..." : "문제 일괄 저장"}
              </button>
            </div>

            <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
              {questions.map((q, idx) => (
                <QuestionEditor
                  key={idx}
                  q={q}
                  idx={idx}
                  evalPointsCount={evalPoints.length}
                  errorPatternsCount={errorPatterns.length}
                  onUpdate={(updater) => updateQuestion(idx, updater)}
                  onDelete={() => handleDeleteQuestion(idx)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── 문제 1개 에디터 ───
function QuestionEditor({ q, idx, evalPointsCount, errorPatternsCount, onUpdate, onDelete }) {
  const update = (patch) => onUpdate((prev) => ({ ...prev, ...patch }));
  const updateChoice = (cIdx, patch) => {
    onUpdate((prev) => {
      const choices = [...(prev.choices || [])];
      choices[cIdx] = { ...choices[cIdx], ...patch };
      return { ...prev, choices };
    });
  };
  const setCorrect = (cIdx) => {
    onUpdate((prev) => {
      const choices = (prev.choices || []).map((c, i) => ({ ...c, isCorrect: i === cIdx }));
      return { ...prev, choices };
    });
  };
  const addChoice = () => {
    onUpdate((prev) => {
      const choices = [...(prev.choices || [])];
      const nextId = String.fromCharCode(65 + choices.length);
      choices.push({ id: nextId, text: "", isCorrect: false });
      return { ...prev, choices };
    });
  };
  const removeChoice = (cIdx) => {
    onUpdate((prev) => {
      const choices = (prev.choices || []).filter((_, i) => i !== cIdx);
      return { ...prev, choices };
    });
  };

  return (
    <div style={{
      border: "1px solid #ddd", borderRadius: 6, padding: 14, marginBottom: 12,
      background: "#fdfbf6"
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <strong>문제 {q.questionNo || idx + 1}</strong>
        <select
          value={q.questionType}
          onChange={(e) => update({ questionType: e.target.value })}
          style={{ padding: 4 }}
        >
          <option value="MULTI_CHOICE">객관식</option>
          <option value="OX">OX</option>
          <option value="ESSAY">서술형</option>
        </select>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 13 }}>
          난이도:
          <input
            type="number"
            min={1}
            max={5}
            value={q.difficulty || 3}
            onChange={(e) => update({ difficulty: Number(e.target.value) || 3 })}
            style={{ width: 50, marginLeft: 4 }}
          />
        </label>
        <button type="button" onClick={onDelete} style={{ color: "#a00" }}>삭제</button>
      </div>
      <textarea
        value={q.stem}
        onChange={(e) => update({ stem: e.target.value })}
        placeholder="문제 본문"
        rows={2}
        style={{ width: "100%", padding: 6, marginBottom: 8 }}
      />

      {(q.questionType === "MULTI_CHOICE" || q.questionType === "OX") && (
        <div>
          {(q.choices || []).map((c, ci) => (
            <div key={ci} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
              <input
                type="radio"
                checked={c.isCorrect}
                onChange={() => setCorrect(ci)}
                title="정답"
              />
              <span style={{ minWidth: 20 }}>{c.id}</span>
              <input
                type="text"
                value={c.text}
                onChange={(e) => updateChoice(ci, { text: e.target.value })}
                style={{ flex: 1, padding: 4 }}
              />
              {!c.isCorrect && (
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, errorPatternsCount - 1)}
                  value={c.errorPatternIdx ?? ""}
                  onChange={(e) => updateChoice(ci, {
                    errorPatternIdx: e.target.value === "" ? null : Number(e.target.value),
                  })}
                  placeholder="오답 패턴 인덱스"
                  style={{ width: 70, padding: 4 }}
                  title="errorPatterns 인덱스 (선택)"
                />
              )}
              {q.questionType === "MULTI_CHOICE" && (
                <button type="button" onClick={() => removeChoice(ci)}>×</button>
              )}
            </div>
          ))}
          {q.questionType === "MULTI_CHOICE" && (
            <button type="button" className="admin-detail-btn secondary" onClick={addChoice}>＋ 선택지 추가</button>
          )}
        </div>
      )}

      {q.questionType === "ESSAY" && (
        <div>
          <textarea
            value={q.modelAnswer || ""}
            onChange={(e) => update({ modelAnswer: e.target.value })}
            placeholder="모범답안"
            rows={3}
            style={{ width: "100%", padding: 6, marginBottom: 6 }}
          />
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
            채워야 할 핵심 문구 (학생이 답안에 모두 포함해야 정답)
          </div>
          {(q.fillBlanks || []).map((b, bi) => (
            <div key={bi} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input
                type="text"
                value={b.phrase}
                onChange={(e) => {
                  onUpdate((prev) => {
                    const fb = [...(prev.fillBlanks || [])];
                    fb[bi] = { ...fb[bi], phrase: e.target.value };
                    return { ...prev, fillBlanks: fb };
                  });
                }}
                style={{ flex: 1, padding: 4 }}
              />
              <button type="button" onClick={() => {
                onUpdate((prev) => ({
                  ...prev,
                  fillBlanks: (prev.fillBlanks || []).filter((_, i) => i !== bi),
                }));
              }}>×</button>
            </div>
          ))}
          <button type="button" className="admin-detail-btn secondary" onClick={() => {
            onUpdate((prev) => ({
              ...prev,
              fillBlanks: [...(prev.fillBlanks || []), { phrase: "" }],
            }));
          }}>＋ 핵심 문구 추가</button>
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        평가 포인트 인덱스 (콤마 구분, 최대 {Math.max(0, evalPointsCount - 1)}):{" "}
        <input
          type="text"
          value={(q.evalPointIdx || []).join(",")}
          onChange={(e) => {
            const list = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map(Number)
              .filter((n) => Number.isInteger(n) && n >= 0);
            update({ evalPointIdx: list });
          }}
          style={{ width: 200, padding: 4 }}
        />
      </div>
    </div>
  );
}

export default AdminStudyContentEditorPage;
