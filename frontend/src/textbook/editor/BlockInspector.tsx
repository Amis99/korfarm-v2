/**
 * 선택된 블록의 폼.
 *
 * 본문/지문/문제 발문 등 마크다운 필드는 모두 MarkdownEditField 사용
 * → 이미지 삽입 도구바 자동 (콘텐츠/테스트 관리 비주얼 에디터와 동일).
 */
import { useEffect, useState } from "react";
// @ts-ignore — JS 모듈
import MarkdownEditFieldRaw from "../../components/editor/MarkdownEditField";
// @ts-ignore — JS 모듈
import { uploadFile } from "../../utils/fileUpload";
import type { Block } from "../types";

/** TS wrapper — MarkdownEditField 의 placeholder 가 optional 인데 .jsx 라 추론이 잘못됨. */
function MarkdownEditField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <MarkdownEditFieldRaw value={value} onChange={onChange} placeholder="" />;
}

export function BlockInspector({
  block, index, onChange, onRemove, onMoveUp, onMoveDown,
}: {
  block: Block;
  index: number;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="lve-block" style={{ padding: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, alignItems: "center" }}>
        <button className="admin-detail-btn secondary sm" onClick={onMoveUp} disabled={!onMoveUp} type="button">▲</button>
        <button className="admin-detail-btn secondary sm" onClick={onMoveDown} disabled={!onMoveDown} type="button">▼</button>
        <button className="admin-detail-btn danger sm" onClick={onRemove} type="button">삭제</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>#{index + 1} · {block.type}</span>
      </div>

      <TypedFields block={block} onChange={onChange} />

      <details style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed #ddd" }}>
        <summary style={{ cursor: "pointer", fontSize: 11, color: "#666" }}>JSON 직접 편집</summary>
        <JsonEdit block={block} onChange={onChange} />
      </details>
    </div>
  );
}

function TypedFields({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  switch (block.type) {
    case "concept":
      return (
        <Field label="본문 (마크다운 + 이미지 삽입)">
          <MarkdownEditField value={block.text}
            onChange={(v: string) => onChange({ text: v } as any)} />
        </Field>
      );
    case "passage-note":
    case "passage-full":
      return (
        <>
          <Field label="제목">
            <input value={block.title ?? ""} style={inputStyle}
              onChange={(e) => onChange({ title: e.target.value } as any)} />
          </Field>
          <Field label="본문 (마크다운 + 이미지 삽입)">
            <MarkdownEditField
              value={typeof block.text === "string" ? block.text : JSON.stringify(block.text)}
              onChange={(v: string) => onChange({ text: v } as any)} />
          </Field>
          <Field label="작가">
            <input value={block.author ?? ""} style={inputStyle}
              onChange={(e) => onChange({ author: e.target.value } as any)} />
          </Field>
          <Field label="출처">
            <input value={block.source ?? ""} style={inputStyle}
              onChange={(e) => onChange({ source: e.target.value } as any)} />
          </Field>
        </>
      );
    case "passage-note-nt":
    case "passage-full-nt":
      return (
        <Field label="본문 (마크다운 + 이미지 삽입)">
          <MarkdownEditField
            value={typeof block.text === "string" ? block.text : JSON.stringify(block.text)}
            onChange={(v: string) => onChange({ text: v } as any)} />
        </Field>
      );
    case "passage-hint":
      return (
        <>
          <Field label="제목"><input value={block.title ?? ""} style={inputStyle}
            onChange={(e) => onChange({ title: e.target.value } as any)} /></Field>
          <Field label="본문 (마크다운)">
            <MarkdownEditField value={block.body}
              onChange={(v: string) => onChange({ body: v } as any)} />
          </Field>
        </>
      );
    case "area-header":
      return (
        <>
          <Field label="영역">
            <select value={block.area} style={inputStyle}
              onChange={(e) => onChange({ area: e.target.value as any })}>
              <option value="vocab">어휘</option>
              <option value="grammar">문법</option>
              <option value="concept">개념</option>
              <option value="literature">문학</option>
              <option value="nonfiction">비문학</option>
              <option value="weekly">실력 확인</option>
              <option value="etc">기타</option>
            </select>
          </Field>
          <Field label="부제"><input value={block.subtitle} style={inputStyle}
            onChange={(e) => onChange({ subtitle: e.target.value } as any)} /></Field>
        </>
      );
    case "section-label":
      return (
        <>
          <Field label="종류">
            <select value={block.kind} style={inputStyle}
              onChange={(e) => onChange({ kind: e.target.value as any })}>
              <option value="passage">지문</option>
              <option value="activity">활동</option>
              <option value="question">문제</option>
              <option value="writing">글쓰기</option>
              <option value="explain">해설</option>
              <option value="structure">구조</option>
            </select>
          </Field>
          <Field label="부제"><input value={block.subtitle ?? ""} style={inputStyle}
            onChange={(e) => onChange({ subtitle: e.target.value } as any)} /></Field>
        </>
      );
    case "chapter-cover":
      return (
        <>
          <Field label="챕터 번호">
            <input type="number" min={1} value={block.chapterNumber} style={inputStyle}
              onChange={(e) => onChange({ chapterNumber: parseInt(e.target.value || "1", 10) } as any)} />
          </Field>
          <Field label="챕터명">
            <input value={block.chapterName} style={inputStyle}
              onChange={(e) => onChange({ chapterName: e.target.value } as any)} />
          </Field>
          <Field label="Chapter 라벨">
            <input value={block.chapterLabel ?? ""} style={inputStyle}
              placeholder="예: Chapter 03"
              onChange={(e) => onChange({ chapterLabel: e.target.value } as any)} />
          </Field>
          <Field label="소개문 (마크다운)">
            <MarkdownEditField value={block.intro ?? ""}
              onChange={(v: string) => onChange({ intro: v } as any)} />
          </Field>
        </>
      );
    case "question":
      return (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Field label="번호">
              <input type="number" value={block.number} style={inputStyle}
                onChange={(e) => onChange({ number: parseInt(e.target.value || "1", 10) } as any)} />
            </Field>
            <Field label="유형">
              <select value={block.qType} style={inputStyle}
                onChange={(e) => onChange({ qType: e.target.value as any })}>
                <option value="multipleChoice">객관식</option>
                <option value="shortAnswer">단답형</option>
                <option value="essay">서술형</option>
              </select>
            </Field>
          </div>
          <Field label="발문 (마크다운 + 이미지)">
            <MarkdownEditField value={block.stem}
              onChange={(v: string) => onChange({ stem: v } as any)} />
          </Field>
          <Field label="<보기> (마크다운 + 이미지)">
            <MarkdownEditField value={block.box ?? ""}
              onChange={(v: string) => onChange({ box: v } as any)} />
          </Field>
          <Field label="<조건> (한 줄에 한 조건)">
            <textarea value={(block.conditions ?? []).join("\n")}
              rows={3}
              style={{ ...inputStyle, fontFamily: "inherit" }}
              onChange={(e) => {
                const lines = e.target.value.split("\n").filter((s) => s.trim() !== "");
                onChange({ conditions: lines } as any);
              }} />
          </Field>
          {block.qType === "multipleChoice" && (
            <Field label="선택지">
              <ChoiceListEditor
                choices={block.choices ?? []}
                onChange={(choices) => onChange({ choices } as any)} />
            </Field>
          )}
          {block.qType === "shortAnswer" && (
            <Field label="답안 줄 수">
              <input type="number" value={block.answerLines?.lines ?? 1} style={inputStyle}
                onChange={(e) => onChange({
                  answerLines: { lines: parseInt(e.target.value || "1", 10) },
                } as any)} />
            </Field>
          )}
          {block.qType === "essay" && (
            <>
              <Field label="답안 라벨">
                <input value={block.answerNote?.label ?? ""} style={inputStyle}
                  onChange={(e) => onChange({
                    answerNote: { ...(block.answerNote ?? { lines: 4 }), label: e.target.value },
                  } as any)} />
              </Field>
              <Field label="답안 박스 줄 수">
                <input type="number" value={block.answerNote?.lines ?? 4} style={inputStyle}
                  onChange={(e) => onChange({
                    answerNote: { ...(block.answerNote ?? { label: "" }), lines: parseInt(e.target.value || "4", 10) },
                  } as any)} />
              </Field>
            </>
          )}
          <Field label="정답 (학생용 PDF 에서는 숨김)">
            <input value={block.answer ?? ""} style={inputStyle}
              onChange={(e) => onChange({ answer: e.target.value } as any)} />
          </Field>
          <Field label="해설 (마크다운, 학생용 숨김)">
            <MarkdownEditField value={block.explanation ?? ""}
              onChange={(v: string) => onChange({ explanation: v } as any)} />
          </Field>
        </>
      );
    case "answer-explain":
    case "model-answer":
      return (
        <Field label={block.type === "answer-explain" ? "해설 (마크다운)" : "모범 답안 (마크다운)"}>
          <MarkdownEditField value={block.body}
            onChange={(v: string) => onChange({ body: v } as any)} />
        </Field>
      );
    case "image":
      return <ImageFields block={block} onChange={onChange} />;
    case "spacer":
      return (
        <Field label="높이 (mm)">
          <input type="number" value={block.heightMm} style={inputStyle}
            onChange={(e) => onChange({ heightMm: parseFloat(e.target.value || "0") } as any)} />
        </Field>
      );
    case "page-break":
      return <div style={{ fontSize: 11, color: "#888" }}>강제 페이지 나눔. 이 블록 이후부터 새 페이지가 시작합니다.</div>;
    case "column-break":
      return <div style={{ fontSize: 11, color: "#888" }}>강제 단 나눔 (다단 영역 내부).</div>;
    default:
      return (
        <div style={{ fontSize: 11, color: "#888" }}>
          이 블록 타입은 아래 JSON 편집기로 직접 수정하세요.
        </div>
      );
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 7px",
  border: "1px solid #d4d4d4",
  borderRadius: 3,
  fontSize: 12,
  boxSizing: "border-box",
};

function ImageFields({ block, onChange }: {
  block: Extract<Block, { type: "image" }>;
  onChange: (p: Partial<Block>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result: any = await uploadFile(file, { purpose: "content" });
      onChange({
        assetId: result.fileId,
        url: result.downloadUrl,
        alt: file.name,
      } as any);
    } catch (err: any) {
      alert("업로드 실패: " + (err?.message ?? String(err)));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <>
      <Field label="이미지 파일">
        <input type="file" accept="image/*" onChange={onPick} disabled={uploading} />
        {uploading && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>업로드 중...</div>}
        {block.assetId && (
          <div style={{ fontSize: 10, color: "#2d6a4f", marginTop: 4 }}>
            파일 ID: {block.assetId.slice(0, 16)}...
          </div>
        )}
      </Field>
      <Field label="너비 (mm) — 미리보기에서 우하단 핸들로도 조절 가능">
        <input type="range" min={10} max={210} step={1} value={block.widthMm}
               onChange={(e) => onChange({ widthMm: parseFloat(e.target.value) } as any)}
               style={{ width: "100%" }} />
        <input type="number" min={10} max={210} step={1} value={block.widthMm} style={inputStyle}
               onChange={(e) => onChange({ widthMm: parseFloat(e.target.value || "60") } as any)} />
      </Field>
      <Field label="높이 (mm) — 비워두면 자동 비율">
        <input type="number" min={0} step={1} value={block.heightMm ?? ""} style={inputStyle}
               placeholder="자동"
               onChange={(e) => {
                 const v = e.target.value;
                 onChange({ heightMm: v === "" ? undefined : parseFloat(v) } as any);
               }} />
      </Field>
      <Field label="정렬">
        <div style={{ display: "flex", gap: 4 }}>
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} type="button"
                    className={`admin-detail-btn ${block.alignment === a ? "" : "secondary"} sm`}
                    onClick={() => onChange({ alignment: a } as any)}
                    style={{ flex: 1 }}>
              {a === "left" ? "좌" : a === "center" ? "중앙" : "우"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="설명 (선택)">
        <input value={block.caption ?? ""} style={inputStyle}
               onChange={(e) => onChange({ caption: e.target.value } as any)} />
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function ChoiceListEditor({
  choices, onChange,
}: {
  choices: NonNullable<Extract<Block, { type: "question" }>["choices"]>;
  onChange: (next: NonNullable<Extract<Block, { type: "question" }>["choices"]>) => void;
}) {
  const update = (i: number, patch: Partial<typeof choices[number]>) => {
    const next = [...choices];
    const cur = next[i];
    if (!cur) return;
    next[i] = { ...cur, ...patch };
    onChange(next);
  };
  const add = () => {
    const ids = ["①", "②", "③", "④", "⑤"];
    const nextId = ids[choices.length] ?? "•";
    onChange([...choices, { id: nextId, text: "" }]);
  };
  const remove = (i: number) => onChange(choices.filter((_, j) => j !== i));
  return (
    <>
      {choices.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
          <span style={{ width: 18, textAlign: "center" }}>{c.id}</span>
          <input type="radio" name="correct" checked={!!c.isCorrect}
            onChange={() => {
              const next = choices.map((cc, j) => ({ ...cc, isCorrect: j === i }));
              onChange(next);
            }} title="정답" />
          <input value={c.text} onChange={(e) => update(i, { text: e.target.value })}
            style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => remove(i)} className="admin-detail-btn danger sm" type="button">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="admin-detail-btn secondary sm" style={{ marginTop: 4 }}>
        + 선택지 추가
      </button>
    </>
  );
}

function JsonEdit({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  const [text, setText] = useState(() => JSON.stringify(block, null, 2));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setText(JSON.stringify(block, null, 2)); }, [block]);
  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 11, marginTop: 6,
                 border: "1px solid #d4d4d4", borderRadius: 3, padding: 6 }} />
      {err && <div style={{ color: "#c0392b", fontSize: 10 }}>{err}</div>}
      <button type="button" className="admin-detail-btn secondary sm" style={{ marginTop: 4 }}
        onClick={() => {
          try {
            const parsed = JSON.parse(text);
            setErr(null);
            onChange(parsed);
          } catch (e: any) {
            setErr(e?.message ?? "JSON 파싱 실패");
          }
        }}>
        JSON 적용
      </button>
    </>
  );
}
