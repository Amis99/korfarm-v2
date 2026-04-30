import { useMemo } from "react";
import DomainRadarChart from "./DomainRadarChart";
import ScoreTrendChart from "./ScoreTrendChart";
import { getDomainColor } from "./domainColors";

/**
 * 성적표 view 컴포넌트 — 데이터 fetch 분리. 페이지(TestReportPage) + 모달(AdminTestStatisticsPage) 양쪽 재사용.
 *
 * props:
 *  - report: 성적표 데이터 (서버 응답)
 *  - userName: 화면에 표시할 응시자 이름 (없으면 숨김)
 *  - testHistory: 추이 차트용 시험 이력 (없으면 차트 숨김)
 *  - embedded: true이면 모달용 — 상단 [돌아가기], 하단 [목록으로/학습시작] 등 라우팅 링크 숨김
 *  - onSwitchToWrongNote: 오답 노트 모달로 전환 (embedded일 때 사용)
 *  - onPrint: 인쇄 핸들러 (없으면 window.print)
 */
export default function TestReportView({
  report,
  userName,
  testHistory = [],
  embedded = false,
  onSwitchToWrongNote,
  onPrint,
}) {
  const typeStats = useMemo(() => {
    if (!report?.details) return { obj: { score: 0, total: 0 }, sub: { score: 0, total: 0 } };
    const obj = { score: 0, total: 0 };
    const sub = { score: 0, total: 0 };
    for (const d of report.details) {
      const earned = d.earnedPoints != null ? d.earnedPoints : (d.isCorrect ? d.points : 0);
      const isSubjective = d.type === "서술형" || d.type === "서술";
      if (isSubjective) { sub.score += earned; sub.total += d.points; }
      else { obj.score += earned; obj.total += d.points; }
    }
    return { obj, sub };
  }, [report]);

  if (!report) return null;
  const domains = Object.entries(report.domainScores || {});

  return (
    <div className={embedded ? "ts-report-embedded" : "ts-report-page"}>
      <div className="ts-report-header">
        <h1>성적표</h1>
        <h2>{report.testTitle}</h2>
        {userName && <p className="ts-report-student">{userName}</p>}
      </div>

      {/* 요약 카드 5개 */}
      <div className="ts-report-summary">
        <div className="ts-summary-card ts-summary-primary">
          <span className="ts-summary-label">총점</span>
          <strong className="ts-summary-value">{report.score} <small>/ {report.totalPoints}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">정답 수</span>
          <strong className="ts-summary-value">{report.correctCount} <small>/ {report.totalQuestions}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">정답률</span>
          <strong className="ts-summary-value">{report.accuracy}%</strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">객관식</span>
          <strong className="ts-summary-value">{typeStats.obj.score} <small>/ {typeStats.obj.total}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">서술형</span>
          <strong className="ts-summary-value">{typeStats.sub.score} <small>/ {typeStats.sub.total}</small></strong>
        </div>
      </div>

      {/* 레이더 + 추이 차트 (embedded면 추이는 history 없을 때 자동 숨김) */}
      <div className="ts-charts-row">
        {domains.length >= 2 && (
          <DomainRadarChart domainScores={report.domainScores} />
        )}
        {!embedded && <ScoreTrendChart history={testHistory} />}
      </div>

      {/* 영역별 점수 테이블 */}
      {domains.length > 0 && (
        <section className="ts-report-section">
          <h3>영역별 점수</h3>
          <table className="ts-table">
            <thead>
              <tr>
                <th>영역</th><th>득점</th><th>만점</th><th>정답</th><th>정답률</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(([domain, ds]) => {
                const rate = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
                const color = getDomainColor(domain);
                return (
                  <tr key={domain}>
                    <td>{domain}</td>
                    <td>{ds.score}</td>
                    <td>{ds.maxScore}</td>
                    <td>{ds.correct}/{ds.total}</td>
                    <td>
                      <div className="ts-domain-bar-cell">
                        <div className="ts-domain-bar-bg">
                          <div className="ts-domain-bar-fill" style={{ width: `${rate}%`, backgroundColor: color.main }} />
                        </div>
                        <span className="ts-domain-bar-label">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="ts-report-section">
        <h3>문항별 결과</h3>
        <table className="ts-table ts-table-detail">
          <thead>
            <tr>
              <th>번호</th><th>영역</th><th>유형</th><th>내 답</th><th>정답</th><th>배점</th><th>결과</th>
            </tr>
          </thead>
          <tbody>
            {(report.details || []).map(d => (
              <tr key={d.questionNumber} className={d.isCorrect ? "" : "ts-row-wrong"}>
                <td>{d.questionNumber}</td>
                <td>{d.domain || "-"}</td>
                <td>{d.type}</td>
                <td>{d.myAnswer || "-"}</td>
                <td>{d.correctAnswer}</td>
                <td>{d.points}</td>
                <td>
                  <span className={`ts-result-mark ${d.isCorrect ? "ts-correct" : "ts-wrong"}`}>
                    {d.isCorrect ? "O" : "X"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="ts-report-actions ts-no-print">
        <button className="ts-btn ts-btn-outline" onClick={() => onPrint ? onPrint() : window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        {onSwitchToWrongNote && (
          <button className="ts-btn ts-btn-outline" onClick={onSwitchToWrongNote}>
            <span className="material-symbols-outlined">error_outline</span>
            오답 노트
          </button>
        )}
      </div>
    </div>
  );
}
