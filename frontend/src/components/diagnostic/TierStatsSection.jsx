function TierStatsSection({ statistics, percentiles }) {
  if (!statistics) return null;

  return (
    <div className="diag-report-section">
      <h2>전체 응시자 통계</h2>
      <p className="tier-stats-subtitle">
        같은 단계 · 학년에 맞는 응시자 {statistics.totalSessions}명 기준
      </p>
      <div className="tier-stats-grid">
        <StatCard
          title="TCI 종합"
          stats={statistics.tciStats}
          percentile={percentiles?.tciPercentile}
        />
        <StatCard
          title="정답률"
          stats={statistics.accuracyStats}
          percentile={percentiles?.accuracyPercentile}
          unit="%"
        />
      </div>
    </div>
  );
}

function StatCard({ title, stats, percentile, unit = "점" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-row">
        <span className="stat-label">평균</span>
        <span className="stat-value">{stats.average.toFixed(1)}{unit}</span>
      </div>
      <div className="stat-card-row">
        <span className="stat-label">최고</span>
        <span className="stat-value stat-high">{stats.max.toFixed(1)}{unit}</span>
      </div>
      <div className="stat-card-row">
        <span className="stat-label">최저</span>
        <span className="stat-value stat-low">{stats.min.toFixed(1)}{unit}</span>
      </div>
      {percentile != null && (
        <div className="stat-card-percentile">
          상위 {percentile.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default TierStatsSection;
