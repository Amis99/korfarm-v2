export default function ReportAreaSection({ areaStats }) {
  if (!areaStats || areaStats.length === 0) return null;

  const totalCount = areaStats.reduce((s, a) => s + a.activityCount, 0);

  return (
    <div className="ur-area-section">
      <h3>영역 분석</h3>
      <table>
        <thead>
          <tr>
            <th>영역</th>
            <th>학습 수</th>
            <th>평균 점수</th>
            <th>비중</th>
          </tr>
        </thead>
        <tbody>
          {areaStats.map((as_) => (
            <tr key={as_.areaKey}>
              <td style={{ fontWeight: 600 }}>{as_.areaLabel}</td>
              <td>{as_.activityCount}회</td>
              <td style={{ fontWeight: 700 }}>{as_.averageScore?.toFixed(1)}점</td>
              <td>
                <div className="ur-ratio-bar-wrap">
                  <div
                    className="ur-ratio-bar"
                    style={{ width: `${totalCount > 0 ? (as_.activityCount / totalCount * 100) : 0}%` }}
                  />
                  <span className="ur-ratio-text">
                    {totalCount > 0 ? (as_.activityCount / totalCount * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
