import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGet, apiPut } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

const COMPETENCIES = [
  "어휘력", "문장 독해력", "구조 독해력", "논리 사고력",
  "어법·문법 능력", "국어 개념 적용 능력",
  "국어 관련 배경지식", "비문학 배경지식",
  "문제 분석 및 전략 수립 능력", "선택지 분석 및 전략 수립 능력",
];

function emptyQuestion(num) {
  return {
    number: num,
    type: "객관식",
    domain: "",
    subDomain: "",
    passageRef: "",
    stem: "",
    points: 5,
    correctAnswer: "",
    choices: [
      { id: "1", text: "" },
      { id: "2", text: "" },
      { id: "3", text: "" },
      { id: "4", text: "" },
      { id: "5", text: "" },
    ],
    choiceExplanations: {},
    intent: "",
    competencyVector: {},
  };
}

function emptyPassage(idx) {
  return {
    id: `p${idx}`,
    title: "",
    text: "",
  };
}

export default function AdminTestEditorPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [payload, setPayload] = useState({ passages: [], questions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    if (!testId || testId === "undefined") {
      navigate("/admin/tests");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [t, p] = await Promise.all([
          apiGet(`/v1/admin/test-papers/${testId}`),
          apiGet(`/v1/admin/test-papers/${testId}/payload`),
        ]);
        if (cancelled) return;
        setTest(t);
        const loaded = p?.payload || {};
        const normalized = {
          passages: Array.isArray(loaded.passages) ? loaded.passages : [],
          questions: Array.isArray(loaded.questions) ? loaded.questions : [],
          metadata: loaded.metadata || {},
        };
        setPayload(normalized);
      } catch (e) {
        console.error(e);
        alert("시험지 로드 실패");
        navigate("/admin/tests");
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId, navigate]);

  const update = useCallback((next) => {
    setPayload(typeof next === "function" ? next : next);
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      // JSON 모드면 텍스트 적용 후 저장
      let toSave = payload;
      if (showJson) {
        try {
          toSave = JSON.parse(jsonText);
          setPayload(toSave);
        } catch {
          alert("JSON 파싱 오류");
          setSaving(false);
          return;
        }
      }
      await apiPut(`/v1/admin/test-papers/${testId}/payload`, { payload: toSave });
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      console.error(e);
      alert("저장 실패: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // 지문 조작
  const addPassage = () => {
    const newP = emptyPassage(payload.passages.length + 1);
    update((p) => ({ ...p, passages: [...p.passages, newP] }));
  };
  const removePassage = (i) => {
    if (!window.confirm(`지문 ${i + 1} 삭제?`)) return;
    update((p) => ({ ...p, passages: p.passages.filter((_, idx) => idx !== i) }));
  };
  const updatePassage = (i, patch) => {
    update((p) => ({
      ...p,
      passages: p.passages.map((x, idx) => idx === i ? { ...x, ...patch } : x),
    }));
  };

  // 문항 조작
  const addQuestion = (atIdx) => {
    const num = payload.questions.length + 1;
    const newQ = emptyQuestion(num);
    update((p) => {
      const arr = [...p.questions];
      arr.splice(atIdx, 0, newQ);
      // 번호 재배치
      arr.forEach((q, i) => { q.number = i + 1; });
      return { ...p, questions: arr };
    });
  };
  const removeQuestion = (i) => {
    if (!window.confirm(`문항 ${i + 1} 삭제?`)) return;
    update((p) => {
      const arr = p.questions.filter((_, idx) => idx !== i);
      arr.forEach((q, idx) => { q.number = idx + 1; });
      return { ...p, questions: arr };
    });
  };
  const updateQuestion = (i, patch) => {
    update((p) => ({
      ...p,
      questions: p.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q),
    }));
  };
  const moveQuestion = (from, to) => {
    if (to < 0 || to >= payload.questions.length) return;
    update((p) => {
      const arr = [...p.questions];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      arr.forEach((q, i) => { q.number = i + 1; });
      return { ...p, questions: arr };
    });
  };

  const updateChoice = (qIdx, cIdx, text) => {
    update((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const choices = q.choices.map((c, j) => j === cIdx ? { ...c, text } : c);
        return { ...q, choices };
      }),
    }));
  };
  const updateChoiceExpl = (qIdx, choiceId, text) => {
    update((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIdx) return q;
        return { ...q, choiceExplanations: { ...q.choiceExplanations, [choiceId]: text } };
      }),
    }));
  };
  const updateVector = (qIdx, key, val) => {
    update((p) => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const vec = { ...(q.competencyVector || {}) };
        const v = parseFloat(val);
        if (isNaN(v) || v === 0) delete vec[key];
        else vec[key] = v;
        return { ...q, competencyVector: vec };
      }),
    }));
  };

  const handleToggleJson = () => {
    if (!showJson) {
      setJsonText(JSON.stringify(payload, null, 2));
    } else {
      try {
        const parsed = JSON.parse(jsonText);
        setPayload(parsed);
      } catch {
        if (!window.confirm("JSON 파싱 오류. 변경 무시?")) return;
      }
    }
    setShowJson(!showJson);
  };

  if (loading) return (
    <AdminLayout>
      <div style={{ padding: 24 }}>로딩 중...</div>
    </AdminLayout>
  );
  if (!test) return null;

  return (
    <AdminLayout>
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <Link to="/admin/tests" className="ts-back-link">← 시험 관리</Link>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          margin: "8px 0 12px", flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <h2 style={{ margin: 0 }}>{test.title}</h2>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {test.examDate || "-"} / {test.totalQuestions}문항
              <Link to={`/admin/tests/${testId}/statistics`} style={{ marginLeft: 12 }}>[통계 보기]</Link>
              <Link to={`/admin/tests/${testId}`} style={{ marginLeft: 8 }}>[기본 정보·답안 입력]</Link>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleToggleJson}
              style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", background: "#fff" }}
            >{showJson ? "비주얼" : "JSON"}</button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "6px 16px", border: 0, borderRadius: 6,
                background: "#2563eb", color: "#fff", cursor: saving ? "wait" : "pointer",
              }}
            >{saving ? "저장 중..." : "저장"}</button>
            {saveMsg && <span style={{ color: "#059669", alignSelf: "center" }}>{saveMsg}</span>}
          </div>
        </div>

        {showJson ? (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            style={{
              width: "100%", height: "70vh", fontFamily: "monospace", fontSize: 12,
              padding: 12, border: "1px solid #d1d5db", borderRadius: 6,
            }}
          />
        ) : (
          <>
            {/* 지문 영역 */}
            <section style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>지문 ({payload.passages.length})</h3>
                <button onClick={addPassage} style={{ padding: "4px 12px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>+ 지문 추가</button>
              </div>
              {payload.passages.map((p, i) => (
                <div key={p.id || i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input
                      placeholder="지문 ID (예: p1)"
                      value={p.id || ""}
                      onChange={(e) => updatePassage(i, { id: e.target.value })}
                      style={{ width: 80, padding: 4, fontSize: 12 }}
                    />
                    <input
                      placeholder="제목/출처"
                      value={p.title || ""}
                      onChange={(e) => updatePassage(i, { title: e.target.value })}
                      style={{ flex: 1, padding: 4, fontSize: 12 }}
                    />
                    <button onClick={() => removePassage(i)} style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>삭제</button>
                  </div>
                  <textarea
                    placeholder="지문 본문"
                    value={p.text || ""}
                    onChange={(e) => updatePassage(i, { text: e.target.value })}
                    style={{ width: "100%", minHeight: 100, padding: 8, fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 4 }}
                  />
                </div>
              ))}
            </section>

            {/* 문항 영역 */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>문항 ({payload.questions.length})</h3>
                <button onClick={() => addQuestion(payload.questions.length)} style={{ padding: "4px 12px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer" }}>+ 문항 추가</button>
              </div>
              {payload.questions.map((q, i) => {
                const isCol = collapsed[i];
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      <button onClick={() => setCollapsed((s) => ({ ...s, [i]: !isCol }))} style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #d1d5db", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                        {isCol ? "▶" : "▼"}
                      </button>
                      <strong style={{ minWidth: 50 }}>{q.number}번</strong>
                      <select
                        value={q.type || "객관식"}
                        onChange={(e) => updateQuestion(i, { type: e.target.value })}
                        style={{ fontSize: 12, padding: "2px 4px" }}
                      >
                        <option>객관식</option>
                        <option>서술형</option>
                      </select>
                      <input
                        placeholder="영역"
                        value={q.domain || ""}
                        onChange={(e) => updateQuestion(i, { domain: e.target.value })}
                        style={{ width: 100, padding: 4, fontSize: 12 }}
                      />
                      <input
                        placeholder="세부영역"
                        value={q.subDomain || ""}
                        onChange={(e) => updateQuestion(i, { subDomain: e.target.value })}
                        style={{ width: 100, padding: 4, fontSize: 12 }}
                      />
                      <input
                        type="number"
                        placeholder="배점"
                        value={q.points ?? 0}
                        onChange={(e) => updateQuestion(i, { points: Number(e.target.value) })}
                        style={{ width: 60, padding: 4, fontSize: 12 }}
                      />
                      <input
                        placeholder="지문 ID"
                        value={q.passageRef || ""}
                        onChange={(e) => updateQuestion(i, { passageRef: e.target.value })}
                        style={{ width: 70, padding: 4, fontSize: 12 }}
                        title="연결할 지문 ID (예: p1)"
                      />
                      <span style={{ flex: 1 }} />
                      <button onClick={() => moveQuestion(i, i - 1)} disabled={i === 0} style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #d1d5db", background: "#fff", borderRadius: 4, cursor: "pointer" }}>↑</button>
                      <button onClick={() => moveQuestion(i, i + 1)} disabled={i === payload.questions.length - 1} style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #d1d5db", background: "#fff", borderRadius: 4, cursor: "pointer" }}>↓</button>
                      <button onClick={() => removeQuestion(i)} style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>삭제</button>
                    </div>

                    {!isCol && (
                      <>
                        <textarea
                          placeholder="문항 발문"
                          value={q.stem || ""}
                          onChange={(e) => updateQuestion(i, { stem: e.target.value })}
                          style={{ width: "100%", minHeight: 50, padding: 8, fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 4, marginBottom: 6 }}
                        />

                        {q.type === "객관식" && (
                          <>
                            <div style={{ marginBottom: 6 }}>
                              <strong style={{ fontSize: 12 }}>선택지</strong> &nbsp;
                              <span style={{ fontSize: 11, color: "#6b7280" }}>정답 번호:</span>
                              <input
                                value={q.correctAnswer || ""}
                                onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                                placeholder="예: 3"
                                style={{ width: 50, padding: 2, fontSize: 12, marginLeft: 4 }}
                              />
                            </div>
                            {(q.choices || []).map((c, ci) => (
                              <div key={ci} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                <span style={{ minWidth: 24, fontSize: 12, color: "#6b7280" }}>{c.id || (ci + 1)}.</span>
                                <input
                                  value={c.text || ""}
                                  onChange={(e) => updateChoice(i, ci, e.target.value)}
                                  placeholder={`선택지 ${ci + 1}`}
                                  style={{ flex: 1, padding: 4, fontSize: 12 }}
                                />
                                <input
                                  value={q.choiceExplanations?.[c.id] || ""}
                                  onChange={(e) => updateChoiceExpl(i, c.id, e.target.value)}
                                  placeholder="해설"
                                  style={{ flex: 1, padding: 4, fontSize: 11, color: "#6b7280" }}
                                />
                              </div>
                            ))}
                          </>
                        )}

                        {q.type === "서술형" && (
                          <textarea
                            placeholder="모범 답안"
                            value={q.correctAnswer || ""}
                            onChange={(e) => updateQuestion(i, { correctAnswer: e.target.value })}
                            style={{ width: "100%", minHeight: 50, padding: 8, fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 4, marginBottom: 6 }}
                          />
                        )}

                        <textarea
                          placeholder="출제 의도·해설"
                          value={q.intent || ""}
                          onChange={(e) => updateQuestion(i, { intent: e.target.value })}
                          style={{ width: "100%", minHeight: 40, padding: 8, fontSize: 12, color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 4, marginBottom: 6 }}
                        />

                        {/* 10대 역량 벡터 */}
                        <details>
                          <summary style={{ cursor: "pointer", fontSize: 12, color: "#6b7280" }}>10대 역량 벡터 (정답 시 누적될 가중치)</summary>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 6, marginTop: 6 }}>
                            {COMPETENCIES.map((k) => (
                              <label key={k} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ flex: 1 }}>{k}</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  value={q.competencyVector?.[k] ?? ""}
                                  onChange={(e) => updateVector(i, k, e.target.value)}
                                  style={{ width: 60, padding: 2, fontSize: 11 }}
                                  placeholder="0"
                                />
                              </label>
                            ))}
                          </div>
                        </details>
                      </>
                    )}
                  </div>
                );
              })}

              <button onClick={() => addQuestion(payload.questions.length)} style={{ width: "100%", padding: 12, marginTop: 8, border: "2px dashed #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#6b7280" }}>
                + 마지막에 문항 추가
              </button>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
