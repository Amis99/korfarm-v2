import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Modal from "../components/Modal";
import { apiGet, apiPost } from "../utils/adminApi";

/**
 * 어드민 오프라인 OMR 일괄 입력 페이지.
 *
 * 흐름:
 *  1) 시험 선택 (URL ?testId 로 들어오거나 드롭다운)
 *  2) 응시 일자 선택 (기본 오늘)
 *  3) 학생 선택 (다중)
 *  4) 학생별 OMR 카드 입력 — 객관식 라디오 + 서술형 텍스트
 *  5) "일괄 제출" → /v1/admin/test-papers/{testId}/offline-omr-bulk
 *
 * CSV 업로드 탭:
 *  - 템플릿 다운로드 (학생 학번/이름 + 1번~N번 + 서술형)
 *  - CSV 파일 업로드 → 프론트에서 파싱 → 같은 bulk 엔드포인트 호출
 *
 * 권한: 본사 = 전 기관, 기관 = 자기 기관 학생만 (백엔드 검증)
 */
export default function AdminOfflineOmrPage() {
  const [searchParams] = useSearchParams();
  const initialTestId = searchParams.get("testId") || "";
  const [tab, setTab] = useState("ui");          // "ui" | "csv"
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState(initialTestId);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [attemptedAt, setAttemptedAt] = useState(() => new Date().toISOString().slice(0, 10));
  // answers[userId][qNumber] = "A"|"B"|... 또는 서술형 텍스트
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  // 시험 목록 로드
  useEffect(() => {
    apiGet("/v1/admin/test-papers").then(setTests).catch(() => setTests([]));
  }, []);

  // 시험 상세 + 문항 + 학생 목록 로드
  useEffect(() => {
    if (!testId) {
      setTest(null);
      setQuestions([]);
      setStudents([]);
      setSelectedIds([]);
      setAnswers({});
      return;
    }
    apiGet(`/v1/admin/test-papers/${testId}`).then((paper) => {
      setTest(paper);
      setQuestions((paper?.payload?.questions || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0)));
    }).catch(() => { setTest(null); setQuestions([]); });
    apiGet(`/v1/admin/test-papers/${testId}/students`).then(setStudents).catch(() => setStudents([]));
  }, [testId]);

  const setAnswer = (userId, qNumber, value) => {
    setAnswers((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [qNumber]: value },
    }));
  };

  const toggleStudent = (userId) => {
    setSelectedIds((prev) => prev.includes(userId)
      ? prev.filter((id) => id !== userId)
      : [...prev, userId]);
  };

  const submit = async () => {
    if (!testId || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const entries = selectedIds.map((uid) => ({
        userId: uid,
        answers: answers[uid] || {},
      }));
      const result = await apiPost(`/v1/admin/test-papers/${testId}/offline-omr-bulk`, {
        entries,
        attemptedAt,
      });
      setResultModal(result);
    } catch (e) {
      setResultModal({ error: e?.message || "제출 실패" });
    } finally {
      setSubmitting(false);
    }
  };

  // CSV 처리
  const handleCsvUpload = async (file) => {
    if (!file || !testId || questions.length === 0) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((r) => r.split(",").map((c) => c.trim())).filter((r) => r.length > 1 && r[0]);
    if (rows.length < 2) {
      alert("CSV 행이 부족합니다 (헤더 + 학생 1행 이상).");
      return;
    }
    const header = rows[0];
    // 첫 컬럼 = userId, 이후 컬럼은 1번~N번 (헤더 행은 무시)
    const entries = rows.slice(1).map((r) => {
      const userId = r[0];
      const ans = {};
      for (let i = 1; i < r.length && i <= questions.length; i++) {
        ans[String(i)] = r[i];
      }
      return { userId, answers: ans };
    }).filter((e) => e.userId);
    if (entries.length === 0) {
      alert("유효한 행이 없습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiPost(`/v1/admin/test-papers/${testId}/offline-omr-bulk`, {
        entries, attemptedAt,
      });
      setResultModal(result);
    } catch (e) {
      setResultModal({ error: e?.message || "제출 실패" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCsvTemplate = () => {
    if (questions.length === 0) return;
    const headerCols = ["userId", ...questions.map((q) => `${q.number}번`)];
    const sampleRow = ["user_xxxxxxxxxxxx", ...questions.map((q) => q.type === "서술형" ? "(서술형 답)" : "A")];
    const csv = [headerCols.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });    // ﻿ = BOM(엑셀 한글 호환)
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testId}-OMR-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDiag = testId.startsWith("diag_paper_");

  return (
    <AdminLayout>
      <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>오프라인 OMR 일괄 입력</h1>
          <Link to="/admin/tests" style={{ fontSize: 13, color: "#666" }}>← 테스트 관리</Link>
        </div>

        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          시험을 종이 OMR 로 응시한 후 관리자가 답안을 일괄 입력합니다.
          제출 시 학생이 직접 응시한 것과 동일하게 채점·역량 누적·성적표 반영이 됩니다.
          {isDiag ? " (진단 시험은 통합 분석표에 즉시 반영됩니다.)" : ""}
        </p>

        {/* 시험 선택 + 응시 일자 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 320 }}>
            <label style={lbl}>시험 선택</label>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              style={selStyle}
            >
              <option value="">시험 선택…</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.id})
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={lbl}>응시 일자</label>
            <input
              type="date"
              value={attemptedAt}
              onChange={(e) => setAttemptedAt(e.target.value)}
              style={inpStyle}
            />
          </div>
        </div>

        {testId && (
          <>
            <div style={{ marginBottom: 12, fontSize: 14 }}>
              <strong>{test?.title || ""}</strong>
              {" · 문항 "}{questions.length}{"개 · 학생 후보 "}{students.length}{"명"}
            </div>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
              <button
                onClick={() => setTab("ui")}
                style={{ ...tabBtn, ...(tab === "ui" ? tabActive : {}) }}
              >UI 입력 ({selectedIds.length}/{students.length})</button>
              <button
                onClick={() => setTab("csv")}
                style={{ ...tabBtn, ...(tab === "csv" ? tabActive : {}) }}
              >CSV 업로드</button>
            </div>

            {tab === "ui" && (
              <div>
                {/* 학생 선택 */}
                <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 13 }}>입력 대상 학생 선택</strong>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setSelectedIds(students.map((s) => s.userId))} style={btnSmall}>전체 선택</button>
                      <button onClick={() => setSelectedIds([])} style={btnSmall}>선택 해제</button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {students.map((s) => (
                      <label key={s.userId} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, background: "#fff", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
                        <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleStudent(s.userId)} />
                        <span>{s.name || s.userId} {s.orgName ? <small style={{ color: "#666" }}>({s.orgName})</small> : null}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 선택된 학생별 OMR 카드 */}
                {selectedIds.length > 0 && questions.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    {selectedIds.map((uid) => {
                      const stu = students.find((s) => s.userId === uid);
                      return (
                        <div key={uid} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                          <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>{stu?.name || uid}</h3>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                            {questions.map((q) => (
                              <div key={q.number} style={{ padding: 6, background: "#f9fafb", borderRadius: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{q.number}번 {q.type === "서술형" ? "(서술형)" : ""}</div>
                                {q.type === "서술형" ? (
                                  <textarea
                                    value={answers[uid]?.[q.number] || ""}
                                    onChange={(e) => setAnswer(uid, q.number, e.target.value)}
                                    style={{ width: "100%", minHeight: 40, fontSize: 12, padding: 4, border: "1px solid #ccc", borderRadius: 4 }}
                                    placeholder="서술형 답"
                                  />
                                ) : (
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {["A", "B", "C", "D", "E"].map((ch) => (
                                      <label key={ch} style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13 }}>
                                        <input
                                          type="radio"
                                          name={`${uid}-${q.number}`}
                                          checked={answers[uid]?.[q.number] === ch}
                                          onChange={() => setAnswer(uid, q.number, ch)}
                                        />
                                        {ch}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    onClick={submit}
                    disabled={submitting || selectedIds.length === 0}
                    style={btnPrimary}
                  >
                    {submitting ? "제출 중…" : `${selectedIds.length}명 일괄 제출`}
                  </button>
                </div>
              </div>
            )}

            {tab === "csv" && (
              <div>
                <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                    템플릿을 다운로드해 첫 컬럼에 학생 userId, 그 다음 컬럼에 1번~{questions.length}번 답을 채우세요.
                    객관식은 A/B/C/D/E, 서술형은 답 문장을 그대로 적습니다.
                  </p>
                  <button onClick={downloadCsvTemplate} style={btnSmall}>📥 템플릿 다운로드</button>
                </div>
                <div style={{ padding: 16, border: "2px dashed #ccc", borderRadius: 8, textAlign: "center" }}>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => handleCsvUpload(e.target.files?.[0])}
                    disabled={submitting}
                    style={{ fontSize: 14 }}
                  />
                  <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>UTF-8 인코딩 + BOM 권장 (엑셀에서 한글 깨짐 방지)</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 결과 모달 */}
        {resultModal && (
          <Modal open onClose={() => setResultModal(null)} title="제출 결과" size="md">
            {resultModal.error ? (
              <p style={{ color: "#c0392b" }}>오류: {resultModal.error}</p>
            ) : (
              <div>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  총 <strong>{resultModal.total}</strong>명 중
                  <strong style={{ color: "#2d6a4f" }}> {resultModal.succeeded}</strong>명 성공
                  {resultModal.failed > 0 && <span style={{ color: "#c0392b" }}>, {resultModal.failed}명 실패</span>}
                </p>
                <div style={{ maxHeight: 300, overflow: "auto" }}>
                  {(resultModal.results || []).map((r, i) => (
                    <div key={i} style={{ padding: 6, fontSize: 12, borderBottom: "1px solid #eee" }}>
                      <span style={{ color: r.ok ? "#2d6a4f" : "#c0392b" }}>
                        {r.ok ? "✓" : "✘"} {r.userId}
                      </span>
                      {r.ok ? (
                        <span style={{ marginLeft: 8 }}>
                          {r.score != null && <>점수 {r.score} · 정답 {r.correctCount} · 회차 {r.attemptNo}</>}
                          {r.sessionId && <>진단 세션 {r.sessionId}</>}
                        </span>
                      ) : (
                        <span style={{ marginLeft: 8, color: "#666" }}>{r.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setResultModal(null)} style={btnPrimary}>확인</button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}

const lbl = { display: "block", fontSize: 12, color: "#666", marginBottom: 4 };
const inpStyle = { width: "100%", padding: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 6, background: "#fff" };
const selStyle = { ...inpStyle };
const tabBtn = { padding: "8px 16px", background: "transparent", border: "none", fontSize: 13, cursor: "pointer", color: "#666" };
const tabActive = { color: "#2d6a4f", borderBottom: "2px solid #2d6a4f", fontWeight: 600 };
const btnPrimary = { padding: "10px 24px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 };
const btnSmall = { padding: "4px 12px", background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 12 };
