/**
 * DomainElement 풀 본문 렌더 — 캔버스 위에서 직접 표시.
 *
 * 도메인별 단순 박스 → 실제 내용 렌더로 확장.
 * passage / question / vocab-list / summary-table / model-answer / answer-explain / concept 등.
 *
 * props 편집은 호출 측에서 DomainInspector 모달로.
 *
 * 2026-05-17 신설.
 */
import type { DomainElement } from "./types";

export function DomainRenderer({ el }: { el: DomainElement }) {
  const props = el.props as any;
  switch (el.domainKind) {
    case "passage-full":
    case "passage-note":
    case "passage-hint":
      return <PassageBox label={domainLabel(el.domainKind)} title={props.title} body={props.text ?? props.body} />;
    case "question":
      return <QuestionBox stem={props.stem} choices={props.choices} number={props.number} />;
    case "vocab-list":
      return <VocabListBox items={props.items} />;
    case "summary-table":
      return <SummaryTableBox rows={props.rows} headers={props.headers} title={props.title} />;
    case "concept":
      return <ConceptBox title={props.title} body={props.text ?? props.body} />;
    case "answer-explain":
      return <AnswerExplainBox text={props.text ?? props.body} />;
    case "model-answer":
      return <ModelAnswerBox text={props.text ?? props.body} />;
    case "area-header":
      return <AreaHeader title={props.title ?? props.areaName} subtitle={props.subtitle} />;
    case "section-label":
      return <SectionLabel text={props.text ?? props.label} />;
    case "structure-diagram":
      return <PlaceholderBox label="구조도" body={props.text ?? "구조도 본문은 인스펙터에서 편집"} />;
    default:
      return <PlaceholderBox label={el.domainKind} body={props.text ?? ""} />;
  }
}

function PassageBox({ label, title, body }: { label: string; title?: string; body?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px solid #2d6a4f", borderRadius: 3, padding: "3mm",
                  background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9, color: "#2d6a4f", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      {title && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>}
      <div style={{ fontSize: 10.5, color: "#222", lineHeight: 1.55, whiteSpace: "pre-wrap",
                    flex: 1, overflow: "hidden" }}>
        {body || ""}
      </div>
    </div>
  );
}

function QuestionBox({ stem, choices, number }: { stem?: string; choices?: any[]; number?: number }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px solid #ddd", padding: "3mm", background: "#fafafa",
                  overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
        {number ? `${number}.` : "문항"} {stem || ""}
      </div>
      {Array.isArray(choices) && choices.length > 0 && (
        <ol style={{ margin: 0, padding: 0, listStyle: "none", flex: 1, overflow: "hidden" }}>
          {choices.map((c: any, i: number) => (
            <li key={i} style={{ fontSize: 10, color: "#333", marginBottom: 2, paddingLeft: 14, position: "relative" }}>
              <span style={{ position: "absolute", left: 0,
                             color: c?.isCorrect ? "#2d6a4f" : "#888" }}>
                {c?.id ?? `${i + 1}.`}
              </span>
              {c?.text ?? ""}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function VocabListBox({ items }: { items?: any[] }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px solid #ddd", padding: "3mm", background: "#fff",
                  overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: "#666", fontWeight: 700, marginBottom: 3 }}>어휘 목록</div>
      {!Array.isArray(items) || items.length === 0 ? (
        <div style={{ fontSize: 10, color: "#aaa" }}>어휘 없음</div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {items.slice(0, 12).map((v: any, i: number) => (
            <li key={i} style={{ fontSize: 10, marginBottom: 2 }}>
              <strong>{v?.word ?? ""}</strong>
              {v?.hanja && <span style={{ color: "#888" }}> ({v.hanja})</span>}
              {v?.meaning && <span style={{ color: "#444" }}> — {v.meaning}</span>}
            </li>
          ))}
          {items.length > 12 && (
            <li style={{ fontSize: 9, color: "#888" }}>… 외 {items.length - 12}개</li>
          )}
        </ol>
      )}
    </div>
  );
}

function SummaryTableBox({ rows, headers, title }: { rows?: any[]; headers?: string[]; title?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px solid #ccc", padding: "3mm", background: "#fff", overflow: "hidden" }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{title}</div>}
      {Array.isArray(rows) && rows.length > 0 ? (
        <table style={{ width: "100%", fontSize: 9, borderCollapse: "collapse" }}>
          {Array.isArray(headers) && headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ border: "1px solid #ccc", padding: 2, background: "#f5f5f5" }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.slice(0, 8).map((row: any, i: number) => (
              <tr key={i}>
                {(Array.isArray(row) ? row : Object.values(row ?? {})).map((cell: any, j: number) => (
                  <td key={j} style={{ border: "1px solid #ddd", padding: 2 }}>{String(cell ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ fontSize: 10, color: "#aaa" }}>요약표 데이터 없음</div>
      )}
    </div>
  );
}

function ConceptBox({ title, body }: { title?: string; body?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "2px solid #d4a017", borderRadius: 4, padding: "3mm",
                  background: "#fff8e1", overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: "#d4a017", fontWeight: 700, marginBottom: 3 }}>개념</div>
      {title && <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{title}</div>}
      <div style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>{body || ""}</div>
    </div>
  );
}

function AnswerExplainBox({ text }: { text?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px solid #c0392b", borderLeft: "4px solid #c0392b", padding: "3mm",
                  background: "#fff5f5", overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: "#c0392b", fontWeight: 700, marginBottom: 3 }}>해설</div>
      <div style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>{text || ""}</div>
    </div>
  );
}

function ModelAnswerBox({ text }: { text?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px dashed #2d6a4f", padding: "3mm",
                  background: "#f0f9f4", overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: "#2d6a4f", fontWeight: 700, marginBottom: 3 }}>모범 답안</div>
      <div style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>{text || ""}</div>
    </div>
  );
}

function AreaHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  background: "#2d6a4f", color: "#fff", padding: "4mm",
                  display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title || "영역"}</div>
      {subtitle && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function SectionLabel({ text }: { text?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  background: "#e8f4ec", borderLeft: "4px solid #2d6a4f", padding: "2mm 3mm",
                  display: "flex", alignItems: "center", fontWeight: 700, fontSize: 12 }}>
      {text || "섹션"}
    </div>
  );
}

function PlaceholderBox({ label, body }: { label: string; body?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", boxSizing: "border-box",
                  border: "1px dashed #aaa", padding: "3mm", background: "#fafafa", overflow: "hidden" }}>
      <div style={{ fontSize: 9, color: "#888", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>{body || ""}</div>
    </div>
  );
}

function domainLabel(k: string): string {
  const map: Record<string, string> = {
    "passage-note": "지문(메모란)", "passage-full": "지문(풀폭)", "passage-hint": "지문 안내",
    "concept": "개념", "vocab-list": "어휘 목록",
    "question": "문제",
    "area-header": "영역 헤더", "section-label": "섹션 라벨",
    "summary-table": "요약표", "structure-diagram": "구조도",
    "answer-explain": "해설", "model-answer": "모범 답안",
  };
  return map[k] ?? k;
}
