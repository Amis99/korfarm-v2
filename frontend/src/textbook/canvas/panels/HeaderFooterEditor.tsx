/**
 * 헤더/푸터 편집 — 메타 패널 안 모달 형태.
 *
 * 교재 단위 설정 (페이지마다 다른 게 아님).
 * 좌우 페이지 펼침 기준 슬롯:
 *   짝수(왼쪽): outer=좌, inner=우
 *   홀수(오른쪽): outer=우, inner=좌
 *
 * 슬롯 종류:
 *   none / logo / pageNumber / areaName / chapterName / text
 *
 * 2026-05-17 신설.
 */
import type { HeaderFooterConfig, SlotContent } from "../../types";

type SlotKind = SlotContent["kind"];

const SLOT_KINDS: { value: SlotKind; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "logo", label: "로고" },
  { value: "pageNumber", label: "페이지 번호" },
  { value: "areaName", label: "영역명" },
  { value: "chapterName", label: "단원명" },
  { value: "text", label: "고정 텍스트" },
];

export function HeaderFooterEditor({
  header, footer,
  onChangeHeader, onChangeFooter,
}: {
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  onChangeHeader: (next: HeaderFooterConfig) => void;
  onChangeFooter: (next: HeaderFooterConfig) => void;
}) {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <Section label="헤더" config={header} onChange={onChangeHeader} />
      <Section label="푸터" config={footer} onChange={onChangeFooter} />
      <div style={{ fontSize: 10, color: "#888", lineHeight: 1.5 }}>
        펼침 기준: 짝수(왼쪽) outer=좌·inner=우 / 홀수(오른쪽) outer=우·inner=좌
      </div>
    </div>
  );
}

function Section({
  label, config, onChange,
}: {
  label: string;
  config: HeaderFooterConfig;
  onChange: (next: HeaderFooterConfig) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#666" }}>outer</span>
        <SlotEditor
          slot={config.outer}
          onChange={(s) => onChange({ ...config, outer: s })}
        />
        <span style={{ fontSize: 11, color: "#666" }}>inner</span>
        <SlotEditor
          slot={config.inner}
          onChange={(s) => onChange({ ...config, inner: s })}
        />
      </div>
    </div>
  );
}

function SlotEditor({ slot, onChange }: { slot: SlotContent; onChange: (s: SlotContent) => void }) {
  const kind = slot.kind;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <select
        value={kind}
        onChange={(e) => {
          const v = e.target.value as SlotKind;
          if (v === "text") onChange({ kind: "text", text: "" });
          else if (v === "logo") onChange({ kind: "logo" });
          else if (v === "image") onChange({ kind: "image", assetId: "" });
          else onChange({ kind: v } as SlotContent);
        }}
        style={{ fontSize: 11, padding: "3px 4px", border: "1px solid #ddd", borderRadius: 3, flex: "0 0 auto" }}
      >
        {SLOT_KINDS.map((k) => (
          <option key={k.value} value={k.value}>{k.label}</option>
        ))}
      </select>
      {kind === "text" && (
        <input
          type="text"
          value={(slot as any).text ?? ""}
          onChange={(e) => onChange({ kind: "text", text: e.target.value })}
          placeholder="텍스트 입력"
          style={{ flex: 1, fontSize: 11, padding: "3px 6px", border: "1px solid #ddd", borderRadius: 3, minWidth: 0 }}
        />
      )}
    </div>
  );
}
