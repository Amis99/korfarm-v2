function TciGaugeChart({ tci, recommendation, statistics, accuracyRate }) {
  const pct = Math.min(Math.max(tci, 0), 100);

  return (
    <div className="tci-gauge">
      <div className="tci-gauge-value">{tci.toFixed(1)}</div>
      <div className="tci-gauge-label">점수</div>

      <div className="tci-gauge-bar">
        <div className="tci-gauge-fill" style={{ width: `${pct}%` }} />
        {/* 평균/최고/최저 마커 */}
        {statistics?.tciStats && (
          <>
            <div className="tci-marker avg" style={{ left: `${statistics.tciStats.average}%` }} title={`평균: ${statistics.tciStats.average.toFixed(1)}`}>
              <div className="tci-marker-line" />
              <div className="tci-marker-label">평균</div>
            </div>
            <div className="tci-marker high-mark" style={{ left: `${statistics.tciStats.max}%` }} title={`최고: ${statistics.tciStats.max.toFixed(1)}`}>
              <div className="tci-marker-line" />
            </div>
            <div className="tci-marker low-mark" style={{ left: `${statistics.tciStats.min}%` }} title={`최저: ${statistics.tciStats.min.toFixed(1)}`}>
              <div className="tci-marker-line" />
            </div>
          </>
        )}
      </div>
      <div className="tci-gauge-markers">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      <div className="tci-interpretation">
        {tci >= 85 && "매우 우수한 국어 종합 역량을 보유하고 있습니다."}
        {tci >= 70 && tci < 85 && "우수한 역량입니다. 취약 부분을 보강하면 최상위권 진입이 가능합니다."}
        {tci >= 50 && tci < 70 && "평균 수준의 역량입니다. 기본기 강화와 약점 보완이 필요합니다."}
        {tci >= 30 && tci < 50 && "기초 역량 보강이 필요합니다. 체계적 학습을 시작하세요."}
        {tci < 30 && "기초부터 차근차근 학습하는 것이 중요합니다."}
      </div>

      {accuracyRate != null && (
        <div className="tci-accuracy-note">
          {accuracyRate >= 85 && "높은 정답률을 기록했습니다."}
          {accuracyRate >= 65 && accuracyRate < 85 && "양호한 정답률입니다."}
          {accuracyRate < 65 && "정답률 향상이 필요합니다."}
        </div>
      )}

      {recommendation && (
        <div className="tci-recommendation">추천 레벨: {recommendation}</div>
      )}
    </div>
  );
}

export default TciGaugeChart;
