import { useState, useRef, useCallback } from "react";
import { apiPost } from "../../utils/adminApi";
import { apiUploadFile, API_BASE, TOKEN_KEY } from "../../utils/api";
import "../../styles/test-paper.css";

/**
 * 시험지 비주얼 편집기 (Phase 2).
 *
 * Props:
 *   layout      현재 layout 객체
 *   onChange    layout 변경 시 부모로 전파
 */
export default function TestPaperEditor({ layout, onChange }) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const safe = layout && Array.isArray(layout.pages) && layout.pages.length > 0
    ? layout
    : { version: "1.0", pages: [makeEmptyPage(1)] };
  const pages = safe.pages;
  const page = pages[Math.min(activePageIdx, pages.length - 1)] || pages[0];
  const pageIdx = pages.indexOf(page);

  const setLayout = (next) => onChange?.(next);

  // ── 페이지 관리 ──
  const addPage = () => {
    const next = { ...safe, pages: [...pages, makeEmptyPage(pages.length + 1)] };
    setLayout(next);
    setActivePageIdx(next.pages.length - 1);
  };
  const removePage = (idx) => {
    if (pages.length <= 1) {
      alert("페이지가 1개뿐입니다. 더 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`페이지 ${idx + 1}을(를) 삭제할까요?`)) return;
    const newPages = pages.filter((_, i) => i !== idx);
    setLayout({ ...safe, pages: newPages });
    setActivePageIdx(Math.max(0, Math.min(activePageIdx, newPages.length - 1)));
  };
  const movePage = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= pages.length) return;
    const newPages = [...pages];
    [newPages[idx], newPages[ni]] = [newPages[ni], newPages[idx]];
    setLayout({ ...safe, pages: newPages });
    setActivePageIdx(ni);
  };
  const updatePage = (idx, patch) => {
    const newPages = pages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    setLayout({ ...safe, pages: newPages });
  };

  // ── 블록 관리 ──
  const updateBlocks = (newBlocks) => updatePage(pageIdx, { blocks: newBlocks });
  const updateBlock = (bidx, patch) => {
    const newBlocks = (page.blocks || []).map((b, i) => (i === bidx ? { ...b, ...patch } : b));
    updateBlocks(newBlocks);
  };
  const removeBlock = (bidx) => {
    const newBlocks = (page.blocks || []).filter((_, i) => i !== bidx);
    updateBlocks(newBlocks);
  };
  const moveBlock = (bidx, dir) => {
    const ni = bidx + dir;
    const blocks = page.blocks || [];
    if (ni < 0 || ni >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[bidx], newBlocks[ni]] = [newBlocks[ni], newBlocks[bidx]];
    updateBlocks(newBlocks);
  };
  const addBlock = (type) => {
    const newBlock = makeEmptyBlock(type);
    updateBlocks([...(page.blocks || []), newBlock]);
  };

  // ── 헤더 편집 ──
  const updateHeader = (patch) => {
    updatePage(pageIdx, { header: { ...(page.header || {}), ...patch } });
  };

  // ── 다단 토글 ──
  const toggleColumns = () => updatePage(pageIdx, { columns: page.columns === 2 ? 1 : 2 });

  return (
    <div className="tpe-root">
      {/* 페이지 nav */}
      <div className="tpe-page-nav">
        {pages.map((p, i) => (
          <button
            key={p.id || i}
            className={`tpe-page-tab ${i === pageIdx ? "active" : ""}`}
            onClick={() => setActivePageIdx(i)}
            title={`페이지 ${i + 1}`}
          >
            {i + 1}
            {i === pageIdx && (
              <span className="tpe-page-tab-actions">
                <span onClick={(e) => { e.stopPropagation(); movePage(i, -1); }} title="앞으로">◀</span>
                <span onClick={(e) => { e.stopPropagation(); movePage(i, 1); }} title="뒤로">▶</span>
                <span onClick={(e) => { e.stopPropagation(); removePage(i); }} title="삭제">×</span>
              </span>
            )}
          </button>
        ))}
        <button className="tpe-page-tab add" onClick={addPage} title="새 페이지">+ 페이지</button>
      </div>

      {/* 도구 모음 */}
      <div className="tpe-toolbar">
        <span className="tpe-toolbar-label">현재 페이지 {pageIdx + 1}</span>
        <div className="tpe-toolbar-divider" />
        <button onClick={toggleColumns} className="tpe-tb-btn">
          단 수: {page.columns === 2 ? "2단" : "1단"} (전환)
        </button>
        <div className="tpe-toolbar-divider" />
        <BlockAddMenu onAdd={addBlock} />
      </div>

      {/* 페이지 에디터 — A4 비율 */}
      <div className="tpr-root tpe-canvas">
        <div className="tpr-page tpe-page-edit" data-page-idx={pageIdx}>
          <HeaderEditor header={page.header} onChange={updateHeader} />
          <div className={`tpr-page-body cols-${page.columns || 1}`}>
            {(page.blocks || []).map((b, i) => (
              <BlockWrap
                key={b.id || i}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                onRemove={() => removeBlock(i)}
                first={i === 0}
                last={i === (page.blocks || []).length - 1}
              >
                <BlockEditor
                  block={b}
                  onChange={(patch) => updateBlock(i, patch)}
                />
              </BlockWrap>
            ))}
            {(page.blocks || []).length === 0 && (
              <p className="tpe-empty-page">우측 위 [블록 추가] 메뉴로 시작하세요.</p>
            )}
          </div>
          <div className="tpr-page-footer">— {pageIdx + 1} —</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 블록 편집기
// ─────────────────────────────────────────────────────────────

function BlockWrap({ children, onMoveUp, onMoveDown, onRemove, first, last }) {
  return (
    <div className="tpe-block-wrap">
      <div className="tpe-block-controls">
        <button onClick={onMoveUp} disabled={first} title="위로">▲</button>
        <button onClick={onMoveDown} disabled={last} title="아래로">▼</button>
        <button onClick={onRemove} title="삭제" className="danger">×</button>
      </div>
      {children}
    </div>
  );
}

function HeaderEditor({ header, onChange }) {
  if (!header) return null;
  return (
    <header className="tpr-page-header tpe-edit-header">
      <ContentEditable
        tag="h2"
        html={header.title || ""}
        onChange={(html) => onChange({ title: html })}
        placeholder="시험지 제목"
      />
      <div className="tpr-page-meta">
        <ContentEditable
          tag="span"
          html={header.meta || ""}
          onChange={(html) => onChange({ meta: html })}
          placeholder="문항 수 · 배점 · 시간"
        />
      </div>
    </header>
  );
}

function BlockEditor({ block, onChange }) {
  switch (block.type) {
    case "info":
      return <InfoBlockEdit block={block} onChange={onChange} />;
    case "text":
      return <TextBlockEdit block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEdit block={block} onChange={onChange} />;
    case "passage":
      return <PassageBlockEdit block={block} onChange={onChange} />;
    case "question":
      return <QuestionBlockEdit block={block} onChange={onChange} />;
    case "box":
      return <BoxBlockEdit block={block} onChange={onChange} />;
    default:
      return <pre className="tpe-unknown">{JSON.stringify(block, null, 2)}</pre>;
  }
}

function InfoBlockEdit({ block, onChange }) {
  return (
    <div className="tpr-block tpr-info">
      <ContentEditable html={block.html || ""} onChange={(html) => onChange({ html })} />
    </div>
  );
}

function TextBlockEdit({ block, onChange }) {
  return (
    <div className="tpr-block tpr-text">
      <ContentEditable html={block.html || ""} onChange={(html) => onChange({ html })} placeholder="자유 텍스트" />
    </div>
  );
}

function PassageBlockEdit({ block, onChange }) {
  return (
    <div className="tpr-block tpr-passage">
      <div className="tpr-passage-label">
        <ContentEditable
          tag="span"
          html={block.label || ""}
          onChange={(html) => onChange({ label: html })}
          placeholder="[1~5]"
        />
      </div>
      <div className="tpr-passage-body">
        <ContentEditable html={block.html || ""} onChange={(html) => onChange({ html })} placeholder="지문 본문" />
      </div>
    </div>
  );
}

function QuestionBlockEdit({ block, onChange }) {
  const choices = block.choices || [];
  const updateChoice = (idx, patch) => {
    const next = choices.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ choices: next });
  };
  const addChoice = () => {
    const idx = choices.length;
    onChange({
      choices: [...choices, { id: `c${idx + 1}`, marker: "①②③④⑤"[idx] || `${idx + 1})`, text: "" }],
    });
  };
  const removeChoice = (idx) => {
    onChange({ choices: choices.filter((_, i) => i !== idx) });
  };
  return (
    <div className="tpr-block tpr-question">
      <div className="tpr-question-stem">
        <input
          type="number"
          className="tpe-q-no"
          value={block.no ?? ""}
          onChange={(e) => onChange({ no: parseInt(e.target.value, 10) || 0 })}
          style={{ width: 40 }}
        />
        <ContentEditable
          tag="span"
          html={block.stem || ""}
          onChange={(html) => onChange({ stem: html })}
          placeholder="문제 발문"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="number"
          className="tpe-q-points"
          value={block.points ?? ""}
          onChange={(e) => onChange({ points: parseInt(e.target.value, 10) || 0 })}
          placeholder="배점"
          style={{ width: 50 }}
        />
      </div>
      {choices.length > 0 && (
        <ol className="tpr-choices">
          {choices.map((c, i) => (
            <li key={c.id || i}>
              <span className="tpr-choice-marker">{c.marker || `${i + 1})`}</span>
              <ContentEditable
                tag="span"
                html={c.text || ""}
                onChange={(html) => updateChoice(i, { text: html })}
                placeholder={`${i + 1}번 선택지`}
                style={{ flex: 1 }}
              />
              <button className="tpe-mini-del" onClick={() => removeChoice(i)} title="선택지 삭제">×</button>
            </li>
          ))}
        </ol>
      )}
      <button className="tpe-add-choice" onClick={addChoice}>+ 선택지 추가</button>
    </div>
  );
}

function BoxBlockEdit({ block, onChange }) {
  return (
    <div className="tpr-block tpr-box">
      <div className="tpr-box-label">
        <ContentEditable
          tag="span"
          html={block.label || ""}
          onChange={(html) => onChange({ label: html })}
          placeholder="<보기> 또는 <조건>"
        />
      </div>
      <div className="tpr-box-body">
        <ContentEditable html={block.html || ""} onChange={(html) => onChange({ html })} placeholder="박스 내용" />
      </div>
    </div>
  );
}

function ImageBlockEdit({ block, onChange }) {
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
      alert("이미지 업로드 실패: " + (err?.message || ""));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fileId = block.fileId;
  const url = fileId ? `${API_BASE}/v1/files/${fileId}/download${
    sessionStorage.getItem(TOKEN_KEY) ? `?token=${sessionStorage.getItem(TOKEN_KEY)}` : ""
  }` : null;

  return (
    <div className={`tpr-block tpr-image tpr-image-align-${block.align || "center"}`}>
      {url ? (
        <img src={url} alt={block.caption || ""} style={{ maxWidth: "100%", width: block.width || "auto" }} />
      ) : (
        <div className="tpe-image-placeholder">
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="tpe-add-img-btn">
            {uploading ? "업로드 중..." : "📷 이미지 선택"}
          </button>
        </div>
      )}
      <div className="tpe-image-controls">
        <select value={block.align || "center"} onChange={(e) => onChange({ align: e.target.value })}>
          <option value="left">좌측</option>
          <option value="center">중앙</option>
          <option value="right">우측</option>
        </select>
        <select value={block.width || "auto"} onChange={(e) => onChange({ width: e.target.value })}>
          <option value="auto">자동</option>
          <option value="40%">40%</option>
          <option value="60%">60%</option>
          <option value="80%">80%</option>
          <option value="100%">100%</option>
        </select>
        {url && (
          <button onClick={() => inputRef.current?.click()} disabled={uploading}>이미지 교체</button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onPick}
      />
      <ContentEditable
        tag="figcaption"
        html={block.caption || ""}
        onChange={(html) => onChange({ caption: html })}
        placeholder="(이미지 설명, 선택)"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 도구
// ─────────────────────────────────────────────────────────────

function BlockAddMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const TYPES = [
    { key: "text", label: "자유 텍스트" },
    { key: "passage", label: "지문" },
    { key: "question", label: "문제" },
    { key: "box", label: "박스 (보기/조건)" },
    { key: "image", label: "이미지" },
    { key: "info", label: "응시 정보 칸" },
  ];
  return (
    <div className="tpe-add-menu">
      <button onClick={() => setOpen((v) => !v)} className="tpe-tb-btn primary">
        + 블록 추가 {open ? "▲" : "▼"}
      </button>
      {open && (
        <ul className="tpe-add-list">
          {TYPES.map((t) => (
            <li key={t.key} onClick={() => { onAdd(t.key); setOpen(false); }}>
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContentEditable({ tag = "div", html, onChange, placeholder, style }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  const handleInput = useCallback(() => {
    onChange?.(ref.current?.innerHTML || "");
  }, [onChange]);

  const Tag = tag;
  const showPlaceholder = !html && !focused && placeholder;

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="tpe-ce"
      data-placeholder={showPlaceholder ? placeholder : ""}
      dangerouslySetInnerHTML={{ __html: html || "" }}
      style={style}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// 빈 블록·페이지 템플릿
// ─────────────────────────────────────────────────────────────

function makeEmptyPage(n) {
  return { id: `p${n}-${Date.now()}`, columns: 1, blocks: [], header: null };
}

function makeEmptyBlock(type) {
  const id = `b${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "info":
      return { id, type: "info", html: "학교 _________  학년/반 ____  이름 _________  응시일 ____" };
    case "text":
      return { id, type: "text", html: "<p>텍스트를 입력하세요.</p>" };
    case "image":
      return { id, type: "image", fileId: null, align: "center", width: "auto", caption: "" };
    case "passage":
      return { id, type: "passage", label: "[1~5]", html: "<p>지문 본문을 입력하세요.</p>" };
    case "question":
      return {
        id, type: "question", no: 1,
        questionType: "MULTI_CHOICE",
        stem: "문제 발문",
        points: 4,
        choices: [
          { id: "c1", marker: "①", text: "" },
          { id: "c2", marker: "②", text: "" },
          { id: "c3", marker: "③", text: "" },
          { id: "c4", marker: "④", text: "" },
          { id: "c5", marker: "⑤", text: "" },
        ],
      };
    case "box":
      return { id, type: "box", label: "<보기>", html: "<p>박스 내용</p>" };
    default:
      return { id, type: "text", html: "" };
  }
}
