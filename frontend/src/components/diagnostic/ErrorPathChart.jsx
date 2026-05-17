import {
  READ_WRONG_PATTERN_LABELS,
  LIT_WRONG_PATTERN_LABELS,
  WRONG_PATTERN_ADVICE,
} from "../../constants/questionBankCodes";

// D1~D10 (비문학) + L1~L8 (문학) 함정 패턴 코드 → 사람 친화적 라벨 + 조언
const PATH_LABEL = { ...READ_WRONG_PATTERN_LABELS, ...LIT_WRONG_PATTERN_LABELS };

function ErrorPathChart({ paths = [] }) {
  if (paths.length === 0) return null;

  const maxVal = Math.max(...paths.map((p) => p.contribution), 1);

  return (
    <ul className="bottleneck-paths">
      {paths.map((p, i) => {
        const label = PATH_LABEL[p.path] || p.path;
        const advice = WRONG_PATTERN_ADVICE[p.path];
        return (
          <li key={i} className="bottleneck-path-item">
            <div className="bottleneck-path-row">
              <span className="bottleneck-path-label" title={label}>{label}</span>
              <span className="path-val">
                <span
                  style={{
                    display: "inline-block",
                    width: `${Math.round((p.contribution / maxVal) * 60)}px`,
                    height: 8,
                    background: "#ef5350",
                    borderRadius: 4,
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                {p.contribution.toFixed(1)}
              </span>
            </div>
            {advice ? <div className="bottleneck-path-advice">{advice}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default ErrorPathChart;
