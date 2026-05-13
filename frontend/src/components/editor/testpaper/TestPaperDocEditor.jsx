import { useMemo, useRef, useLayoutEffect, useState } from "react";
import {
  AREA_LABELS, SUB_AREA_LABELS,
  READ_QUESTION_TYPE_LABELS, LIT_QUESTION_TYPE_LABELS,
  READ_WRONG_PATTERN_LABELS, LIT_WRONG_PATTERN_LABELS,
} from "../../../constants/questionBankCodes";
import { uploadFile, fileDownloadUrl } from "../../../utils/fileUpload";
import { COMPETENCIES, vectorActiveCount, vectorSum } from "../../../constants/competencies";
import CompetencyVectorEditor from "../dailyquiz/CompetencyVectorEditor";
import Modal from "../../Modal";
import MarkdownEditField from "../MarkdownEditField";
import { handleTextareaShortcut } from "../markdownShortcuts";
import AiPassageGenModal from "./AiPassageGenModal";
import AiQuestionGenModal from "./AiQuestionGenModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { mdImgRenderer } from "../../FileImage";

const PATTERN_OPTIONS = { ...READ_WRONG_PATTERN_LABELS, ...LIT_WRONG_PATTERN_LABELS };
const QTYPE_OPTIONS = { ...READ_QUESTION_TYPE_LABELS, ...LIT_QUESTION_TYPE_LABELS };

/**
 * 시험지 비주얼 에디터.
 * - questions 는 q.number 오름차순으로 정렬해 표시
 * - 같은 지문(passageId) 의 문항은 한 묶음으로 표시. 지문 박스는 내용에 맞춘 자동 높이
 * - 선택지마다 정답 라디오(앞) + 함정 패턴(뒤) 입력
 * - 문항마다 10대 역량 벡터 입력 토글
 */
export default function TestPaperDocEditor({ editor }) {
  const { content } = editor;
  const questions = content?.questions || [];
  const passages = content?.passages || [];

  // AI 모달 상태 — passage: { passageIndex } | null, question: { passageId, passageText } | null
  const [aiPassageModal, setAiPassageModal] = useState(null);
  const [aiQuestionModal, setAiQuestionModal] = useState(null);

  const meta = editor.meta || {};
  const testId = meta.contentId;
  const defaultLevelId = meta.levelId || "";
  const isDiagnostic = content?.kind === "diagnostic"
    || meta.series === "diagnostic"
    || String(testId || "").startsWith("diag_paper_");

  const grouped = useMemo(() => {
    const map = new Map();
    questions.forEach((q, idx) => {
      const key = q.passageId || "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ q, idx });
    });
    // 각 지문 그룹 내 번호 오름차순
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.q.number ?? a.idx + 1) - (b.q.number ?? b.idx + 1));
    }
    const order = [
      ...passages.map((p) => p.id),
      ...Array.from(map.keys()).filter((k) => k !== "_none" && !passages.some((p) => p.id === k)),
      "_none",
    ];
    return order
      .map((k) => ({
        passage: passages.find((p) => p.id === k) || (k === "_none" ? null : { id: k, text: "" }),
        items: map.get(k) || [],
      }))
      // 지문 없는 그룹("_none")은 그 안에 문항이 있을 때만 표시. 등록된 지문은 빈 상태여도 항상 표시.
      .filter(({ passage, items }) => passage != null || items.length > 0);
  }, [questions, passages]);

  const nextNumber = () => {
    const max = questions.reduce((m, q) => Math.max(m, q.number || 0), 0);
    return max + 1;
  };

  const addPassage = () => {
    const id = `p${Date.now().toString(36)}`;
    editor.addItem("passages", passages.length, {
      id, text: "", domain: "", subDomain: "",
    });
  };

  const removePassage = (idx, passageId) => {
    if (!window.confirm("이 지문을 삭제할까요? (그 지문에 속한 문항의 passageId는 비워집니다)")) return;
    questions.forEach((q, qi) => {
      if (q.passageId === passageId) editor.updateField(`questions[${qi}].passageId`, null);
    });
    editor.removeItem("passages", idx);
  };

  const newQuestion = (type = "MULTI_CHOICE", passageId = null) => {
    const question = {
      id: `q${Date.now().toString(36)}`,
      number: nextNumber(),
      type,
      stem: "",
      passageId,
      boxContent: "",
      conditionContent: "",
      choices: type === "MULTI_CHOICE" ? [
        { id: "1", text: "", wrongPattern: null },
        { id: "2", text: "", wrongPattern: null },
        { id: "3", text: "", wrongPattern: null },
        { id: "4", text: "", wrongPattern: null },
        { id: "5", text: "", wrongPattern: null },
      ] : [],
      answerId: "",
      choiceExplanations: {},
      explanation: "",
      modelAnswer: "",
      essayKeywords: [],
      essayRubric: "",
      questionType: null,
      competencyVector: {},
    };
    if (!isDiagnostic) question.points = 5;
    return question;
  };

  const addQuestionTo = (passageId) => {
    editor.addItem("questions", questions.length, newQuestion("MULTI_CHOICE", passageId));
  };

  const removeQuestion = (idx) => {
    if (!window.confirm("이 문항을 삭제할까요?")) return;
    editor.removeItem("questions", idx);
  };

  // 같은 그룹(passageId) 안에서만 문항 순서 변경. 전역 questions 배열에서 swap 후 number 재할당.
  const moveQuestionInGroup = (currentGlobalIdx, direction) => {
    const cur = questions[currentGlobalIdx];
    if (!cur) return;
    const groupKey = cur.passageId || "_none";
    const groupMembers = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => (q.passageId || "_none") === groupKey);
    const localPos = groupMembers.findIndex((it) => it.i === currentGlobalIdx);
    if (localPos < 0) return;
    const targetLocalPos = direction === "up" ? localPos - 1 : localPos + 1;
    if (targetLocalPos < 0 || targetLocalPos >= groupMembers.length) return;
    const targetGlobalIdx = groupMembers[targetLocalPos].i;

    const newQuestions = questions.map((q) => ({ ...q }));
    [newQuestions[currentGlobalIdx], newQuestions[targetGlobalIdx]] =
      [newQuestions[targetGlobalIdx], newQuestions[currentGlobalIdx]];
    // 전체 number 재할당 — 그룹 안 순서가 바뀌어도 전역 번호 1..N 유지.
    newQuestions.forEach((q, i) => { q.number = i + 1; });
    editor.setContentDirect({ ...editor.content, questions: newQuestions });
  };

  return (
    <div className="dq-doc-root">
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px", marginBottom: 12,
        background: "var(--bg)", border: "1px solid var(--stroke)", borderRadius: 8,
      }}>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          지문 <strong style={{ color: "var(--text)" }}>{passages.length}</strong>개 · 총 <strong style={{ color: "var(--text)" }}>{questions.length}</strong>문항
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="ce-btn ce-btn-primary"
          onClick={addPassage}
          style={{ fontSize: 12 }}
        >+ 지문 추가</button>
        <button
          type="button"
          className="ce-btn ce-btn-secondary"
          onClick={() => editor.addItem("questions", questions.length, newQuestion("MULTI_CHOICE", null))}
          style={{ fontSize: 12 }}
        >+ 문항 추가 (지문 없음)</button>
      </div>

      <div className="dq-doc-paper">
        {grouped.length === 0 && (
          <div style={{
            padding: 24, textAlign: "center",
            color: "var(--muted)", fontSize: 13,
            background: "var(--panel)", border: "1px dashed var(--stroke)", borderRadius: 8,
          }}>
            아직 지문도 문항도 없습니다. 위쪽의 <strong style={{ color: "#ff7f2a" }}>[+ 지문 추가]</strong> 또는 <strong>[+ 문항 추가 (지문 없음)]</strong> 버튼으로 시작하세요.
          </div>
        )}

        {grouped.map(({ passage, items }) => (
          <PassageBlock
            key={passage?.id || "_none"}
            passage={passage}
            items={items}
            passageIndex={passage ? passages.findIndex((p) => p.id === passage.id) : -1}
            editor={editor}
            onRemovePassage={() => passage && passage.id !== "_none" && removePassage(passages.findIndex((p) => p.id === passage.id), passage.id)}
            onAddQuestion={() => addQuestionTo(passage?.id || null)}
            onRemoveQuestion={removeQuestion}
            onMoveQuestion={moveQuestionInGroup}
            isDiagnostic={isDiagnostic}
            onAiPassage={() => setAiPassageModal({ passageIndex: passages.findIndex((p) => p.id === passage?.id) })}
            onAiQuestion={() => setAiQuestionModal({
              passageId: passage?.id || null,
              passageText: passage?.text || "",
              area: passage?.domain || null,
              subArea: passage?.subDomain || null,
            })}
          />
        ))}
      </div>

      {/* AI 지문 생성 모달 */}
      {aiPassageModal != null && (() => {
        const idx = aiPassageModal.passageIndex;
        const p = passages[idx];
        return (
          <AiPassageGenModal
            open
            onClose={() => setAiPassageModal(null)}
            testId={testId}
            defaultArea={p?.domain || "READ"}
            defaultSubArea={p?.subDomain || ""}
            defaultLevelId={defaultLevelId}
            onGenerated={({ text, area, subArea }) => {
              if (idx < 0) return;
              editor.updateField(`passages[${idx}].text`, text || "");
              if (area) editor.updateField(`passages[${idx}].domain`, area);
              if (subArea) editor.updateField(`passages[${idx}].subDomain`, subArea);
            }}
          />
        );
      })()}

      {/* AI 문항 생성 모달 */}
      {aiQuestionModal != null && (
        <AiQuestionGenModal
          open
          onClose={() => setAiQuestionModal(null)}
          testId={testId}
          passageId={aiQuestionModal.passageId}
          passageText={aiQuestionModal.passageText}
          area={aiQuestionModal.area}
          subArea={aiQuestionModal.subArea}
          levelId={defaultLevelId}
          onGenerated={(question, review) => {
            // 비주얼 에디터에 새 문항 추가 (모든 필드 채워진 상태로)
            const newQ = {
              id: `q${Date.now().toString(36)}`,
              number: nextNumber(),
              passageId: aiQuestionModal.passageId,
              ...question,
              // review 결과는 메타로 같이 저장 (추후 필터링·재검수 용)
              _aiReview: review,
            };
            if (isDiagnostic) delete newQ.points;
            editor.addItem("questions", questions.length, newQ);
          }}
        />
      )}
    </div>
  );
}

// 발문 — textarea + 밑줄 토글만 (간단한 한 줄 도구)
// 단축키: Ctrl+B/I/U(서식), Ctrl+J/E/R(정렬). markdownShortcuts.js 공용 헬퍼 사용.
function StemEditor({ value, onChange }) {
  const taRef = useRef(null);
  const wrapU = () => {
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const t = value || "";
    const sel = t.slice(start, end) || "밑줄";
    const next = t.slice(0, start) + "<u>" + sel + "</u>" + t.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      try {
        el.focus();
        const cursor = start + 3 + sel.length;
        el.setSelectionRange(cursor, cursor);
      } catch { /* ignore */ }
    });
  };
  // 자동 높이
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(50, el.scrollHeight)}px`;
  }, [value]);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
      <textarea
        ref={taRef}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => handleTextareaShortcut(e, { value: value || "", setValue: onChange })}
        placeholder="발문 (Ctrl+B/I/U 서식, Ctrl+J/E/R 정렬, [U] 버튼으로 밑줄)"
        style={{
          flex: 1, padding: 8, fontSize: 13, lineHeight: 1.5,
          background: "var(--bg)", color: "var(--text)",
          border: "1px solid var(--stroke)", borderRadius: 4,
          resize: "none", overflow: "hidden", minHeight: 50,
          fontFamily: "inherit",
        }}
      />
      <button
        type="button"
        onClick={wrapU}
        title="선택 텍스트에 밑줄 (<u>...</u>)"
        style={{
          padding: "4px 10px", fontSize: 12, cursor: "pointer",
          background: "var(--bg)", color: "var(--text)",
          border: "1px solid var(--stroke)", borderRadius: 4,
          flexShrink: 0,
        }}
      ><u>U</u></button>
    </div>
  );
}

// 자동 높이 textarea — 내용 길이에 맞춰 height 늘어남, 박스 내부 스크롤 없음
// 단축키: Ctrl+B/I/U(서식), Ctrl+J/E/R(정렬). 호출자가 onChange(event) 형태로 받으므로 어댑팅.
function AutoTextarea({ value, onChange, placeholder, minHeight = 60, style, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [value, minHeight]);
  return (
    <textarea
      ref={ref}
      value={value || ""}
      onChange={onChange}
      onKeyDown={(e) => handleTextareaShortcut(e, {
        value: value || "",
        setValue: (next) => onChange({ target: { value: next } }),
      })}
      placeholder={placeholder}
      style={{
        width: "100%", padding: 10,
        fontSize: 13, lineHeight: 1.6,
        background: "var(--bg)", color: "var(--text)",
        border: "1px solid var(--stroke)", borderRadius: 4,
        resize: "none", overflow: "hidden",
        minHeight,
        ...style,
      }}
      {...rest}
    />
  );
}

function PassageBlock({ passage, items, passageIndex, editor, onRemovePassage, onAddQuestion, onRemoveQuestion, onMoveQuestion, isDiagnostic, onAiPassage, onAiQuestion }) {
  const isNone = !passage || passage.id === "_none";
  const passagePath = !isNone && passageIndex >= 0 ? `passages[${passageIndex}]` : null;

  // 영역에 맞는 세부영역만 필터링 (코드 prefix 매칭). 영역 미선택 시 전체.
  const subAreaOptions = useMemo(() => {
    const area = passage?.domain;
    if (!area) return Object.entries(SUB_AREA_LABELS);
    return Object.entries(SUB_AREA_LABELS).filter(([code]) => code.startsWith(`${area}_`));
  }, [passage?.domain]);

  return (
    <div style={{
      marginBottom: 24, padding: 16, borderRadius: 8,
      background: "var(--bg)", border: "1px solid var(--stroke)",
    }}>
      {!isNone && passage && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <strong style={{ color: "var(--text)", fontSize: 13 }}>📖 지문 {passage.id}</strong>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <select
                value={passage.domain || ""}
                onChange={(e) => {
                  const newArea = e.target.value || null;
                  editor.updateField(`${passagePath}.domain`, newArea);
                  // 영역 변경 시 기존 세부영역이 새 영역에 속하지 않으면 reset
                  if (passage.subDomain && (!newArea || !passage.subDomain.startsWith(`${newArea}_`))) {
                    editor.updateField(`${passagePath}.subDomain`, null);
                  }
                }}
                style={selStyle}
                title="영역"
              >
                <option value="">영역 선택</option>
                {Object.entries(AREA_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <select
                value={passage.subDomain || ""}
                onChange={(e) => editor.updateField(`${passagePath}.subDomain`, e.target.value || null)}
                style={selStyle}
                title={passage.domain ? "세부 영역" : "먼저 영역을 선택하세요"}
                disabled={!passage.domain}
              >
                <option value="">{passage.domain ? "세부영역 선택" : "영역 먼저 선택"}</option>
                {subAreaOptions.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAiPassage}
                style={{ ...subtleBtn, background: "rgba(168,85,247,0.12)", color: "#c084fc", borderColor: "rgba(168,85,247,0.4)" }}
                title="AI 지문 생성 (Sonnet 4.6)"
              >🤖 AI 생성</button>
              <button type="button" onClick={onRemovePassage} style={dangerBtn}>지문 삭제</button>
            </div>
          </div>
          <MarkdownEditField
            value={passage.text}
            onChange={(text) => editor.updateField(`${passagePath}.text`, text)}
            placeholder="지문 본문 — 마크다운 + 이미지 삽입 가능. 밑줄은 <u>...</u>"
            minHeight={160}
          />
        </div>
      )}
      {isNone && (
        <div style={{ marginBottom: 12, color: "var(--muted)", fontSize: 12 }}>
          📌 지문 없는 문항
        </div>
      )}

      {items.map(({ q, idx }, localPos) => (
        <QuestionCard
          key={q.id || idx}
          q={q}
          idx={idx}
          editor={editor}
          isDiagnostic={isDiagnostic}
          onRemove={() => onRemoveQuestion(idx)}
          canMoveUp={localPos > 0}
          canMoveDown={localPos < items.length - 1}
          onMoveUp={() => onMoveQuestion(idx, "up")}
          onMoveDown={() => onMoveQuestion(idx, "down")}
        />
      ))}

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button type="button" className="dq-doc-add-between" onClick={onAddQuestion} style={{ flex: 1 }}>
          + 이 지문에 문항 추가
        </button>
        <button
          type="button"
          onClick={onAiQuestion}
          className="ce-btn"
          style={{
            background: "rgba(168,85,247,0.18)", color: "#c084fc",
            border: "1px solid rgba(168,85,247,0.4)", padding: "6px 14px",
            fontSize: 13, fontWeight: 600,
          }}
          title="AI 문항 생성 (Opus 4.7 + 학생 페르소나 검증)"
        >🤖 AI 생성</button>
      </div>
    </div>
  );
}

function QuestionCard({ q, idx, editor, isDiagnostic, onRemove, canMoveUp, canMoveDown, onMoveUp, onMoveDown }) {
  const path = `questions[${idx}]`;
  const isEssay = q.type === "ESSAY" || q.type === "서술형";
  const set = (k, v) => editor.updateField(`${path}.${k}`, v);
  const displayNumber = q.number ?? idx + 1;

  // 역량 벡터 모달 — { kind: "correct" } | { kind: "wrong", choiceIdx } | null
  const [vecModal, setVecModal] = useState(null);
  const closeVec = () => setVecModal(null);
  const correctVec = q.competencyVector || {};
  const correctVecActive = vectorActiveCount(correctVec);

  return (
    <div style={{
      marginBottom: 12, padding: 12, borderRadius: 6,
      background: "var(--panel)", border: "1px solid var(--stroke)",
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <strong style={{ color: "var(--accent)", minWidth: 36 }}>{displayNumber}번</strong>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="같은 지문 그룹 안에서 위로"
            style={{ ...moveBtn, opacity: canMoveUp ? 1 : 0.3, cursor: canMoveUp ? "pointer" : "not-allowed" }}
          >▲</button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="같은 지문 그룹 안에서 아래로"
            style={{ ...moveBtn, opacity: canMoveDown ? 1 : 0.3, cursor: canMoveDown ? "pointer" : "not-allowed" }}
          >▼</button>
        </div>
        <select value={q.type || "MULTI_CHOICE"} onChange={(e) => set("type", e.target.value)} style={selStyle}>
          <option value="MULTI_CHOICE">객관식</option>
          <option value="ESSAY">서술형</option>
        </select>
        {!isDiagnostic && (
          <input
            type="number"
            value={q.points ?? 0}
            onChange={(e) => set("points", Number(e.target.value))}
            style={{ ...inpStyle, width: 60 }}
            placeholder="배점"
            title="배점"
          />
        )}
        <select
          value={q.questionType || ""}
          onChange={(e) => set("questionType", e.target.value || null)}
          style={selStyle}
          title="문제 유형"
        >
          <option value="">문제 유형</option>
          {Object.entries(QTYPE_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setVecModal({ kind: "correct" })}
          style={{
            ...subtleBtn,
            background: correctVecActive > 0 ? "rgba(245,158,11,0.15)" : "var(--bg)",
            color: correctVecActive > 0 ? "#fbbf24" : "var(--muted)",
            borderColor: correctVecActive > 0 ? "rgba(245,158,11,0.4)" : "var(--stroke)",
          }}
          title="정답 시 누적될 역량 가중치"
        >🎯 정답 벡터 {correctVecActive > 0 ? `· ${correctVecActive}` : ""}</button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onRemove} style={dangerBtn}>문항 삭제</button>
      </div>

      <StemEditor value={q.stem} onChange={(v) => set("stem", v)} />

      <BoxField q={q} idx={idx} editor={editor} />

      <CollapsibleField
        label="<조건>"
        present={Boolean(q.conditionContent)}
        onAdd={() => set("conditionContent", " ")}
        onClear={() => set("conditionContent", "")}
      >
        <AutoTextarea value={q.conditionContent} onChange={(e) => set("conditionContent", e.target.value)} placeholder="<조건> 본문" minHeight={50} />
      </CollapsibleField>

      {!isEssay && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <strong style={{ fontSize: 12, color: "var(--muted)" }}>선택지</strong>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>(앞쪽 ◯ 클릭 = 정답 지정)</span>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => editor.addItem(`${path}.choices`, (q.choices || []).length, {
                id: String((q.choices || []).length + 1), text: "", wrongPattern: null,
              })}
              style={subtleBtn}
            >+ 선택지</button>
          </div>
          {(q.choices || []).map((c, ci) => {
            const isAnswer = q.answerId === c.id;
            const wrongActive = vectorActiveCount(c.wrongVector);
            return (
              <div key={ci} style={{
                marginBottom: 10, padding: 8, borderRadius: 6,
                background: isAnswer ? "rgba(34,197,94,0.06)" : "var(--bg)",
                border: `1px solid ${isAnswer ? "rgba(34,197,94,0.3)" : "var(--stroke)"}`,
              }}>
                {/* 1행: 정답라디오 / id / 선택지 본문 (한 줄 전체) */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => set("answerId", c.id)}
                    title={isAnswer ? "정답" : "정답으로 지정"}
                    style={{
                      width: 24, height: 24, padding: 0, borderRadius: "50%",
                      border: `2px solid ${isAnswer ? "#22c55e" : "var(--stroke)"}`,
                      background: isAnswer ? "rgba(34,197,94,0.18)" : "transparent",
                      color: isAnswer ? "#22c55e" : "var(--muted)",
                      fontWeight: 700, cursor: "pointer", fontSize: 12, lineHeight: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >{isAnswer ? "●" : ""}</button>
                  <input
                    value={c.id || ""}
                    onChange={(e) => editor.updateField(`${path}.choices[${ci}].id`, e.target.value)}
                    style={{ ...inpStyle, width: 44, flexShrink: 0 }}
                    placeholder="id"
                  />
                  <input
                    value={c.text || ""}
                    onChange={(e) => editor.updateField(`${path}.choices[${ci}].text`, e.target.value)}
                    style={{ ...inpStyle, flex: 1 }}
                    placeholder={`선택지 ${ci + 1}`}
                  />
                  <ChoiceImageButton
                    onUploaded={(url, alt) => {
                      const existing = (c.text || "").trimEnd();
                      const sep = existing ? " " : "";
                      editor.updateField(`${path}.choices[${ci}].text`, `${existing}${sep}![${alt}](${url})`);
                    }}
                  />
                </div>
                {/* 선택지에 이미지 markdown 이 있으면 입력란 아래 미리보기 */}
                {/\!\[[^\]]*\]\([^)]+\)/.test(c.text || "") && (
                  <div style={{ marginTop: 6, paddingLeft: 34 }}>
                    <ChoicePreview text={c.text} />
                  </div>
                )}
                {/* 2행: 해설 / 함정 패턴 / 약점 / 삭제 */}
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", paddingLeft: 34 }}>
                  <input
                    value={(q.choiceExplanations || {})[c.id] || ""}
                    onChange={(e) => set(`choiceExplanations.${c.id}`, e.target.value)}
                    style={{ ...inpStyle, flex: 1, color: "var(--muted)", fontSize: 11 }}
                    placeholder="이 선지 해설"
                  />
                  <select
                    value={c.wrongPattern || ""}
                    onChange={(e) => editor.updateField(`${path}.choices[${ci}].wrongPattern`, e.target.value || null)}
                    style={{ ...selStyle, width: 130, flexShrink: 0 }}
                    title="이 선지의 함정 패턴"
                  >
                    <option value="">함정 패턴</option>
                    {Object.entries(PATTERN_OPTIONS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setVecModal({ kind: "wrong", choiceIdx: ci })}
                    style={{
                      ...subtleBtn,
                      background: wrongActive > 0 ? "rgba(59,130,246,0.15)" : "var(--bg)",
                      color: wrongActive > 0 ? "#60a5fa" : "var(--muted)",
                      borderColor: wrongActive > 0 ? "rgba(59,130,246,0.4)" : "var(--stroke)",
                      flexShrink: 0,
                    }}
                    title="이 선지를 골라 틀린 학생의 약점 벡터"
                  >약점 {wrongActive > 0 ? `· ${wrongActive}` : ""}</button>
                  <button
                    type="button"
                    onClick={() => editor.removeItem(`${path}.choices`, ci)}
                    style={{ ...subtleBtn, flexShrink: 0 }}
                    title="선택지 삭제"
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isEssay && (
        <>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>모범 답안</strong>
            <AutoTextarea value={q.modelAnswer} onChange={(e) => set("modelAnswer", e.target.value)} placeholder="모범 답안" minHeight={60} />
          </div>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>채점 기준</strong>
            <AutoTextarea value={q.essayRubric} onChange={(e) => set("essayRubric", e.target.value)} placeholder="채점 기준 — 만점/부분점수/0점 부여 기준" minHeight={60} />
          </div>
        </>
      )}

      <div style={{ marginTop: 8 }}>
        <strong style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>출제 의도·해설</strong>
        <AutoTextarea value={q.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder="출제 의도 또는 해설" minHeight={50} />
      </div>

      {/* 역량 벡터 모달 */}
      {vecModal?.kind === "correct" && (
        <Modal open onClose={closeVec} title={`${displayNumber}번 — 정답 벡터 (정답 시 누적될 가중치)`} size="md">
          <CompetencyVectorEditor
            value={correctVec}
            onChange={(nv) => set("competencyVector", nv)}
            label="정답 벡터"
            color="correct"
            defaultOpen
          />
          <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
            ℹ️ 학생이 이 문제를 맞히면 위 가중치가 그 학생의 10대 역량에 누적됩니다.
          </div>
        </Modal>
      )}
      {vecModal?.kind === "wrong" && (() => {
        const ci = vecModal.choiceIdx;
        const c = (q.choices || [])[ci];
        if (!c) return null;
        const wv = c.wrongVector || {};
        return (
          <Modal open onClose={closeVec} title={`${displayNumber}번 — 선지 ${c.id || ci + 1} 약점 벡터`} size="md">
            <div style={{ marginBottom: 8, fontSize: 12, color: "var(--muted)" }}>
              <strong style={{ color: "var(--text)" }}>{c.text || "(빈 선지)"}</strong>
            </div>
            <CompetencyVectorEditor
              value={wv}
              onChange={(nv) => editor.updateField(`${path}.choices[${ci}].wrongVector`, nv)}
              label="약점 벡터"
              color="wrong"
              defaultOpen
            />
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
              ℹ️ 학생이 이 선지를 골라서 틀리면 위 가중치만큼 그 역량에 음수 영향이 누적됩니다.
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// <보기> 전용 — 지문과 동일한 마크다운 에디터 (이미지·밑줄·정렬 등 풀기능)
function BoxField({ q, idx, editor }) {
  const path = `questions[${idx}]`;
  const set = (k, v) => editor.updateField(`${path}.${k}`, v);
  const present = Boolean(q.boxContent);

  if (!present) {
    return (
      <button type="button" onClick={() => set("boxContent", " ")} style={{ ...subtleBtn, marginTop: 8, fontSize: 11 }}>
        + &lt;보기&gt; 추가
      </button>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 12, color: "var(--muted)" }}>&lt;보기&gt;</strong>
        <button type="button" onClick={() => set("boxContent", "")} style={subtleBtn}>제거</button>
      </div>
      <MarkdownEditField
        value={q.boxContent}
        onChange={(text) => set("boxContent", text)}
        placeholder="<보기> 본문 — 마크다운 + 이미지 + 밑줄 (<u>) 가능"
        minHeight={100}
      />
    </div>
  );
}

function CollapsibleField({ label, present, onAdd, onClear, children }) {
  if (!present) {
    return (
      <button type="button" onClick={onAdd} style={{ ...subtleBtn, marginTop: 8, fontSize: 11 }}>
        + {label} 추가
      </button>
    );
  }
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 12, color: "var(--muted)" }}>{label}</strong>
        <button type="button" onClick={onClear} style={subtleBtn}>제거</button>
      </div>
      {children}
    </div>
  );
}

/**
 * 선택지 본문 옆 이미지 업로드 버튼. 클릭 시 파일 input → S3 업로드 →
 * onUploaded(downloadUrl, alt) 호출. 부모가 c.text 끝에 markdown 을 append.
 */
function ChoiceImageButton({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file, { purpose: "content" });
      const url = result.downloadUrl || fileDownloadUrl(result.fileId);
      const alt = (result.originalName || "image").replace(/\.[^.]+$/, "");
      onUploaded(url, alt);
    } catch (err) {
      alert("이미지 업로드 실패: " + (err.message || ""));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="선택지에 이미지 삽입"
        style={{ ...subtleBtn, flexShrink: 0, padding: "4px 8px" }}
      >{uploading ? "..." : "🖼"}</button>
    </>
  );
}

/** 선택지 본문 마크다운 미리보기 (이미지 포함 시 입력란 아래 표시). */
function ChoicePreview({ text }) {
  return (
    <div style={{
      padding: "6px 8px", background: "var(--bg)",
      border: "1px dashed var(--stroke)", borderRadius: 4,
      fontSize: 12, color: "var(--text)",
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: mdImgRenderer,
          p: ({ children }) => <span>{children}</span>,
        }}
      >{text || ""}</ReactMarkdown>
    </div>
  );
}

const inpStyle = {
  padding: "4px 8px", fontSize: 12,
  background: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--stroke)", borderRadius: 4,
};
const selStyle = { ...inpStyle, padding: "4px 6px" };
const moveBtn = {
  padding: "1px 6px", fontSize: 9, lineHeight: 1.2,
  background: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--stroke)", borderRadius: 3,
};
const subtleBtn = {
  padding: "2px 8px", fontSize: 11, cursor: "pointer",
  background: "var(--bg)", color: "var(--muted)",
  border: "1px solid var(--stroke)", borderRadius: 4,
};
const dangerBtn = {
  padding: "4px 10px", fontSize: 11, cursor: "pointer",
  background: "rgba(239,68,68,0.1)", color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4,
};
