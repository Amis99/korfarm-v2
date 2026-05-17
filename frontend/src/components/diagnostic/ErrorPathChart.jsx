import { READ_WRONG_PATTERN_LABELS, LIT_WRONG_PATTERN_LABELS } from "../../constants/questionBankCodes";

// D1~D10 (비문학) + L1~L8 (문학) 함정 패턴 코드 → 사람 친화적 라벨
const PATH_LABEL = { ...READ_WRONG_PATTERN_LABELS, ...LIT_WRONG_PATTERN_LABELS };

function ErrorPathChart({ paths = [] }) {
  if (paths.length === 0) return null;

  const maxVal = Math.max(...paths.map(p => p.contribution), 1);

  return (
    <ul className="bottleneck-paths">
      {paths.map((p, i) => {
        const label = PATH_LABEL[p.path] || p.path;
        return (
          <li key={i}>
            <span title={label}>{label}</span>
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
          </li>
        );
      })}
    </ul>
  );
}

export default ErrorPathChart;
