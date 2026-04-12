const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지-daily-reading\\frontend\\public\\daily-reading\\saussure3\\117.json';
const targetDir = path.dirname(targetFile);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Data setup
const title = '[문학] 어린 왕자 2부';

const p1_sentences = [
  "어린 왕자는 지구에 도착해 사막에서 뱀을 만났어요.",
  "뱀은 아주 작았지만, 왕자보다 더 큰 힘을 가졌다고 말했지요.",
  "뱀은 자신이 왕자를 별로 돌려보낼 수 있다고 수수께끼 같은 말을 했어요."
];
const p2_sentences = [
  "그 후 왕자는 끝없이 펼쳐진 장미꽃 정원을 발견했어요.",
  "자신의 별에 있는 장미가 세상에 단 하나뿐인 줄 알았기에 왕자는 크게 슬퍼했어요.",
  "하지만 곧 자신의 장미가 얼마나 특별한지 깨닫게 된답니다."
];
const p3_sentences = [
  "여우를 만난 왕자는 길들인다는 것의 진짜 의미를 배웠어요.",
  "여우는 중요한 것은 눈에 보이지 않는다는 멋진 비밀을 알려 주었죠.",
  "결국 왕자는 자신의 장미를 책임지기 위해 떠날 결심을 해요."
];

const p1_text = p1_sentences.join(' ');
const p2_text = p2_sentences.join(' ');
const p3_text = p3_sentences.join(' ');

function getSentenceRanges(pId, sentences) {
    let ranges = [];
    let start = 0;
    for (let s of sentences) {
        let text = pId === 'p1' ? p1_text : pId === 'p2' ? p2_text : p3_text;
        let s_start = text.indexOf(s, start);
        let s_end = s_start + s.length - 1;
        ranges.push({ paragraphId: pId, start: s_start, end: s_end });
        start = s_end + 1;
    }
    return ranges;
}

const p1_ranges = getSentenceRanges('p1', p1_sentences);
const p2_ranges = getSentenceRanges('p2', p2_sentences);
const p3_ranges = getSentenceRanges('p3', p3_sentences);

const p1_full_range = { paragraphId: "p1", start: 0, end: p1_text.length - 1 };
const p2_full_range = { paragraphId: "p2", start: 0, end: p2_text.length - 1 };
const p3_full_range = { paragraphId: "p3", start: 0, end: p3_text.length - 1 };

let timeline = [];

let stepCount = 1;
function addIntensive(ranges, prompt, choices, answerIdx) {
    let ids = ['A', 'B', 'C', 'D'];
    timeline.push({
        stepId: "step" + stepCount++,
        highlight: { ranges: Array.isArray(ranges) ? ranges : [ranges] },
        question: {
            prompt: prompt,
            choices: choices.map((c, i) => ({ id: ids[i], text: c })),
            answerId: ids[answerIdx],
            scoring: {
                correctDeltaSec: 10,
                wrongDeltaSec: -5,
                eliminateWrongChoice: true
            }
        }
    });
}

// P1
addIntensive([p1_ranges[0]], "누구를 만났나요?", ["토끼", "뱀", "사자", "여우"], 1);
addIntensive([p1_ranges[1]], "뱀의 특징은 무엇인가요?", ["크고 약함", "작고 약함", "크고 강함", "작지만 강함"], 3);
addIntensive([p1_ranges[2]], "뱀은 무엇을 약속했나요?", ["별로 돌려보냄", "보물을 줌", "친구를 찾아줌", "비밀을 알려줌"], 0);
addIntensive([p1_full_range], "1문단의 중심 내용은?", ["지구의 사막", "뱀과의 만남", "뱀의 마법", "수수께끼"], 1);

// P2
addIntensive([p2_ranges[0]], "왕자는 무엇을 발견했나요?", ["장미꽃 정원", "사과나무 숲", "투명한 호수", "높은 산"], 0);
addIntensive([p2_ranges[1]], "왕자가 슬퍼한 이유는?", ["장미가 죽어서", "길을 잃어서", "꽃이 흔해서", "뱀이 무서워서"], 2);
addIntensive([p2_ranges[2]], "왕자는 무엇을 깨달았나요?", ["장미의 평범함", "장미의 특별함", "자신의 약함", "자신의 용기"], 1);
addIntensive([p2_full_range], "2문단의 중심 내용은?", ["장미꽃의 종류", "별의 특징", "슬픔과 깨달음", "정원의 아름다움"], 2);

// P3
addIntensive([p3_ranges[0]], "왕자는 무엇을 배웠나요?", ["사냥의 기술", "길들임의 의미", "별자리 읽기", "노래 부르기"], 1);
addIntensive([p3_ranges[1]], "중요한 것은 어떤가요?", ["눈에 잘 보임", "돈으로 살 수 있음", "눈에 보이지 않음", "빨리 사라짐"], 2);
addIntensive([p3_ranges[2]], "왕자의 결심은 무엇인가요?", ["장미를 책임짐", "사막에 남음", "여우와 여행함", "새 별을 찾음"], 0);
addIntensive([p3_full_range], "3문단의 중심 내용은?", ["여우의 비밀", "길들임과 결심", "눈에 보이는 것", "친구 사귀기"], 1);

let cards = [
  { id: "c1", text: "지구의 사막 도착" },
  { id: "c2", text: "작지만 강한 뱀 만남" },
  { id: "c3", text: "수많은 장미꽃 발견" },
  { id: "c4", text: "장미의 특별함 깨달음" },
  { id: "c5", text: "여우의 멋진 비밀" },
  { id: "c6", text: "장미를 위한 결심" }
];
let correctOrder = ["c1", "c2", "c3", "c4", "c5", "c6"];

let confirmQuestions = [
    {
        id: "q1",
        prompt: "왕자가 지구에서 처음 만난 것은 무엇인가요?",
        answerText: "뱀",
        answerMatchMode: "CONTAINS",
        answerRanges: [{ paragraphId: "p1", start: p1_text.indexOf("뱀"), end: p1_text.indexOf("뱀") }],
        scoring: { correctDeltaSec: 15, wrongDeltaSec: -5 },
        revealOnWrong: true
    },
    {
        id: "q2",
        prompt: "장미꽃 정원을 보고 왕자는 처음에 어떤 기분이었나요?",
        answerText: "슬퍼했어요",
        answerMatchMode: "CONTAINS",
        answerRanges: [{ paragraphId: "p2", start: p2_text.indexOf("슬퍼했어요"), end: p2_text.indexOf("슬퍼했어요") + 4 }],
        scoring: { correctDeltaSec: 15, wrongDeltaSec: -5 },
        revealOnWrong: true
    },
    {
        id: "q3",
        prompt: "여우가 알려준 중요한 것은 눈에 보이나요?",
        answerText: "보이지 않는다는",
        answerMatchMode: "CONTAINS",
        answerRanges: [{ paragraphId: "p3", start: p3_text.indexOf("보이지 않는다는"), end: p3_text.indexOf("보이지 않는다는") + 7 }],
        scoring: { correctDeltaSec: 15, wrongDeltaSec: -5 },
        revealOnWrong: true
    }
];

const json = {
  contentId: "dr-saussure3-117",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: title,
  description: "어린 왕자 2부 이야기입니다.",
  targetLevel: "SAUSSURE_3",
  schoolGradeRange: { min: 3, max: 4 },
  area: "문학",
  subArea: "소설",
  competencies: ["내용 이해", "중심 생각 찾기"],
  tags: ["어린왕자", "소설", "동화"],
  access: { mode: "FREE" },
  seedReward: { seedType: "GOLD", count: 10, multiplier: 1.0 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: [
        { id: "p1", text: p1_text },
        { id: "p2", text: p2_text },
        { id: "p3", text: p3_text }
      ]
    },
    intensive: {
      timeline: timeline
    },
    recall: {
      cards: cards,
      correctOrder: correctOrder,
      seedPenalty: -5
    },
    confirm: {
      questions: confirmQuestions
    }
  }
};

fs.writeFileSync(targetFile, JSON.stringify(json, null, 2), 'utf-8');
console.log('Successfully saved to', targetFile);
