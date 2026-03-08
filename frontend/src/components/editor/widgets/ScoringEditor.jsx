/**
 * 스코어링 (correctDeltaSec / wrongDeltaSec) 편집
 */
export default function ScoringEditor({ scoring = {}, pathPrefix, updateField }) {
  const scoringPath = `${pathPrefix}.scoring`;

  const handleChange = (field, value) => {
    const num = value === "" ? undefined : Number(value);
    updateField(`${scoringPath}.${field}`, num);
  };

  return (
    <div className="ce-scoring-row" data-field-path={scoringPath}>
      <label>
        정답 시간
        <input
          className="ce-scoring-input"
          type="number"
          value={scoring.correctDeltaSec ?? ""}
          onChange={(e) => handleChange("correctDeltaSec", e.target.value)}
          placeholder="초"
        />
      </label>
      <label>
        오답 시간
        <input
          className="ce-scoring-input"
          type="number"
          value={scoring.wrongDeltaSec ?? ""}
          onChange={(e) => handleChange("wrongDeltaSec", e.target.value)}
          placeholder="초"
        />
      </label>
    </div>
  );
}
