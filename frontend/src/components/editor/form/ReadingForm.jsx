import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";
import ScoringEditor from "../widgets/ScoringEditor";
import HighlightPicker from "../widgets/HighlightPicker";
import DraggableList from "../widgets/DraggableList";

/**
 * 독해 콘텐츠 편집 폼 (오른쪽 패널)
 * 지문 / 정독 타임라인 / 복기 카드 / 확인 문항
 */
export default function ReadingForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem, reorderItems } = editor;

  const paragraphs = content?.passage?.paragraphs || [];
  const timeline = content?.intensive?.timeline || content?.timeline || [];
  const timelinePath = content?.intensive?.timeline ? "intensive.timeline" : "timeline";
  const recallCards = content?.recall?.cards || [];
  const confirmQuestions = content?.confirm?.questions || [];

  /* === 지문 편집 === */
  const handleParagraphChange = (idx, text) => {
    updateField(`passage.paragraphs[${idx}].text`, text);
  };

  const handleAddParagraph = () => {
    addItem("passage.paragraphs", paragraphs.length, {
      id: `p${Date.now()}`,
      text: "",
    });
  };

  const handleRemoveParagraph = (idx) => {
    removeItem("passage.paragraphs", idx);
  };

  /* === 정독 타임라인 편집 === */
  const handleAddStep = () => {
    addItem(timelinePath, timeline.length, {
      stepId: `s${Date.now()}`,
      highlight: { ranges: [] },
    });
  };

  const handleRemoveStep = (idx) => {
    removeItem(timelinePath, idx);
  };

  const handleAddHighlight = (stepIdx, range) => {
    const ranges = timeline[stepIdx]?.highlight?.ranges || [];
    const { _text, ...cleanRange } = range;
    addItem(`${timelinePath}[${stepIdx}].highlight.ranges`, ranges.length, cleanRange);
  };

  const handleRemoveHighlight = (stepIdx, rangeIdx) => {
    removeItem(`${timelinePath}[${stepIdx}].highlight.ranges`, rangeIdx);
  };

  /* === 복기 카드 편집 === */
  const handleAddRecallCard = () => {
    addItem("recall.cards", recallCards.length, {
      id: `rc${Date.now()}`,
      text: "",
    });
  };

  const handleRemoveRecallCard = (idx) => {
    removeItem("recall.cards", idx);
  };

  /* === 확인 문항 편집 === */
  const handleAddConfirmQ = () => {
    addItem("confirm.questions", confirmQuestions.length, {
      id: `cq${Date.now()}`,
      prompt: "",
      answerText: "",
    });
  };

  const handleRemoveConfirmQ = (idx) => {
    removeItem("confirm.questions", idx);
  };

  return (
    <div>
      {/* 지문 */}
      <CollapsibleSection
        title="지문"
        count={paragraphs.length}
        defaultOpen={focusPath === "passage"}
      >
        <div data-field-path="passage">
          {paragraphs.map((para, i) => (
            <div key={para.id || i} className="ce-form-section">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <label className="ce-form-label" style={{ margin: 0 }}>단락 {i + 1}</label>
                <span style={{ fontSize: 11, color: "#6a7a6e" }}>ID: {para.id}</span>
                <button
                  className="ce-choice-del"
                  onClick={() => handleRemoveParagraph(i)}
                  style={{ marginLeft: "auto" }}
                >×</button>
              </div>
              <textarea
                className="ce-form-textarea"
                value={para.text || ""}
                onChange={(e) => handleParagraphChange(i, e.target.value)}
                data-field-path={`passage.paragraphs[${i}].text`}
                rows={3}
              />
            </div>
          ))}
          <button className="ce-add-btn" onClick={handleAddParagraph}>
            + 단락 추가
          </button>
        </div>
      </CollapsibleSection>

      {/* 정독 타임라인 */}
      <CollapsibleSection
        title="정독 타임라인"
        count={timeline.length}
        defaultOpen={focusPath?.startsWith("intensive")}
      >
        <div data-field-path="intensive">
          {timeline.map((step, i) => {
            const stepPath = `${timelinePath}[${i}]`;
            return (
              <div key={step.stepId || i} className="ce-collapsible" style={{ margin: "8px 0" }}>
                <div className="ce-collapsible-header">
                  <span>Step {i + 1}</span>
                  <span style={{ fontSize: 11, color: "#6a7a6e" }}>ID: {step.stepId}</span>
                  <button
                    className="ce-choice-del"
                    onClick={() => handleRemoveStep(i)}
                    style={{ marginLeft: "auto" }}
                  >×</button>
                </div>
                <div className="ce-collapsible-body">
                  {/* 하이라이트 */}
                  <div className="ce-form-section">
                    <label className="ce-form-label">하이라이트 범위</label>
                    <HighlightPicker
                      ranges={step.highlight?.ranges || []}
                      paragraphs={paragraphs}
                      onAdd={(range) => handleAddHighlight(i, range)}
                      onRemove={(rangeIdx) => handleRemoveHighlight(i, rangeIdx)}
                      selectContainerId="ce-passage-container"
                    />
                  </div>

                  {/* 문항 (선택) */}
                  <div className="ce-form-section">
                    <label className="ce-form-label">문항 (선택)</label>
                    {step.question ? (
                      <div data-field-path={`${stepPath}.question`}>
                        <textarea
                          className="ce-form-textarea"
                          value={step.question.prompt || ""}
                          onChange={(e) => updateField(`${stepPath}.question.prompt`, e.target.value)}
                          placeholder="발문"
                          rows={2}
                        />
                        <ChoiceEditor
                          choices={step.question.choices || []}
                          answerId={step.question.answerId}
                          pathPrefix={`${stepPath}.question`}
                          updateField={updateField}
                          addItem={addItem}
                          removeItem={removeItem}
                        />
                        <ScoringEditor
                          scoring={step.question.scoring || {}}
                          pathPrefix={`${stepPath}.question`}
                          updateField={updateField}
                        />
                        <button
                          className="ce-btn ce-btn-danger"
                          style={{ marginTop: 4, fontSize: 11, padding: "3px 8px" }}
                          onClick={() => updateField(`${stepPath}.question`, undefined)}
                        >
                          문항 제거
                        </button>
                      </div>
                    ) : (
                      <button
                        className="ce-add-btn"
                        onClick={() => updateField(`${stepPath}.question`, {
                          prompt: "",
                          choices: [
                            { id: `c${Date.now()}a`, text: "" },
                            { id: `c${Date.now()}b`, text: "" },
                          ],
                          answerId: `c${Date.now()}a`,
                        })}
                      >
                        + 문항 추가
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <button className="ce-add-btn" onClick={handleAddStep}>
            + Step 추가
          </button>
        </div>
      </CollapsibleSection>

      {/* 복기 카드 */}
      <CollapsibleSection
        title="복기 카드"
        count={recallCards.length}
        defaultOpen={focusPath?.startsWith("recall")}
      >
        <div data-field-path="recall">
          <DraggableList
            items={recallCards}
            onReorder={(from, to) => reorderItems("recall.cards", from, to)}
            renderItem={(card, i) => (
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6a7a6e" }}>{i + 1}.</span>
                  <input
                    className="ce-form-input"
                    value={card.text || ""}
                    onChange={(e) => updateField(`recall.cards[${i}].text`, e.target.value)}
                    data-field-path={`recall.cards[${i}].text`}
                    style={{ flex: 1 }}
                  />
                  <button className="ce-choice-del" onClick={() => handleRemoveRecallCard(i)}>×</button>
                </div>
              </div>
            )}
          />
          {/* seedPenalty */}
          <div className="ce-form-section" style={{ marginTop: 8 }}>
            <label className="ce-form-label">오답 감점 (seedPenalty)</label>
            <input
              className="ce-form-input"
              type="number"
              value={content?.recall?.seedPenalty ?? ""}
              onChange={(e) => updateField("recall.seedPenalty", e.target.value === "" ? undefined : Number(e.target.value))}
              style={{ width: 80 }}
            />
          </div>
          <button className="ce-add-btn" onClick={handleAddRecallCard}>
            + 카드 추가
          </button>
        </div>
      </CollapsibleSection>

      {/* 확인 문항 */}
      <CollapsibleSection
        title="확인 문항"
        count={confirmQuestions.length}
        defaultOpen={focusPath?.startsWith("confirm")}
      >
        <div data-field-path="confirm">
          {confirmQuestions.map((q, i) => {
            const qPath = `confirm.questions[${i}]`;
            return (
              <div key={q.id || i} className="ce-collapsible" style={{ margin: "8px 0" }}>
                <div className="ce-collapsible-header">
                  <span>확인 {i + 1}</span>
                  <button
                    className="ce-choice-del"
                    onClick={() => handleRemoveConfirmQ(i)}
                    style={{ marginLeft: "auto" }}
                  >×</button>
                </div>
                <div className="ce-collapsible-body">
                  <div className="ce-form-section">
                    <label className="ce-form-label">발문</label>
                    <textarea
                      className="ce-form-textarea"
                      value={q.prompt || ""}
                      onChange={(e) => updateField(`${qPath}.prompt`, e.target.value)}
                      data-field-path={`${qPath}.prompt`}
                      rows={2}
                    />
                  </div>
                  <div className="ce-form-section">
                    <label className="ce-form-label">정답 텍스트</label>
                    <input
                      className="ce-form-input"
                      value={q.answerText || ""}
                      onChange={(e) => updateField(`${qPath}.answerText`, e.target.value)}
                      data-field-path={`${qPath}.answerText`}
                    />
                  </div>
                  {/* answerRanges (고급) */}
                  {q.answerRanges && (
                    <div className="ce-form-section">
                      <label className="ce-form-label">정답 범위 (answerRanges)</label>
                      <textarea
                        className="ce-form-textarea"
                        value={JSON.stringify(q.answerRanges, null, 2)}
                        onChange={(e) => {
                          try {
                            updateField(`${qPath}.answerRanges`, JSON.parse(e.target.value));
                          } catch { /* ignore parse error */ }
                        }}
                        rows={3}
                        style={{ fontFamily: "monospace", fontSize: 11 }}
                      />
                    </div>
                  )}
                  <div className="ce-form-row">
                    <div>
                      <label className="ce-form-label">매칭 모드</label>
                      <select
                        className="ce-form-select"
                        value={q.answerMatchMode || "ANY"}
                        onChange={(e) => updateField(`${qPath}.answerMatchMode`, e.target.value)}
                      >
                        <option value="ANY">ANY</option>
                        <option value="ALL">ALL</option>
                      </select>
                    </div>
                    <div>
                      <label className="ce-form-label">오답 시 공개</label>
                      <select
                        className="ce-form-select"
                        value={q.revealOnWrong !== false ? "true" : "false"}
                        onChange={(e) => updateField(`${qPath}.revealOnWrong`, e.target.value === "true")}
                      >
                        <option value="true">예</option>
                        <option value="false">아니오</option>
                      </select>
                    </div>
                  </div>
                  <ScoringEditor
                    scoring={q.scoring || {}}
                    pathPrefix={qPath}
                    updateField={updateField}
                  />
                </div>
              </div>
            );
          })}
          <button className="ce-add-btn" onClick={handleAddConfirmQ}>
            + 확인 문항 추가
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
