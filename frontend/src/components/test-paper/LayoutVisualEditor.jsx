import { useState, useRef } from "react";
import { apiPost } from "../../utils/adminApi";
import { apiUploadFile, API_BASE, TOKEN_KEY } from "../../utils/api";
import "../../styles/layout-editor.css";

/**
 * 시험지 비주얼 편집기 — 단일 blocks 배열 흐름.
 * 페이지 분할은 typst 가 자동. 사용자가 강제 페이지 분할 원하면 [페이지 분할] 블록 추가.
 *
 * Props:
 *   layout    { version, type, header, columns, blocks }
 *   onChange  layout 변경 시 콜백
 */
export default function LayoutVisualEditor({ layout, onChange }) {
  const lo = layout || { columns: 1, blocks: [] };
  const blocks = lo.blocks || [];
  const set = (next) => onChange?.(next);

  const updateHeader = (patch) => {
    set({ ...lo, header: { ...(lo.header || {}), ...patch } });
  };
  const updateColumns = (n) => set({ ...lo, columns: n });
  const updateBlock = (idx, patch) => {
    const newBlocks = blocks.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    set({ ...lo, blocks: newBlocks });
  };
  const removeBlock = (idx) => {
    set({ ...lo, blocks: blocks.filter((_, i) => i !== idx) });
  };
  const moveBlock = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[ni]] = [newBlocks[ni], newBlocks[idx]];
    set({ ...lo, blocks: newBlocks });
  };
  const addBlock = (type) => {
    set({ ...lo, blocks: [...blocks, makeBlock(type)] });
  };
  const insertBlock = (idx, type) => {
    const next = [...blocks];
    next.splice(idx + 1, 0, makeBlock(type));
    set({ ...lo, blocks: next });
  };

  return (
    <div className="lve-root">
      {/* 도구 모음 */}
      <div className="lve-toolbar">
        <span className="lve-tb-label">단 수:</span>
        <div className="lve-toggle">
          <button className={lo.columns !== 2 ? "active" : ""} onClick={() => updateColumns(1)}>1단</button>
          <button className={lo.columns === 2 ? "active" : ""} onClick={() => updateColumns(2)}>2단</button>
        </div>
        <div className="lve-tb-divider" />
        <BlockAddMenu onAdd={addBlock} />
      </div>

      {/* 헤더 편집 */}
      <div className="lve-header-edit">
        <input
          type="text"
          value={lo.header?.title || ""}
          onChange={(e) => updateHeader({ title: e.target.value })}
          placeholder="시험지 제목"
          className="lve-header-title"
        />
        <input
          type="text"
          value={lo.header?.meta || ""}
          onChange={(e) => updateHeader({ meta: e.target.value })}
          placeholder="문항 수 · 배점 · 시간"
          className="lve-header-meta"
        />
      </div>

      {/* 블록 흐름 */}
      <div className="lve-blocks">
        {blocks.length === 0 ? (
          <p className="lve-empty">우측 위 [블록 추가] 메뉴로 시작하세요.</p>
        ) : (
          blocks.map((b, i) => (
            <div key={b.id || i} className="lve-block-wrap">
              <BlockEdit block={b} onChange={(patch) => updateBlock(i, patch)} />
              <div className="lve-block-controls">
                <button onClick={() => moveBlock(i, -1)} disabled={i === 0} title="위로">▲</button>
                <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} title="아래로">▼</button>
                <InsertAfter onInsert={(type) => insertBlock(i, type)} />
                <button className="danger" onClick={() => removeBlock(i)} title="삭제">×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BlockEdit({ block, onChange }) {
  switch (block.type) {
    case "info":
      return <InfoEdit block={block} onChange={onChange} />;
    case "text":
      return <TextEdit block={block} onChange={onChange} />;
    case "image":
      return <ImageEdit block={block} onChange={onChange} />;
    case "passage":
      return <PassageEdit block={block} onChange={onChange} />;
    case "question":
      return <QuestionEdit block={block} onChange={onChange} />;
    case "box":
      return <BoxEdit block={block} onChange={onChange} />;
    case "page-break":
      return <div className="lve-page-break">— 페이지 분할 —</div>;
    case "spacer":
      return <div className="lve-spacer">↕ 빈 줄 ({block.height || 8}pt)</div>;
    case "heading":
      return <HeadingEdit block={block} onChange={onChange} />;
    case "answer-table":
      return <AnswerTableEdit block={block} onChange={onChange} />;
    case "answer-explanation":
      return <AnswerExplanationEdit block={block} onChange={onChange} />;
    default:
      return <div className="lve-unknown">{block.type}</div>;
  }
}

function InfoEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-info">
      <textarea
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="응시 정보 칸 (학교 ___ 학년 ___ 이름 ___ 등)"
        rows={2}
      />
    </div>
  );
}

function TextEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-text">
      <div className="lve-block-meta">
        <select value={block.align || "left"} onChange={(e) => onChange({ align: e.target.value })}>
          <option value="left">왼쪽</option>
          <option value="center">가운데</option>
          <option value="right">오른쪽</option>
          <option value="justify">양측</option>
        </select>
      </div>
      <textarea
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="자유 텍스트"
        rows={3}
      />
    </div>
  );
}

function HeadingEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-heading">
      <div className="lve-block-meta">
        <select value={block.level || 2} onChange={(e) => onChange({ level: parseInt(e.target.value, 10) })}>
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
      </div>
      <input
        type="text"
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="제목"
      />
    </div>
  );
}

function PassageEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-passage">
      <input
        className="lve-passage-label"
        value={block.label || ""}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="[1~5]"
      />
      <textarea
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="지문 본문"
        rows={6}
      />
    </div>
  );
}

function QuestionEdit({ block, onChange }) {
  const choices = block.choices || [];
  const updateChoice = (idx, patch) =>
    onChange({ choices: choices.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });
  const removeChoice = (idx) =>
    onChange({ choices: choices.filter((_, i) => i !== idx) });
  const addChoice = () => {
    const idx = choices.length;
    onChange({
      choices: [...choices, { id: `c${idx + 1}`, marker: "①②③④⑤"[idx] || "", text: "" }],
    });
  };

  return (
    <div className="lve-block lve-question">
      <div className="lve-q-head">
        <input
          type="number"
          className="lve-q-no"
          value={block.no ?? ""}
          onChange={(e) => onChange({ no: parseInt(e.target.value, 10) || 0 })}
          placeholder="번호"
        />
        <input
          type="number"
          className="lve-q-points"
          value={block.points ?? ""}
          onChange={(e) => onChange({ points: parseInt(e.target.value, 10) || 0 })}
          placeholder="배점"
        />
        <select
          value={block.questionType || "MULTI_CHOICE"}
          onChange={(e) => onChange({ questionType: e.target.value })}
        >
          <option value="MULTI_CHOICE">객관식</option>
          <option value="ESSAY">서술형</option>
        </select>
      </div>
      <textarea
        value={block.stem || ""}
        onChange={(e) => onChange({ stem: e.target.value })}
        placeholder="문제 발문"
        rows={2}
      />
      {block.questionType !== "ESSAY" && (
        <>
          <ol className="lve-choices">
            {choices.map((c, i) => (
              <li key={c.id || i}>
                <span className="lve-choice-marker">{c.marker || `${i + 1})`}</span>
                <input
                  type="text"
                  value={c.text || ""}
                  onChange={(e) => updateChoice(i, { text: e.target.value })}
                  placeholder={`${i + 1}번 선택지`}
                />
                <button className="lve-mini-del" onClick={() => removeChoice(i)} title="삭제">×</button>
              </li>
            ))}
          </ol>
          <button className="lve-add-choice" onClick={addChoice}>+ 선택지</button>
        </>
      )}
    </div>
  );
}

function BoxEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-box">
      <input
        className="lve-box-label"
        value={block.label || ""}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="<보기> 또는 <조건>"
      />
      <textarea
        value={block.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="박스 내용"
        rows={3}
      />
    </div>
  );
}

function ImageEdit({ block, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const presign = await apiPost("/v1/files/presign", {
        purpose: "test_paper",
        filename: file.name,
        mime: file.type,
        size: file.size,
      });
      const fileId = presign?.fileId;
      if (fileId) {
        await apiUploadFile(fileId, file);
        onChange({ fileId });
      }
    } catch (err) {
      alert("업로드 실패: " + (err?.message || ""));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const url = block.fileId
    ? `${API_BASE}/v1/files/${block.fileId}/download${
        sessionStorage.getItem(TOKEN_KEY) ? `?token=${sessionStorage.getItem(TOKEN_KEY)}` : ""
      }`
    : null;

  return (
    <div className="lve-block lve-image">
      {url ? (
        <img src={url} alt={block.caption || ""} style={{ maxWidth: "100%" }} />
      ) : (
        <div className="lve-image-placeholder">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? "업로드 중..." : "📷 이미지 선택"}
          </button>
        </div>
      )}
      <div className="lve-block-meta">
        <select value={block.align || "center"} onChange={(e) => onChange({ align: e.target.value })}>
          <option value="left">왼쪽</option>
          <option value="center">가운데</option>
          <option value="right">오른쪽</option>
        </select>
        <select value={block.width || "60%"} onChange={(e) => onChange({ width: e.target.value })}>
          <option value="40%">40%</option>
          <option value="60%">60%</option>
          <option value="80%">80%</option>
          <option value="100%">100%</option>
        </select>
        {url && <button onClick={() => inputRef.current?.click()} disabled={uploading}>교체</button>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onPick}
      />
      <input
        type="text"
        value={block.caption || ""}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="캡션 (선택)"
      />
    </div>
  );
}

function AnswerTableEdit({ block }) {
  const rows = block.rows || [];
  return (
    <div className="lve-block lve-answer-table">
      <strong>정답표</strong>
      <table>
        <thead><tr><th>번호</th><th>정답</th><th>배점</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}><td>{r.no}</td><td>{r.answer}</td><td>{r.points}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnswerExplanationEdit({ block, onChange }) {
  return (
    <div className="lve-block lve-answer-exp">
      <div className="lve-q-head">
        <input
          type="number"
          className="lve-q-no"
          value={block.no ?? ""}
          onChange={(e) => onChange({ no: parseInt(e.target.value, 10) || 0 })}
          placeholder="번호"
        />
        <input
          type="text"
          className="lve-q-points"
          value={block.answer ?? ""}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder="정답"
          style={{ width: 60 }}
        />
        <input
          type="number"
          className="lve-q-points"
          value={block.points ?? ""}
          onChange={(e) => onChange({ points: parseInt(e.target.value, 10) || 0 })}
          placeholder="배점"
        />
      </div>
      <textarea
        value={block.explanation || ""}
        onChange={(e) => onChange({ explanation: e.target.value })}
        placeholder="해설"
        rows={3}
      />
      <textarea
        value={block.modelAnswer || ""}
        onChange={(e) => onChange({ modelAnswer: e.target.value })}
        placeholder="모범답안 (선택)"
        rows={2}
      />
    </div>
  );
}

// ─── 도구 ───

const BLOCK_TYPES = [
  { key: "text", label: "텍스트" },
  { key: "passage", label: "지문" },
  { key: "question", label: "문제" },
  { key: "box", label: "박스 (보기/조건)" },
  { key: "image", label: "이미지" },
  { key: "info", label: "응시 정보 칸" },
  { key: "heading", label: "소제목" },
  { key: "spacer", label: "빈 줄" },
  { key: "page-break", label: "페이지 분할" },
];

function BlockAddMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lve-add-menu">
      <button className="lve-tb-btn primary" onClick={() => setOpen((v) => !v)}>
        + 블록 추가 {open ? "▲" : "▼"}
      </button>
      {open && (
        <ul className="lve-add-list">
          {BLOCK_TYPES.map((t) => (
            <li key={t.key} onClick={() => { onAdd(t.key); setOpen(false); }}>
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InsertAfter({ onInsert }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="lve-insert-after">
      <button onClick={() => setOpen((v) => !v)} title="다음에 추가">+</button>
      {open && (
        <ul className="lve-add-list" style={{ right: 0 }}>
          {BLOCK_TYPES.map((t) => (
            <li key={t.key} onClick={() => { onInsert(t.key); setOpen(false); }}>
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

// ─── 빈 블록 템플릿 ───

function makeBlock(type) {
  const id = `b${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "info":
      return { id, type: "info", text: "학교 ___ 학년/반 ___ 이름 ___ 응시일 ___" };
    case "text":
      return { id, type: "text", text: "", align: "left" };
    case "image":
      return { id, type: "image", fileId: null, align: "center", width: "60%", caption: "" };
    case "passage":
      return { id, type: "passage", label: "[1~5]", text: "" };
    case "question":
      return {
        id, type: "question", no: 1, questionType: "MULTI_CHOICE",
        stem: "", points: 4,
        choices: [
          { id: "c1", marker: "①", text: "" },
          { id: "c2", marker: "②", text: "" },
          { id: "c3", marker: "③", text: "" },
          { id: "c4", marker: "④", text: "" },
          { id: "c5", marker: "⑤", text: "" },
        ],
      };
    case "box":
      return { id, type: "box", label: "<보기>", text: "" };
    case "heading":
      return { id, type: "heading", level: 2, text: "" };
    case "spacer":
      return { id, type: "spacer", height: 8 };
    case "page-break":
      return { id, type: "page-break" };
    default:
      return { id, type: "text", text: "" };
  }
}
