import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import Modal from "../components/Modal";
import TestReportView from "../components/test-report/TestReportView";
import TestWrongNoteView from "../components/test-report/TestWrongNoteView";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { useAuth } from "../hooks/useAuth";
import "../styles/test-storage.css";

function fmt(n, digits = 1) {
  if (n == null || isNaN(n)) return "-";
  return Number(n).toFixed(digits);
}
function pct(n) {
  if (n == null || isNaN(n)) return "-";
  return (Number(n) * 100).toFixed(1) + "%";
}

// 정규화 — snake_case ↔ camelCase
function normTest(t) {
  if (!t) return null;
  return {
    testId: t.testId ?? t.test_id,
    title: t.title,
    examDate: t.examDate ?? t.exam_date,
    totalQuestions: t.totalQuestions ?? t.total_questions ?? 0,
    totalPoints: t.totalPoints ?? t.total_points ?? 0,
    levelId: t.levelId ?? t.level_id,
  };
}
function normStats(s) {
  if (!s) return null;
  const grade = s.gradeStats ?? s.grade_stats ?? {};
  const normalizedGrade = {};
  for (const [k, v] of Object.entries(grade || {})) {
    normalizedGrade[k] = {
      count: v.count ?? 0, avg: v.avg ?? 0, max: v.max ?? 0, min: v.min ?? 0,
      stdDev: v.stdDev ?? v.std_dev ?? 0,
    };
  }
  return {
    submissionCount: s.submissionCount ?? s.submission_count ?? 0,
    avgScore: s.avgScore ?? s.avg_score,
    maxScore: s.maxScore ?? s.max_score,
    minScore: s.minScore ?? s.min_score,
    stdDev: s.stdDev ?? s.std_dev,
    totalPoints: s.totalPoints ?? s.total_points ?? 0,
    gradeStats: normalizedGrade,
    updatedAt: s.updatedAt ?? s.updated_at,
  };
}
function normStudent(d) {
  return {
    userId: d.userId ?? d.user_id,
    userName: d.userName ?? d.user_name,
    school: d.school,
    grade: d.grade,
    orgName: d.orgName ?? d.org_name,
    score: d.score ?? 0,
    totalPoints: d.totalPoints ?? d.total_points ?? 0,
    accuracy: d.accuracy ?? 0,
    submittedAt: d.submittedAt ?? d.submitted_at,
    domainScores: d.domainScores ?? d.domain_scores ?? {},
    wrongQuestionNumbers: d.wrongQuestionNumbers ?? d.wrong_question_numbers ?? [],
    // 학생명 클릭 → 실제 성적표 페이지 navigation 용 (2026-05-16 추가)
    kind: d.kind ?? "misc",
    sessionId: d.sessionId ?? d.session_id ?? null,
    submissionId: d.submissionId ?? d.submission_id ?? null,
    tier: d.tier ?? null,
    tci: d.tci ?? null,
    recommendedLevel: d.recommendedLevel ?? d.recommended_level ?? null,
  };
}
function normEssayEntry(e) {
  return {
    userId: e.userId ?? e.user_id,
    name: e.name ?? "",
    answer: e.answer ?? "",
    earned: e.earned ?? 0,
  };
}
function normQuestion(q) {
  const ebRaw = q.essayBuckets ?? q.essay_buckets ?? {};
  const eb = {};
  for (const [k, list] of Object.entries(ebRaw)) {
    eb[k] = (Array.isArray(list) ? list : []).map(normEssayEntry);
  }
  return {
    number: q.number ?? 0,
    type: q.type,
    domain: q.domain,
    subDomain: q.subDomain ?? q.sub_domain,
    points: q.points ?? 0,
    correctAnswer: q.correctAnswer ?? q.correct_answer,
    wrongRate: q.wrongRate ?? q.wrong_rate ?? 0,
    correctRate: q.correctRate ?? q.correct_rate ?? 0,
    attempts: q.attempts ?? 0,
    correctCount: q.correctCount ?? q.correct_count ?? 0,
    choiceDistribution: q.choiceDistribution ?? q.choice_distribution ?? {},
    choiceStudents: q.choiceStudents ?? q.choice_students ?? {},
    wrongStudentNames: q.wrongStudentNames ?? q.wrong_student_names ?? [],
    competencyVector: q.competencyVector ?? q.competency_vector ?? {},
    essayDistribution: q.essayDistribution ?? q.essay_distribution ?? {},
    essayBuckets: eb,
    choiceIds: q.choiceIds ?? q.choice_ids ?? [],
    // 문항 모달용 본문 (2026-05-16 추가)
    stemText: q.stemText ?? q.stem_text ?? null,
    passageText: q.passageText ?? q.passage_text ?? null,
    choiceTexts: q.choiceTexts ?? q.choice_texts ?? {},
    explanation: q.explanation ?? null,
    choiceExplanations: q.choiceExplanations ?? q.choice_explanations ?? {},
  };
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8,
      padding: "12px 16px", minWidth: 120, flex: "1 1 140px",
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// 클릭 가능한 셀 (모달 트리거)
function ClickableCell({ children, onClick, title }) {
  return (
    <span
      onClick={onClick}
      title={title || "클릭 시 상세 보기"}
      style={{
        cursor: "pointer", color: "var(--accent)", textDecoration: "underline",
        textDecorationStyle: "dotted",
      }}
    >{children}</span>
  );
}

export default function AdminTestStatisticsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHq = (user?.roles || []).includes("HQ_ADMIN");
  // 통계 scope 토글: ORG_ADMIN 기본값 "org" (자기 기관) / HQ_ADMIN 은 항상 "all"
  const [scope, setScope] = useState(isHq ? "all" : "org");
  const [test, setTest] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("students");

  // 학생 필터
  const [stuSearch, setStuSearch] = useState("");
  const [stuGrade, setStuGrade] = useState("all");

  // 모달 상태
  const [modal, setModal] = useState(null);
  // modal 형태:
  //  { kind:"domain", student }
  //  { kind:"wrong", student }
  //  { kind:"choice", question, choiceId }
  //  { kind:"essay", question, bucketKey }
  //  { kind:"competency", question }
  //  { kind:"report", student }
  //  { kind:"wrongNote", student }

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [wrongNoteData, setWrongNoteData] = useState(null);
  const [wrongNoteLoading, setWrongNoteLoading] = useState(false);

  useEffect(() => {
    if (!testId || testId === "undefined") {
      navigate("/admin/tests");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = `?scope=${encodeURIComponent(scope)}`;
        const [t, s, sd, qa] = await Promise.all([
          apiGet(`/v1/admin/test-papers/${testId}`),
          apiGet(`/v1/admin/test-papers/${testId}/statistics${qs}`),
          apiGet(`/v1/admin/test-papers/${testId}/students-detail${qs}`),
          apiGet(`/v1/admin/test-papers/${testId}/question-analysis${qs}`),
        ]);
        if (cancelled) return;
        setTest(normTest(t));
        setStats(normStats(s));
        setStudents((Array.isArray(sd) ? sd : []).map(normStudent));
        setQuestions((Array.isArray(qa) ? qa : []).map(normQuestion));
      } catch (e) {
        console.error(e);
        alert("통계 로드 실패");
        navigate("/admin/tests");
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId, navigate, scope]);

  // 모달이 report/wrongNote면 데이터 로드
  useEffect(() => {
    if (!modal) { setReportData(null); setWrongNoteData(null); return; }
    if (modal.kind === "report" && modal.student) {
      setReportLoading(true);
      apiGet(`/v1/admin/test-papers/${testId}/submissions/${modal.student.userId}/report`)
        .then(setReportData)
        .catch((e) => { console.error(e); alert("성적표 로드 실패"); setModal(null); })
        .finally(() => setReportLoading(false));
    } else if (modal.kind === "wrongNote" && modal.student) {
      setWrongNoteLoading(true);
      apiGet(`/v1/admin/test-papers/${testId}/submissions/${modal.student.userId}/wrong-note`)
        .then(setWrongNoteData)
        .catch((e) => { console.error(e); alert("오답 노트 로드 실패"); setModal(null); })
        .finally(() => setWrongNoteLoading(false));
    }
  }, [modal, testId]);

  const gradeOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => s.grade && set.add(s.grade));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = stuSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (q) {
        const hay = `${s.userName || ""} ${s.school || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (stuGrade !== "all" && s.grade !== stuGrade) return false;
      return true;
    });
  }, [students, stuSearch, stuGrade]);

  // 문항별 정렬 — 오답률 상위 (correctRate 낮은 순) 가 기본. 사용자 클릭으로 번호 순 전환 가능.
  const [questionSort, setQuestionSort] = useState("wrongRate"); // "wrongRate" | "number"
  const sortedQuestions = useMemo(() => {
    const arr = [...questions];
    if (questionSort === "wrongRate") {
      arr.sort((a, b) => (a.correctRate ?? 0) - (b.correctRate ?? 0));
    } else {
      arr.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    }
    return arr;
  }, [questions, questionSort]);

  // 학생별/문항별 페이지네이션 (각 독립)
  const studentsPg = usePagination(filteredStudents, 15);
  const questionsPg = usePagination(sortedQuestions, 15);

  // 검색/필터/탭 변경 시 페이지 리셋
  useEffect(() => {
    studentsPg.setPage(1);
  }, [stuSearch, stuGrade, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <AdminLayout>
      <div className="ts-page ts-admin"><div className="ts-center"><p>로딩 중...</p></div></div>
    </AdminLayout>
  );
  if (!test || !stats) return null;

  const totalPoints = stats.totalPoints || test.totalPoints || 0;
  const inputStyle = {
    padding: "6px 10px", background: "var(--bg)", color: "var(--text)",
    border: "1px solid var(--stroke)", borderRadius: 6,
  };

  // 진단 테스트 여부 — testId 가 'diag_paper_' 시작 또는 students[0].kind === 'diagnostic'
  const isDiagnostic = String(testId || "").startsWith("diag_paper_") || students[0]?.kind === "diagnostic";

  // 학생명 클릭 → 실제 성적표 페이지로 navigate (2026-05-16)
  // 진단: /diagnostic/v2/report/:sessionId?adminReturn=...
  // 챕터·기타: /admin/tests/:testId/students/:userId/report (어드민 전용 신규 페이지)
  const adminReturnUrl = `/admin/tests/${testId}/statistics`;
  const openStudentReport = (s) => {
    if (s.kind === "diagnostic" && s.sessionId) {
      navigate(`/diagnostic/v2/report/${s.sessionId}?adminReturn=${encodeURIComponent(adminReturnUrl)}`);
    } else {
      navigate(`/admin/tests/${testId}/students/${s.userId}/report`);
    }
  };

  // 모달 닫기
  const closeModal = () => setModal(null);

  return (
    <AdminLayout>
      <div className="ts-page ts-admin" style={{ paddingTop: 16 }}>
        <Link to="/admin/tests" className="ts-link" style={{ fontSize: 13 }}>← 시험 관리</Link>
        <h2 style={{ margin: "6px 0 4px", color: "var(--text)" }}>{test.title}</h2>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span>{test.examDate || "-"} / 총 {test.totalQuestions}문항 / {totalPoints}점 / 응시자 {stats.submissionCount}명</span>
          {/* 본사 시험은 HQ_ADMIN 만 편집 가능 — ORG_ADMIN 에게는 편집 링크 숨김 */}
          {isHq && (
            <Link to={`/admin/tests/${testId}/edit`} style={{ color: "var(--accent)" }}>[시험지 편집]</Link>
          )}
          {/* scope 토글 — ORG_ADMIN 에게만 노출 (HQ_ADMIN 은 항상 전체) */}
          {!isHq && (
            <div style={{
              display: "inline-flex", border: "1px solid var(--stroke)",
              borderRadius: 6, overflow: "hidden",
            }}>
              <button
                type="button"
                onClick={() => setScope("org")}
                style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: 600,
                  border: 0, cursor: "pointer",
                  background: scope === "org" ? "var(--accent)" : "var(--panel)",
                  color: scope === "org" ? "#fff" : "var(--text)",
                }}
              >우리 기관</button>
              <button
                type="button"
                onClick={() => setScope("all")}
                style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: 600,
                  border: 0, cursor: "pointer",
                  background: scope === "all" ? "var(--accent)" : "var(--panel)",
                  color: scope === "all" ? "#fff" : "var(--text)",
                }}
              >전체</button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <StatCard label="응시자" value={`${stats.submissionCount}명`} />
          <StatCard label="평균" value={`${fmt(stats.avgScore)}점`} sub={totalPoints ? pct((stats.avgScore || 0) / totalPoints) : null} />
          <StatCard label="최고" value={`${stats.maxScore ?? "-"}점`} />
          <StatCard label="최저" value={`${stats.minScore ?? "-"}점`} />
          <StatCard label="표준편차" value={fmt(stats.stdDev, 2)} />
        </div>

        {stats.gradeStats && Object.keys(stats.gradeStats).length > 0 && (
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "var(--text)" }}>학년별 통계</h4>
            <table style={{ width: "100%", fontSize: 12, color: "var(--text)" }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  <th style={{ padding: "4px 8px" }}>학년</th>
                  <th style={{ padding: "4px 8px" }}>응시</th>
                  <th style={{ padding: "4px 8px" }}>평균</th>
                  <th style={{ padding: "4px 8px" }}>최고</th>
                  <th style={{ padding: "4px 8px" }}>최저</th>
                  <th style={{ padding: "4px 8px" }}>표준편차</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.gradeStats).map(([grade, g]) => (
                  <tr key={grade} style={{ borderTop: "1px solid var(--stroke)" }}>
                    <td style={{ padding: "4px 8px" }}>{grade}</td>
                    <td style={{ padding: "4px 8px" }}>{g.count}</td>
                    <td style={{ padding: "4px 8px" }}>{fmt(g.avg)}</td>
                    <td style={{ padding: "4px 8px" }}>{g.max}</td>
                    <td style={{ padding: "4px 8px" }}>{g.min}</td>
                    <td style={{ padding: "4px 8px" }}>{fmt(g.stdDev, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => setTab("students")}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--stroke)",
              background: tab === "students" ? "var(--accent)" : "var(--panel)",
              color: tab === "students" ? "#fff" : "var(--text)",
              cursor: "pointer", fontWeight: 600,
            }}
          >학생별 ({students.length})</button>
          <button
            onClick={() => setTab("questions")}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--stroke)",
              background: tab === "questions" ? "var(--accent)" : "var(--panel)",
              color: tab === "questions" ? "#fff" : "var(--text)",
              cursor: "pointer", fontWeight: 600,
            }}
          >문항별 ({questions.length})</button>
        </div>

        {tab === "students" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input type="text" placeholder="학생 이름·학교 검색" value={stuSearch} onChange={(e) => setStuSearch(e.target.value)} style={{ ...inputStyle, flex: "1 1 200px" }} />
              <select value={stuGrade} onChange={(e) => setStuGrade(e.target.value)} style={inputStyle}>
                <option value="all">전체 학년</option>
                {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: 12 }}>
                {filteredStudents.length} / {students.length}
              </span>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8, padding: 8, overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, minWidth: 800, color: "var(--text)" }}>
                <thead>
                  <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                    <th style={{ padding: "6px 6px" }}>이름</th>
                    <th style={{ padding: "6px 6px" }}>학교</th>
                    <th style={{ padding: "6px 6px" }}>학년</th>
                    <th style={{ padding: "6px 6px" }}>기관</th>
                    <th style={{ padding: "6px 6px" }}>응시일시</th>
                    <th style={{ padding: "6px 6px" }}>점수</th>
                    <th style={{ padding: "6px 6px" }}>정답률</th>
                    {/* 진단 테스트면 TCI/판정 레벨 컬럼 */}
                    {isDiagnostic && <th style={{ padding: "6px 6px" }}>역량 지수 (TCI)</th>}
                    {isDiagnostic && <th style={{ padding: "6px 6px" }}>판정 레벨</th>}
                    <th style={{ padding: "6px 6px" }}>틀린 번호</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsPg.paged.map((s) => {
                    const wrongCount = (s.wrongQuestionNumbers || []).length;
                    return (
                      <tr key={s.userId} style={{ borderTop: "1px solid var(--stroke)" }}>
                        <td style={{ padding: "4px 6px", fontWeight: 600 }}>
                          <ClickableCell
                            onClick={() => openStudentReport(s)}
                            title="실제 성적표 보기"
                          >
                            {s.userName || "-"}
                          </ClickableCell>
                        </td>
                        <td style={{ padding: "4px 6px" }}>{s.school || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{s.grade || "-"}</td>
                        <td style={{ padding: "4px 6px" }}>{s.orgName || "본사"}</td>
                        <td style={{ padding: "4px 6px", color: "var(--muted)" }}>
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString("ko-KR") : "-"}
                        </td>
                        <td style={{ padding: "4px 6px", fontWeight: 600 }}>{s.score} / {s.totalPoints}</td>
                        <td style={{ padding: "4px 6px" }}>{pct(s.accuracy)}</td>
                        {isDiagnostic && (
                          <td style={{ padding: "4px 6px", fontWeight: 600 }}>
                            {s.tci != null ? `${Number(s.tci).toFixed(1)}` : "-"}
                          </td>
                        )}
                        {isDiagnostic && (
                          <td style={{ padding: "4px 6px" }}>{s.recommendedLevel || "-"}</td>
                        )}
                        <td style={{ padding: "4px 6px", color: wrongCount > 0 ? "#fca5a5" : "var(--muted)" }}>
                          {wrongCount > 0 ? (
                            <ClickableCell onClick={() => setModal({ kind: "wrong", student: s })} title="틀린 번호 보기">
                              <span style={{ color: "#fca5a5" }}>{wrongCount}개</span>
                            </ClickableCell>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={isDiagnostic ? 10 : 8} style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>응시 학생 없음</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={studentsPg.page} totalPages={studentsPg.totalPages} onChange={studentsPg.setPage} />
            </div>
          </>
        )}

        {tab === "questions" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>정렬:</span>
              <div style={{
                display: "inline-flex", border: "1px solid var(--stroke)",
                borderRadius: 6, overflow: "hidden",
              }}>
                <button
                  type="button"
                  onClick={() => setQuestionSort("wrongRate")}
                  style={{
                    padding: "4px 10px", fontSize: 12, fontWeight: 600,
                    border: 0, cursor: "pointer",
                    background: questionSort === "wrongRate" ? "var(--accent)" : "var(--panel)",
                    color: questionSort === "wrongRate" ? "#fff" : "var(--text)",
                  }}
                >오답률 상위 순</button>
                <button
                  type="button"
                  onClick={() => setQuestionSort("number")}
                  style={{
                    padding: "4px 10px", fontSize: 12, fontWeight: 600,
                    border: 0, cursor: "pointer",
                    background: questionSort === "number" ? "var(--accent)" : "var(--panel)",
                    color: questionSort === "number" ? "#fff" : "var(--text)",
                  }}
                >번호 순</button>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                번호를 클릭하면 발문·선지·해설을 볼 수 있습니다.
              </span>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8, padding: 8, overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, minWidth: 1000, color: "var(--text)" }}>
                <thead>
                  <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                    <th style={{ padding: "6px 6px" }}>번호</th>
                    <th style={{ padding: "6px 6px" }}>유형</th>
                    <th style={{ padding: "6px 6px" }}>영역</th>
                    <th style={{ padding: "6px 6px" }}>배점</th>
                    <th style={{ padding: "6px 6px" }}>정답</th>
                    <th style={{ padding: "6px 6px" }}>정답률</th>
                    <th style={{ padding: "6px 6px" }}>응시</th>
                    <th style={{ padding: "6px 6px", minWidth: 240 }}>선택지 분포 (%)</th>
                    <th style={{ padding: "6px 6px" }}>역량</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsPg.paged.map((q) => (
                    <QuestionRow
                      key={q.number}
                      q={q}
                      onNumberClick={() => setModal({ kind: "questionDetail", question: q })}
                      onChoiceClick={(cid) => setModal({ kind: "choice", question: q, choiceId: cid })}
                      onEssayClick={(bk) => setModal({ kind: "essay", question: q, bucketKey: bk })}
                      onCompetencyClick={() => setModal({ kind: "competency", question: q })}
                    />
                  ))}
                  {questions.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>문항 분석 없음</td></tr>
                  )}
                </tbody>
              </table>
              <Pagination page={questionsPg.page} totalPages={questionsPg.totalPages} onChange={questionsPg.setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── 모달 ── (학생명 클릭은 navigate 로 변경 — 2026-05-16) */}
      {modal?.kind === "wrong" && (
        <Modal open onClose={closeModal} title={`${modal.student.userName || "-"} — 틀린 번호 (${modal.student.wrongQuestionNumbers.length}개)`} size="sm">
          <WrongModalBody numbers={modal.student.wrongQuestionNumbers} />
        </Modal>
      )}
      {modal?.kind === "choice" && (
        <Modal open onClose={closeModal} title={`${modal.question.number}번 — 선택지 ${modal.choiceId} 응답자`} size="md">
          <ChoiceModalBody question={modal.question} choiceId={modal.choiceId} />
        </Modal>
      )}
      {modal?.kind === "essay" && (
        <Modal open onClose={closeModal} title={`${modal.question.number}번 — ${ESSAY_LABEL[modal.bucketKey] || modal.bucketKey} 학생·답안`} size="lg">
          <EssayModalBody question={modal.question} bucketKey={modal.bucketKey} />
        </Modal>
      )}
      {modal?.kind === "competency" && (
        <Modal open onClose={closeModal} title={`${modal.question.number}번 — 역량 가중치`} size="md">
          <CompetencyModalBody question={modal.question} />
        </Modal>
      )}
      {modal?.kind === "questionDetail" && (
        <Modal open onClose={closeModal} title={`${modal.question.number}번 — 발문·선지·해설`} size="lg">
          <QuestionDetailModalBody question={modal.question} />
        </Modal>
      )}
    </AdminLayout>
  );
}

const ESSAY_LABEL = { full: "만점", partial: "부분점수", zero: "0점" };
const ESSAY_COLOR = {
  full: { bg: "rgba(34,197,94,0.18)", fg: "#86efac", bd: "rgba(34,197,94,0.4)" },
  partial: { bg: "rgba(252,211,77,0.18)", fg: "#fcd34d", bd: "rgba(252,211,77,0.4)" },
  zero: { bg: "rgba(239,68,68,0.18)", fg: "#fca5a5", bd: "rgba(239,68,68,0.4)" },
};

function QuestionRow({ q, onNumberClick, onChoiceClick, onEssayClick, onCompetencyClick }) {
  const isEssay = q.type === "서술형" || q.type === "서술";
  const total = q.attempts || 0;

  return (
    <tr style={{ borderTop: "1px solid var(--stroke)" }}>
      <td style={{ padding: "4px 6px", fontWeight: 600 }}>
        <ClickableCell onClick={onNumberClick} title="발문·선지·해설 보기">
          {q.number}
        </ClickableCell>
      </td>
      <td style={{ padding: "4px 6px" }}>{q.type}</td>
      <td style={{ padding: "4px 6px" }}>{q.domain || "-"}{q.subDomain ? ` / ${q.subDomain}` : ""}</td>
      <td style={{ padding: "4px 6px" }}>{q.points}</td>
      <td style={{ padding: "4px 6px" }}>{q.correctAnswer || "-"}</td>
      <td style={{
        padding: "4px 6px",
        color: q.correctRate >= 0.7 ? "#86efac" : q.correctRate >= 0.4 ? "#fcd34d" : "#fca5a5",
        fontWeight: 600,
      }}>{pct(q.correctRate)}</td>
      <td style={{ padding: "4px 6px" }}>{q.correctCount}/{q.attempts}</td>
      <td style={{ padding: "4px 6px" }}>
        {isEssay ? (
          <EssayDistribution q={q} total={total} onClick={onEssayClick} />
        ) : (
          <ChoiceDistribution q={q} total={total} onClick={onChoiceClick} />
        )}
      </td>
      <td style={{ padding: "4px 6px" }}>
        {Object.keys(q.competencyVector || {}).length > 0 ? (
          <ClickableCell onClick={onCompetencyClick} title="역량 상세 보기">
            {Object.keys(q.competencyVector).length}개
          </ClickableCell>
        ) : "-"}
      </td>
    </tr>
  );
}

// 객관식 — 동적 선지 ID(1/2/3/4/5 또는 A/B/C/D 등) + 백분율
function ChoiceDistribution({ q, total, onClick }) {
  // 우선순위: q.choiceIds → choiceDistribution 키 → 1~5 fallback
  let choices = (q.choiceIds && q.choiceIds.length > 0)
    ? q.choiceIds
    : Object.keys(q.choiceDistribution || {});
  if (choices.length === 0) choices = ["1", "2", "3", "4", "5"];
  // 라벨 — 숫자형이면 "N번", 문자형이면 그대로
  const isNumeric = (c) => /^\d+$/.test(c);

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {choices.map((c) => {
        const n = q.choiceDistribution?.[c] || 0;
        const ratio = total > 0 ? (n / total) : 0;
        const isCorrect = c === q.correctAnswer;
        const hasResponses = n > 0;
        return (
          <button
            key={c}
            type="button"
            onClick={() => hasResponses && onClick(c)}
            disabled={!hasResponses}
            style={{
              minWidth: 44, padding: "4px 6px", borderRadius: 4,
              background: isCorrect ? "rgba(34,197,94,0.18)" : (hasResponses ? "rgba(239,68,68,0.12)" : "var(--bg)"),
              color: isCorrect ? "#86efac" : (hasResponses ? "#fca5a5" : "var(--muted)"),
              border: `1px solid ${isCorrect ? "rgba(34,197,94,0.4)" : "var(--stroke)"}`,
              fontSize: 11, fontWeight: 700,
              cursor: hasResponses ? "pointer" : "default",
              textAlign: "center", lineHeight: 1.2,
            }}
            title={hasResponses ? `${c} 응답자 ${n}명` : ""}
          >
            <div>{isNumeric(c) ? `${c}번` : c}</div>
            <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
              {total > 0 ? `${(ratio * 100).toFixed(0)}%` : "-"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 서술형 — 만점/부분점수/0점 셀 + 백분율
function EssayDistribution({ q, total, onClick }) {
  const buckets = ["full", "partial", "zero"];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {buckets.map((bk) => {
        const n = q.essayDistribution?.[bk] || 0;
        const ratio = total > 0 ? (n / total) : 0;
        const has = n > 0;
        const c = ESSAY_COLOR[bk];
        return (
          <button
            key={bk}
            type="button"
            onClick={() => has && onClick(bk)}
            disabled={!has}
            style={{
              minWidth: 64, padding: "4px 8px", borderRadius: 4,
              background: has ? c.bg : "var(--bg)",
              color: has ? c.fg : "var(--muted)",
              border: `1px solid ${has ? c.bd : "var(--stroke)"}`,
              fontSize: 11, fontWeight: 700,
              cursor: has ? "pointer" : "default",
              textAlign: "center", lineHeight: 1.2,
            }}
            title={has ? `${ESSAY_LABEL[bk]} ${n}명` : ""}
          >
            <div>{ESSAY_LABEL[bk]}</div>
            <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
              {total > 0 ? `${(ratio * 100).toFixed(0)}%` : "-"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 모달 본문들

function DomainModalBody({ student }) {
  const entries = Object.entries(student.domainScores || {});
  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 8, color: "var(--muted)" }}>
        총점: <strong style={{ color: "var(--text)" }}>{student.score} / {student.totalPoints}</strong>
        {" · "}정답률: <strong style={{ color: "var(--text)" }}>{(student.accuracy * 100).toFixed(1)}%</strong>
      </div>
      <table style={{ width: "100%", fontSize: 12, color: "var(--text)" }}>
        <thead>
          <tr style={{ background: "var(--bg)", textAlign: "left" }}>
            <th style={{ padding: "6px 8px" }}>영역</th>
            <th style={{ padding: "6px 8px" }}>득점</th>
            <th style={{ padding: "6px 8px" }}>만점</th>
            <th style={{ padding: "6px 8px" }}>정답</th>
            <th style={{ padding: "6px 8px" }}>비율</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([domain, d]) => {
            const max = d.maxScore ?? d.max_score ?? 0;
            const rate = max > 0 ? ((d.score / max) * 100).toFixed(0) : "-";
            return (
              <tr key={domain} style={{ borderTop: "1px solid var(--stroke)" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>{domain}</td>
                <td style={{ padding: "6px 8px" }}>{d.score}</td>
                <td style={{ padding: "6px 8px" }}>{max}</td>
                <td style={{ padding: "6px 8px" }}>{d.correct}/{d.total}</td>
                <td style={{ padding: "6px 8px" }}>{rate}{rate !== "-" ? "%" : ""}</td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>영역별 데이터 없음</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function WrongModalBody({ numbers }) {
  if (!numbers?.length) return <div style={{ color: "var(--muted)" }}>틀린 문항 없음</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {numbers.map((n) => (
        <span key={n} style={{
          padding: "4px 10px", borderRadius: 4,
          background: "rgba(239,68,68,0.18)",
          border: "1px solid rgba(239,68,68,0.4)",
          color: "#fca5a5", fontWeight: 700, fontSize: 13,
        }}>{n}번</span>
      ))}
    </div>
  );
}

function ChoiceModalBody({ question, choiceId }) {
  const names = (question.choiceStudents || {})[choiceId] || [];
  const count = (question.choiceDistribution || {})[choiceId] || 0;
  const total = question.attempts || 0;
  const ratio = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  const isCorrect = choiceId === question.correctAnswer;

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 12, color: "var(--muted)" }}>
        <span>{count}명 ({ratio}%)</span>
        <span style={{ marginLeft: 8 }}>·</span>
        <span style={{ marginLeft: 8, color: isCorrect ? "#86efac" : "#fca5a5", fontWeight: 700 }}>
          {isCorrect ? "정답" : "오답"}
        </span>
      </div>
      {names.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>응답자 없음</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {names.map((n, i) => (
            <span key={i} style={{
              padding: "4px 10px", borderRadius: 4,
              background: "var(--bg)", border: "1px solid var(--stroke)",
              fontSize: 12,
            }}>{n}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function EssayModalBody({ question, bucketKey }) {
  const list = (question.essayBuckets || {})[bucketKey] || [];
  const total = question.attempts || 0;
  const c = ESSAY_COLOR[bucketKey] || ESSAY_COLOR.zero;

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 12, color: "var(--muted)" }}>
        <span style={{ color: c.fg, fontWeight: 700 }}>{ESSAY_LABEL[bucketKey]}</span>
        {" · "}
        <span>{list.length}명 / 응시 {total}명</span>
        {total > 0 && <span> ({((list.length / total) * 100).toFixed(1)}%)</span>}
      </div>
      {list.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>해당 점수 응답자 없음</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((e, i) => (
            <div key={i} style={{
              padding: 10, borderRadius: 6,
              background: "var(--bg)", border: "1px solid var(--stroke)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ color: "var(--text)" }}>{e.name}</strong>
                <span style={{ color: c.fg, fontWeight: 600, fontSize: 11 }}>
                  {e.earned}점 / {question.points}점
                </span>
              </div>
              <pre style={{
                margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontFamily: "inherit", fontSize: 12, color: "var(--text)",
              }}>{e.answer || "(답안 없음)"}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionDetailModalBody({ question }) {
  const choiceIds = (question.choiceIds && question.choiceIds.length > 0)
    ? question.choiceIds
    : Object.keys(question.choiceTexts || {});
  const isNumeric = (c) => /^\d+$/.test(c);
  const correct = question.correctAnswer;

  return (
    <div style={{ fontSize: 13, color: "var(--text)" }}>
      <div style={{ marginBottom: 10, color: "var(--muted)", fontSize: 12 }}>
        {question.type} · {question.points}점 · 정답률 {(question.correctRate * 100).toFixed(1)}%
      </div>
      {question.passageText && (
        <div style={{
          background: "var(--bg)", border: "1px solid var(--stroke)",
          borderRadius: 6, padding: 10, marginBottom: 10,
          fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 240, overflowY: "auto",
        }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>지문</div>
          {question.passageText}
        </div>
      )}
      {question.stemText && (
        <div style={{ marginBottom: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          <strong style={{ marginRight: 6 }}>{question.number}.</strong>{question.stemText}
        </div>
      )}
      {choiceIds.length > 0 && (
        <ol style={{ margin: "8px 0", paddingLeft: 0, listStyle: "none" }}>
          {choiceIds.map((c) => {
            const text = (question.choiceTexts || {})[c] || "";
            const isCorrect = c === correct;
            return (
              <li key={c} style={{
                padding: "6px 10px", marginBottom: 4, borderRadius: 4,
                background: isCorrect ? "rgba(34,197,94,0.12)" : "var(--bg)",
                border: `1px solid ${isCorrect ? "rgba(34,197,94,0.4)" : "var(--stroke)"}`,
                display: "flex", gap: 8,
              }}>
                <span style={{
                  fontWeight: 700, minWidth: 22,
                  color: isCorrect ? "#86efac" : "var(--muted)",
                }}>{isNumeric(c) ? `${c}.` : c}</span>
                <span style={{ flex: 1, whiteSpace: "pre-wrap" }}>{text || "(선지 본문 없음)"}</span>
                {isCorrect && (
                  <span style={{ color: "#86efac", fontWeight: 700, fontSize: 11, alignSelf: "center" }}>정답</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {question.explanation && (
        <div style={{
          marginTop: 10, padding: 10, borderRadius: 6,
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "#60a5fa", marginBottom: 4 }}>해설</div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{question.explanation}</div>
        </div>
      )}
      {question.choiceExplanations && Object.keys(question.choiceExplanations).length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>선지별 해설</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
            {Object.entries(question.choiceExplanations).map(([cid, text]) => (
              <li key={cid} style={{ marginBottom: 4, whiteSpace: "pre-wrap" }}>
                <strong>{isNumeric(cid) ? `${cid}.` : cid}</strong> {text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!question.stemText && !question.passageText && choiceIds.length === 0 && !question.explanation && (
        <div style={{ color: "var(--muted)" }}>문항 본문이 등록되지 않았습니다.</div>
      )}
    </div>
  );
}

function CompetencyModalBody({ question }) {
  const entries = Object.entries(question.competencyVector || {}).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, v]) => s + Math.abs(v), 0);

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 8, color: "var(--muted)" }}>
        {question.number}번 / {question.type} / 정답: {question.correctAnswer || "-"}
      </div>
      {entries.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>역량 데이터 없음</div>
      ) : (
        <table style={{ width: "100%", fontSize: 12, color: "var(--text)" }}>
          <thead>
            <tr style={{ background: "var(--bg)", textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>역량</th>
              <th style={{ padding: "6px 8px" }}>가중치</th>
              <th style={{ padding: "6px 8px" }}>비율</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([k, v]) => {
              const ratio = sum > 0 ? Math.abs(v) / sum : 0;
              return (
                <tr key={k} style={{ borderTop: "1px solid var(--stroke)" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{k}</td>
                  <td style={{ padding: "6px 8px" }}>{Number(v).toFixed(2)}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        flex: 1, height: 8, background: "var(--bg)",
                        borderRadius: 4, overflow: "hidden", maxWidth: 200,
                      }}>
                        <div style={{
                          width: `${(ratio * 100).toFixed(0)}%`, height: "100%",
                          background: "var(--accent)",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {(ratio * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
