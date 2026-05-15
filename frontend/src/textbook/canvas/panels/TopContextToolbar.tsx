/**
 * 상단 컨텍스트 툴바. 선택된 요소(들) 의 type 에 따라 변경.
 */
import type { CanvasElement, TextElement, ImageElement, ShapeElement, StickerElement } from "../types";

export function TopContextToolbar({
  selected, onChange, onRemove, onDuplicate, onBringForward, onSendBackward,
}: {
  selected: CanvasElement | null;
  onChange: (id: string, patch: Partial<CanvasElement>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}) {
  if (!selected) {
    return (
      <div style={toolbarStyle}>
        <span style={{ fontSize: 11, color: "#888" }}>요소를 선택하면 편집 도구가 여기에 표시됩니다.</span>
      </div>
    );
  }

  const common = (
    <>
      <Group>
        <NumberField label="회전" value={Math.round(selected.rotation)}
          onChange={(v) => onChange(selected.id, { rotation: v } as any)} suffix="°" min={-360} max={360} />
        <NumberField label="투명도" value={Math.round((selected.opacity ?? 1) * 100)}
          onChange={(v) => onChange(selected.id, { opacity: v / 100 } as any)} suffix="%" min={0} max={100} />
      </Group>
      <Group>
        <button className="admin-detail-btn secondary sm" onClick={() => onBringForward(selected.id)} type="button"
                title="앞으로">▲</button>
        <button className="admin-detail-btn secondary sm" onClick={() => onSendBackward(selected.id)} type="button"
                title="뒤로">▼</button>
        <button className="admin-detail-btn secondary sm" onClick={() => onDuplicate(selected.id)} type="button"
                title="복제">복제</button>
        <button className="admin-detail-btn danger sm" onClick={() => onRemove(selected.id)} type="button">×</button>
      </Group>
    </>
  );

  return (
    <div style={toolbarStyle}>
      {selected.type === "text" && <TextControls el={selected} onChange={onChange} />}
      {selected.type === "image" && <ImageControls el={selected} onChange={onChange} />}
      {selected.type === "shape" && <ShapeControls el={selected} onChange={onChange} />}
      {selected.type === "sticker" && <StickerControls el={selected} onChange={onChange} />}
      {common}
    </div>
  );
}

function TextControls({ el, onChange }: { el: TextElement; onChange: (id: string, p: Partial<CanvasElement>) => void }) {
  return (
    <>
      <Group>
        <NumberField label="크기" value={el.fontSize}
          onChange={(v) => onChange(el.id, { fontSize: v } as any)} suffix="pt" min={6} max={144} />
        <ColorField label="색" value={el.color}
          onChange={(v) => onChange(el.id, { color: v } as any)} />
      </Group>
      <Group>
        {(["bold", "italic", "underline"] as const).map((k) => {
          const active = k === "bold" ? el.fontWeight === "bold"
                       : k === "italic" ? el.fontStyle === "italic"
                       : el.textDecoration === "underline";
          const patch = k === "bold" ? { fontWeight: active ? "normal" : "bold" }
                      : k === "italic" ? { fontStyle: active ? "normal" : "italic" }
                      : { textDecoration: active ? "none" : "underline" };
          return (
            <button key={k} type="button"
                    className={`admin-detail-btn ${active ? "" : "secondary"} sm`}
                    style={{ fontWeight: k === "bold" ? "bold" : undefined,
                             fontStyle: k === "italic" ? "italic" : undefined,
                             textDecoration: k === "underline" ? "underline" : undefined }}
                    onClick={() => onChange(el.id, patch as any)}>
              {k[0]?.toUpperCase()}
            </button>
          );
        })}
        {(["left", "center", "right", "justify"] as const).map((a) => (
          <button key={a} type="button"
                  className={`admin-detail-btn ${el.align === a ? "" : "secondary"} sm`}
                  onClick={() => onChange(el.id, { align: a } as any)}>
            {a === "left" ? "좌" : a === "center" ? "중" : a === "right" ? "우" : "양"}
          </button>
        ))}
      </Group>
    </>
  );
}

function ImageControls({ el, onChange }: { el: ImageElement; onChange: (id: string, p: Partial<CanvasElement>) => void }) {
  return (
    <Group>
      <span style={{ fontSize: 11, color: "#666" }}>필터</span>
      {(["none", "grayscale", "sepia", "blur"] as const).map((f) => (
        <button key={f} type="button"
                className={`admin-detail-btn ${el.filter === f ? "" : "secondary"} sm`}
                onClick={() => onChange(el.id, { filter: f } as any)}>
          {f === "none" ? "없음" : f === "grayscale" ? "흑백" : f === "sepia" ? "세피아" : "블러"}
        </button>
      ))}
      <span style={{ fontSize: 11, color: "#666", marginLeft: 8 }}>채움</span>
      {(["cover", "contain", "fill"] as const).map((o) => (
        <button key={o} type="button"
                className={`admin-detail-btn ${(el.objectFit ?? "cover") === o ? "" : "secondary"} sm`}
                onClick={() => onChange(el.id, { objectFit: o } as any)}>
          {o === "cover" ? "꽉" : o === "contain" ? "비율" : "늘"}
        </button>
      ))}
    </Group>
  );
}

function ShapeControls({ el, onChange }: { el: ShapeElement; onChange: (id: string, p: Partial<CanvasElement>) => void }) {
  return (
    <Group>
      <ColorField label="채움" value={el.fill}
        onChange={(v) => onChange(el.id, { fill: v } as any)} />
      <ColorField label="외곽" value={el.stroke}
        onChange={(v) => onChange(el.id, { stroke: v } as any)} />
      <NumberField label="굵기" value={el.strokeWidth}
        onChange={(v) => onChange(el.id, { strokeWidth: v } as any)} suffix="px" min={0} max={20} />
    </Group>
  );
}

function StickerControls({ el, onChange }: { el: StickerElement; onChange: (id: string, p: Partial<CanvasElement>) => void }) {
  if (el.source !== "emoji") return null;
  return (
    <Group>
      <span style={{ fontSize: 11, color: "#666" }}>이모지</span>
      <input value={el.value} onChange={(e) => onChange(el.id, { value: e.target.value } as any)}
             style={{ fontSize: 20, width: 40, textAlign: "center",
                      border: "1px solid #ddd", borderRadius: 3 }} />
    </Group>
  );
}

const toolbarStyle: React.CSSProperties = {
  height: 48,
  borderBottom: "1px solid #ddd",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
  gap: 12,
  flexWrap: "wrap",
};

function Group({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 4,
                        borderRight: "1px solid #eee", paddingRight: 12 }}>{children}</div>;
}

function NumberField({ label, value, onChange, suffix, min, max }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
  min?: number; max?: number;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#666" }}>
      {label}
      <input type="number" value={value} min={min} max={max}
             onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
             style={{ width: 56, padding: "3px 5px", border: "1px solid #ddd",
                      borderRadius: 3, fontSize: 12 }} />
      {suffix}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#666" }}>
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
             style={{ width: 28, height: 22, padding: 0, border: "1px solid #ddd", borderRadius: 3 }} />
    </label>
  );
}
