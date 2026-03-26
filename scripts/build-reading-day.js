#!/usr/bin/env node
// 일일독해 콘텐츠 빌더 - 작성자가 입력한 내용을 유효한 JSON 항목으로 조립
// 문장 경계 자동 인식, 하이라이트 range 자동 계산, 구조 검증
const fs = require('fs');
const path = require('path');

const LEVEL_CONFIG = {
  saussure1:      { id: 'SAUSSURE_1', abbr: 's1', targetLen: 500, grade: {min:1,max:1}, seed: 'WHEAT' },
  saussure2:      { id: 'SAUSSURE_2', abbr: 's2', targetLen: 600, grade: {min:2,max:2}, seed: 'WHEAT' },
  saussure3:      { id: 'SAUSSURE_3', abbr: 's3', targetLen: 700, grade: {min:3,max:3}, seed: 'WHEAT' },
  frege1:         { id: 'FREGE_1',    abbr: 'f1', targetLen: 800, grade: {min:4,max:4}, seed: 'WHEAT' },
  frege2:         { id: 'FREGE_2',    abbr: 'f2', targetLen: 900, grade: {min:5,max:5}, seed: 'WHEAT' },
  frege3:         { id: 'FREGE_3',    abbr: 'f3', targetLen: 1000, grade: {min:5,max:5}, seed: 'WHEAT' },
  russell1:       { id: 'RUSSELL_1',  abbr: 'r1', targetLen: 1100, grade: {min:7,max:7}, seed: 'WHEAT' },
  russell2:       { id: 'RUSSELL_2',  abbr: 'r2', targetLen: 1200, grade: {min:7,max:7}, seed: 'WHEAT' },
  russell3:       { id: 'RUSSELL_3',  abbr: 'r3', targetLen: 1300, grade: {min:8,max:8}, seed: 'WHEAT' },
  wittgenstein1:  { id: 'WITTGENSTEIN_1', abbr: 'w1', targetLen: 1400, grade: {min:9,max:9}, seed: 'WHEAT' },
  wittgenstein2:  { id: 'WITTGENSTEIN_2', abbr: 'w2', targetLen: 1500, grade: {min:10,max:10}, seed: 'WHEAT' },
  wittgenstein3:  { id: 'WITTGENSTEIN_3', abbr: 'w3', targetLen: 1600, grade: {min:10,max:10}, seed: 'WHEAT' },
};

// 문장 분리 - 한국어 문장 끝 패턴 기반
function splitSentences(text) {
  // 마침표, 물음표, 느낌표 뒤에 공백이나 문자열 끝이 오는 패턴
  const sentences = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if ((text[i] === '.' || text[i] === '?' || text[i] === '!' || text[i] === '다' || text[i] === '요') &&
        i + 1 < text.length && text[i] === '.' && text[i+1] !== ' ' && /[가-힣]/.test(text[i+1])) {
      // 마침표 뒤에 바로 한글이 오면 문장 분리
      sentences.push(current);
      current = '';
    } else if ((text[i] === '다' || text[i] === '요') && text[i-1] !== undefined &&
               i + 1 < text.length && text[i+1] === '.') {
      // ~다. ~요. 패턴은 다음 문자에서 처리
    } else if (text[i] === '.' && (i + 1 >= text.length || text[i+1] === ' ' || /[가-힣]/.test(text[i+1] || ''))) {
      // 문장 끝 마침표
      if (i + 1 < text.length && text[i+1] === ' ') {
        // 공백 포함
      }
    }
  }
  if (current) sentences.push(current);
  return sentences;
}

// 지정된 구분자(||)로 문장 분리 - 더 정확
function splitBySeparator(text, sep = '||') {
  return text.split(sep).map(s => s.trim()).filter(s => s.length > 0);
}

// 문장들의 시작/끝 위치 계산 (결합된 텍스트 기준)
function computeRanges(sentences) {
  const ranges = [];
  let pos = 0;
  for (const sent of sentences) {
    ranges.push({ start: pos, end: pos + sent.length, text: sent });
    pos += sent.length;
  }
  return ranges;
}

// 선택지 길이 편차 검증
function validateChoiceVariance(choices, maxVariance = 0.15) {
  const lengths = choices.map(c => c.text.length);
  const maxLen = Math.max(...lengths);
  const minLen = Math.min(...lengths);
  if (maxLen === 0) return { ok: true, variance: 0 };
  const variance = (maxLen - minLen) / maxLen;
  return { ok: variance <= maxVariance, variance: Math.round(variance * 100) };
}

// 전체 콘텐츠 빌드
function buildDayContent(input) {
  const { level, dayIndex, subArea, paragraphSentences, intensive, recall, confirm } = input;
  const config = LEVEL_CONFIG[level];
  if (!config) throw new Error(`알 수 없는 레벨: ${level}`);

  // 문단 텍스트 조립 및 range 계산
  const paragraphs = [];
  const allRanges = []; // [{paragraphId, sentenceIdx, start, end, text}]

  for (let pi = 0; pi < paragraphSentences.length; pi++) {
    const pId = `p${pi + 1}`;
    const sentences = paragraphSentences[pi];
    const fullText = sentences.join('');
    paragraphs.push({ id: pId, text: fullText });

    let pos = 0;
    for (let si = 0; si < sentences.length; si++) {
      allRanges.push({
        paragraphId: pId,
        sentenceIdx: si,
        start: pos,
        end: pos + sentences[si].length,
        text: sentences[si]
      });
      pos += sentences[si].length;
    }
    // 문단 전체 range (중심내용 문항용)
    allRanges.push({
      paragraphId: pId,
      sentenceIdx: -1, // 전체
      start: 0,
      end: fullText.length,
      text: '[문단 전체]'
    });
  }

  const totalLength = paragraphs.reduce((s, p) => s + p.text.length, 0);

  // 정독 타임라인 구성
  const timeline = intensive.map((q, i) => {
    const range = allRanges[i]; // intensive 배열 순서 = allRanges 순서
    if (!range) throw new Error(`정독 ${i+1}번째 항목에 대응하는 문장/문단이 없습니다`);

    return {
      stepId: `s${i + 1}`,
      highlight: {
        paragraphId: range.paragraphId,
        range: { start: range.start, end: range.end }
      },
      question: {
        prompt: q.prompt,
        choices: q.choices,
        answerId: q.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    };
  });

  // 복기 카드
  const recallCards = recall.map((text, i) => ({
    id: `c${i + 1}`,
    text: text
  }));

  // 확인학습
  const confirmQuestions = confirm.map((q, i) => ({
    id: `q${i + 1}`,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode || 'ANY',
    answerRanges: q.answerRanges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }));

  const dayStr = String(dayIndex).padStart(3, '0');
  const subAreaLabel = subArea === 'NONFICTION' ? '비문학' :
                       subArea === 'LITERATURE' ? '문학' : subArea;

  const item = {
    content_type: "DAILY_READING",
    level_id: config.id,
    area: "READING",
    sub_area: subArea,
    day_index: dayIndex,
    module_key: "reading_training",
    schema_version: "1.0",
    content: {
      contentId: `dr-${config.abbr}-${dayStr}`,
      contentType: "DAILY_READING",
      version: 1,
      status: "PUBLISHED",
      title: `일일독해(${subAreaLabel}) Day ${dayIndex}`,
      description: "일일 독해 - 정독·복기·확인",
      targetLevel: config.id,
      schoolGradeRange: config.grade,
      area: "READING",
      subArea: subArea,
      competencies: ["READING"],
      tags: ["daily-reading", level.replace(/(\d)/, '$1')],
      access: { mode: "FREE" },
      seedReward: { seedType: config.seed, count: 3, multiplier: 1 },
      timeLimitSec: 300,
      assets: {},
      payload: {
        passage: {
          format: "TEXT",
          paragraphs: paragraphs
        },
        intensive: { timeline },
        recall: {
          cards: recallCards,
          correctOrder: recallCards.map(c => c.id),
          seedPenalty: 1
        },
        confirm: { questions: confirmQuestions }
      }
    }
  };

  // 검증
  const issues = [];
  const lenDiff = totalLength - config.targetLen;
  if (Math.abs(lenDiff) > 50) {
    issues.push(`지문길이 ${totalLength}자 (목표 ${config.targetLen}±50, 차이 ${lenDiff > 0 ? '+' : ''}${lenDiff})`);
  }
  if (recallCards.length !== 8) {
    issues.push(`복기카드 ${recallCards.length}장 (8장 필요)`);
  }
  if (confirmQuestions.length < 5 || confirmQuestions.length > 10) {
    issues.push(`확인학습 ${confirmQuestions.length}문항 (5~10 필요)`);
  }

  // 선택지 편차 검증
  for (const step of timeline) {
    const v = validateChoiceVariance(step.question.choices);
    if (!v.ok) {
      issues.push(`${step.stepId} 선택지편차 ${v.variance}% (15% 이하 필요)`);
    }
  }

  return { item, totalLength, issues, allRanges };
}

// 배치 파일에 주입
function injectIntoFile(levelKey, dayIndex, newItem) {
  const batchFile = path.join(__dirname, '..', 'generated', `daily-batch-reading-${levelKey}.json`);
  const data = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  data.items[dayIndex - 1] = newItem;
  fs.writeFileSync(batchFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ ${batchFile} Day ${dayIndex} 주입 완료`);
}

// 문단별 문장 range 표시 (작성 도우미)
function showRanges(paragraphSentences) {
  for (let pi = 0; pi < paragraphSentences.length; pi++) {
    const pId = `p${pi + 1}`;
    let pos = 0;
    console.log(`\n[${pId}]`);
    for (let si = 0; si < paragraphSentences[pi].length; si++) {
      const sent = paragraphSentences[pi][si];
      console.log(`  문장${si+1}: [${pos}~${pos+sent.length}] (${sent.length}자) "${sent.substring(0, 40)}..."`);
      pos += sent.length;
    }
    const fullLen = paragraphSentences[pi].join('').length;
    console.log(`  [전체]: [0~${fullLen}] (${fullLen}자)`);
  }
}

module.exports = { buildDayContent, injectIntoFile, showRanges, LEVEL_CONFIG, validateChoiceVariance };

// CLI 모드
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'inject' && args[1] && args[2]) {
    const levelKey = args[1];
    const contentFile = args[2];
    const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
    const result = buildDayContent(content);

    console.log(`\n=== 빌드 결과 ===`);
    console.log(`지문 길이: ${result.totalLength}자`);
    console.log(`정독 스텝: ${result.item.content.payload.intensive.timeline.length}`);
    console.log(`복기 카드: ${result.item.content.payload.recall.cards.length}`);
    console.log(`확인 문항: ${result.item.content.payload.confirm.questions.length}`);

    if (result.issues.length > 0) {
      console.log(`\n⚠ 검증 이슈:`);
      result.issues.forEach(i => console.log(`  - ${i}`));
    } else {
      console.log(`\n✅ 모든 검증 통과`);
    }

    // range 표시
    showRanges(content.paragraphSentences);

    if (args[3] === '--write') {
      injectIntoFile(levelKey, content.dayIndex, result.item);
    } else {
      // 결과 JSON 출력
      const outFile = contentFile.replace('.json', '-built.json');
      fs.writeFileSync(outFile, JSON.stringify(result.item, null, 2), 'utf8');
      console.log(`\n결과 저장: ${outFile}`);
      console.log(`배치 파일에 주입하려면: node build-reading-day.js inject ${levelKey} ${contentFile} --write`);
    }
  } else {
    console.log('사용법: node build-reading-day.js inject <level> <content.json> [--write]');
    console.log('레벨: ' + Object.keys(LEVEL_CONFIG).join(', '));
  }
}
