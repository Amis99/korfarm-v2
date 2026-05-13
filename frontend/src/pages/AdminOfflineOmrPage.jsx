import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Modal from "../components/Modal";
import { apiGet, apiPost } from "../utils/adminApi";

/**
 * 어드민 오프라인 OMR 일괄 입력 페이지.
 *
 * 흐름:
 *  1) 시험 선택 (검색·종류 필터) — 본사 시험 + 권한 범위 기관 시험
 *  2) 응시 일자 선택 (기본 오늘)
 *  3) 학생 다단 필터: (본사) 기관 → 수강반 → 학생 / (기관) 수강반 → 학생
 *  4) 학생별 OMR 카드 — 객관식 라디오 + 서술형 텍스트
 *  5) "일괄 제출" → /v1/admin/test-papers/{testId}/offline-omr-bulk
 *
 * 권한 정책:
 *  - 본사: 모든 시험·전 기관 전 학생 접근
 *  - 기관: 본사 시험 + 자기 기관 시험만 / 자기 기관 학생만
 */
export default function AdminOfflineOmrPage() {
  const [searchParams] = useSearchParams();
  const initialTestId = searchParams.get("testId") || "";
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("ui");                  // "ui" | "csv"
  const [tests, setTests] = useState([]);
  const [testSearch, setTestSearch] = useState("");
  const [testKind, setTestKind] = useState("all");       // all | diagnostic | chapter | misc
  const [testOrg, setTestOrg] = useState("all");         // all | hq | <orgId>
  const [testId, setTestId] = useState(initialTestId);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterOrg, setFilterOrg] = useState("all");     // 학생 필터 — 기관
  const [filterClass, setFilterClass] = useState("all"); // 학생 필터 — 수강반
  const [selectedIds, setSelectedIds] = useState([]);
  const [attemptedAt, setAttemptedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    apiGet("/v1/auth/me").then(setMe).catch(() => setMe(null));
    apiGet("/v1/admin/test-papers").then((data) => setTests(Array.isArray(data) ? data : [])).catch(() => setTests([]));
  }, []);

  const isHq = (me?.roles || []).includes("HQ_ADMIN");

  // 시험 옵션 — 검색·종류·기관 필터 적용
  const orgsInTests = useMemo(() => {
    const m = new Map();
    tests.forEach((t) => {
      if (t.orgId && t.orgId !== "org_hq" && t.orgName) m.set(t.orgId, t.orgName);
    });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [tests]);

  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    return tests.filter((t) => {
      if (testKind !== "all" && t.kind !== testKind) return false;
      if (testOrg !== "all") {
        if (testOrg === "hq") {
          if (t.orgId && t.orgId !== "org_hq") return false;
        } else {
          if (t.orgId !== testOrg) return false;
        }
      }
      if (q && !(t.title || "").toLowerCase().includes(q) && !(t.testId || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tests, testSearch, testKind, testOrg]);

  // 시험 상세 + 문항 + 학생 목록
  useEffect(() => {
    if (!testId) {
      setTest(null); setQuestions([]); setStudents([]); setSelectedIds([]); setAnswers({});
      setFilterOrg("all"); setFilterClass("all");
      return;
    }
    apiGet(`/v1/admin/test-papers/${encodeURIComponent(testId)}`).then(setTest).catch(() => setTest(null));
    apiGet(`/v1/admin/test-papers/${encodeURIComponent(testId)}/questions`).then((qs) => {
      setQuestions((qs || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0)));
    }).catch(() => setQuestions([]));
    apiGet(`/v1/admin/test-papers/${encodeURIComponent(testId)}/students`).then((data) => setStudents(Array.isArray(data) ? data : [])).catch(() => setStudents([]));
  }, [testId]);

  // 학생 필터링 — 기관·수강반
  const orgsInStudents = useMemo(() => {
    const m = new Map();
    students.forEach((s) => { if (s.orgId && s.orgName) m.set(s.orgId, s.orgName); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [students]);

  const classesInStudents = useMemo(() => {
    const m = new Map();
    students.forEach((s) => {
      if (filterOrg !== "all" && s.orgId !== filterOrg) return;
      (s.classIds || []).forEach((cid, i) => {
        const cname = (s.classNames || [])[i] || cid;
        m.set(cid, cname);
      });
    });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [students, filterOrg]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterOrg !== "all" && s.orgId !== filterOrg) return false;
      if (filterClass !== "all" && !(s.classIds || []).includes(filterClass)) return false;
      return true;
    });
  }, [students, filterOrg, filterClass]);

  const setAnswer = (uid, qNum, value) => {
    setAnswers((prev) => ({ ...prev, [uid]: { ...(prev[uid] || {}), [qNum]: value } }));
  };

  const toggleStudent = (uid) => {
    setSelectedIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const submit = async () => {
    if (!testId || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const entries = selectedIds.map((uid) => ({ userId: uid, answers: answers[uid] || {} }));
      const result = await apiPost(`/v1/admin/test-papers/${encodeURIComponent(testId)}/offline-omr-bulk`, { entries, attemptedAt });
      setResultModal(result);
    } catch (e) {
      setResultModal({ error: e?.message || "제출 실패" });
    } finally { setSubmitting(false); }
  };

  const handleCsvUpload = async (file) => {
    if (!file || !testId || questions.length === 0) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((r) => r.split(",").map((c) => c.trim())).filter((r) => r.length > 1 && r[0]);
    if (rows.length < 2) { alert("CSV 행이 부족합니다 (헤더 + 학생 1행 이상)."); return; }
    const entries = rows.slice(1).map((r) => {
      const userId = r[0];
      const ans = {};
      for (let i = 1; i < r.length && i <= questions.length; i++) ans[String(i)] = r[i];
      return { userId, answers: ans };
    }).filter((e) => e.userId);
    if (entries.length === 0) { alert("유효한 행이 없습니다."); return; }
    setSubmitting(true);
    try {
      const result = await apiPost(`/v1/admin/test-papers/${encodeURIComponent(testId)}/offline-omr-bulk`, { entries, attemptedAt });
      setResultModal(result);
    } catch (e) {
      setResultModal({ error: e?.message || "제출 실패" });
    } finally { setSubmitting(false); }
  };

  const downloadCsvTemplate = () => {
    if (questions.length === 0) return;
    const headerCols = ["userId", ...questions.map((q) => `${q.number}번`)];
    const sampleRow = ["user_xxxxxxxxxxxx", ...questions.map((q) => q.type === "서술형" ? "(서술형 답)" : "A")];
    const csv = [headerCols.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${testId}-OMR-template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const isDiag = testId.startsWith("diag_paper_");
  const kindLabel = { diagnostic: "진단", chapter: "챕터", misc: "기타" };

  return (
    <AdminLayout>
      <div style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>오프라인 OMR 일괄 입력</h1>
          <Link to="/admin/tests" style={{ fontSize: 13, color: "#666" }}>← 테스트 관리</Link>
        </div>

        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          시험을 종이 OMR 로 응시한 후 관리자가 답안을 일괄 입력합니다.
          제출 시 학생이 직접 응시한 것과 동일하게 채점·역량 누적·성적표 반영이 됩니다.
          {isDiag ? " (진단 시험은 통합 분석표에 즉시 반영됩니다.)" : ""}
        </p>

        {/* ── 시험 선택 ── */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>1. 시험 선택</strong>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <input
              type="search" placeholder="시험 제목·ID 검색"
              value={testSearch} onChange={(e) => setTestSearch(e.target.value)}
              style={{ ...inpStyle, flex: 2, minWidth: 240 }}
            />
            <select value={testKind} onChange={(e) => setTestKind(e.target.value)} style={{ ...inpStyle, width: 140 }}>
              <option value="all">전체 종류</option>
              <option value="diagnostic">진단</option>
              <option value="chapter">챕터</option>
              <option value="misc">기타</option>
            </select>
            <select value={testOrg} onChange={(e) => setTestOrg(e.target.value)} style={{ ...inpStyle, width: 160 }}>
              <option value="all">전체 기관</option>
              <option value="hq">본사 시험</option>
              {orgsInTests.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 4 }}>
            {filteredTests.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: "#999", fontSize: 13 }}>일치하는 시험이 없습니다.</div>
            ) : filteredTests.map((t) => (
              <label
                key={t.testId}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                  background: testId === t.testId ? "#ecfdf5" : "transparent",
                }}
              >
                <input type="radio" name="testPick" checked={testId === t.testId} onChange={() => setTestId(t.testId)} />
                <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 3, background: "#e0e7ff", color: "#3730a3", fontSize: 11 }}>
                  {kindLabel[t.kind] || t.kind}
                </span>
                <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 3, background: (t.orgId && t.orgId !== "org_hq") ? "#fef3c7" : "#dcfce7", color: (t.orgId && t.orgId !== "org_hq") ? "#92400e" : "#166534", fontSize: 11 }}>
                  {t.orgId && t.orgId !== "org_hq" ? (t.orgName || "기관") : "본사"}
                </span>
                <span style={{ fontSize: 13 }}>{t.title}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>{t.testId}</span>
              </label>
            ))}
          </div>
        </div>

        {testId && (
          <>
            {/* ── 응시 일자 ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
              <div>
                <label style={lbl}>응시 일자</label>
                <input type="date" value={attemptedAt} onChange={(e) => setAttemptedAt(e.target.value)} style={{ ...inpStyle, width: 180 }} />
              </div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                <strong>{test?.title || ""}</strong> · 문항 {questions.length}개 · 학생 후보 {students.length}명
              </div>
            </div>

            {/* 탭 */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
              <button onClick={() => setTab("ui")} style={{ ...tabBtn, ...(tab === "ui" ? tabActive : {}) }}>
                UI 입력 ({selectedIds.length}/{filteredStudents.length})
              </button>
              <button onClick={() => setTab("csv")} style={{ ...tabBtn, ...(tab === "csv" ? tabActive : {}) }}>CSV 업로드</button>
            </div>

            {tab === "ui" && (
              <div>
                {/* 학생 필터 + 선택 */}
                <div style={{ padding: 12, background: "#f9fafb", borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    {isHq && (
                      <div>
                        <label style={lbl}>기관</label>
                        <select value={filterOrg} onChange={(e) => { setFilterOrg(e.target.value); setFilterClass("all"); }} style={{ ...inpStyle, width: 180 }}>
                          <option value="all">전 기관</option>
                          {orgsInStudents.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={lbl}>수강반</label>
                      <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ ...inpStyle, width: 200 }}>
                        <option value="all">전 수강반</option>
                        {classesInStudents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "flex-end" }}>
                      <button onClick={() => setSelectedIds(filteredStudents.map((s) => s.userId))} style={btnSmall}>전체 선택</button>
                      <button onClick={() => setSelectedIds([])} style={btnSmall}>선택 해제</button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {filteredStudents.length === 0 ? (
                      <div style={{ gridColumn: "1/-1", padding: 12, textAlign: "center", color: "#999", fontSize: 13 }}>
                        일치하는 학생이 없습니다.
                      </div>
                    ) : filteredStudents.map((s) => (
                      <label key={s.userId} style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, background: "#fff", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
                        <input type="checkbox" checked={selectedIds.includes(s.userId)} onChange={() => toggleStudent(s.userId)} />
                        <span>{s.name || s.userId}</span>
                        {s.orgName && <small style={{ color: "#666" }}>({s.orgName}{s.classNames?.length ? `·${s.classNames.join(",")}` : ""})</small>}
                      </label>
                    ))}
                  </div>
                </div>

                {/* OMR 카드 */}
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
                                        <input type="radio" name={`${uid}-${q.number}`} checked={answers[uid]?.[q.number] === ch} onChange={() => setAnswer(uid, q.number, ch)} />
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
                  <button onClick={submit} disabled={submitting || selectedIds.length === 0} style={btnPrimary}>
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
                  <input type="file" accept=".csv,text/csv" onChange={(e) => handleCsvUpload(e.target.files?.[0])} disabled={submitting} style={{ fontSize: 14 }} />
                  <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>UTF-8 + BOM 권장 (엑셀 한글 호환)</p>
                </div>
              </div>
            )}
          </>
        )}

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
                      <span style={{ color: r.ok ? "#2d6a4f" : "#c0392b" }}>{r.ok ? "✓" : "✘"} {r.userId}</span>
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
const inpStyle = { padding: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 6, background: "#fff" };
const tabBtn = { padding: "8px 16px", background: "transparent", border: "none", fontSize: 13, cursor: "pointer", color: "#666" };
const tabActive = { color: "#2d6a4f", borderBottom: "2px solid #2d6a4f", fontWeight: 600 };
const btnPrimary = { padding: "10px 24px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 };
const btnSmall = { padding: "4px 12px", background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 12 };
