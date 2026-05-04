import MarkdownEditField from "../MarkdownEditField";
import MultiChoiceEditor from "./MultiChoiceEditor";
import FillBlanksEditor from "./FillBlanksEditor";
import TextSelectEditor from "./TextSelectEditor";
import ChoiceComplexOxEditor from "./ChoiceComplexOxEditor";
import CompetencyVectorEditor from "./CompetencyVectorEditor";

const TYPE_OPTIONS = [
  { value: "MULTI_CHOICE", label: "객관식 (MULTI_CHOICE)" },
  { value: "FILL_BLANKS", label: "빈칸 채우기 (FILL_BLANKS)" },
  { value: "TEXT_SELECT", label: "지문 영역 클릭 (TEXT_SELECT)" },
  { value: "CHOICE_COMPLEX_OX", label: "선지 분석 (CHOICE_COMPLEX_OX)" },
];

/**
 * 한 문제 카드의 인라인 편집기. 학생 화면 cum-card 와 비슷한 레이아웃.
 *
 * props:
 *   question, idx, total, path("questions[idx]"), editor,
 *   onMoveUp, onMoveDown, onDelete, onDuplicate
 */
export default function QuestionCardEditor({
  question, idx, total, path, editor,
  onMoveUp, onMoveDown, onDelete, onDuplicate,
}) {
  const t = question.type || "MULTI_CHOICE";

  const onTypeChange = (newType) => {
    if (newType === t) return;
    if (!window.confirm(`문제 유형을 "${t}" → "${newType}" 로 변경합니다. 일부 필드는 초기화됩니다. 진행할까요?`)) return;
    // 최소 필드만 보존
    const base = { id: question.id, type: newType, stem: question.stem || "", explanation: question.explanation || "", scoring: question.scoring };
    let next = base;
    if (newType === "MULTI_CHOICE") {
      next = { ...base, passage: typeof question.passage === "string" ? question.passage : "", choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" }, { id: "c3", text: "" }, { id: "c4", text: "" },
      ], answerId: "" };
    } else if (newType === "FILL_BLANKS") {
      next = { ...base, passage: typeof question.passage === "string" ? question.passage : "", template: "____", blanks: [
        { id: "b1", choices: [{ id: "b1-c1", text: "" }, { id: "b1-c2", text: "" }], answerId: "" },
      ] };
    } else if (newType === "TEXT_SELECT") {
      next = { ...base, passage: { paragraphs: [{ id: "p1", text: "" }] }, answerRanges: [], answerMatchMode: "ALL" };
    } else if (newType === "CHOICE_COMPLEX_OX") {
      next = {
        ...base, questionKind: "CHOICE_ANALYSIS",
        passage: { paragraphs: [{ id: "p1", text: "" }] },
        choices: [
          { choiceId: "A", text: "", propositions: [{ propId: "A1", text: "", oxAnswer: "O", matchMode: "ALL", evidenceRanges: [] }] },
          { choiceId: "B", text: "", propositions: [{ propId: "B1", text: "", oxAnswer: "O", matchMode: "ALL", evidenceRanges: [] }] },
        ],
      };
    }
    editor.updateField(path, next);
  };

  // passage 가 string 인 type (MULTI_CHOICE, FILL_BLANKS) 와 객체인 type (TEXT_SELECT, CHOICE_COMPLEX_OX) 분리
  const passageIsString = t === "MULTI_CHOICE" || t === "FILL_BLANKS";

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">문제 {idx + 1} / {total}</div>
        <select
          className="dq-card-type"
          value={t}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <div className="dq-card-actions">
          <button type="button" onClick={onMoveUp} disabled={idx === 0} title="위로">▲</button>
          <button type="button" onClick={onMoveDown} disabled={idx >= total - 1} title="아래로">▼</button>
          <button type="button" onClick={onDuplicate} title="복제">⧉</button>
          <button type="button" onClick={onDelete} title="삭제" className="danger">×</button>
        </div>
      </div>

      <div className="dq-card-body">
        <div className="dq-section-label">발문 (stem)</div>
        <MarkdownEditField
          value={question.stem || ""}
          onChange={(v) => editor.updateField(`${path}.stem`, v)}
          placeholder="문제 발문 (예: 알맞은 물건을 고르세요)"
          minHeight={70}
        />

        {/* 일일퀴즈 1번(어휘) 은 본문 키들을 "보기" 한 박스로 통일.
            2~10번은 기존대로 지문/안내/보기/형광펜 4박스 분리. */}
        {passageIsString && idx === 0 && (
          <>
            <div className="dq-section-label">보기 (어휘 문제 본문)</div>
            <MarkdownEditField
              value={question["보기"] ?? ""}
              onChange={(v) => editor.updateField(`${path}.보기`, v)}
              placeholder="학생 화면에 본문 박스로 노출되는 텍스트. (마크다운·이미지·표 지원)"
              minHeight={140}
            />
          </>
        )}

        {passageIsString && idx !== 0 && (
          <>
            <div className="dq-section-label">지문 (passage) — 본문</div>
            <MarkdownEditField
              value={typeof question.passage === "string" ? question.passage : ""}
              onChange={(v) => editor.updateField(`${path}.passage`, v)}
              placeholder="지문이 없으면 비워두세요. (마크다운·이미지·표 지원)"
              minHeight={120}
            />

            <div className="dq-section-label">추가 안내문 (prompt) — 학생 화면에 본문 박스로 노출</div>
            <MarkdownEditField
              value={question.prompt || ""}
              onChange={(v) => editor.updateField(`${path}.prompt`, v)}
              placeholder="발문 외 추가 안내."
              minHeight={80}
            />

            <div className="dq-section-label">보기 (examples) — 학생 화면에 별도 박스로 노출 (선택)</div>
            <MarkdownEditField
              value={question["보기"] ?? question.examples ?? question.example ?? question.additionalInfo ?? ""}
              onChange={(v) => editor.updateField(`${path}.보기`, v)}
              placeholder="보기 박스에 표시할 텍스트. 사용 안 하면 비워두세요."
              minHeight={80}
            />

            <div className="dq-section-label">강조 단어 (highlight) — 지문 안 형광펜 처리할 단어/구절</div>
            <input
              type="text"
              value={question.highlight?.text || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) editor.updateField(`${path}.highlight`, { text: v });
                else editor.updateField(`${path}.highlight`, null);
              }}
              placeholder="예: 단짝 (지문 안에서 이 단어를 노란색 형광펜으로 표시)"
              style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </>
        )}

        {t === "MULTI_CHOICE" && <MultiChoiceEditor question={question} path={path} editor={editor} />}
        {t === "FILL_BLANKS" && <FillBlanksEditor question={question} path={path} editor={editor} />}
        {t === "TEXT_SELECT" && <TextSelectEditor question={question} path={path} editor={editor} />}
        {t === "CHOICE_COMPLEX_OX" && <ChoiceComplexOxEditor question={question} path={path} editor={editor} />}

        {/* 10대 역량 벡터 — 정답 시 누적될 가중치 분포 */}
        <div className="dq-section-label" style={{ marginTop: 14 }}>10대 역량 벡터</div>
        <CompetencyVectorEditor
          value={question.competencyVector}
          onChange={(v) => editor.updateField(`${path}.competencyVector`, v)}
          label="정답 시 누적될 역량 가중치"
          color="correct"
        />
        {/* MULTI_CHOICE 의 경우: 각 선택지의 wrongVector (오답 선택 시 학생 약점) */}
        {t === "MULTI_CHOICE" && (question.choices || []).length > 0 && (
          <div className="dq-section-label" style={{ marginTop: 8 }}>선택지별 약점 벡터 (이 선택지를 골라 틀린 학생의 약점)</div>
        )}
        {t === "MULTI_CHOICE" && (question.choices || []).map((c, ci) => {
          const isAnswer = question.answerId === c.id;
          if (isAnswer) return null; // 정답 선지는 wrongVector 의미 없음
          return (
            <CompetencyVectorEditor
              key={`wv-${c.id || ci}`}
              value={c.wrongVector}
              onChange={(v) => editor.updateField(`${path}.choices[${ci}].wrongVector`, v)}
              label={`선택지 ${ci + 1} (${(c.text || "").slice(0, 20)}${(c.text || "").length > 20 ? "…" : ""}) 약점`}
              color="wrong"
              compact
            />
          );
        })}

        <div className="dq-section-label" style={{ marginTop: 14 }}>해설 (explanation)</div>
        <MarkdownEditField
          value={question.explanation || ""}
          onChange={(v) => editor.updateField(`${path}.explanation`, v)}
          placeholder="정답 해설 (마크다운·이미지 지원)"
          minHeight={90}
        />

        <div className="dq-section-label" style={{ marginTop: 12 }}>점수 (scoring)</div>
        <div className="dq-scoring-row">
          <label>
            정답 시간 가산
            <input
              type="number"
              value={question?.scoring?.correctDeltaSec ?? 20}
              onChange={(e) => editor.updateField(`${path}.scoring.correctDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
          <label>
            오답 시간 차감
            <input
              type="number"
              value={question?.scoring?.wrongDeltaSec ?? -40}
              onChange={(e) => editor.updateField(`${path}.scoring.wrongDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
        </div>
      </div>
    </div>
  );
}
