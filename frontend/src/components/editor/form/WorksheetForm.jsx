import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";
import ScoringEditor from "../widgets/ScoringEditor";
import DraggableList from "../widgets/DraggableList";

/**
 * 퀴즈/워크시트 편집 폼 (오른쪽 패널)
 */
export default function WorksheetForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem, reorderItems } = editor;
  const questions = content?.questions || [];

  const handleAddQuestion = () => {
    const newQ = {
      id: `q${Date.now()}`,
      stem: "",
      choices: [
        { id: `c${Date.now()}a`, text: "" },
        { id: `c${Date.now()}b`, text: "" },
        { id: `c${Date.now()}c`, text: "" },
        { id: `c${Date.now()}d`, text: "" },
        { id: `c${Date.now()}e`, text: "" },
      ],
      answerId: `c${Date.now()}a`,
    };
    addItem("questions", questions.length, newQ);
  };

  const handleRemoveQuestion = (idx) => {
    if (!confirm(`문항 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("questions", idx);
  };

  const renderQuestion = (q, i) => {
    const path = `questions[${i}]`;
    const isActive = focusPath && focusPath.startsWith(path);

    return (
      <CollapsibleSection
        key={q.id || i}
        title={`문항 ${i + 1}`}
        defaultOpen={isActive}
      >
        <div data-field-path={path}>
          {/* 발문 */}
          <div className="ce-form-section">
            <label className="ce-form-label">발문 (stem)</label>
            <textarea
              className="ce-form-textarea"
              value={q.stem || q.prompt || ""}
              onChange={(e) => updateField(`${path}.stem`, e.target.value)}
              data-field-path={`${path}.stem`}
              rows={2}
            />
          </div>

          {/* 지문 (선택) */}
          <div className="ce-form-section">
            <label className="ce-form-label">지문 (선택)</label>
            <textarea
              className="ce-form-textarea"
              value={q.passage || ""}
              onChange={(e) => updateField(`${path}.passage`, e.target.value)}
              data-field-path={`${path}.passage`}
              rows={2}
              placeholder="지문이 있으면 입력"
            />
          </div>

          {/* 하이라이트 (선택) — 지문 내 강조 단어 */}
          <div className="ce-form-section">
            <label className="ce-form-label">하이라이트 텍스트</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                className="ce-form-input"
                style={{ flex: 1 }}
                value={q.highlight?.text || ""}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  updateField(`${path}.highlight`, val ? { text: val } : undefined);
                }}
                placeholder="지문에서 강조할 단어 (비우면 하이라이트 없음)"
                data-field-path={`${path}.highlight`}
              />
              {q.passage && (
                <button
                  type="button"
                  className="ce-btn ce-btn-secondary"
                  style={{ fontSize: 11, whiteSpace: "nowrap" }}
                  onClick={() => {
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed) {
                      const text = sel.toString().trim();
                      if (text && q.passage.includes(text)) {
                        updateField(`${path}.highlight`, { text });
                        sel.removeAllRanges();
                      }
                    }
                  }}
                >
                  드래그 적용
                </button>
              )}
            </div>
          </div>

          {/* 선택지 + 정답 */}
          <div className="ce-form-section">
            <label className="ce-form-label">선택지</label>
            <ChoiceEditor
              choices={q.choices || []}
              answerId={q.answerId}
              pathPrefix={path}
              updateField={updateField}
              addItem={addItem}
              removeItem={removeItem}
            />
          </div>

          {/* 스코어링 */}
          <div className="ce-form-section">
            <label className="ce-form-label">스코어링</label>
            <ScoringEditor
              scoring={q.scoring || {}}
              pathPrefix={path}
              updateField={updateField}
            />
          </div>

          {/* 삭제 */}
          <button
            className="ce-btn ce-btn-danger"
            style={{ marginTop: 8 }}
            onClick={() => handleRemoveQuestion(i)}
          >
            문항 삭제
          </button>
        </div>
      </CollapsibleSection>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        문항 편집 ({questions.length}개)
      </div>
      <DraggableList
        items={questions}
        onReorder={(from, to) => reorderItems("questions", from, to)}
        renderItem={renderQuestion}
      />
      <button className="ce-add-btn" onClick={handleAddQuestion}>
        + 문항 추가
      </button>
    </div>
  );
}
