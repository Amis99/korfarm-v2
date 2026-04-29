import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/test-storage.css";

function fmt(n, digits = 1) {
  if (n == null || isNaN(n)) return "-";
  return Number(n).toFixed(digits);
}

function pct(n) {
  if (n == null || isNaN(n)) return "-";
  return (Number(n) * 100).toFixed(1) + "%";
}

// snake_case ↔ camelCase 양쪽 지원 정규화
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
  // 학년 통계 키도 snake-case일 가능성
  const normalizedGrade = {};
  for (const [k, v] of Object.entries(grade || {})) {
    normalizedGrade[k] = {
      count: v.count ?? 0,
      avg: v.avg ?? 0,
      max: v.max ?? 0,
      min: v.min ?? 0,
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
  };
}
function normQuestion(q) {
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

export default function AdminTestStatisticsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("students");

  // 학생 필터
  const [stuSearch, setStuSearch] = useState("");
  const [stuGrade, setStuGrade] = useState("all");

  useEffect(() => {
    if (!testId || testId === "undefined") {
      navigate("/admin/tests");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [t, s, sd, qa] = await Promise.all([
          apiGet(`/v1/admin/test-papers/${testId}`),
          apiGet(`/v1/admin/test-papers/${testId}/statistics`),
          apiGet(`/v1/admin/test-papers/${testId}/students-detail`),
          apiGet(`/v1/admin/test-papers/${testId}/question-analysis`),
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
  }, [testId, navigate]);

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

  return (
    <AdminLayout>
      <div className="ts-page ts-admin" style={{ paddingTop: 16 }}>
        <Link to="/admin/tests" className="ts-link" style={{ fontSize: 13 }}>← 시험 관리</Link>
        <h2 style={{ margin: "6px 0 4px", color: "var(--text)" }}>{test.title}</h2>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          {test.examDate || "-"} / 총 {test.totalQuestions}문항 / {totalPoints}점 / 응시자 {stats.submissionCount}명
          <Link to={`/admin/tests/${testId}/edit`} style={{ marginLeft: 12, color: "var(--accent)" }}>[시험지 편집]</Link>
        </div>

        {/* 전체 통계 */}
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

        {/* 탭 */}
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
              <table style={{ width: "100%", fontSize: 11, minWidth: 800, color: "var(--text)" }}>
                <thead>
                  <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                    <th style={{ padding: "6px 6px" }}>이름</th>
                    <th style={{ padding: "6px 6px" }}>학교</th>
                    <th style={{ padding: "6px 6px" }}>학년</th>
                    <th style={{ padding: "6px 6px" }}>기관</th>
                    <th style={{ padding: "6px 6px" }}>응시일시</th>
                    <th style={{ padding: "6px 6px" }}>점수</th>
                    <th style={{ padding: "6px 6px" }}>정답률</th>
                    <th style={{ padding: "6px 6px" }}>영역별</th>
                    <th style={{ padding: "6px 6px" }}>틀린 번호</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.userId} style={{ borderTop: "1px solid var(--stroke)" }}>
                      <td style={{ padding: "4px 6px", fontWeight: 600 }}>{s.userName || "-"}</td>
                      <td style={{ padding: "4px 6px" }}>{s.school || "-"}</td>
                      <td style={{ padding: "4px 6px" }}>{s.grade || "-"}</td>
                      <td style={{ padding: "4px 6px" }}>{s.orgName || "본사"}</td>
                      <td style={{ padding: "4px 6px", color: "var(--muted)" }}>
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleString("ko-KR") : "-"}
                      </td>
                      <td style={{ padding: "4px 6px", fontWeight: 600 }}>{s.score} / {s.totalPoints}</td>
                      <td style={{ padding: "4px 6px" }}>{pct(s.accuracy)}</td>
                      <td style={{ padding: "4px 6px" }}>
                        {Object.entries(s.domainScores || {}).map(([dom, d]) => (
                          <span key={dom} style={{ marginRight: 8 }}>
                            {dom}: <b>{d.score}</b>/{d.maxScore ?? d.max_score}
                          </span>
                        ))}
                      </td>
                      <td style={{ padding: "4px 6px", color: "#fca5a5" }}>
                        {(s.wrongQuestionNumbers || []).join(", ") || "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>응시 학생 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "questions" && (
          <div style={{ background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8, padding: 8, overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, minWidth: 900, color: "var(--text)" }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  <th style={{ padding: "6px 6px" }}>번호</th>
                  <th style={{ padding: "6px 6px" }}>유형</th>
                  <th style={{ padding: "6px 6px" }}>영역</th>
                  <th style={{ padding: "6px 6px" }}>배점</th>
                  <th style={{ padding: "6px 6px" }}>정답</th>
                  <th style={{ padding: "6px 6px" }}>정답률</th>
                  <th style={{ padding: "6px 6px" }}>오답률</th>
                  <th style={{ padding: "6px 6px" }}>응시</th>
                  <th style={{ padding: "6px 6px" }}>선택지 분포</th>
                  <th style={{ padding: "6px 6px" }}>역량</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.number} style={{ borderTop: "1px solid var(--stroke)" }}>
                    <td style={{ padding: "4px 6px", fontWeight: 600 }}>{q.number}</td>
                    <td style={{ padding: "4px 6px" }}>{q.type}</td>
                    <td style={{ padding: "4px 6px" }}>{q.domain || "-"}{q.subDomain ? ` / ${q.subDomain}` : ""}</td>
                    <td style={{ padding: "4px 6px" }}>{q.points}</td>
                    <td style={{ padding: "4px 6px" }}>{q.correctAnswer || "-"}</td>
                    <td style={{ padding: "4px 6px", color: q.correctRate >= 0.7 ? "#86efac" : q.correctRate >= 0.4 ? "#fcd34d" : "#fca5a5" }}>
                      {pct(q.correctRate)}
                    </td>
                    <td style={{ padding: "4px 6px" }}>{pct(q.wrongRate)}</td>
                    <td style={{ padding: "4px 6px" }}>{q.correctCount}/{q.attempts}</td>
                    <td style={{ padding: "4px 6px" }}>
                      {Object.entries(q.choiceDistribution || {}).sort().map(([c, n]) => {
                        const studentNames = (q.choiceStudents || {})[c] || [];
                        const tip = studentNames.length > 0 ? studentNames.join(", ") : "";
                        const isCorrect = c === q.correctAnswer;
                        return (
                          <span
                            key={c}
                            title={tip}
                            style={{
                              marginRight: 6, padding: "1px 5px",
                              background: isCorrect ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                              color: isCorrect ? "#86efac" : "#fca5a5",
                              borderRadius: 3,
                              cursor: tip ? "help" : "default",
                              fontWeight: 600,
                            }}
                          >{c}: {n}</span>
                        );
                      })}
                    </td>
                    <td style={{ padding: "4px 6px", color: "var(--muted)" }}>
                      {Object.entries(q.competencyVector || {})
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([k, v]) => `${k} ${fmt(v, 2)}`)
                        .join(" / ") || "-"}
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>문항 분석 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
