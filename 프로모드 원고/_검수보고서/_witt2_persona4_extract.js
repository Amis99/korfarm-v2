// 비트겐슈타인2 객관식 추출 - 4 페르소나 점검용
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '비트겐슈타인2');
const out = [];
const chapters = [];
for (let i = 1; i <= 20; i++) chapters.push('ch' + String(i).padStart(2, '0'));

const targetTypes = ['reading_01','reading_02','reading_03','reading_04','reading_05',
                     'literature_01','literature_02','literature_03','literature_04','literature_05',
                     'grammar'];

let totalCount = 0;
let answerDist = { '①':0, '②':0, '③':0, '④':0, '⑤':0 };

for (const ch of chapters) {
  for (const t of targetTypes) {
    const p = path.join(root, ch, t + '.json');
    if (!fs.existsSync(p)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { console.error('parse fail:', p); continue; }
    let mc = data.questions && data.questions.multipleChoice;
    if (!Array.isArray(mc) && Array.isArray(data.questions)) {
      // grammar.json: questions가 직접 배열, 각 q에 choices 포함
      mc = data.questions.filter(q => Array.isArray(q.choices));
    }
    if (!Array.isArray(mc)) continue;
    for (const q of mc) {
      totalCount++;
      if (answerDist[q.answer] !== undefined) answerDist[q.answer]++;
      out.push({
        chapter: ch,
        file: t,
        title: data.title || '',
        genre: data.genre || data.area || '',
        qNum: q.number,
        Rcode: q.Rcode || q.code || '',
        stem: q.stem,
        choices: (q.choices||[]).map(c => `${c.id} ${c.text}`),
        answer: q.answer,
        explanation: q.explanation || '',
      });
    }
  }
}

fs.writeFileSync(path.join(__dirname, '_witt2_mc_all.jsonl'),
  out.map(x => JSON.stringify(x)).join('\n'), 'utf8');

console.error('total:', totalCount);
console.error('answer dist:', answerDist);
