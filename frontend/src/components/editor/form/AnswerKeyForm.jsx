import CollapsibleSection from "../widgets/CollapsibleSection";
import DraggableList from "../widgets/DraggableList";

/**
 * 모범답안 편집 폼 (오른쪽 패널)
 * 섹션 > 아이템 2단 중첩 구조
 */
export default function AnswerKeyForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem, reorderItems } = editor;
  const sections = content?.sections || [];

  /* 섹션 추가 */
  const handleAddSection = () => {
    addItem("sections", sections.length, {
      label: `섹션 ${sections.length + 1}`,
      items: [],
    });
  };

  /* 섹션 삭제 */
  const handleRemoveSection = (si) => {
    if (!confirm(`섹션 ${si + 1}을 삭제하시겠습니까?`)) return;
    removeItem("sections", si);
  };

  /* 아이템 추가 */
  const handleAddItem = (si) => {
    const items = sections[si]?.items || [];
    addItem(`sections[${si}].items`, items.length, {
      number: items.length + 1,
      answer: "",
      explanation: "",
    });
  };

  /* 아이템 삭제 */
  const handleRemoveItem = (si, ii) => {
    removeItem(`sections[${si}].items`, ii);
  };

  const renderItem = (si) => (item, ii) => {
    const path = `sections[${si}].items[${ii}]`;
    return (
      <div data-field-path={path} style={{ flex: 1 }}>
        <div className="ce-form-row">
          <div style={{ width: 50, flex: "none" }}>
            <label className="ce-form-label">번호</label>
            <input
              className="ce-form-input"
              type="number"
              value={item.number ?? ii + 1}
              onChange={(e) => updateField(`${path}.number`, Number(e.target.value))}
              style={{ textAlign: "center" }}
            />
          </div>
          <div style={{ width: 80, flex: "none" }}>
            <label className="ce-form-label">유형</label>
            <input
              className="ce-form-input"
              value={item.type || ""}
              onChange={(e) => updateField(`${path}.type`, e.target.value)}
              placeholder="객관식"
            />
          </div>
          <div style={{ width: 60, flex: "none" }}>
            <label className="ce-form-label">배점</label>
            <input
              className="ce-form-input"
              value={item.points ?? ""}
              onChange={(e) => updateField(`${path}.points`, e.target.value)}
              placeholder="2"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="ce-form-label">정답</label>
            <input
              className="ce-form-input"
              value={item.answer || ""}
              onChange={(e) => updateField(`${path}.answer`, e.target.value)}
              data-field-path={`${path}.answer`}
            />
          </div>
        </div>
        {/* 문제 텍스트 (선택) */}
        <div className="ce-form-section" style={{ marginTop: 4 }}>
          <label className="ce-form-label">문제 (선택)</label>
          <input
            className="ce-form-input"
            value={item.question || ""}
            onChange={(e) => updateField(`${path}.question`, e.target.value)}
            placeholder="문제 텍스트"
          />
        </div>
        {/* 해설 */}
        <div className="ce-form-section" style={{ marginTop: 4 }}>
          <label className="ce-form-label">해설</label>
          <textarea
            className="ce-form-textarea"
            value={item.explanation || ""}
            onChange={(e) => updateField(`${path}.explanation`, e.target.value)}
            data-field-path={`${path}.explanation`}
            rows={2}
          />
        </div>
        {/* 모범답안 텍스트 (선택) */}
        {(item.modelAnswer != null || item.type === "서술형") && (
          <div className="ce-form-section" style={{ marginTop: 4 }}>
            <label className="ce-form-label">모범답안 텍스트</label>
            <textarea
              className="ce-form-textarea"
              value={item.modelAnswer || ""}
              onChange={(e) => updateField(`${path}.modelAnswer`, e.target.value)}
              rows={2}
            />
          </div>
        )}
        <button
          className="ce-btn ce-btn-danger"
          style={{ marginTop: 4, fontSize: 11, padding: "3px 8px" }}
          onClick={() => handleRemoveItem(si, ii)}
        >
          삭제
        </button>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        모범답안 편집 ({sections.length}개 섹션)
      </div>
      {sections.map((sec, si) => {
        const secPath = `sections[${si}]`;
        return (
          <CollapsibleSection
            key={si}
            title={sec.label || `섹션 ${si + 1}`}
            count={(sec.items || []).length}
            defaultOpen={focusPath && focusPath.startsWith(secPath)}
          >
            <div data-field-path={secPath}>
              <div className="ce-form-section">
                <label className="ce-form-label">섹션 라벨</label>
                <input
                  className="ce-form-input"
                  value={sec.label || ""}
                  onChange={(e) => updateField(`${secPath}.label`, e.target.value)}
                  data-field-path={`${secPath}.label`}
                />
              </div>
              <DraggableList
                items={sec.items || []}
                onReorder={(from, to) => reorderItems(`${secPath}.items`, from, to)}
                renderItem={renderItem(si)}
              />
              <button className="ce-add-btn" onClick={() => handleAddItem(si)}>
                + 아이템 추가
              </button>
              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8, width: "100%" }}
                onClick={() => handleRemoveSection(si)}
              >
                섹션 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}
      <button className="ce-add-btn" onClick={handleAddSection}>
        + 섹션 추가
      </button>
    </div>
  );
}
