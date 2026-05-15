/**
 * 교재 생성기 도메인 타입.
 *
 * 디자인 하네스(소쉬르/프레게/러셀/비트겐슈타인 60권 7,060p) 의
 * LaTeX/Typst 매크로 ↔ 비주얼 에디터 블록을 1:1 매핑한다.
 *
 * 핵심 불변(invariant):
 *  - 페이지 크기는 A4 고정 (210×297mm). 짧아지거나 길어지지 않는다.
 *  - 다단은 항상 auto(컬럼 자연 흐름). balanced 금지. → CSS column-fill: auto / Typst #columns
 *  - "문제·문장 독해 유닛" 같은 결속 세트는 breakable=false 로 한 덩이 보장.
 *  - 업로드 JSON 의 알 수 없는 노드/필드는 UnknownBlock 또는 raw 로 절대 버리지 않는다.
 */

// ─── 시리즈·레벨 ──────────────────────────────────────────────────

export type Series = "saussure" | "frege" | "russell" | "wittgenstein" | "custom";

export type LevelId =
  | "saussure1" | "saussure2" | "saussure3"
  | "frege1" | "frege2" | "frege3"
  | "russell1" | "russell2" | "russell3"
  | "wittgenstein1" | "wittgenstein2" | "wittgenstein3";

export type AreaCode = "vocab" | "grammar" | "concept" | "literature" | "nonfiction" | "weekly" | "etc";

// ─── 최상위 ──────────────────────────────────────────────────────

export interface Textbook {
  textbookId: string;             // tb_xxxx
  orgId: string | null;           // null|"org_hq" → 본사 / 그 외 → 기관
  title: string;
  series: Series;
  level: number;                  // 1~12
  volume: number;                 // 권 번호
  chapterRange: [number, number];
  pageSize: "A4";                 // 고정
  bgPalette: BackgroundPalette;
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  pages: Page[];
  imagePool: ImageAsset[];        // 업로드된 이미지 라이브러리 (페이지 배경 선택용)
  sourceSnapshot?: unknown;       // 업로드 직후 원본 JSON. 누락 방지 round-trip 검증용
  schemaVersion: 1;
  studentPdfFileId?: string;
  answerPdfFileId?: string;
  status: "draft" | "ready";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── 페이지 ──────────────────────────────────────────────────────

export interface Page {
  pageId: string;
  background: PageBackground;
  blocks: Block[];
  /** 페이지 안 일부 구간만 다단 처리할 때 사용. blocks 의 idx 범위. */
  multicolRanges?: Array<{ from: number; to: number; columns: 2 | 3 }>;
}

export type PageBackground =
  | { kind: "preset"; ref: PresetBackgroundKey }
  | { kind: "image"; assetId: string; opacity?: number }
  | { kind: "none" };

export type PresetBackgroundKey =
  | "sau_plain" | "sau_book_cover" | "sau_chapter_cover" | "sau_act" | "sau_question"
  | "fre_plain" | "fre_book_cover" | "fre_chapter_cover" | "fre_act" | "fre_question"
  | "rus_plain" | "rus_book_cover" | "rus_chapter_cover" | "rus_act" | "rus_question"
  | "wit_plain" | "wit_book_cover" | "wit_chapter_cover" | "wit_act" | "wit_question";

export interface BackgroundPalette {
  plain: PresetBackgroundKey;
  bookCover: PresetBackgroundKey;
  chapterCover: PresetBackgroundKey;
  activity: PresetBackgroundKey;
  question: PresetBackgroundKey;
}

// ─── 헤더/푸터 (좌우 페이지 분기 4슬롯) ──────────────────────────

export type SlotContent =
  | { kind: "none" }
  | { kind: "logo"; assetId?: string; height?: number /* mm */ }
  | { kind: "pageNumber" }
  | { kind: "areaName" }           // \leftmark
  | { kind: "chapterName" }        // \rightmark
  | { kind: "image"; assetId: string; height?: number }
  | { kind: "text"; text: string };

/**
 * 두 페이지 펼침 기준 슬롯.
 *  - 짝수(왼쪽) 페이지: outer=좌, inner=우
 *  - 홀수(오른쪽) 페이지: outer=우, inner=좌
 * 기본값: 헤더 outer=logo, 푸터 outer=pageNumber, header.inner / footer.inner 는 편집 대상
 */
export interface HeaderFooterConfig {
  outer: SlotContent;
  inner: SlotContent;
}

// ─── 이미지 라이브러리 ───────────────────────────────────────────

export interface ImageAsset {
  assetId: string;                 // file_xxxx (백엔드 fileId)
  url: string;                     // /v1/files/{id}/download
  originalName: string;
  mime: string;
  widthPx?: number;
  heightPx?: number;
  uploadedAt: string;
}

// ─── 인라인 보조 ─────────────────────────────────────────────────

export type WrongPattern = string; // READ_WRONG_PATTERN_LABELS ∪ LIT_WRONG_PATTERN_LABELS

export interface Choice {
  id: string;                      // "①".."⑤"
  text: string;                    // markdown 허용
  isCorrect?: boolean;
  wrongPattern?: WrongPattern;
  wrongVector?: Record<string, number>;
  explanation?: string;
}

export interface AnswerLines { lines: number }
export interface AnswerNote { label: string; lines: number }

export interface VocabItem {
  number: number;
  word: string;
  hanja?: string;
  pos?: string;                    // 명사·동사 등
  meaning: string;
  example?: string;
  dictEntry?: unknown;             // 표준국어대사전 raw 보존
}

export interface StructureNode {
  level: 0 | 1 | 2 | 3;
  label: string;
  content?: string;
  blank?: boolean;                 // 학생 채우기용
  children?: StructureNode[];
}

export interface SummaryTableRow {
  category?: string;
  item: string;                    // 초성/빈칸 토큰 허용 — "핵심: 너 ㅈㅇ ㅇㄹ ①"
  answer?: string;                 // 학생용에서는 숨김
  source?: string;
}

// ─── 블록 — 1. 골격 ──────────────────────────────────────────────

export interface BookCover {
  type: "book-cover";
  series: Series;
  level: number;
  volume: number;
  chapterRange: [number, number];
  subtitle?: string;
  logoAssetId?: string;
  badgeText?: string;              // 시리즈 배지 텍스트
}

export interface ChapterCover {
  type: "chapter-cover";
  chapterNumber: number;
  chapterName: string;
  chapterLabel?: string;           // "Chapter 03"
  intro?: string;
  areaList: Array<{ area: AreaCode; subtitle: string; color?: string }>;
}

export interface AreaHeader {
  type: "area-header";
  area: AreaCode;
  subtitle: string;
  color?: string;
  labelStyle?: "saussure" | "frege" | "russell" | "wittgenstein"; // 시리즈별 라벨 박스
}

export interface SectionLabel {
  type: "section-label";
  kind: "passage" | "activity" | "question" | "writing" | "explain" | "structure";
  area?: AreaCode;
  subtitle?: string;
}

export interface WhitespaceArt {
  type: "whitespace-art";
  assetId: string;
  /** 페이지 남은 높이가 이 비율 이상일 때만 출력 (디자인 하네스 \kfWhitespaceArt 와 동일). */
  minRemainHeightRatio?: number;   // 기본 0.30
}

// ─── 블록 — 2. 본문 ──────────────────────────────────────────────

export interface ConceptBox {
  type: "concept";
  text: string;                    // markdown
  examples?: string[];
}

export interface VocabList {
  type: "vocab-list";
  items: VocabItem[];
}

export interface PassageBase {
  title?: string;
  text: string | string[] | Record<string, string>;
  isVerse?: boolean;               // 시 — 행/연 자동 처리
  author?: string;
  source?: string;
  genre?: string;
}

export interface PassageNote extends PassageBase { type: "passage-note" }
export interface PassageNoteNT extends PassageBase { type: "passage-note-nt" }   // 제목 없음 + 메모란
export interface PassageFull extends PassageBase { type: "passage-full" }        // 메모란 없음 + 제목
export interface PassageFullNT extends PassageBase { type: "passage-full-nt" }   // 메모란 없음 + 제목 없음

export interface PassageHint {
  type: "passage-hint";
  title?: string;
  body: string;
}

// ─── 블록 — 3. 활동 (11 subtype) ────────────────────────────────

export interface ActivityBase {
  instruction?: string;
  answerFormat?: string;
}

export interface ActivityOX extends ActivityBase {
  type: "activity-ox";
  items: Array<{ stem: string; answer?: "O" | "X"; explanation?: string }>;
}

export interface ActivityConnect extends ActivityBase {
  type: "activity-connect";
  pairs: Array<{ left: string; right: string }>;
}

export interface ActivityBlank extends ActivityBase {
  type: "activity-blank";
  items: Array<{ stem: string; blanks: string[]; answer?: string[] }>;
}

export interface ActivityWriting extends ActivityBase {
  type: "activity-writing";
  prompt: string;
  lines: number;                   // 답안 줄 수
  modelAnswer?: string;
  scoringRubric?: string[];
}

export interface ActivityVocab extends ActivityBase {
  type: "activity-vocab";
  items: VocabItem[];
}

export interface ActivityCheck extends ActivityBase {
  type: "activity-check";
  /** 표 형태이면 rows, 문항 형태이면 questions. 둘 다 허용. */
  rows?: Array<Record<string, string>>;
  questions?: Array<{ stem: string; answer?: string }>;
}

export interface ActivityTable extends ActivityBase {
  type: "activity-table";
  headers: string[];
  rows: Array<Array<string | null>>;   // null = 학생 채우기 빈 셀
}

export interface ActivitySentenceUnit {
  number: number;
  sentence?: string;               // 문장 본문 (있으면 SentenceBox, 없으면 SentencelessUnit)
  subQuestions: Array<{
    label: string;                 // "(1)"
    stem: string;
    choices?: Choice[];
    answer?: string;
    explanation?: string;
  }>;
}

export interface ActivitySentence extends ActivityBase {
  type: "activity-sentence";
  units: ActivitySentenceUnit[];
  /** 5번 이후 \columnbreak (프레게+/러셀+ 정책) */
  splitAfter?: number;
}

export interface ActivityExplainUnit {
  passage: string;
  questions: Array<{ stem: string; choices?: Choice[]; answer?: string; explanation?: string }>;
}

export interface ActivityExplain extends ActivityBase {
  type: "activity-explain";
  units: ActivityExplainUnit[];
}

export interface ActivityAnalysis extends ActivityBase {
  type: "activity-analysis";
  items: Array<{ stem: string; answer?: string }>;
  /** 8개 이상 짧은 단답이면 자동 multicols (디자인 하네스 _is_short_blank_items 정책). */
  autoMulticol?: boolean;
}

export interface ActivityStructure extends ActivityBase {
  type: "activity-structure";
  root: StructureNode;
}

// ─── 블록 — 4. 문제 (한 덩이 보장) ──────────────────────────────

export interface QuestionBlock {
  type: "question";
  number: number;
  qType: "multipleChoice" | "shortAnswer" | "essay";
  stem: string;                    // 부정 표현(않은/없는/아닌) 자동 underline (렌더 단계)
  passageRef?: string;             // 같은 페이지 PassageNote 의 식별자
  box?: string;                    // <보기>
  conditions?: string[];           // <조건>
  choices?: Choice[];              // qType=multipleChoice
  answer?: string;                 // 학생용 빌드 시 제외
  explanation?: string;            // 학생용 빌드 시 제외
  answerLines?: AnswerLines;       // qType=shortAnswer
  answerNote?: AnswerNote;         // qType=essay
  modelAnswer?: string;
  essayRubric?: string[];
  points?: number;
  competencyVector?: Record<string, number>;
  /** 항상 true — 발문~선택지~답안란이 한 컬럼/페이지 안에 함께. */
  keepTogether: true;
}

// ─── 블록 — 5. 표/도식 ──────────────────────────────────────────

export interface StructureDiagram {
  type: "structure-diagram";
  title?: string;
  root: StructureNode;
}

export interface SummaryTable {
  type: "summary-table";
  title?: string;
  instruction?: string;
  rows: SummaryTableRow[];
}

// ─── 블록 — 6. 정답·해설 (학생용 빌드 제외) ─────────────────────

export interface AnswerExplain {
  type: "answer-explain";
  questionNumber?: number;
  body: string;
}

export interface ModelAnswer {
  type: "model-answer";
  questionNumber?: number;
  body: string;
}

// ─── 블록 — 7. 비트겐슈타인 전용 ────────────────────────────────

export interface BitGrammarSet {
  type: "bit-grammar";
  domain: string;
  subDomain?: string;
  conceptPassage?: PassageFull;
  questions: QuestionBlock[];
}

export interface BitLiteratureSet {
  type: "bit-literature";
  index: number;                   // 1~5
  workTitle: string;
  author?: string;
  genre?: string;
  passage: PassageFull;
  commentary?: { text: string; blanks?: Array<{ id: string; hint: string; answer: string }> };
  summaryTable?: SummaryTable;
  questions: QuestionBlock[];
}

export interface BitReadingSet {
  type: "bit-reading";
  index: number;                   // 1~5
  passage: PassageFull;
  summaryTable?: SummaryTable;
  questions: QuestionBlock[];
}

export interface BitPatternSet {
  type: "bit-pattern";
  patternCode: string;             // P1~P10 or L1~L8
  patternName: string;
  patternDescription?: string;
  items: Array<{
    passage?: string;
    stem: string;
    choiceSet: Array<{ text: string; isCorrect: boolean; label: "O" | "X" }>;
  }>;
}

// ─── 블록 — 이미지 (마우스 리사이즈/정렬) ─────────────────

/**
 * 본문 흐름 안에 끼우는 이미지 블록.
 *  - 미리보기에서 우하단 핸들을 마우스로 잡고 끌어 리사이즈
 *  - 정렬(좌·중·우) 은 Inspector 의 선택지
 *  - widthMm 단위 (PDF 출력과 1:1)
 */
export interface ImageBlock {
  type: "image";
  assetId: string;                 // 업로드된 파일 ID (file_xxxx)
  url?: string;                    // 표시용 캐시 (없으면 /v1/files/{assetId}/download)
  widthMm: number;                 // 기본 60
  heightMm?: number;               // 비율 유지면 undefined
  alignment: "left" | "center" | "right";
  caption?: string;
  alt?: string;
}

// ─── 블록 — 8. 흐름 제어 (에디터에서 수정 가능) ─────────────────

export interface PageBreak { type: "page-break" }
export interface ColumnBreak { type: "column-break" }
export interface Spacer { type: "spacer"; heightMm: number }

/** 사용자가 임의 블록 세트를 한 덩이로 묶음 (절대 단/페이지 분리 안 됨). */
export interface KeepTogetherGroup {
  type: "keep-together";
  blocks: Block[];
}

// ─── 블록 — 9. Unknown (누락 절대 금지) ─────────────────────────

/**
 * 알 수 없는 노드 타입을 만난 경우 보존용.
 * 업로드 → 저장 → PDF 라운드트립에서 원본을 그대로 유지한다.
 * CSS .lve-unknown (이미 layout-editor.css 에 예약) 으로 노란 monospace 박스 렌더.
 */
export interface UnknownBlock {
  type: "unknown";
  original: unknown;               // JSON.parse 가능한 원본
  raw: string;                     // 사람이 보고 편집할 수 있는 형태
  note?: string;                   // "지원되지 않는 타입: xxx" 같은 안내
}

// ─── Block 유니언 ────────────────────────────────────────────────

export type Block =
  // 1. 골격
  | BookCover | ChapterCover | AreaHeader | SectionLabel | WhitespaceArt
  // 2. 본문
  | ConceptBox | VocabList
  | PassageNote | PassageNoteNT | PassageFull | PassageFullNT | PassageHint
  // 3. 활동
  | ActivityOX | ActivityConnect | ActivityBlank | ActivityWriting
  | ActivityVocab | ActivityCheck | ActivityTable
  | ActivitySentence | ActivityExplain | ActivityAnalysis | ActivityStructure
  // 4. 문제
  | QuestionBlock
  // 5. 표/도식
  | StructureDiagram | SummaryTable
  // 6. 정답·해설 (학생용 빌드 제외)
  | AnswerExplain | ModelAnswer
  // 7. 비트 전용
  | BitGrammarSet | BitLiteratureSet | BitReadingSet | BitPatternSet
  // 이미지
  | ImageBlock
  // 8. 흐름 제어
  | PageBreak | ColumnBreak | Spacer | KeepTogetherGroup
  // 9. Unknown
  | UnknownBlock;

export type BlockType = Block["type"];

// ─── 카탈로그 (BlockPalette 용) ─────────────────────────────────

export const BLOCK_CATEGORIES: Array<{
  category: string;
  label: string;
  types: BlockType[];
}> = [
  {
    category: "skeleton", label: "골격",
    types: ["book-cover", "chapter-cover", "area-header", "section-label", "whitespace-art"],
  },
  {
    category: "body", label: "본문",
    types: ["concept", "vocab-list",
            "passage-note", "passage-note-nt", "passage-full", "passage-full-nt", "passage-hint",
            "image"],
  },
  {
    category: "activity", label: "활동",
    types: ["activity-ox", "activity-connect", "activity-blank", "activity-writing",
            "activity-vocab", "activity-check", "activity-table",
            "activity-sentence", "activity-explain", "activity-analysis", "activity-structure"],
  },
  {
    category: "question", label: "문제",
    types: ["question"],
  },
  {
    category: "table", label: "표·도식",
    types: ["structure-diagram", "summary-table"],
  },
  {
    category: "answer", label: "정답·해설 (학생용 숨김)",
    types: ["answer-explain", "model-answer"],
  },
  {
    category: "bit", label: "비트겐슈타인 전용",
    types: ["bit-grammar", "bit-literature", "bit-reading", "bit-pattern"],
  },
  {
    category: "flow", label: "흐름 제어",
    types: ["page-break", "column-break", "spacer", "keep-together"],
  },
];

// ─── 타입 가드 ──────────────────────────────────────────────────

export function isPassageBlock(b: Block): b is PassageNote | PassageNoteNT | PassageFull | PassageFullNT {
  return b.type === "passage-note" || b.type === "passage-note-nt"
      || b.type === "passage-full" || b.type === "passage-full-nt";
}

export function isAnswerOnlyBlock(b: Block): b is AnswerExplain | ModelAnswer {
  return b.type === "answer-explain" || b.type === "model-answer";
}

/** 학생용 빌드에서 제외해야 할 블록(정답·해설). */
export function isStudentHidden(b: Block): boolean {
  return isAnswerOnlyBlock(b);
}

// ─── 기본값 헬퍼 ────────────────────────────────────────────────

export function defaultHeader(): HeaderFooterConfig {
  // 외측 로고, 내측 영역명 (디자인 하네스 기본)
  return { outer: { kind: "logo" }, inner: { kind: "areaName" } };
}

export function defaultFooter(): HeaderFooterConfig {
  // 외측 페이지 번호, 내측 챕터명
  return { outer: { kind: "pageNumber" }, inner: { kind: "chapterName" } };
}

export function defaultBgPalette(series: Series): BackgroundPalette {
  const prefix = series === "saussure" ? "sau"
               : series === "frege" ? "fre"
               : series === "russell" ? "rus"
               : series === "wittgenstein" ? "wit"
               : "sau";
  return {
    plain: `${prefix}_plain` as PresetBackgroundKey,
    bookCover: `${prefix}_book_cover` as PresetBackgroundKey,
    chapterCover: `${prefix}_chapter_cover` as PresetBackgroundKey,
    activity: `${prefix}_act` as PresetBackgroundKey,
    question: `${prefix}_question` as PresetBackgroundKey,
  };
}
