function TciGaugeChart({ tci, rawTci, confidence, recommendation, statistics }) {
  const pct = Math.min(Math.max(tci, 0), 100);
  const rawPct = Math.min(Math.max(rawTci || tci, 0), 100);
  const diff = tci - (rawTci || tci);

  return (
    <div className="tci-gauge">
      <div className="tci-gauge-value">{tci.toFixed(1)}</div>
      <div className="tci-gauge-label">
        종합 역량 지수 (TCI)
        {confidence < 1 && <span style={{ marginLeft: 8, fontSize: 11, color: "#a09588" }}>
          신뢰도 {(confidence * 100).toFixed(0)}%
        </span>}
      </div>

      {rawTci != null && Math.abs(diff) > 0.1 && (
        <div className="tci-raw-compare">
          원점수 {rawPct.toFixed(1)} → 보정 후 {tci.toFixed(1)}
          <span className={diff > 0 ? "tci-diff-up" : "tci-diff-down"}>
            ({diff > 0 ? "+" : ""}{diff.toFixed(1)})
          </span>
        </div>
      )}

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
        <span>35</span>
        <span>45</span>
        <span>55</span>
        <span>65</span>
        <span>100</span>
      </div>

      <div className="tci-interpretation">
        {tci >= 75 && "매우 우수한 국어 종합 역량을 보유하고 있습니다."}
        {tci >= 60 && tci < 75 && "우수한 역량입니다. 취약 부분을 보강하면 최상위권 진입이 가능합니다."}
        {tci >= 45 && tci < 60 && "평균 수준의 역량입니다. 기본기 강화와 약점 보완이 필요합니다."}
        {tci >= 35 && tci < 45 && "기초 역량 보강이 필요합니다. 체계적 학습을 시작하세요."}
        {tci < 35 && "기초부터 차근차근 학습하는 것이 중요합니다."}
      </div>

      {recommendation && (
        <div className="tci-recommendation">추천 레벨: {recommendation}</div>
      )}
    </div>
  );
}

export default TciGaugeChart;
