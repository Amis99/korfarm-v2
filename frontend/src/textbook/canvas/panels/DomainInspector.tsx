/**
 * 도메인 요소 props 편집 — 우측 패널, 선택된 요소가 domain 일 때만 표시.
 *
 * 종류별 핵심 필드를 폼으로 + 그 외는 JSON textarea 로 raw 편집.
 *
 * 2026-05-17 신설.
 */
import { useState, useEffect } from "react";
import type { DomainElement } from "../types";

export function DomainInspector({
  element, onChange,
}: {
  element: DomainElement | null;
  onChange: (patch: Partial<DomainElement>) => void;
}) {
  const [rawJson, setRawJson] = useState("");
  const [rawErr, setRawErr] = useState("");

  useEffect(() => {
    if (!element) { setRawJson(""); return; }
    setRawJson(JSON.stringify(element.props, null, 2));
    setRawErr("");
  }, [element?.id]);

  if (!element) return null;

  const props = element.props as any;
  const setProp = (key: string, value: any) => {
    onChange({ props: { ...props, [key]: value } } as any);
  };

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 8 }}>
        도메인 — {element.domainKind}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* 공통 필드들 — 종류별 핵심 1~2개 */}
        {(element.domainKind === "passage-full"
          || element.domainKind === "passage-note"
          || element.domainKind === "passage-hint") && (
          <>
            <Field label="제목" value={props.title ?? ""} onChange={(v) => setProp("title", v)} />
            <FieldArea label="본문" rows={6} value={props.text ?? props.body ?? ""}
                       onChange={(v) => setProp("text", v)} />
          </>
        )}
        {element.domainKind === "question" && (
          <>
            <Field label="번호" type="number" value={props.number ?? ""}
                   onChange={(v) => setProp("number", v ? parseInt(v, 10) : undefined)} />
            <FieldArea label="발문(stem)" rows={3} value={props.stem ?? ""}
                       onChange={(v) => setProp("stem", v)} />
            <div style={{ fontSize: 10, color: "#888" }}>
              선지는 raw JSON 에서 choices 배열로 편집
            </div>
          </>
        )}
        {element.domainKind === "concept" && (
          <>
            <Field label="제목" value={props.title ?? ""} onChange={(v) => setProp("title", v)} />
            <FieldArea label="본문" rows={5} value={props.text ?? props.body ?? ""}
                       onChange={(v) => setProp("text", v)} />
          </>
        )}
        {(element.domainKind === "answer-explain" || element.domainKind === "model-answer") && (
          <FieldArea label="본문" rows={5} value={props.text ?? props.body ?? ""}
                     onChange={(v) => setProp("text", v)} />
        )}
        {element.domainKind === "area-header" && (
          <>
            <Field label="제목" value={props.title ?? props.areaName ?? ""}
                   onChange={(v) => setProp("title", v)} />
            <Field label="부제" value={props.subtitle ?? ""}
                   onChange={(v) => setProp("subtitle", v)} />
          </>
        )}
        {element.domainKind === "section-label" && (
          <Field label="라벨" value={props.text ?? props.label ?? ""}
                 onChange={(v) => setProp("text", v)} />
        )}

        {/* Raw JSON 편집 — 항상 보임 */}
        <details style={{ marginTop: 4 }}>
          <summary style={{ fontSize: 10, color: "#666", cursor: "pointer" }}>
            전체 JSON 편집
          </summary>
          <textarea
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ props: parsed } as any);
                setRawErr("");
              } catch {
                setRawErr("JSON 문법 오류 — 저장 안 됨");
              }
            }}
            rows={8}
            style={{
              width: "100%", marginTop: 4, fontFamily: "monospace", fontSize: 11,
              padding: 4, border: "1px solid #ddd", borderRadius: 3, boxSizing: "border-box",
            }}
          />
          {rawErr && <div style={{ fontSize: 10, color: "#c0392b", marginTop: 2 }}>{rawErr}</div>}
        </details>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }:
  { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "#666" }}>{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: 12, padding: "4px 6px", border: "1px solid #ddd", borderRadius: 3 }}
      />
    </label>
  );
}

function FieldArea({ label, value, onChange, rows }:
  { label: string; value: string; onChange: (v: string) => void; rows: number }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "#666" }}>{label}</span>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        style={{ fontSize: 12, padding: "4px 6px", border: "1px solid #ddd", borderRadius: 3,
                 resize: "vertical", boxSizing: "border-box" }}
      />
    </label>
  );
}
