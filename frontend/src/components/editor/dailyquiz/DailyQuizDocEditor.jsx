import { useState } from "react";
import QuestionCardEditor from "./QuestionCardEditor";

/**
 * 일일퀴즈 워드 프로세서형 비주얼 에디터.
 * - 단일 페이지 (시험지 컨셉)
 * - 문제 카드 누적 — 학생 화면과 동일 레이아웃, 단 모든 텍스트가 인라인 편집 가능
 * - 카드 사이 [+ 문제 추가]
 *
 * props (EditorShell 에서 호출):
 *   editor: useContentEditor 반환
 *   focusPath, setFocusPath: 미사용 (장차 동기화 용)
 */
export default function DailyQuizDocEditor({ editor }) {
  const { content } = editor;
  const questions = content?.questions || [];
  const [collapsed, setCollapsed] = useState({}); // {idx: bool}

  const addQuestion = (atIdx) => {
    const newId = `q${Date.now().toString(36)}`;
    const newQ = {
      id: newId,
      type: "MULTI_CHOICE",
      stem: "",
      passage: "",
      choices: [
        { id: "c1", text: "" },
        { id: "c2", text: "" },
        { id: "c3", text: "" },
        { id: "c4", text: "" },
      ],
      answerId: "",
      explanation: "",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
    };
    editor.addItem("questions", atIdx, newQ);
  };
  const removeQuestion = (idx) => {
    if (!window.confirm(`문제 ${idx + 1} 을 삭제할까요?`)) return;
    editor.removeItem("questions", idx);
  };
  const duplicateQuestion = (idx) => {
    const q = questions[idx];
    const dup = JSON.parse(JSON.stringify(q));
    dup.id = `${q.id}-copy-${Date.now().toString(36).slice(-3)}`;
    editor.addItem("questions", idx + 1, dup);
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
            총 {questions.length}문제
          </span>
        </div>
      </div>

      <div className="dq-doc-paper">
        {questions.length === 0 && (
          <div className="dq-doc-empty">
            아직 문제가 없습니다. 아래 [+ 문제 추가]로 시작하세요.
          </div>
        )}
        {questions.map((q, i) => (
          <div key={q.id || i}>
            <button
              type="button"
              className="dq-doc-add-between"
              onClick={() => addQuestion(i)}
              title="여기에 문제 추가"
            >+ 여기에 문제 추가</button>
            <QuestionCardEditor
              question={q}
              idx={i}
              total={questions.length}
              path={`questions[${i}]`}
              editor={editor}
              onMoveUp={() => move(i, i - 1)}
              onMoveDown={() => move(i, i + 1)}
              onDelete={() => removeQuestion(i)}
              onDuplicate={() => duplicateQuestion(i)}
            />
          </div>
        ))}
        <button
          type="button"
          className="dq-doc-add-between dq-doc-add-end"
          onClick={() => addQuestion(questions.length)}
        >+ 마지막에 문제 추가</button>
      </div>
    </div>
  );
}
