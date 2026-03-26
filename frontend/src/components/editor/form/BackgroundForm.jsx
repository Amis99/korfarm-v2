import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";
import ScoringEditor from "../widgets/ScoringEditor";
import DraggableList from "../widgets/DraggableList";

/**
 * 배경지식 편집 폼 (오른쪽 패널)
 * passages[] 기반 + questions[] 레거시 fallback
 */
export default function BackgroundForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem, reorderItems } = editor;
  const passages = content?.passages || [];
  const legacyQuestions = content?.questions || [];
  const hasPassages = passages.length > 0 || legacyQuestions.length === 0;

  // --- passages 모드 ---

  const handleAddPassage = () => {
    const idx = passages.length;
    const newP = {
      id: `p${idx + 1}`,
      title: "",
      text: "",
      questions: [
        {
          id: `q1`,
          type: "MULTI_CHOICE",
          stem: "",
          choices: [
            { id: "A", text: "" },
            { id: "B", text: "" },
            { id: "C", text: "" },
            { id: "D", text: "" },
          ],
          answerId: "A",
          scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
        },
      ],
    };
    addItem("passages", idx, newP);
  };

  const handleRemovePassage = (idx) => {
    if (!confirm(`지문 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("passages", idx);
  };

  const handleAddQuestion = (pi) => {
    const questions = passages[pi]?.questions || [];
    const newQ = {
      id: `q${questions.length + 1}`,
      type: "MULTI_CHOICE",
      stem: "",
      choices: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    };
    addItem(`passages[${pi}].questions`, questions.length, newQ);
  };

  const handleRemoveQuestion = (pi, qi) => {
    if (!confirm(`문제 ${qi + 1}을 삭제하시겠습니까?`)) return;
    removeItem(`passages[${pi}].questions`, qi);
  };

  // 레거시 모드 핸들러
  const handleAddLegacyQ = () => {
    const newQ = {
      id: `q${Date.now()}`,
      type: "MULTI_CHOICE",
      stem: "",
      choices: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    };
    addItem("questions", legacyQuestions.length, newQ);
  };

  const handleRemoveLegacyQ = (idx) => {
    if (!confirm(`문항 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("questions", idx);
  };

  // passages 모드 렌더
  if (hasPassages) {
    const renderPassage = (p, pi) => {
      const pPath = `passages[${pi}]`;
      const isPActive = focusPath && focusPath.startsWith(pPath);
      const questions = p.questions || [];
      const textLen = p.text?.length || 0;
      const lenWarning = textLen > 0 && (textLen < 300 || textLen > 500);

      return (
        <CollapsibleSection
          key={p.id || pi}
          title={`지문 ${pi + 1} — ${p.title || "(제목 없음)"}`}
          count={questions.length}
          defaultOpen={isPActive}
        >
          <div data-field-path={pPath}>
            {/* 지문 제목 */}
            <div className="ce-form-section">
              <label className="ce-form-label">지문 제목</label>
              <input
                className="ce-form-input"
                value={p.title || ""}
                onChange={(e) => updateField(`${pPath}.title`, e.target.value)}
                data-field-path={`${pPath}.title`}
                placeholder="예: 눈은 정보의 창"
              />
            </div>

            {/* 지문 ID */}
            <div className="ce-form-section">
              <label className="ce-form-label">ID</label>
              <input
                className="ce-form-input"
                value={p.id || ""}
                onChange={(e) => updateField(`${pPath}.id`, e.target.value)}
                placeholder="p1, p2, ..."
                style={{ width: 100 }}
              />
            </div>

            {/* 지문 본문 */}
            <div className="ce-form-section">
              <label className="ce-form-label">
                지문 본문
                <span style={{ fontWeight: 400, marginLeft: 8, color: lenWarning ? "#ff6b6b" : "#6a7a6e" }}>
                  ({textLen}자{lenWarning ? " — 300~500자 권장" : ""})
                </span>
              </label>
              <textarea
                className="ce-form-textarea"
                value={p.text || ""}
                onChange={(e) => updateField(`${pPath}.text`, e.target.value)}
                data-field-path={`${pPath}.text`}
                rows={8}
                placeholder="지문 내용을 입력하세요 (300~500자 권장)"
              />
            </div>

            {/* 문제 목록 */}
            <div style={{ marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              문제 ({questions.length}개)
            </div>
            {questions.map((q, qi) => {
              const qPath = `${pPath}.questions[${qi}]`;
              const isQActive = focusPath && focusPath.startsWith(qPath);
              return (
                <CollapsibleSection
                  key={q.id || qi}
                  title={`Q${qi + 1}`}
                  defaultOpen={isQActive}
                >
                  <div data-field-path={qPath}>
                    <div className="ce-form-section">
                      <label className="ce-form-label">발문 (stem)</label>
                      <textarea
                        className="ce-form-textarea"
                        value={q.stem || ""}
                        onChange={(e) => updateField(`${qPath}.stem`, e.target.value)}
                        data-field-path={`${qPath}.stem`}
                        rows={2}
                      />
                    </div>
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
                      style={{ marginTop: 8, fontSize: 12 }}
                      onClick={() => handleRemoveQuestion(pi, qi)}
                    >
                      문제 삭제
                    </button>
                  </div>
                </CollapsibleSection>
              );
            })}
            <button
              className="ce-add-btn"
              style={{ fontSize: 12, marginTop: 4 }}
              onClick={() => handleAddQuestion(pi)}
            >
              + 문제 추가
            </button>

            {/* 지문 삭제 */}
            <button
              className="ce-btn ce-btn-danger"
              style={{ marginTop: 12 }}
              onClick={() => handleRemovePassage(pi)}
            >
              지문 삭제
            </button>
          </div>
        </CollapsibleSection>
      );
    };

    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
          지문 편집 ({passages.length}개)
        </div>
        <DraggableList
          items={passages}
          onReorder={(from, to) => reorderItems("passages", from, to)}
          renderItem={renderPassage}
        />
        <button className="ce-add-btn" onClick={handleAddPassage}>
          + 지문 추가
        </button>
      </div>
    );
  }

  // --- 레거시 모드 (questions만 있는 경우) ---
  const renderLegacyQ = (q, i) => {
    const path = `questions[${i}]`;
    const isActive = focusPath && focusPath.startsWith(path);
    return (
      <CollapsibleSection
        key={q.id || i}
        title={`문항 ${i + 1}`}
        defaultOpen={isActive}
      >
        <div data-field-path={path}>
          <div className="ce-form-section">
            <label className="ce-form-label">발문 (stem)</label>
            <textarea
              className="ce-form-textarea"
              value={q.stem || q.prompt || ""}
              onChange={(e) => updateField(`${path}.stem`, e.target.value)}
              rows={2}
            />
          </div>
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
          <div className="ce-form-section">
            <label className="ce-form-label">스코어링</label>
            <ScoringEditor
              scoring={q.scoring || {}}
              pathPrefix={path}
              updateField={updateField}
            />
          </div>
          <button
            className="ce-btn ce-btn-danger"
            style={{ marginTop: 8 }}
            onClick={() => handleRemoveLegacyQ(i)}
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
        <span style={{ color: "#ff8f2b", marginRight: 8 }}>레거시</span>
        문항 편집 ({legacyQuestions.length}개)
      </div>
      <DraggableList
        items={legacyQuestions}
        onReorder={(from, to) => reorderItems("questions", from, to)}
        renderItem={renderLegacyQ}
      />
      <button className="ce-add-btn" onClick={handleAddLegacyQ}>
        + 문항 추가
      </button>
    </div>
  );
}
