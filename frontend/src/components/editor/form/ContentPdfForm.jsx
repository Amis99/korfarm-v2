import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";
import ScoringEditor from "../widgets/ScoringEditor";

/**
 * 내용 숙지 PDF 편집 폼 (오른쪽 패널)
 * pdfUrl + layout + questions[]
 */
export default function ContentPdfForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem } = editor;
  const questions = content?.questions || [];

  const handleAddQuestion = () => {
    const newQ = {
      id: `q${Date.now()}`,
      type: "MULTI_CHOICE",
      stem: "",
      choices: [
        { id: `c${Date.now()}a`, text: "" },
        { id: `c${Date.now()}b`, text: "" },
        { id: `c${Date.now()}c`, text: "" },
        { id: `c${Date.now()}d`, text: "" },
        { id: `c${Date.now()}e`, text: "" },
      ],
      answerId: `c${Date.now()}a`,
      scoring: { correctDeltaSec: -10, wrongDeltaSec: 5 },
    };
    addItem("questions", questions.length, newQ);
  };

  const handleRemoveQuestion = (idx) => {
    if (!confirm(`문항 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("questions", idx);
  };

  return (
    <div>
      {/* PDF URL */}
      <div className="ce-form-section" data-field-path="pdfUrl">
        <label className="ce-form-label">PDF URL</label>
        <input
          className="ce-form-input"
          value={content?.pdfUrl || ""}
          onChange={(e) => updateField("pdfUrl", e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* layout */}
      <div className="ce-form-section" data-field-path="settings">
        <label className="ce-form-label">레이아웃</label>
        <select
          className="ce-form-select"
          value={content?.layout || "EXAM_SHEET"}
          onChange={(e) => updateField("layout", e.target.value)}
        >
          <option value="EXAM_SHEET">EXAM_SHEET</option>
          <option value="SIMPLE">SIMPLE</option>
        </select>
      </div>

      {/* requireStart */}
      <div className="ce-form-section">
        <label className="ce-form-label">시작 요구</label>
        <select
          className="ce-form-select"
          value={content?.requireStart ? "true" : "false"}
          onChange={(e) => updateField("requireStart", e.target.value === "true")}
        >
          <option value="true">예</option>
          <option value="false">아니오</option>
        </select>
      </div>

      {/* 문항 */}
      <div style={{ marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        문항 편집 ({questions.length}개)
      </div>

      {questions.map((q, qi) => {
        const qPath = `questions[${qi}]`;
        const isActive = focusPath && focusPath.startsWith(qPath);

        return (
          <CollapsibleSection
            key={q.id || qi}
            title={`문항 ${qi + 1} — ${q.type || "MULTI_CHOICE"}`}
            defaultOpen={isActive}
          >
            <div data-field-path={qPath}>
              {/* 문항 유형 */}
              <div className="ce-form-section">
                <label className="ce-form-label">유형</label>
                <select
                  className="ce-form-select"
                  value={q.type || "MULTI_CHOICE"}
                  onChange={(e) => updateField(`${qPath}.type`, e.target.value)}
                >
                  <option value="MULTI_CHOICE">객관식 (MULTI_CHOICE)</option>
                  <option value="FILL_BLANKS">빈칸 채우기 (FILL_BLANKS)</option>
                  <option value="SENTENCE_BUILDING">문장 구성 (SENTENCE_BUILDING)</option>
                </select>
              </div>

              {/* 발문 */}
              <div className="ce-form-section">
                <label className="ce-form-label">발문 (stem)</label>
                <textarea
                  className="ce-form-textarea"
                  value={q.stem || ""}
                  onChange={(e) => updateField(`${qPath}.stem`, e.target.value)}
                  rows={2}
                />
              </div>

              {/* 지문 (선택) */}
              <div className="ce-form-section">
                <label className="ce-form-label">지문 (선택)</label>
                <textarea
                  className="ce-form-textarea"
                  value={q.passage || ""}
                  onChange={(e) => updateField(`${qPath}.passage`, e.target.value)}
                  rows={2}
                  placeholder="지문이 있으면 입력"
                />
              </div>

              {/* 유형별 편집 */}
              {(q.type === "MULTI_CHOICE" || !q.type) && (
                <div className="ce-form-section">
                  <label className="ce-form-label">선택지</label>
                  <ChoiceEditor
                    choices={q.choices || []}
                    answerId={q.answerId}
                    pathPrefix={qPath}
                    updateField={updateField}
                    addItem={addItem}
                    removeItem={removeItem}
                  />
                </div>
              )}

              {q.type === "FILL_BLANKS" && (
                <>
                  <div className="ce-form-section">
                    <label className="ce-form-label">템플릿 (빈칸은 ___로 표시)</label>
                    <textarea
                      className="ce-form-textarea"
                      value={q.template || ""}
                      onChange={(e) => updateField(`${qPath}.template`, e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="ce-form-section">
                    <label className="ce-form-label">빈칸 ({(q.blanks || []).length}개)</label>
                    {(q.blanks || []).map((b, bi) => {
                      const bPath = `${qPath}.blanks[${bi}]`;
                      return (
                        <div key={bi} style={{ marginBottom: 8, padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                          <label className="ce-form-label">빈칸 {bi + 1} 선택지</label>
                          <ChoiceEditor
                            choices={b.choices || []}
                            answerId={b.answerId}
                            pathPrefix={bPath}
                            updateField={updateField}
                            addItem={addItem}
                            removeItem={removeItem}
                          />
                          <button
                            className="ce-choice-del"
                            onClick={() => removeItem(`${qPath}.blanks`, bi)}
                            style={{ fontSize: 12 }}
                          >
                            빈칸 삭제
                          </button>
                        </div>
                      );
                    })}
                    <button
                      className="ce-add-btn"
                      onClick={() =>
                        addItem(`${qPath}.blanks`, (q.blanks || []).length, {
                          choices: [
                            { id: `c${Date.now()}a`, text: "" },
                            { id: `c${Date.now()}b`, text: "" },
                          ],
                          answerId: "",
                        })
                      }
                    >
                      + 빈칸 추가
                    </button>
                  </div>
                </>
              )}

              {q.type === "SENTENCE_BUILDING" && (
                <div className="ce-form-section">
                  <label className="ce-form-label">문장 파트 ({(q.sentenceParts || []).length}개)</label>
                  {(q.sentenceParts || []).map((sp, spi) => {
                    const spPath = `${qPath}.sentenceParts[${spi}]`;
                    return (
                      <div key={spi} style={{ marginBottom: 8, padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                        <div className="ce-form-row">
                          <div>
                            <label className="ce-form-label">정답</label>
                            <input
                              className="ce-form-input"
                              value={sp.answer || ""}
                              onChange={(e) => updateField(`${spPath}.answer`, e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="ce-form-label">교란어 (쉼표 구분)</label>
                            <input
                              className="ce-form-input"
                              value={(sp.distractors || []).join(",")}
                              onChange={(e) => {
                                const ds = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                                updateField(`${spPath}.distractors`, ds);
                              }}
                            />
                          </div>
                          <button
                            className="ce-choice-del"
                            onClick={() => removeItem(`${qPath}.sentenceParts`, spi)}
                            title="삭제"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="ce-add-btn"
                    onClick={() =>
                      addItem(`${qPath}.sentenceParts`, (q.sentenceParts || []).length, {
                        answer: "",
                        distractors: [],
                      })
                    }
                  >
                    + 파트 추가
                  </button>
                </div>
              )}

              {/* requireCorrect */}
              <div className="ce-form-section">
                <label className="ce-form-label">정답 필수</label>
                <select
                  className="ce-form-select"
                  value={q.requireCorrect ? "true" : "false"}
                  onChange={(e) => updateField(`${qPath}.requireCorrect`, e.target.value === "true")}
                >
                  <option value="false">아니오</option>
                  <option value="true">예</option>
                </select>
              </div>

              {/* 스코어링 */}
              <div className="ce-form-section">
                <label className="ce-form-label">스코어링</label>
                <ScoringEditor
                  scoring={q.scoring || {}}
                  pathPrefix={qPath}
                  updateField={updateField}
                />
              </div>

              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleRemoveQuestion(qi)}
              >
                문항 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}

      <button className="ce-add-btn" onClick={handleAddQuestion}>
        + 문항 추가
      </button>
    </div>
  );
}
