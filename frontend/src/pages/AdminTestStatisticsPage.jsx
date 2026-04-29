import { useEffect, useState } from "react";
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

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      padding: "12px 16px", minWidth: 120, flex: "1 1 140px",
    }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
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
  const [tab, setTab] = useState("students"); // students | questions

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
        setTest(t);
        setStats(s);
        setStudents(Array.isArray(sd) ? sd : []);
        setQuestions(Array.isArray(qa) ? qa : []);
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

  if (loading) return (
    <AdminLayout>
      <div style={{ padding: 24 }}>로딩 중...</div>
    </AdminLayout>
  );
  if (!test || !stats) return null;

  const totalPoints = stats.totalPoints || test.totalPoints || 0;

  return (
    <AdminLayout>
      <div className="ts-detail-wrap" style={{ padding: 16 }}>
        <Link to="/admin/tests" className="ts-back-link">← 시험 관리</Link>
        <h2 style={{ margin: "8px 0 4px" }}>{test.title}</h2>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          {test.examDate || "-"} / 총 {test.totalQuestions}문항 / {totalPoints}점 / 응시자 {stats.submissionCount}명
          <Link to={`/admin/tests/${testId}/edit`} style={{ marginLeft: 12 }}>[시험지 편집]</Link>
        </div>

        {/* 전체 통계 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <StatCard label="응시자" value={`${stats.submissionCount}명`} />
          <StatCard label="평균" value={`${fmt(stats.avgScore)}점`} sub={totalPoints ? `${pct((stats.avgScore || 0) / totalPoints)}` : null} />
          <StatCard label="최고" value={`${stats.maxScore ?? "-"}점`} />
          <StatCard label="최저" value={`${stats.minScore ?? "-"}점`} />
          <StatCard label="표준편차" value={fmt(stats.stdDev, 2)} />
        </div>

        {/* 학년별 통계 */}
        {stats.gradeStats && Object.keys(stats.gradeStats).length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13 }}>학년별 통계</h4>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={{ padding: "4px 8px" }}>학년</th>
                  <th style={{ padding: "4px 8px" }}>응시 수</th>
                  <th style={{ padding: "4px 8px" }}>평균</th>
                  <th style={{ padding: "4px 8px" }}>최고</th>
                  <th style={{ padding: "4px 8px" }}>최저</th>
                  <th style={{ padding: "4px 8px" }}>표준편차</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.gradeStats).map(([grade, g]) => (
                  <tr key={grade} style={{ borderTop: "1px solid #f3f4f6" }}>
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
              padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db",
              background: tab === "students" ? "#2563eb" : "#fff",
              color: tab === "students" ? "#fff" : "#111827",
              cursor: "pointer",
            }}
          >학생별 ({students.length})</button>
          <button
            onClick={() => setTab("questions")}
            style={{
              padding: "6px 12px", borderRadius: 6, border: "1px solid #d1d5db",
              background: tab === "questions" ? "#2563eb" : "#fff",
              color: tab === "questions" ? "#fff" : "#111827",
              cursor: "pointer",
            }}
          >문항별 ({questions.length})</button>
        </div>

        {tab === "students" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={{ padding: "4px 6px" }}>이름</th>
                  <th style={{ padding: "4px 6px" }}>학교</th>
                  <th style={{ padding: "4px 6px" }}>학년</th>
                  <th style={{ padding: "4px 6px" }}>기관</th>
                  <th style={{ padding: "4px 6px" }}>응시일시</th>
                  <th style={{ padding: "4px 6px" }}>점수</th>
                  <th style={{ padding: "4px 6px" }}>정답률</th>
                  <th style={{ padding: "4px 6px" }}>영역별</th>
                  <th style={{ padding: "4px 6px" }}>틀린 번호</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.userId} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "4px 6px", fontWeight: 600 }}>{s.userName || "-"}</td>
                    <td style={{ padding: "4px 6px" }}>{s.school || "-"}</td>
                    <td style={{ padding: "4px 6px" }}>{s.grade || "-"}</td>
                    <td style={{ padding: "4px 6px" }}>{s.orgName || "본사"}</td>
                    <td style={{ padding: "4px 6px", color: "#6b7280" }}>
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString("ko-KR") : "-"}
                    </td>
                    <td style={{ padding: "4px 6px", fontWeight: 600 }}>{s.score} / {s.totalPoints}</td>
                    <td style={{ padding: "4px 6px" }}>{pct(s.accuracy)}</td>
                    <td style={{ padding: "4px 6px", color: "#374151" }}>
                      {Object.entries(s.domainScores || {}).map(([dom, d]) => (
                        <span key={dom} style={{ marginRight: 8 }}>
                          {dom}: <b>{d.score}</b>/{d.maxScore}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: "4px 6px", color: "#dc2626" }}>
                      {(s.wrongQuestionNumbers || []).join(", ") || "-"}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>응시자 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "questions" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
            <table style={{ width: "100%", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={{ padding: "4px 6px" }}>번호</th>
                  <th style={{ padding: "4px 6px" }}>유형</th>
                  <th style={{ padding: "4px 6px" }}>영역</th>
                  <th style={{ padding: "4px 6px" }}>배점</th>
                  <th style={{ padding: "4px 6px" }}>정답</th>
                  <th style={{ padding: "4px 6px" }}>정답률</th>
                  <th style={{ padding: "4px 6px" }}>오답률</th>
                  <th style={{ padding: "4px 6px" }}>응시</th>
                  <th style={{ padding: "4px 6px" }}>선택지 분포</th>
                  <th style={{ padding: "4px 6px" }}>역량</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.number} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "4px 6px", fontWeight: 600 }}>{q.number}</td>
                    <td style={{ padding: "4px 6px" }}>{q.type}</td>
                    <td style={{ padding: "4px 6px" }}>{q.domain || "-"}{q.subDomain ? ` / ${q.subDomain}` : ""}</td>
                    <td style={{ padding: "4px 6px" }}>{q.points}</td>
                    <td style={{ padding: "4px 6px" }}>{q.correctAnswer || "-"}</td>
                    <td style={{ padding: "4px 6px", color: q.correctRate >= 0.7 ? "#059669" : q.correctRate >= 0.4 ? "#d97706" : "#dc2626" }}>
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
                              marginRight: 6,
                              padding: "1px 5px",
                              background: isCorrect ? "#d1fae5" : "#fee2e2",
                              color: isCorrect ? "#065f46" : "#991b1b",
                              borderRadius: 3,
                              cursor: tip ? "help" : "default",
                            }}
                          >{c}: {n}</span>
                        );
                      })}
                    </td>
                    <td style={{ padding: "4px 6px", color: "#6b7280" }}>
                      {Object.entries(q.competencyVector || {})
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([k, v]) => `${k} ${fmt(v, 2)}`)
                        .join(" / ") || "-"}
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>문항 분석 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
