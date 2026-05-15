/**
 * 블록 추가 팔레트. 8 카테고리.
 */
import { useState } from "react";
import { BLOCK_CATEGORIES, type Block, type BlockType } from "../types";

export function BlockPalette({ onAdd }: { onAdd: (b: Block) => void }) {
  const [openCat, setOpenCat] = useState<string | null>(BLOCK_CATEGORIES[0]?.category ?? null);
  return (
    <div className="lve-add-menu" style={{ padding: 8 }}>
      <div className="lve-tb-label">블록 추가</div>
      {BLOCK_CATEGORIES.map((cat) => (
        <div key={cat.category} style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setOpenCat((c) => (c === cat.category ? null : cat.category))}
            style={{
              width: "100%", textAlign: "left", padding: "4px 8px",
              background: openCat === cat.category ? "#e8f4ec" : "#f7f7f5",
              border: "1px solid #ddd", borderRadius: 4, cursor: "pointer",
              fontWeight: 600, fontSize: 12,
            }}
          >
            {openCat === cat.category ? "▾" : "▸"} {cat.label}
          </button>
          {openCat === cat.category && (
            <ul className="lve-add-list" style={{ margin: "4px 0 8px", paddingLeft: 16 }}>
              {cat.types.map((t) => (
                <li
                  key={t}
                  onClick={() => onAdd(makeDefaultBlock(t))}
                  style={{ padding: "3px 6px", fontSize: 11, cursor: "pointer" }}
                >
                  + {labelOf(t)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function labelOf(t: BlockType): string {
  const map: Record<BlockType, string> = {
    "book-cover": "권 표지",
    "chapter-cover": "챕터 표지",
    "area-header": "영역 헤더",
    "section-label": "섹션 라벨",
    "whitespace-art": "여백 일러스트",
    "concept": "개념 박스",
    "vocab-list": "어휘 목록",
    "passage-note": "지문 (제목+메모란)",
    "passage-note-nt": "지문 (메모란만)",
    "passage-full": "지문 (제목+전체폭)",
    "passage-full-nt": "지문 (전체폭)",
    "passage-hint": "지문 안내",
    "image": "이미지",
    "activity-ox": "OX 활동",
    "activity-connect": "선 잇기",
    "activity-blank": "빈칸 채우기",
    "activity-writing": "글쓰기",
    "activity-vocab": "어휘 활동",
    "activity-check": "내용 확인",
    "activity-table": "정리표",
    "activity-sentence": "문장 독해",
    "activity-explain": "해설 학습",
    "activity-analysis": "분석 훈련",
    "activity-structure": "구조도",
    "question": "문제",
    "structure-diagram": "구조 도식",
    "summary-table": "요약표",
    "answer-explain": "정답·해설",
    "model-answer": "모범 답안",
    "bit-grammar": "비트 문법 세트",
    "bit-literature": "비트 문학 세트",
    "bit-reading": "비트 비문학 세트",
    "bit-pattern": "비트 패턴 워크북",
    "page-break": "── 페이지 나눔 ──",
    "column-break": "── 단 나눔 ──",
    "spacer": "여백",
    "keep-together": "한 덩이 묶음",
    "unknown": "(원본 보존)",
  };
  return map[t];
}

/** 타입별 기본값. 빈 필드는 사용자가 Inspector 에서 채움. */
function makeDefaultBlock(t: BlockType): Block {
  switch (t) {
    case "book-cover":
      return { type: "book-cover", series: "saussure", level: 1, volume: 1, chapterRange: [1, 4] };
    case "chapter-cover":
      return { type: "chapter-cover", chapterNumber: 1, chapterName: "(챕터명)", areaList: [] };
    case "area-header":
      return { type: "area-header", area: "vocab", subtitle: "(부제)" };
    case "section-label":
      return { type: "section-label", kind: "passage" };
    case "whitespace-art":
      return { type: "whitespace-art", assetId: "" };
    case "concept":
      return { type: "concept", text: "" };
    case "vocab-list":
      return { type: "vocab-list", items: [] };
    case "passage-note":
      return { type: "passage-note", title: "", text: "" };
    case "passage-note-nt":
      return { type: "passage-note-nt", text: "" };
    case "passage-full":
      return { type: "passage-full", title: "", text: "" };
    case "passage-full-nt":
      return { type: "passage-full-nt", text: "" };
    case "passage-hint":
      return { type: "passage-hint", body: "" };
    case "image":
      return { type: "image", assetId: "", widthMm: 60, alignment: "center" };
    case "activity-ox":
      return { type: "activity-ox", items: [] };
    case "activity-connect":
      return { type: "activity-connect", pairs: [] };
    case "activity-blank":
      return { type: "activity-blank", items: [] };
    case "activity-writing":
      return { type: "activity-writing", prompt: "", lines: 5 };
    case "activity-vocab":
      return { type: "activity-vocab", items: [] };
    case "activity-check":
      return { type: "activity-check" };
    case "activity-table":
      return { type: "activity-table", headers: [], rows: [] };
    case "activity-sentence":
      return { type: "activity-sentence", units: [] };
    case "activity-explain":
      return { type: "activity-explain", units: [] };
    case "activity-analysis":
      return { type: "activity-analysis", items: [] };
    case "activity-structure":
      return { type: "activity-structure", root: { level: 0, label: "" } };
    case "question":
      return {
        type: "question", number: 1, qType: "multipleChoice",
        stem: "", choices: [], keepTogether: true,
      };
    case "structure-diagram":
      return { type: "structure-diagram", root: { level: 0, label: "" } };
    case "summary-table":
      return { type: "summary-table", rows: [] };
    case "answer-explain":
      return { type: "answer-explain", body: "" };
    case "model-answer":
      return { type: "model-answer", body: "" };
    case "bit-grammar":
      return { type: "bit-grammar", domain: "", questions: [] };
    case "bit-literature":
      return {
        type: "bit-literature", index: 1, workTitle: "",
        passage: { type: "passage-full", title: "", text: "" }, questions: [],
      };
    case "bit-reading":
      return {
        type: "bit-reading", index: 1,
        passage: { type: "passage-full", title: "", text: "" }, questions: [],
      };
    case "bit-pattern":
      return { type: "bit-pattern", patternCode: "P1", patternName: "", items: [] };
    case "page-break":
      return { type: "page-break" };
    case "column-break":
      return { type: "column-break" };
    case "spacer":
      return { type: "spacer", heightMm: 8 };
    case "keep-together":
      return { type: "keep-together", blocks: [] };
    case "unknown":
      return { type: "unknown", original: null, raw: "" };
  }
}
