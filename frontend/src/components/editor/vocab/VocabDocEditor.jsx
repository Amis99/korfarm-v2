import VocabQuestionCard from "./VocabQuestionCard";

/**
 * 어휘(PRO_VOCAB / VOCAB_BASIC) 워드 프로세서형 비주얼 에디터.
 * payload.questions[] — 단어 카드 누적 (지문 없음)
 * 각 카드: questionKind(7가지) + type(MULTI_CHOICE/FILL_BLANKS)
 */
function detectMode(meta) {
  const cts = Array.isArray(meta?.contentType) ? meta.contentType : (meta?.contentType ? [meta.contentType] : []);
  for (const ct of cts) {
    const up = String(ct || "").toUpperCase();
    if (up.includes("POS")) return "pos";
    if (up.includes("CONCEPT")) return "concept";
  }
  return "vocab";
}

const MODE_HEADER_LABEL = {
  vocab: "📚 어휘",
  pos: "🏷️ 품사",
  concept: "💡 국어 개념",
};

export default function VocabDocEditor({ editor }) {
  const { content, meta } = editor;
  const questions = content?.questions || [];
  const mode = detectMode(meta);

  const addQuestion = (atIdx) => {
    const newId = `vq-${Date.now().toString(36)}`;
    editor.addItem("questions", atIdx, {
      id: newId,
      type: "MULTI_CHOICE",
      questionKind: "WORD_TO_MEANING",
      stem: "",
      choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" },
        { id: "c3", text: "" }, { id: "c4", text: "" },
      ],
      answerId: "",
      explanation: "",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
    });
  };
  const removeQuestion = (i) => {
    if (!window.confirm(`어휘 ${i + 1} 삭제?`)) return;
    editor.removeItem("questions", i);
  };
  const duplicateQuestion = (i) => {
    const q = questions[i];
    const dup = JSON.parse(JSON.stringify(q));
    dup.id = `${q.id}-copy-${Date.now().toString(36).slice(-3)}`;
    editor.addItem("questions", i + 1, dup);
  };
  const move = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    editor.reorderItems("questions", from, to);
  };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>
            제한 시간 (초)
            <input
              type="number"
              value={content?.timeLimitSec ?? 180}
              onChange={(e) => editor.updateField("timeLimitSec", Number(e.target.value))}
              style={{ width: 90 }}
            />
          </label>
          <label>
            씨앗 보상 개수
            <input
              type="number"
              value={content?.seedReward?.count ?? 3}
              onChange={(e) => editor.updateField("seedReward.count", Number(e.target.value))}
              style={{ width: 70 }}
            />
          </label>
          <span style={{ flex: 1 }} />
          <span className="dq-doc-meta-stat">{MODE_HEADER_LABEL[mode]} · 총 {questions.length} 문항</span>
        </div>
      </div>

      <div className="dq-doc-paper">
        {questions.length === 0 && (
          <div className="dq-doc-empty">
            아직 어휘가 없습니다. 아래 [+ 어휘 추가]로 시작하세요.
          </div>
        )}
        {questions.map((q, i) => (
          <div key={q.id || i}>
            <button
              type="button"
              className="dq-doc-add-between"
              onClick={() => addQuestion(i)}
              title="여기에 어휘 추가"
            >+ 여기에 어휘 추가</button>
            <VocabQuestionCard
              question={q}
              idx={i}
              total={questions.length}
              path={`questions[${i}]`}
              editor={editor}
              onMoveUp={() => move(i, i - 1)}
              onMoveDown={() => move(i, i + 1)}
              onDelete={() => removeQuestion(i)}
              onDuplicate={() => duplicateQuestion(i)}
              mode={mode}
            />
          </div>
        ))}
        <button
          type="button"
          className="dq-doc-add-between dq-doc-add-end"
          onClick={() => addQuestion(questions.length)}
        >+ 마지막에 어휘 추가</button>
      </div>
    </div>
  );
}
