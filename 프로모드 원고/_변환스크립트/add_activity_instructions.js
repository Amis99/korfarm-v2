/**
 * activity 섹션에 instruction이 누락된 경우 subtype별 표준 안내 문구 추가.
 * 표준 안내 문구는 콘텐츠가 아닌 일관 가이드(메타에 가까움) 정책 적용.
 *
 * subtype별 매핑은 한국어 학습 활동 표준 안내. 누락 subtype은 일반 문구.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const SUBTYPE_INSTRUCTION = {
  "글쓰기":          "주어진 안내에 맞춰 자유롭게 글로 표현해 보세요.",
  "빈칸":            "빈칸에 알맞은 말을 채워 보세요.",
  "빈칸형":          "빈칸에 알맞은 말을 채워 보세요.",
  "OX":              "다음 설명이 맞으면 ○, 틀리면 ×를 표시해 보세요.",
  "연결":            "왼쪽과 오른쪽을 알맞게 선으로 연결해 보세요.",
  "괄호_선택형":     "괄호 안에서 알맞은 말을 골라 보세요.",
  "단답형":          "물음에 알맞은 말을 답해 보세요.",
  "초성":            "주어진 초성을 보고 알맞은 낱말을 써 보세요.",
  "초성_퀴즈":       "주어진 초성을 보고 알맞은 낱말을 써 보세요.",
  "분류":            "다음을 알맞은 항목으로 분류해 보세요.",
  "분석_훈련":       "다음을 차례대로 분석해 보세요.",
  "문장_독해":       "주어진 문장을 분석해 답해 보세요.",
  "지시어":          "지시어가 가리키는 대상을 찾아 답해 보세요.",
  "어법_훈련":       "어법에 맞는 표현을 골라 보세요.",
  "객관식":          "다음 물음에 가장 알맞은 답을 골라 보세요.",
  "서술형":          "다음 물음에 답을 서술해 보세요.",
};
const DEFAULT_INSTRUCTION = "다음 활동을 안내에 따라 수행해 보세요.";

const LEVELS = ["소쉬르1","소쉬르2","소쉬르3","프레게1","프레게2","프레게3","러셀1","러셀2","러셀3"];
let touched = 0;

function processFile(p) {
  let txt = fs.readFileSync(p, "utf8");
  if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
  const d = JSON.parse(txt);
  if (!Array.isArray(d.sections)) return;
  let modified = false;
  for (const s of d.sections) {
    if (s.type !== "activity") continue;
    if (!s.content || typeof s.content !== "object") continue;
    if (s.content.instruction) continue; // 이미 있음
    s.content.instruction = SUBTYPE_INSTRUCTION[s.subtype] || DEFAULT_INSTRUCTION;
    modified = true;
    touched++;
  }
  if (modified) fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf8");
}

for (const L of LEVELS) {
  const dir = path.join(ROOT, L);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { processFile(path.join(dir, f)); }
    catch (e) { console.error(`[err] ${f}: ${e.message}`); }
  }
}
console.log(`activity instruction 추가: ${touched}건`);
