function LearningRecommendation({ report }) {
  const level = report.recommendedLevel;
  const tci = report.rawTci;

  const getAdvice = () => {
    if (tci >= 75) return "높은 역량을 보유하고 있습니다. 고난도 문항과 심화 학습을 통해 최상위권을 목표로 하세요.";
    if (tci >= 60) return "전반적으로 양호한 수준입니다. 취약 역량을 집중 보강하면 큰 폭의 성장이 가능합니다.";
    if (tci >= 45) return "기초 역량은 갖추고 있으나 전반적인 보강이 필요합니다. 기본 개념부터 차근차근 학습하세요.";
    return "기초 역량 강화가 우선입니다. 쉬운 지문부터 시작하여 기본기를 다지는 것을 추천합니다.";
  };

  const weakAreas = report.weakCompetencies || [];

  return (
    <div className="diag-report-section">
      <h2>추천 학습 방향</h2>
      <div className="learning-rec-card">
        {level && (
          <div className="rec-level">
            <span className="rec-level-label">추천 학습 레벨</span>
            <span className="rec-level-value">{level.label}</span>
          </div>
        )}
        <p className="rec-advice">{getAdvice()}</p>

        {weakAreas.length > 0 && (
          <div className="rec-weak-areas">
            <div className="rec-weak-title">우선 보강 영역</div>
            <ul>
              {weakAreas.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rec-notice">
          상세 추천 학습 콘텐츠는 추후 업데이트될 예정입니다.
        </div>
      </div>
    </div>
  );
}

export default LearningRecommendation;
