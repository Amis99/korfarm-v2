/**
 * 프로모드 원고 자동 점검 스크립트.
 * 정량 항목을 전수 측정하여 _검수보고서/audit_report.json 생성.
 *
 * 측정 항목:
 *  A. 지문 길이 (레벨군 목표 대비)
 *  B. 선택지 길이 편차 (cq_01) + 정답이 최장/최단 여부 (cq_02)
 *  C. 한정 표현 분포 (cq_04: -만, -뿐, 오직, 반드시, 항상, 전혀, 모두, 완전히)
 *  D. 한 문항 내 중복 선택지 (cu_02)
 *  E. 챕터 내 선택지 고유도 (cu_01)
 *  F. 적절/부적절 발문 비율 (ai_01)
 *  G. answer_explain refId 매칭률 (sp_04)
 *  H. 비트 챕터 테스트: 총문항·총점 (ct_01·02)
 *  I. 비트 pattern: 코드 분포·OX 분포 (pw_01·02)
 *  J. 비트 commentary 초성 일치 (st_03) + marker vs blanks (fc_04)
 *  K. 활동 instruction 빈 여부 (aa_01)
 *  L. concept examples 존재 여부 (ce_02)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_FILE = path.join(ROOT, "_검수보고서", "audit_report.json");

const LEVEL_TARGETS = {
  소쉬르1: { passageMin: 100, passageMax: 400 },
  소쉬르2: { passageMin: 150, passageMax: 500 },
  소쉬르3: { passageMin: 250, passageMax: 600 },
  프레게1: { passageMin: 350, passageMax: 800 },
  프레게2: { passageMin: 450, passageMax: 900 },
  프레게3: { passageMin: 450, passageMax: 1000 },
  러셀1:   { passageMin: 550, passageMax: 1100 },
  러셀2:   { passageMin: 650, passageMax: 1200 },
  러셀3:   { passageMin: 750, passageMax: 1300 },
  비트겐슈타인1: { passageMin: 700, passageMax: 1100 },
  비트겐슈타인2: { passageMin: 800, passageMax: 1200 },
  비트겐슈타인3: { passageMin: 900, passageMax: 1300 },
};
const LIMIT_TOKENS = ["만", "뿐", "오직", "반드시", "항상", "전혀", "모두", "완전히"];

function load(p) {
  let t = fs.readFileSync(p, "utf8");
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  return JSON.parse(t);
}

const findings = []; // 각: {level, file, ruleId, severity, msg, value}
function record(level, file, ruleId, severity, msg, value) {
  findings.push({ level, file, ruleId, severity, msg, value });
}

/* ───────────── 일반 (소쉬르/프레게/러셀) 챕터 점검 ───────────── */
function auditNormalChapter(level, file, data) {
  const target = LEVEL_TARGETS[level] || {};
  const sections = data.sections || [];

  // A. passage 길이
  for (const s of sections) {
    if (s.type === "passage" && s.content?.text) {
      const len = String(s.content.text).replace(/\s/g, "").length;
      if (len < target.passageMin)
        record(level, file, "ld_01", "high", `지문 짧음: ${len}자 (목표 ≥${target.passageMin})`, len);
      else if (len > target.passageMax)
        record(level, file, "ld_01", "medium", `지문 김: ${len}자 (목표 ≤${target.passageMax})`, len);
    }
    if (s.type === "concept" && (!s.content?.examples || s.content.examples.length === 0)) {
      if (s.content?.text && String(s.content.text).length > 100)
        record(level, file, "ce_02", "medium", `concept에 examples 없음: ${s.title || s.subtype || ""}`, null);
    }
    if (s.type === "activity" && !s.content?.instruction) {
      record(level, file, "aa_01", "high", `activity 지시문 없음: ${s.title || s.subtype || ""}`, null);
    }
  }

  // 챕터 내 모든 question 객관식 모음
  const allChoiceQs = [];
  for (const s of sections) {
    if (s.type === "question" && s.subtype === "객관식" && s.content?.items) {
      for (const it of s.content.items) {
        if (Array.isArray(it.choices) && it.choices.length >= 2) {
          allChoiceQs.push({ section: s, item: it });
        }
      }
    }
  }

  // B + C. 선택지 길이·한정 표현
  for (const { section, item } of allChoiceQs) {
    const lens = item.choices.map(c => String(c.text || "").length);
    const max = Math.max(...lens), min = Math.min(...lens);
    if (max - min > 12)
      record(level, file, "cq_01", "high",
        `선택지 길이 편차 ${max-min}자 (Q${item.number}, ${section.area}/${section.subtype})`, max-min);

    // D. 한 문항 내 중복 선택지
    const seen = new Set(), texts = item.choices.map(c => (c.text || "").trim());
    for (const t of texts) { if (t && seen.has(t)) record(level, file, "cu_02", "critical",
      `중복 선택지 (Q${item.number}): "${t}"`, t); seen.add(t); }

    // C. 한정 표현 분포
    const tokenCount = item.choices.map(c =>
      LIMIT_TOKENS.reduce((n, tk) => n + ((c.text || "").includes(tk) ? 1 : 0), 0));
    const total = tokenCount.reduce((a,b)=>a+b, 0);
    if (total > 0) {
      const max1 = Math.max(...tokenCount);
      // 한정 표현이 1개 선택지에만 몰려 있으면 누설 위험
      if (max1 >= 2 && tokenCount.filter(n => n > 0).length === 1)
        record(level, file, "cq_04", "critical",
          `한정 표현이 한 선택지에만 집중 (Q${item.number})`, tokenCount);
    }
  }

  // E. 챕터 내 선택지 고유도
  const allTexts = allChoiceQs.flatMap(({item}) => item.choices.map(c => (c.text || "").trim())).filter(Boolean);
  if (allTexts.length > 0) {
    const uniq = new Set(allTexts).size;
    const ratio = uniq / allTexts.length;
    if (ratio < 0.8)
      record(level, file, "cu_01", "critical",
        `챕터 내 선택지 고유도 ${(ratio*100).toFixed(0)}% (목표 ≥80%)`, ratio);
  }

  // F. 적절/부적절 발문 비율
  const stems = allChoiceQs.map(({item}) => item.stem || "");
  const inappCount = stems.filter(s => /않|아닌|없는/.test(s)).length;
  const appCount = stems.length - inappCount;
  if (stems.length >= 5) {
    const ratio = inappCount / stems.length;
    if (ratio < 0.5 || ratio > 0.9)
      record(level, file, "ai_01", "medium",
        `적절/부적절 비율: 적절 ${appCount} : 부적절 ${inappCount} (권장 적절 30%·부적절 70%)`,
        { appCount, inappCount });
  }

  // G. answer_explain refId 매칭률
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.type !== "answer_explain") continue;
    // 같은 area·subtype의 직전 question·activity item ids 수집
    const prev = sections.slice(0, i).reverse().find(p =>
      (p.type === "question" || p.type === "activity") &&
      p.area === s.area && p.subtype === s.subtype);
    if (!prev) {
      record(level, file, "sp_04", "high",
        `answer_explain ref 가능한 앞 섹션 없음: ${s.area}/${s.subtype}`, null);
      continue;
    }
    const itemIds = (prev.content?.items || []).map(it => String(it.number));
    const refIds = (s.content?.items || []).map(it => String(it.refId));
    const unmatched = refIds.filter(r => !itemIds.includes(r));
    if (unmatched.length > 0)
      record(level, file, "sp_04", "high",
        `answer_explain refId 미매칭 ${unmatched.length}개: ${unmatched.join(",")}`, unmatched);
  }
}

/* ───────────── 비트 reading_NN.json ───────────── */
function auditWittReading(level, file, data) {
  const target = LEVEL_TARGETS[level];
  // passage 길이
  const t = data.passage?.text;
  if (t) {
    const len = String(t).replace(/\s/g, "").length;
    if (len < target.passageMin) record(level, file, "ld_01", "high", `지문 짧음 ${len}자`, len);
    else if (len > target.passageMax) record(level, file, "ld_01", "medium", `지문 김 ${len}자`, len);
  }
  // figures (없어도 OK)
  if (!data.passage?.figures) {
    record(level, file, "fc_01", "medium", `figures 필드 없음 (필요 여부 수동 판단)`, null);
  }
  // questions
  const mc = data.questions?.multipleChoice || [];
  for (const it of mc) {
    if (Array.isArray(it.choices)) {
      const lens = it.choices.map(c => String(c.text||"").length);
      const max = Math.max(...lens), min = Math.min(...lens);
      if (max-min > 14) record(level, file, "cq_01", "high",
        `선택지 길이 편차 ${max-min}자 (Q${it.number})`, max-min);
    }
  }
  // summaryTable
  if (!data.summaryTable || !Array.isArray(data.summaryTable.rows) || data.summaryTable.rows.length === 0)
    record(level, file, "st_01", "high", `summaryTable 없음/비어있음`, null);
}

/* ───────────── 비트 literature_NN.json ───────────── */
function auditWittLiterature(level, file, data) {
  // commentary 초성 일치 (fc_04 + st_03)
  const com = data.commentary;
  if (com) {
    const text = com.text || "";
    const markersInText = (text.match(/[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/g) || []);
    const blanks = com.blanks || [];
    if (markersInText.length !== blanks.length)
      record(level, file, "fc_04", "critical",
        `commentary marker(${markersInText.length}) vs blanks(${blanks.length}) 불일치`, null);
    // 초성 일치
    for (const b of blanks) {
      const cho = chosung(b.answer || "");
      if (b.hint && cho && cho !== b.hint.replace(/\s/g, ""))
        record(level, file, "st_03", "critical",
          `초성 불일치: ${b.id} answer="${b.answer}" hint="${b.hint}" expected="${cho}"`, null);
    }
  } else {
    record(level, file, "fc_03", "high", `commentary 누락`, null);
  }
  // questions choice editor와 동일
  const mc = data.questions?.multipleChoice || [];
  for (const it of mc) {
    if (Array.isArray(it.choices)) {
      const lens = it.choices.map(c => String(c.text||"").length);
      const max = Math.max(...lens), min = Math.min(...lens);
      if (max-min > 14) record(level, file, "cq_01", "high",
        `선택지 길이 편차 ${max-min}자 (Q${it.number})`, max-min);
    }
  }
}

/* 한글 한 글자 → 초성 */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
function chosungChar(ch) {
  const c = ch.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return ch;
  return CHO[Math.floor(c / 588)];
}
function chosung(s) {
  return [...String(s)].filter(c => /[가-힣]/.test(c)).map(chosungChar).join("");
}

/* ───────────── 비트 grammar.json ───────────── */
function auditWittGrammar(level, file, data) {
  const qs = data.questions || [];
  if (qs.length < 3) record(level, file, "ct_01", "medium", `grammar 문항 ${qs.length}개 (적음)`, qs.length);
  for (const q of qs) {
    if (Array.isArray(q.choices)) {
      const lens = q.choices.map(c => String(c.text||"").length);
      const max = Math.max(...lens), min = Math.min(...lens);
      if (max-min > 14) record(level, file, "cq_01", "high",
        `grammar 선택지 길이 편차 ${max-min}자 (Q${q.number})`, max-min);
    }
  }
}

/* ───────────── 비트 pattern.json ───────────── */
function auditWittPattern(level, file, data) {
  const qs = data.questions || [];
  const codes = new Set(qs.map(q => q.patternCode).filter(Boolean));
  const expected = ["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","L1","L2","L3","L4","L5","L6","L7","L8"];
  const missing = expected.filter(c => !codes.has(c));
  if (missing.length > 0)
    record(level, file, "pw_01", "high", `pattern 누락 코드: ${missing.join(",")}`, missing);
  // OX 분포
  for (const q of qs) {
    const labels = (q.choiceSet || []).map(c => c.label);
    if (labels.length > 0 && (labels.every(l => l === "O") || labels.every(l => l === "X")))
      record(level, file, "pw_02", "critical",
        `pattern Q${q.number} choiceSet 모두 ${labels[0]}`, labels);
  }
}

/* ───────────── 비트 test.json ───────────── */
function auditWittTest(level, file, data) {
  const total = data.totalQuestions ?? (data.questions || []).length;
  const totalPts = data.totalPoints ?? (data.questions || []).reduce((a,q)=>a+(q.points||0), 0);
  if (total !== 30) record(level, file, "ct_01", "high", `total ${total}문항 (목표 30)`, total);
  if (totalPts !== 100) record(level, file, "ct_01", "high", `total ${totalPts}점 (목표 100)`, totalPts);
  const sec = (data.questions || []).reduce((acc, q) => { acc[q.section] = (acc[q.section]||0)+1; return acc; }, {});
  const r = sec["비문학"] || 0, l = sec["문학"] || 0;
  if (Math.abs(r - l) > total * 0.3)
    record(level, file, "ct_02", "high", `비문학/문학 불균형 ${r}:${l}`, { r, l });
}

/* ───────────── 메인 ───────────── */
function listJson(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".json")) : [];
}
function processNormal(level) {
  const dir = path.join(ROOT, level);
  for (const f of listJson(dir)) {
    try { auditNormalChapter(level, f, load(path.join(dir, f))); }
    catch (e) { record(level, f, "PARSE", "critical", e.message, null); }
  }
}
function processWitt(level) {
  const dir = path.join(ROOT, level);
  for (const ch of fs.readdirSync(dir)) {
    const chDir = path.join(dir, ch);
    if (!fs.statSync(chDir).isDirectory()) continue;
    for (const f of listJson(chDir)) {
      const rel = `${ch}/${f}`;
      try {
        const d = load(path.join(chDir, f));
        if (f.startsWith("reading_")) auditWittReading(level, rel, d);
        else if (f.startsWith("literature_")) auditWittLiterature(level, rel, d);
        else if (f === "grammar.json") auditWittGrammar(level, rel, d);
        else if (f === "pattern.json") auditWittPattern(level, rel, d);
        else if (f === "test.json") auditWittTest(level, rel, d);
      } catch (e) { record(level, rel, "PARSE", "critical", e.message, null); }
    }
  }
}

["소쉬르1","소쉬르2","소쉬르3","프레게1","프레게2","프레게3","러셀1","러셀2","러셀3"].forEach(processNormal);
["비트겐슈타인1","비트겐슈타인2","비트겐슈타인3"].forEach(processWitt);

// 요약
const bySeverity = findings.reduce((a,f)=>{a[f.severity]=(a[f.severity]||0)+1;return a;}, {});
const byRule = findings.reduce((a,f)=>{a[f.ruleId]=(a[f.ruleId]||0)+1;return a;}, {});
const byLevel = findings.reduce((a,f)=>{a[f.level]=(a[f.level]||0)+1;return a;}, {});
const out = {
  summary: {
    total: findings.length,
    bySeverity,
    byRule,
    byLevel,
    generatedAt: new Date().toISOString(),
  },
  findings,
};
fs.writeFileSync(REPORT_FILE, JSON.stringify(out, null, 2), "utf8");
console.log(`총 ${findings.length}건`);
console.log("심각도:", bySeverity);
console.log("규칙별 상위:", Object.entries(byRule).sort((a,b)=>b[1]-a[1]).slice(0,8).map(e=>`${e[0]}=${e[1]}`).join(", "));
console.log("레벨별:", byLevel);
console.log(`보고서: ${REPORT_FILE}`);
