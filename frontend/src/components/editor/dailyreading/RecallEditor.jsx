import InlineEditable from "../dailyquiz/InlineEditable";

/**
 * 일일독해 복기(recall) 편집.
 * payload.recall = { cards: [{id, text}], correctOrder: [id, id, ...], seedPenalty: number }
 *
 * 학생 흐름: cards 가 셔플되어 표시됨 → 학생이 올바른 순서로 배치 → correctOrder 와 비교
 */
export default function RecallEditor({ recall, editor }) {
  const cards = recall?.cards || [];
  const correctOrder = recall?.correctOrder || [];
  const seedPenalty = recall?.seedPenalty ?? 1;

  const addCard = () => {
    const newId = `card-${Date.now().toString(36).slice(-4)}`;
    editor.addItem("recall.cards", cards.length, { id: newId, text: "" });
    // correctOrder 끝에 자동 추가
    editor.updateField("recall.correctOrder", [...correctOrder, newId]);
  };
  const removeCard = (i) => {
    if (cards.length <= 2) return alert("최소 2개 카드가 필요합니다.");
    if (!window.confirm(`카드 ${i + 1} 삭제? (correctOrder 에서도 자동 제거)`)) return;
    const cardId = cards[i].id;
    editor.removeItem("recall.cards", i);
    editor.updateField("recall.correctOrder", correctOrder.filter((id) => id !== cardId));
  };
  const moveOrder = (from, to) => {
    if (to < 0 || to >= correctOrder.length) return;
    const next = [...correctOrder];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    editor.updateField("recall.correctOrder", next);
  };

  const cardById = (id) => cards.find((c) => c.id === id);

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">🔁 복기 (recall) — {cards.length} 카드</div>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 12, color: "#5b4d2e" }}>
          오답 시 씨앗 감점
          <input
            type="number"
            value={seedPenalty}
            onChange={(e) => editor.updateField("recall.seedPenalty", Number(e.target.value))}
            style={{ width: 50, marginLeft: 6 }}
          />
        </label>
      </div>
      <div className="dq-card-body">
        <div className="dq-section-label">카드 풀 (학생 화면에서 셔플되어 표시됨)</div>
        {cards.map((c, i) => (
          <div key={c.id || i} className="dr-recall-card">
            <span className="dr-recall-card-id">{c.id}</span>
            <InlineEditable
              value={c.text}
              onChange={(v) => editor.updateField(`recall.cards[${i}].text`, v)}
              placeholder="카드 본문 (한 의미 단위)"
              className="dq-mc-text"
              multiline={false}
            />
            <button type="button" className="dq-mc-del" onClick={() => removeCard(i)}>×</button>
          </div>
        ))}
        <button type="button" className="dq-add-btn" onClick={addCard}>+ 카드 추가</button>

        <div className="dq-section-label" style={{ marginTop: 14 }}>
          정답 순서 (correctOrder) — 위에서 아래로 ▲▼ 로 정렬
        </div>
        <div className="dr-correct-order">
          {correctOrder.map((id, i) => {
            const c = cardById(id);
            return (
              <div key={id + i} className="dr-correct-row">
                <span className="dr-correct-num">{i + 1}.</span>
                <span className="dr-correct-text">
                  {c ? c.text || "(빈 카드)" : <em style={{ color: "#c0392b" }}>없는 카드 ID: {id}</em>}
                </span>
                <div className="dq-fb-blank-move">
                  <button type="button" onClick={() => moveOrder(i, i - 1)} disabled={i === 0}>▲</button>
                  <button type="button" onClick={() => moveOrder(i, i + 1)} disabled={i >= correctOrder.length - 1}>▼</button>
                </div>
              </div>
            );
          })}
          {correctOrder.length === 0 && (
            <div style={{ color: "#888", fontSize: 12, padding: 6 }}>
              correctOrder 가 비어 있습니다. 카드를 추가하면 자동으로 끝에 추가됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
