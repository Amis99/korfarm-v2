// 4 페르소나 휴리스틱 자동 스캔 - 비트2 객관식
// 입력: _witt2_mc_all.jsonl
const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, '_witt2_mc_all.jsonl'), 'utf8').trim().split('\n');
const items = lines.map(l => JSON.parse(l));

const suspects = [];
const tag = (item, persona, code, reason, priority) =>
  suspects.push({ ...item, persona, code, reason, priority });

// 강한 단정어 패턴 (S5/A4/T1)
const ABS_PATTERNS = [
  /완전히/, /전혀\s*[^없]*없/, /오로지/, /오직.*만/, /아무런\s*[^없]*없/, /절대로?\s*[^없못아]/,
  /언제나/, /항상/, /결코/, /무관(하|할)/, /전적으로/, /완벽한?/, /완벽하게/, /모두\s*[^거이][^는]/,
  /일체\s*없/, /하나도\s*없/, /없이\s*완성/, /무비판적/, /무조건/,
];

// AI 어투 / 단조 어미 (M3/M4)
const AI_PATTERNS = [
  /이라\s*할\s*수\s*있다\.\s*$/, /이라고\s*볼\s*수\s*있다\.\s*$/,
  /라\s*할\s*수\s*있다\.\s*$/, /다고\s*할\s*수\s*있다\.\s*$/,
];

// 정답 위치 편향 체크용
const fileAnsCount = {};
for (const it of items) {
  const k = `${it.chapter}/${it.file}`;
  if (!fileAnsCount[k]) fileAnsCount[k] = { '①':0,'②':0,'③':0,'④':0,'⑤':0, total:0 };
  fileAnsCount[k][it.answer]++;
  fileAnsCount[k].total++;
}

// 1) 부정형 stem + 정답 선지의 강한 단정어 (A4/S5)
const NEG_STEM = /(적절하지\s*않은|일치하지\s*않는|볼\s*수\s*없는|틀린|잘못된|아닌\s*것)/;
for (const it of items) {
  if (!NEG_STEM.test(it.stem)) continue;
  const ans = (it.choices || []).find(c => c.startsWith(it.answer));
  if (!ans) continue;
  const txt = ans.slice(2);
  for (const pat of ABS_PATTERNS) {
    if (pat.test(txt)) {
      tag(it, 'S/M', 'S5+M4', `부정형 정답 선지에 강한 단정어("${txt.match(pat)[0]}") — 형식 단서로 정답 추측 가능`, 'medium');
      break;
    }
  }
}

// 2) <보기> 감상형 — stem 안에 <보기> 핵심어가 들어있는 케이스
const VIEWPOINT = /<보기>를\s*(참고|바탕)|<보기>의\s*관점/;
for (const it of items) {
  if (!VIEWPOINT.test(it.stem)) continue;
  if (!NEG_STEM.test(it.stem)) continue;
  const ans = (it.choices || []).find(c => c.startsWith(it.answer));
  if (!ans) continue;
  // 정답이 마지막(④,⑤) 위치에 있고 강한 단정어 있을 때만
  if ((it.answer === '④' || it.answer === '⑤')) {
    const txt = ans.slice(2);
    if (/완전히|아무런|전혀|오로지|완벽|무관/.test(txt)) {
      // 이미 첫 번째 패스에서 잡혔는지
      const dup = suspects.find(s => s.chapter===it.chapter && s.file===it.file && s.qNum===it.qNum);
      if (!dup) tag(it, 'S/I', 'S1+I4', '<보기> 감상 부정형 + ④/⑤ 위치 + 단정어 — 메타전략 풀이 가능', 'medium');
    }
  }
}

// 3) 정답 위치 편향 (I2) — 파일 단위로 한 위치가 70% 이상
for (const k of Object.keys(fileAnsCount)) {
  const c = fileAnsCount[k];
  if (c.total < 5) continue;
  for (const id of ['①','②','③','④','⑤']) {
    if (c[id] / c.total >= 0.7) {
      suspects.push({
        chapter: k.split('/')[0], file: k.split('/')[1], qNum: '*', stem: `(파일 단위)`,
        choices: [], answer: id, persona: 'I', code: 'I2',
        reason: `파일 내 정답 ${id} 비율 ${(c[id]/c.total*100).toFixed(0)}% — 위치 편향`,
        priority: 'medium'
      });
    }
  }
}

// 4) 데이터 무결성 (M2) — 정답이 5선지에 없거나, 선지 누락
for (const it of items) {
  if (!it.choices || it.choices.length !== 5) {
    tag(it, 'M', 'M2', `선지 개수 ${it.choices?.length||0}개 (5개 아님)`, 'critical');
    continue;
  }
  const ids = it.choices.map(c => c[0]);
  if (!ids.includes(it.answer)) {
    tag(it, 'M', 'M2', `정답 ${it.answer}이 선지 ID에 없음`, 'critical');
  }
}

// 5) 발문 모호성 (S3) — 매우 짧거나 의문 구조 불분명
for (const it of items) {
  if ((it.stem || '').length < 8) {
    tag(it, 'S', 'S3', `발문이 너무 짧음 (${it.stem?.length||0}자)`, 'high');
  }
}

console.log('의심 건수:', suspects.length);
const codeStat = {};
for (const s of suspects) codeStat[s.code] = (codeStat[s.code]||0)+1;
console.log('코드별 분포:', codeStat);

fs.writeFileSync(path.join(__dirname, '_witt2_persona4_suspects.jsonl'),
  suspects.map(s => JSON.stringify(s)).join('\n'), 'utf8');
console.log('저장: _witt2_persona4_suspects.jsonl');
