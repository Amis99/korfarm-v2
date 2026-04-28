import InlineEditable from "../dailyquiz/InlineEditable";
import MultiChoiceEditor from "../dailyquiz/MultiChoiceEditor";
import FillBlanksEditor from "../dailyquiz/FillBlanksEditor";
import CompetencyVectorEditor from "../dailyquiz/CompetencyVectorEditor";

const TYPE_OPTIONS = [
  { value: "MULTI_CHOICE", label: "객관식" },
  { value: "FILL_BLANKS", label: "빈칸 채우기" },
];

/* 카테고리별 questionKind 옵션 — 모드는 부모(VocabDocEditor)가 결정해 prop 으로 전달 */
const KIND_OPTIONS_BY_MODE = {
  vocab: [
    { value: "WORD_TO_MEANING", label: "낱말 → 뜻" },
    { value: "MEANING_TO_WORD", label: "뜻 → 낱말" },
    { value: "EXAMPLE_BLANK", label: "용례 빈칸" },
    { value: "HANJA_READING", label: "한자 표기 → 뜻" },
    { value: "DICT_MEANING", label: "사전 뜻풀이 → 낱말" },
    { value: "DICT_EXAMPLE", label: "사전 용례" },
    { value: "DICT_POLYSEMY", label: "다의어 분별" },
  ],
  pos: [
    { value: "POS", label: "품사 판별" },
    { value: "POS_TRANSFORM", label: "품사 변환" },
    { value: "POS_FUNCTION", label: "품사 기능" },
  ],
  concept: [
    { value: "CONCEPT", label: "개념 정의" },
    { value: "CONCEPT_EXAMPLE", label: "사례 적용" },
    { value: "CONCEPT_COMPARE", label: "개념 비교" },
  ],
};

const MODE_LABEL = { vocab: "어휘", pos: "품사", concept: "국어 개념" };

/**
 * 어휘 문제 카드 — questionKind 셀렉터 + type 분기(MULTI_CHOICE / FILL_BLANKS).
 *
 * props:
 *   question, idx, total, path, editor,
 *   onMoveUp, onMoveDown, onDelete, onDuplicate
 */
export default function VocabQuestionCard({
  question, idx, total, path, editor,
  onMoveUp, onMoveDown, onDelete, onDuplicate,
  mode = "vocab",
}) {
  const t = question.type || "MULTI_CHOICE";
  const kindOptions = KIND_OPTIONS_BY_MODE[mode] || KIND_OPTIONS_BY_MODE.vocab;
  const defaultKind = kindOptions[0]?.value || "WORD_TO_MEANING";
  const kind = question.questionKind || defaultKind;

  const onTypeChange = (newType) => {
    if (newType === t) return;
    if (!window.confirm(`문제 유형 "${t}" → "${newType}" 로 변경합니다. 일부 필드가 초기화됩니다.`)) return;
    const base = {
      id: question.id, type: newType, questionKind: kind,
      stem: question.stem || "", explanation: question.explanation || "",
      scoring: question.scoring,
    };
    let next = base;
    if (newType === "MULTI_CHOICE") {
      next = { ...base, choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" }, { id: "c3", text: "" }, { id: "c4", text: "" },
      ], answerId: "" };
    } else if (newType === "FILL_BLANKS") {
      next = { ...base, template: "____", blanks: [
        { id: "b1", choices: [{ id: "b1-c1", text: "" }, { id: "b1-c2", text: "" }], answerId: "" },
      ] };
    }
    editor.updateField(path, next);
  };

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">{MODE_LABEL[mode] || "문항"} {idx + 1} / {total}</div>
        <select
          className="dq-card-type"
          value={kind}
          onChange={(e) => editor.updateField(`${path}.questionKind`, e.target.value)}
          title="유형"
        >
          {kindOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          {/* 풀에 없는 값이면 그대로 보여줌 (커스텀 자유 입력) */}
          {!kindOptions.find((o) => o.value === kind) && kind && (
            <option value={kind}>{kind} (커스텀)</option>
          )}
        </select>
        <select className="dq-card-type" value={t} onChange={(e) => onTypeChange(e.target.value)} title="문제 형태">
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
        <div className="dq-section-label">발문 (stem) — 학생에게 보일 질문</div>
        <InlineEditable
          value={question.stem || ""}
          onChange={(v) => editor.updateField(`${path}.stem`, v)}
          placeholder="예: 다음 낱말의 뜻으로 알맞은 것을 고르시오. — '청렴'"
          className="dq-stem"
        />

        <div className="dq-section-label">지문 (passage) — 선택. 학생 화면에서 카드 위에 박스로 표시</div>
        <InlineEditable
          value={typeof question.passage === "string" ? question.passage : ""}
          onChange={(v) => editor.updateField(`${path}.passage`, v)}
          placeholder="(지문이 있으면 입력. 없으면 비워두세요.)"
          className="dq-passage"
        />

        <div className="dq-section-label">하이라이트 — 지문 안에서 형광펜 표시할 문구 (선택)</div>
        <InlineEditable
          value={question.highlight?.text || ""}
          onChange={(v) => editor.updateField(`${path}.highlight`, v ? { text: v } : null)}
          placeholder="(지문 안에 있는 텍스트와 정확히 일치해야 매칭됨. 비우면 하이라이트 없음.)"
          multiline={false}
          className="vocab-hl-input"
        />
        {question.highlight?.text && question.passage && !question.passage.includes(question.highlight.text) && (
          <div className="vocab-hl-warn">⚠ 입력한 하이라이트 문구가 지문 본문에서 발견되지 않습니다 — 학생 화면에서 표시되지 않습니다.</div>
        )}

        <div className="dq-section-label">&lt;보기&gt; — 선택. 발문 옆 '보기' 박스 (예문·추가 정보)</div>
        <InlineEditable
          value={typeof question["보기"] === "string" ? question["보기"] : ""}
          onChange={(v) => editor.updateField(`${path}.보기`, v)}
          placeholder="(보기 자료가 있으면 입력. 예문·한자 표기·추가 자료 등)"
          className="dq-passage"
        />

        {t === "MULTI_CHOICE" && <MultiChoiceEditor question={question} path={path} editor={editor} />}
        {t === "FILL_BLANKS" && <FillBlanksEditor question={question} path={path} editor={editor} />}

        <div className="dq-section-label" style={{ marginTop: 14 }}>10대 역량 벡터</div>
        <CompetencyVectorEditor
          value={question.competencyVector}
          onChange={(v) => editor.updateField(`${path}.competencyVector`, v)}
          label="정답 시 누적될 역량 가중치"
          color="correct"
        />
        {t === "MULTI_CHOICE" && (question.choices || []).length > 0 && (
          <div className="dq-section-label" style={{ marginTop: 8 }}>선택지별 약점 벡터</div>
        )}
        {t === "MULTI_CHOICE" && (question.choices || []).map((c, ci) => {
          if (question.answerId === c.id) return null;
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

        <div className="dq-section-label" style={{ marginTop: 14 }}>해설 (explanation) — 사전 정의·예문·한자·어원 등</div>
        <InlineEditable
          value={question.explanation || ""}
          onChange={(v) => editor.updateField(`${path}.explanation`, v)}
          placeholder="정답 해설. 사전적 의미·예문·한자 표기 등 학습용 정보"
          className="dq-explanation"
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
