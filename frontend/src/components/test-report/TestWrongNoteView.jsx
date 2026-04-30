import { useMemo } from "react";
import WrongNoteDomainChart from "./WrongNoteDomainChart";
import { getDomainColor } from "./domainColors";

/**
 * 오답 노트 view 컴포넌트 — 데이터 fetch 분리. 페이지/모달 양쪽 재사용.
 *
 * props:
 *  - data: 오답 노트 데이터 (서버 응답)
 *  - userName: 응시자 이름
 *  - embedded: true이면 모달용 — 라우팅 링크 숨김
 *  - onSwitchToReport: 성적표 모달로 전환
 *  - onPrint: 인쇄 핸들러
 */
export default function TestWrongNoteView({
  data,
  userName,
  embedded = false,
  onSwitchToReport,
  onPrint,
}) {
  const wrongStats = useMemo(() => {
    if (!data?.wrongItems) return null;
    const items = data.wrongItems;
    const totalWrong = items.length;
    const lostPoints = items.reduce((sum, i) => sum + (i.points || 0), 0);
    const domainGroups = {};
    for (const item of items) {
      const d = item.domain || "기타";
      domainGroups[d] = (domainGroups[d] || 0) + 1;
    }
    const domainCount = Object.keys(domainGroups).length;
    const topDomain = Object.entries(domainGroups).sort((a, b) => b[1] - a[1])[0];
    return { totalWrong, lostPoints, domainGroups, domainCount, topDomain: topDomain?.[0] || "-" };
  }, [data]);

  if (!data) return null;

  return (
    <div className={embedded ? "ts-report-embedded" : "ts-report-page"}>
      <div className="ts-report-header">
        <h1>오답 노트</h1>
        <h2>{data.testTitle}</h2>
        {userName && <p className="ts-report-student">{userName}</p>}
      </div>

      {data.wrongItems.length === 0 ? (
        <div className="ts-center" style={{ marginTop: 40 }}>
          <p>틀린 문항이 없습니다. 만점입니다!</p>
        </div>
      ) : (
        <>
          {wrongStats && (
            <div className="ts-report-summary">
              <div className="ts-summary-card ts-summary-primary">
                <span className="ts-summary-label">오답 수</span>
                <strong className="ts-summary-value">{wrongStats.totalWrong}문항</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">손실 배점</span>
                <strong className="ts-summary-value">{wrongStats.lostPoints}점</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">오답 영역 수</span>
                <strong className="ts-summary-value">{wrongStats.domainCount}개</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">최다 오답 영역</span>
                <strong className="ts-summary-value" style={{ fontSize: 20 }}>{wrongStats.topDomain}</strong>
              </div>
            </div>
          )}

          {wrongStats && Object.keys(wrongStats.domainGroups).length >= 2 && (
            <div style={{ marginBottom: 28 }}>
              <WrongNoteDomainChart domainGroups={wrongStats.domainGroups} />
            </div>
          )}

          <div className="ts-wrong-list">
            {data.wrongItems.map(item => {
              const domainColor = getDomainColor(item.domain);
              return (
                <div key={item.questionNumber} className="ts-wrong-card">
                  <div className="ts-wrong-header">
                    <span className="ts-wrong-num">{item.questionNumber}번</span>
                    <span className="ts-wrong-type">{item.type}</span>
                    {item.domain && (
                      <span
                        className="ts-wrong-domain"
                        style={{ backgroundColor: domainColor.bg, color: domainColor.main, borderColor: domainColor.main }}
                      >
                        {item.domain}
                      </span>
                    )}
                    <span className="ts-wrong-pts">{item.points}점</span>
                  </div>

                  {item.passage && (
                    <div className="ts-wrong-passage">
                      <span className="ts-label">지문/작품:</span> {item.passage}
                    </div>
                  )}

                  <div className="ts-wrong-answers">
                    <div className="ts-wrong-my">
                      <span className="ts-label">내 답:</span>
                      <span className="ts-wrong-val ts-wrong-mine">{item.myAnswer || "-"}</span>
                    </div>
                    <div className="ts-wrong-correct">
                      <span className="ts-label">정답:</span>
                      <span className="ts-wrong-val ts-wrong-right">{item.correctAnswer}</span>
                    </div>
                  </div>

                  {item.intent && (
                    <div className="ts-wrong-intent">
                      <span className="ts-label">출제 의도:</span> {item.intent}
                    </div>
                  )}

                  <div className="ts-wrong-feedback">
                    <span className="ts-label">해설:</span>
                    <pre className="ts-wrong-feedback-text">{item.feedback}</pre>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="ts-report-actions ts-no-print">
        <button className="ts-btn ts-btn-outline" onClick={() => onPrint ? onPrint() : window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        {onSwitchToReport && (
          <button className="ts-btn ts-btn-outline" onClick={onSwitchToReport}>
            <span className="material-symbols-outlined">assessment</span>
            성적표
          </button>
        )}
      </div>
    </div>
  );
}
