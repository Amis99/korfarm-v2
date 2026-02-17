import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

const TABS = [
  { key: "info", label: "기본 정보", icon: "info" },
  { key: "pdf", label: "시험지 PDF", icon: "picture_as_pdf" },
  { key: "questions", label: "문항 관리", icon: "quiz" },
  { key: "answer", label: "답안 입력", icon: "edit_note" },
  { key: "submissions", label: "응시 현황", icon: "leaderboard" },
];

const EMPTY_Q = { number: 1, type: "객관식", domain: "", subDomain: "", passage: "", points: 0, correctAnswer: "", choiceExplanations: {}, intent: "" };

function AdminTestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Info tab
  const [infoForm, setInfoForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Questions tab
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);

  // Answer tab
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [omrAnswers, setOmrAnswers] = useState({});
  const [omrSaving, setOmrSaving] = useState(false);
  const [omrMsg, setOmrMsg] = useState("");

  // Submissions tab
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  const loadTest = useCallback(() => {
    apiGet(`/v1/admin/test-papers/${testId}/questions`)
      .then(qs => setQuestions(Array.isArray(qs) ? qs : []))
      .catch((e) => console.error(e));
  }, [testId]);

  useEffect(() => {
    apiGet(`/v1/admin/test-papers/${testId}`)
      .then(t => {
        setTest(t);
        setInfoForm({
          title: t.title || "",
          description: t.description || "",
          levelId: t.levelId || "",
          totalQuestions: t.totalQuestions || 0,
          totalPoints: t.totalPoints || 0,
          timeLimitMinutes: t.timeLimitMinutes || "",
          examDate: t.examDate || "",
          series: t.series || "",
        });
      })
      .catch(() => navigate("/admin/tests"))
      .finally(() => setLoading(false));
  }, [testId, navigate]);

  useEffect(() => {
    if (tab === "questions") {
      setQLoading(true);
      apiGet(`/v1/admin/test-papers/${testId}/questions`)
        .then(qs => setQuestions(Array.isArray(qs) ? qs : []))
        .catch(() => setQuestions([]))
        .finally(() => setQLoading(false));
    } else if (tab === "answer") {
      apiGet(`/v1/admin/test-papers/${testId}/students`)
        .then(setStudents)
        .catch(() => setStudents([]));
      apiGet(`/v1/admin/test-papers/${testId}/questions`)
        .then(qs => setQuestions(Array.isArray(qs) ? qs : []))
        .catch((e) => console.error(e));
    } else if (tab === "submissions") {
      setSubLoading(true);
      apiGet(`/v1/admin/test-papers/${testId}/submissions`)
        .then(setSubmissions)
        .catch(() => setSubmissions([]))
        .finally(() => setSubLoading(false));
    }
  }, [tab, testId]);

  // ── Info handlers ──
  const handleInfoSave = async () => {
    setSaving(true);
    try {
      await apiPut(`/v1/admin/test-papers/${testId}`, {
        title: infoForm.title,
        description: infoForm.description || null,
        levelId: infoForm.levelId || null,
        totalQuestions: Number(infoForm.totalQuestions) || 0,
        totalPoints: Number(infoForm.totalPoints) || 0,
        timeLimitMinutes: infoForm.timeLimitMinutes ? Number(infoForm.timeLimitMinutes) : null,
        examDate: infoForm.examDate || null,
        series: infoForm.series || null,
      });
      alert("저장되었습니다.");
    } catch { alert("저장 실패"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까? 모든 문항과 답안이 삭제됩니다.")) return;
    try {
      await apiDelete(`/v1/admin/test-papers/${testId}`);
      navigate("/admin/tests");
    } catch { alert("삭제 실패"); }
  };

  // ── PDF handlers ──
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now, use presign flow
    try {
      const presign = await apiPost("/v1/files/presign", {
        purpose: "test_pdf",
        filename: file.name,
        mime: "application/pdf",
        size: file.size,
      });
      // upload file (simplified - in real app would upload to presign URL)
      await apiPost(`/v1/admin/test-papers/${testId}/pdf`, { fileId: presign.fileId });
      alert("PDF 업로드 완료");
      setTest(prev => ({ ...prev, pdfFileId: presign.fileId }));
    } catch { alert("PDF 업로드 실패"); }
  };

  // ── Questions handlers ──
  const updateQ = (idx, field, value) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[idx] };
      if (field.startsWith("exp_")) {
        const key = field.replace("exp_", "");
        q.choiceExplanations = { ...(q.choiceExplanations || {}), [key]: value };
      } else {
        q[field] = value;
      }
      next[idx] = q;
      return next;
    });
  };

  const addRow = () => {
    const maxNum = questions.reduce((m, q) => Math.max(m, q.number || 0), 0);
    setQuestions(prev => [...prev, { ...EMPTY_Q, number: maxNum + 1 }]);
  };

  const removeRow = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const saveQuestions = async () => {
    setQSaving(true);
    try {
      const payload = questions.map(q => ({
        number: Number(q.number),
        type: q.type || "객관식",
        domain: q.domain || null,
        subDomain: q.subDomain || null,
        passage: q.passage || null,
        points: Number(q.points) || 0,
        correctAnswer: q.correctAnswer || null,
        choiceExplanations: q.choiceExplanations && Object.keys(q.choiceExplanations).length > 0 ? q.choiceExplanations : null,
        intent: q.intent || null,
      }));
      await apiPost(`/v1/admin/test-papers/${testId}/questions`, { questions: payload });
      alert("문항이 저장되었습니다.");
    } catch { alert("저장 실패"); }
    finally { setQSaving(false); }
  };

  // ── OMR (answer entry) handlers ──
  const handleOmrBubble = (qNum, choice) => {
    setOmrAnswers(prev => {
      const key = String(qNum);
      if (prev[key] === String(choice)) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: String(choice) };
    });
  };

  const handleOmrSubmit = async () => {
    if (!selectedStudent) { alert("학생을 선택해 주세요."); return; }
    setOmrSaving(true);
    setOmrMsg("");
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/submit-for-student`, {
        answers: omrAnswers,
        userId: selectedStudent,
      });
      setOmrMsg(`저장 완료 — 점수: ${res.score}, 정답: ${res.correctCount}`);
      setOmrAnswers({});
      // refresh students
      apiGet(`/v1/admin/test-papers/${testId}/students`).then(setStudents).catch((e) => console.error(e));
    } catch (err) {
      setOmrMsg(err.message || "저장 실패");
    } finally {
      setOmrSaving(false);
    }
  };

  // ── Navigate students ──
  const studentIdx = students.findIndex(s => s.userId === selectedStudent);
  const prevStudent = () => {
    if (studentIdx > 0) {
      setSelectedStudent(students[studentIdx - 1].userId);
      setOmrAnswers({});
      setOmrMsg("");
    }
  };
  const nextStudent = () => {
    if (studentIdx < students.length - 1) {
      setSelectedStudent(students[studentIdx + 1].userId);
      setOmrAnswers({});
      setOmrMsg("");
    }
  };

  if (loading) return <AdminLayout><div className="ts-page ts-center"><p>불러오는 중...</p></div></AdminLayout>;
  if (!test) return null;

  // group questions into rows of 5 for OMR
  const omrRows = [];
  for (let i = 0; i < questions.length; i += 5) {
    omrRows.push(questions.slice(i, i + 5));
  }

  return (
    <AdminLayout>
    <div className="ts-page ts-admin">
      <div className="ts-back-row">
        <Link to="/admin/tests" className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 시험 목록
        </Link>
      </div>

      <header className="ts-header">
        <h1>{test.title}</h1>
      </header>

      <nav className="ts-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`ts-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className="material-symbols-outlined">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Tab 1: Info ── */}
      {tab === "info" && (
        <div className="ts-tab-content">
          <div className="ts-form-grid">
            <label>
              제목
              <input value={infoForm.title} onChange={e => setInfoForm(f => ({ ...f, title: e.target.value }))} />
            </label>
            <label>
              레벨
              <input value={infoForm.levelId} onChange={e => setInfoForm(f => ({ ...f, levelId: e.target.value }))} />
            </label>
            <label>
              시행일
              <input type="date" value={infoForm.examDate} onChange={e => setInfoForm(f => ({ ...f, examDate: e.target.value }))} />
            </label>
            <label>
              시리즈
              <input value={infoForm.series} onChange={e => setInfoForm(f => ({ ...f, series: e.target.value }))} />
            </label>
            <label>
              총 문항
              <input type="number" value={infoForm.totalQuestions} onChange={e => setInfoForm(f => ({ ...f, totalQuestions: e.target.value }))} />
            </label>
            <label>
              총 배점
              <input type="number" value={infoForm.totalPoints} onChange={e => setInfoForm(f => ({ ...f, totalPoints: e.target.value }))} />
            </label>
            <label>
              시험 시간(분)
              <input type="number" value={infoForm.timeLimitMinutes} onChange={e => setInfoForm(f => ({ ...f, timeLimitMinutes: e.target.value }))} />
            </label>
            <label className="ts-form-full">
              설명
              <textarea value={infoForm.description} onChange={e => setInfoForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </label>
          </div>
          <div className="ts-form-actions">
            <button className="ts-btn ts-btn-primary" onClick={handleInfoSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button className="ts-btn ts-btn-danger" onClick={handleDelete}>삭제</button>
          </div>
        </div>
      )}

      {/* ── Tab 2: PDF ── */}
      {tab === "pdf" && (
        <div className="ts-tab-content">
          <div className="ts-pdf-upload">
            <label className="ts-btn ts-btn-outline ts-file-label">
              <span className="material-symbols-outlined">upload_file</span>
              PDF 업로드
              <input type="file" accept=".pdf" onChange={handlePdfUpload} hidden />
            </label>
            <p className="ts-muted">
              {test.pdfFileId ? `파일 ID: ${test.pdfFileId}` : "PDF가 업로드되지 않았습니다."}
            </p>
          </div>
          {test.pdfFileId && (
            <div className="ts-pdf-container" onContextMenu={e => e.preventDefault()}>
              <iframe
                className="ts-pdf-iframe"
                src={`${API_BASE}/v1/files/${test.pdfFileId}/download#toolbar=0&navpanes=0`}
                title="시험지 미리보기"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Questions ── */}
      {tab === "questions" && (
        <div className="ts-tab-content">
          {qLoading ? (
            <p>불러오는 중...</p>
          ) : (
            <>
              <div className="ts-sheet-toolbar">
                <span>{questions.length}문항 / 총 {questions.reduce((s, q) => s + (Number(q.points) || 0), 0)}점</span>
                <button className="ts-btn ts-btn-outline" onClick={addRow}>
                  <span className="material-symbols-outlined">add</span> 행 추가
                </button>
              </div>
              <div className="ts-sheet-scroll">
                <table className="ts-sheet-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>번호</th>
                      <th style={{ width: 80 }}>유형</th>
                      <th style={{ width: 80 }}>영역</th>
                      <th style={{ width: 90 }}>세부영역</th>
                      <th style={{ width: 120 }}>지문</th>
                      <th style={{ width: 60 }}>배점</th>
                      <th style={{ width: 70 }}>정답</th>
                      <th style={{ width: 140 }}>출제의도</th>
                      <th style={{ width: 120 }}>1번 해설</th>
                      <th style={{ width: 120 }}>2번 해설</th>
                      <th style={{ width: 120 }}>3번 해설</th>
                      <th style={{ width: 120 }}>4번 해설</th>
                      <th style={{ width: 120 }}>5번 해설</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, idx) => (
                      <tr key={idx}>
                        <td>
                          <input type="number" className="ts-sheet-input" value={q.number} onChange={e => updateQ(idx, "number", Number(e.target.value))} />
                        </td>
                        <td>
                          <select className="ts-sheet-select" value={q.type || "객관식"} onChange={e => updateQ(idx, "type", e.target.value)}>
                            <option value="객관식">객관식</option>
                            <option value="서술형">서술형</option>
                          </select>
                        </td>
                        <td><input className="ts-sheet-input" value={q.domain || ""} onChange={e => updateQ(idx, "domain", e.target.value)} /></td>
                        <td><input className="ts-sheet-input" value={q.subDomain || ""} onChange={e => updateQ(idx, "subDomain", e.target.value)} /></td>
                        <td><input className="ts-sheet-input" value={q.passage || ""} onChange={e => updateQ(idx, "passage", e.target.value)} /></td>
                        <td><input type="number" className="ts-sheet-input" value={q.points} onChange={e => updateQ(idx, "points", Number(e.target.value))} /></td>
                        <td>
                          <input
                            className="ts-sheet-input"
                            value={q.correctAnswer || ""}
                            onChange={e => updateQ(idx, "correctAnswer", e.target.value)}
                            placeholder={q.type === "객관식" ? "1~5" : ""}
                            disabled={q.type === "서술형"}
                          />
                        </td>
                        <td><textarea className="ts-sheet-textarea" value={q.intent || ""} onChange={e => updateQ(idx, "intent", e.target.value)} rows={1} /></td>
                        {[1, 2, 3, 4, 5].map(n => (
                          <td key={n}>
                            <textarea
                              className="ts-sheet-textarea"
                              value={q.choiceExplanations?.[String(n)] || ""}
                              onChange={e => updateQ(idx, `exp_${n}`, e.target.value)}
                              rows={1}
                              disabled={q.type === "서술형" && n > 1}
                              placeholder={q.type === "서술형" && n === 1 ? "모범답안" : ""}
                            />
                          </td>
                        ))}
                        <td>
                          <button className="ts-btn-icon" onClick={() => removeRow(idx)} title="삭제">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ts-form-actions">
                <button className="ts-btn ts-btn-primary" onClick={saveQuestions} disabled={qSaving}>
                  {qSaving ? "저장 중..." : "일괄 저장"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 4: Answer Entry (OMR) ── */}
      {tab === "answer" && (
        <div className="ts-tab-content">
          <div className="ts-answer-bar">
            <div className="ts-answer-student-select">
              <button className="ts-btn-icon" onClick={prevStudent} disabled={studentIdx <= 0}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <select
                value={selectedStudent}
                onChange={e => { setSelectedStudent(e.target.value); setOmrAnswers({}); setOmrMsg(""); }}
                className="ts-student-dropdown"
              >
                <option value="">학생 선택...</option>
                {students.map(s => (
                  <option key={s.userId} value={s.userId}>
                    {s.name || s.userId} {s.hasSubmitted ? `(${s.score}점)` : ""}
                  </option>
                ))}
              </select>
              <button className="ts-btn-icon" onClick={nextStudent} disabled={studentIdx >= students.length - 1}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <span className="ts-muted" style={{ marginLeft: 8 }}>
                {studentIdx >= 0 ? `${studentIdx + 1} / ${students.length}` : ""}
              </span>
            </div>
          </div>

          {selectedStudent && (
            <>
              <div className="ts-omr-grid">
                {omrRows.map((row, ri) => (
                  <div key={ri} className="ts-omr-row">
                    {row.map(q => (
                      <div key={q.number} className="ts-omr-cell">
                        <div className="ts-omr-qnum">
                          <span className="ts-omr-num">{q.number}</span>
                          <span className="ts-omr-pts">{q.points}점</span>
                        </div>
                        {(q.type || "객관식") === "객관식" ? (
                          <div className="ts-omr-bubbles">
                            {[1, 2, 3, 4, 5].map(c => (
                              <button
                                key={c}
                                className={`ts-omr-bubble ${omrAnswers[String(q.number)] === String(c) ? "selected" : ""}`}
                                onClick={() => handleOmrBubble(q.number, c)}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="ts-omr-essay-input"
                            value={omrAnswers[String(q.number)] || ""}
                            onChange={e => setOmrAnswers(prev => ({ ...prev, [String(q.number)]: e.target.value }))}
                            placeholder="서술형"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {omrMsg && <p className="ts-omr-msg">{omrMsg}</p>}

              <div className="ts-form-actions">
                <button className="ts-btn ts-btn-primary" onClick={handleOmrSubmit} disabled={omrSaving}>
                  {omrSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 5: Submissions ── */}
      {tab === "submissions" && (
        <div className="ts-tab-content">
          {subLoading ? (
            <p>불러오는 중...</p>
          ) : submissions.length === 0 ? (
            <p className="ts-muted">응시자가 없습니다.</p>
          ) : (
            <table className="ts-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th>점수</th>
                  <th>정답 수</th>
                  <th>정답률</th>
                  <th>입력자</th>
                  <th>제출일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.userId}>
                    <td>{s.userName || s.userId}</td>
                    <td>{s.score}</td>
                    <td>{s.correctCount}</td>
                    <td>{s.accuracy}%</td>
                    <td>{s.submittedBy === s.userId ? "본인" : "관리자"}</td>
                    <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("ko-KR") : "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="ts-btn ts-btn-outline ts-btn-sm"
                          onClick={() => navigate(`/tests/${testId}/report?studentId=${s.userId}`)}
                          title="성적표 보기"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>assessment</span>
                          성적표
                        </button>
                        <button
                          className="ts-btn ts-btn-outline ts-btn-sm"
                          onClick={() => navigate(`/tests/${testId}/wrong-note?studentId=${s.userId}`)}
                          title="오답 노트 보기"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error_outline</span>
                          오답
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default AdminTestDetailPage;
