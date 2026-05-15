/**
 * 좌측 — 요소 추가 패널 (캔바 좌측 사이드바).
 */
import { useState } from "react";
import { createDefaultElement, type CanvasElement, type CanvasElementType } from "../types";
// @ts-ignore — JS 모듈
import { uploadFile } from "../../../utils/fileUpload";

const TAB_DEFS: Array<{ key: CanvasElementType | "text-preset" | "image-upload";
                        icon: string; label: string }> = [
  { key: "text",          icon: "title",       label: "텍스트" },
  { key: "image-upload",  icon: "image",       label: "사진" },
  { key: "shape",         icon: "category",    label: "도형" },
  { key: "sticker",       icon: "emoji_emotions", label: "스티커" },
  { key: "domain",        icon: "menu_book",   label: "교재 블록" },
];

export function LeftAddPanel({
  onAdd,
}: {
  onAdd: (el: CanvasElement) => void;
}) {
  const [active, setActive] = useState<typeof TAB_DEFS[number]["key"]>("text");
  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* 카테고리 아이콘 바 */}
      <div style={{ width: 60, borderRight: "1px solid #eee", background: "#fafafa",
                    display: "flex", flexDirection: "column", padding: "8px 0" }}>
        {TAB_DEFS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActive(t.key)}
                  style={{
                    padding: "10px 4px", border: "none",
                    background: active === t.key ? "#e8f4ec" : "transparent",
                    color: active === t.key ? "#2d6a4f" : "#555",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", fontSize: 10, gap: 2,
                  }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      {/* 활성 패널 */}
      <div style={{ flex: 1, padding: 10, overflowY: "auto", background: "#fff" }}>
        {active === "text" && <TextPanel onAdd={onAdd} />}
        {active === "image-upload" && <ImagePanel onAdd={onAdd} />}
        {active === "shape" && <ShapePanel onAdd={onAdd} />}
        {active === "sticker" && <StickerPanel onAdd={onAdd} />}
        {active === "domain" && <DomainPanel onAdd={onAdd} />}
      </div>
    </div>
  );
}

function TextPanel({ onAdd }: { onAdd: (el: CanvasElement) => void }) {
  const presets: Array<{ label: string; fontSize: number; fontWeight?: "bold" }> = [
    { label: "제목 (큼)", fontSize: 36, fontWeight: "bold" },
    { label: "부제 (중간)", fontSize: 22, fontWeight: "bold" },
    { label: "본문 (작음)", fontSize: 12 },
    { label: "캡션", fontSize: 9 },
  ];
  return (
    <>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>텍스트 추가</div>
      {presets.map((p) => (
        <button key={p.label} type="button" className="admin-detail-btn secondary"
                style={{ width: "100%", marginBottom: 6, textAlign: "left",
                         fontSize: p.fontSize > 20 ? 18 : 13, fontWeight: p.fontWeight ?? "normal" }}
                onClick={() => {
                  const el = createDefaultElement("text") as any;
                  onAdd({ ...el, content: p.label, fontSize: p.fontSize,
                          fontWeight: p.fontWeight ?? "normal" } as CanvasElement);
                }}>
          {p.label}
        </button>
      ))}
    </>
  );
}

function ImagePanel({ onAdd }: { onAdd: (el: CanvasElement) => void }) {
  const [uploading, setUploading] = useState(false);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result: any = await uploadFile(file, { purpose: "content" });
      const el = createDefaultElement("image");
      onAdd({ ...el, assetId: result.fileId, url: result.downloadUrl, alt: file.name } as any);
    } catch (err: any) {
      alert("업로드 실패: " + (err?.message ?? String(err)));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>이미지 업로드</div>
      <label className="admin-detail-btn" style={{ width: "100%", display: "block", cursor: "pointer" }}>
        {uploading ? "업로드 중..." : "+ 이미지 선택"}
        <input type="file" accept="image/*" onChange={onPick} disabled={uploading}
               style={{ display: "none" }} />
      </label>
      <div style={{ fontSize: 10, color: "#888", marginTop: 8 }}>
        업로드 후 캔버스에 자동 추가됩니다.
      </div>
    </>
  );
}

function ShapePanel({ onAdd }: { onAdd: (el: CanvasElement) => void }) {
  const shapes: Array<{ kind: "rect" | "ellipse" | "triangle" | "line" | "arrow"; label: string; icon: string }> = [
    { kind: "rect",     label: "사각형", icon: "rectangle" },
    { kind: "ellipse",  label: "원",     icon: "circle" },
    { kind: "triangle", label: "삼각형", icon: "change_history" },
    { kind: "line",     label: "선",     icon: "horizontal_rule" },
    { kind: "arrow",    label: "화살표", icon: "arrow_forward" },
  ];
  return (
    <>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>도형 추가</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {shapes.map((s) => (
          <button key={s.kind} type="button" className="admin-detail-btn secondary"
                  onClick={() => {
                    const el = createDefaultElement("shape");
                    onAdd({ ...el, shape: s.kind } as any);
                  }}
                  style={{ padding: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined">{s.icon}</span>
            <span style={{ fontSize: 11 }}>{s.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function StickerPanel({ onAdd }: { onAdd: (el: CanvasElement) => void }) {
  const emojis = ["⭐", "✨", "❤️", "🔥", "✅", "❌", "✏️", "📌", "📝", "📚",
                  "🎯", "💡", "❓", "❗", "👍", "👏", "🌟", "🎉", "🏆", "🔍"];
  return (
    <>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>이모지 스티커</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {emojis.map((e) => (
          <button key={e} type="button"
                  onClick={() => {
                    const el = createDefaultElement("sticker");
                    onAdd({ ...el, value: e } as any);
                  }}
                  style={{ fontSize: 22, padding: 8, background: "transparent",
                           border: "1px solid #eee", borderRadius: 4, cursor: "pointer" }}>
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

function DomainPanel({ onAdd }: { onAdd: (el: CanvasElement) => void }) {
  const domains: Array<{ kind: string; label: string }> = [
    { kind: "passage-full",      label: "지문 (풀폭)" },
    { kind: "passage-note",      label: "지문 (메모란)" },
    { kind: "passage-hint",      label: "지문 안내" },
    { kind: "concept",           label: "개념 박스" },
    { kind: "vocab-list",        label: "어휘 목록" },
    { kind: "question",          label: "문제" },
    { kind: "area-header",       label: "영역 헤더" },
    { kind: "section-label",     label: "섹션 라벨" },
    { kind: "summary-table",     label: "요약표" },
    { kind: "structure-diagram", label: "구조도" },
    { kind: "answer-explain",    label: "해설" },
    { kind: "model-answer",      label: "모범 답안" },
  ];
  return (
    <>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>교재 도메인 블록</div>
      {domains.map((d) => (
        <button key={d.kind} type="button" className="admin-detail-btn secondary"
                style={{ width: "100%", marginBottom: 4, textAlign: "left", fontSize: 12 }}
                onClick={() => {
                  const el = createDefaultElement("domain");
                  onAdd({ ...el, domainKind: d.kind as any, props: {} } as any);
                }}>
          {d.label}
        </button>
      ))}
    </>
  );
}
