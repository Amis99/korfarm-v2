import PassageGroupEditor from "./PassageGroupEditor";
import BackgroundQuestionEditor from "./BackgroundQuestionEditor";

/**
 * 배경지식/추론 워드 프로세서형 비주얼 에디터.
 * 두 모드:
 *   - passages 모드 (권장): payload.passages[] = [{id, title, text, questions:[]}]
 *   - legacy 모드: payload.questions[] (지문 없이 문항만)
 *
 * BACKGROUND_KNOWLEDGE / BACKGROUND_KNOWLEDGE_QUIZ / PRO_BACKGROUND / PRO_LOGIC / LOGIC 공용.
 */
export default function BackgroundDocEditor({ editor }) {
  const { content } = editor;
  const passages = content?.passages || [];
  const legacyQuestions = content?.questions || [];
  const isPassagesMode = passages.length > 0;
  const isLegacyMode = !isPassagesMode && legacyQuestions.length > 0;
  const isEmpty = !isPassagesMode && !isLegacyMode;

  const addPassage = (atIdx) => {
    const idx = atIdx ?? passages.length;
    const newId = `passage-${Date.now().toString(36).slice(-4)}`;
    editor.addItem("passages", idx, {
      id: newId,
      title: "",
      text: "",
      questions: [],
    });
  };
  const removePassage = (i) => {
    if (!window.confirm(`지문 ${i + 1} 삭제? (이 지문의 문제도 모두 삭제)`)) return;
    editor.removeItem("passages", i);
  };
  const movePassage = (from, to) => {
    if (to < 0 || to >= passages.length) return;
    editor.reorderItems("passages", from, to);
  };

  // legacy questions 편집
  const addLegacyQuestion = (atIdx) => {
    const newId = `q${Date.now().toString(36)}`;
    editor.addItem("questions", atIdx, {
      id: newId,
      type: "MULTI_CHOICE",
      stem: "",
      choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" },
        { id: "c3", text: "" }, { id: "c4", text: "" },
      ],
      answerId: "",
      explanation: "",
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    });
  };
  const removeLegacyQuestion = (i) => {
    if (!window.confirm(`문제 ${i + 1} 삭제?`)) return;
    editor.removeItem("questions", i);
  };
  const duplicateLegacyQuestion = (i) => {
    const q = legacyQuestions[i];
    const dup = JSON.parse(JSON.stringify(q));
    dup.id = `${q.id}-copy-${Date.now().toString(36).slice(-3)}`;
    editor.addItem("questions", i + 1, dup);
  };
  const moveLegacyQuestion = (from, to) => {
    if (to < 0 || to >= legacyQuestions.length) return;
    editor.reorderItems("questions", from, to);
  };

  // 모드 전환
  const switchToPassages = () => {
    if (legacyQuestions.length > 0) {
      if (!window.confirm("지문 모드로 전환합니다. 기존 questions[] 는 새 지문 1개의 questions 로 옮겨집니다. 계속할까요?")) return;
      const newPassage = {
        id: `passage-${Date.now().toString(36).slice(-4)}`,
        title: "지문 1",
        text: "",
        questions: legacyQuestions,
      };
      editor.updateField("passages", [newPassage]);
      editor.updateField("questions", []);
    } else {
      addPassage(0);
    }
  };
  const switchToLegacy = () => {
    if (!window.confirm("레거시 모드(지문 없이 문제만)로 전환합니다. 모든 지문의 문제만 추출됩니다. 계속할까요?")) return;
    const flat = passages.flatMap((p) => p.questions || []);
    editor.updateField("questions", flat);
    editor.updateField("passages", []);
  };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>
            제한 시간 (초)
            <input
              type="number"
              value={content?.timeLimitSec ?? 600}
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
          <span className="dq-doc-meta-stat">
            {isPassagesMode && `지문 ${passages.length}개 · 총 문제 ${passages.reduce((s, p) => s + (p.questions?.length || 0), 0)}개`}
            {isLegacyMode && `레거시 모드 — 문제 ${legacyQuestions.length}개`}
            {isEmpty && "비어 있음"}
          </span>
          <span className="bg-mode-toggle">
            {!isLegacyMode && (
              <button type="button" className="ce-btn ce-btn-secondary" onClick={switchToLegacy} title="지문 없이 문제만으로 전환">
                레거시 모드
              </button>
            )}
            {!isPassagesMode && (
              <button type="button" className="ce-btn ce-btn-primary" onClick={switchToPassages} title="지문 + 문제 모드로 전환 (권장)">
                지문 모드
              </button>
            )}
          </span>
        </div>
      </div>

      <div className="dq-doc-paper">
        {isEmpty && (
          <div className="dq-doc-empty">
            아직 콘텐츠가 없습니다. 위 [지문 모드] 버튼으로 첫 지문을 추가하세요.
          </div>
        )}

        {isPassagesMode && (
          <>
            {passages.map((p, pi) => (
              <div key={p.id || pi}>
                <button
                  type="button"
                  className="dr-step-insert"
                  onClick={() => addPassage(pi)}
                  title="여기에 지문 추가"
                >+ 여기에 지문 추가</button>
                <PassageGroupEditor
                  passage={p}
                  pi={pi}
                  total={passages.length}
                  editor={editor}
                  onMoveUp={() => movePassage(pi, pi - 1)}
                  onMoveDown={() => movePassage(pi, pi + 1)}
                  onDelete={() => removePassage(pi)}
                />
              </div>
            ))}
            <button
              type="button"
              className="dr-step-insert dr-step-insert-end"
              onClick={() => addPassage(passages.length)}
            >+ 마지막에 지문 추가</button>
          </>
        )}

        {isLegacyMode && (
          <>
            <div style={{ padding: "8px 12px", marginBottom: 8, background: "#fff5e0", border: "1px solid #d8c89c", borderRadius: 4, color: "#8a6d3b", fontSize: 12 }}>
              ⚠ 레거시 모드 — 새 콘텐츠는 [지문 모드] 권장
            </div>
            {legacyQuestions.map((q, i) => (
              <div key={q.id || i}>
                <button
                  type="button"
                  className="dq-doc-add-between"
                  onClick={() => addLegacyQuestion(i)}
                >+ 여기에 문제 추가</button>
                <BackgroundQuestionEditor
                  question={q}
                  idx={i}
                  total={legacyQuestions.length}
                  path={`questions[${i}]`}
                  editor={editor}
                  onMoveUp={() => moveLegacyQuestion(i, i - 1)}
                  onMoveDown={() => moveLegacyQuestion(i, i + 1)}
                  onDelete={() => removeLegacyQuestion(i)}
                  onDuplicate={() => duplicateLegacyQuestion(i)}
                />
              </div>
            ))}
            <button
              type="button"
              className="dq-doc-add-between dq-doc-add-end"
              onClick={() => addLegacyQuestion(legacyQuestions.length)}
            >+ 마지막에 문제 추가</button>
          </>
        )}
      </div>
    </div>
  );
}
