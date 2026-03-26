/**
 * 러셀2 Day 2 문학 (현대 수필 - 자아 성찰) 콘텐츠 생성 스크립트
 * 중2~중3 수준, 1200자 ±50자
 */

// ── 지문 정의 ──
const paragraphs = [
  {
    id: "p1",
    text: "이사한 지 한 달이 지났는데도 나는 새 동네에 좀처럼 익숙해지지 못했다. 골목 끝에 있는 작은 문구점마저 낯설게 느껴졌고, 학교에서 돌아오면 현관 앞에서 잠시 멈칫하곤 했다. 예전 집 현관에는 할머니가 키우던 분꽃 화분이 놓여 있었다. 문을 열면 은은한 꽃향기가 먼저 반겨 주었고, 할머니는 늘 거실 소파에 앉아 안경 너머로 나를 바라보셨다. 지금은 빈 현관만이 나를 맞이한다. 가방을 내려놓고 방에 들어서면 창밖으로 낯선 아파트 단지만 끝없이 이어져 있었다. 나는 침대에 누워 천장을 올려다보며, 할머니와 보냈던 따뜻한 시간들이 자꾸 떠올랐다."
  },
  {
    id: "p2",
    text: "일요일 아침, 엄마가 베란다에서 작은 화분 하나를 들고 들어오셨다. 분꽃이었다. 봉오리는 아직 오므라들어 있었지만 잎은 연둣빛으로 싱싱했다. 엄마는 내 책상 위 햇볕이 잘 드는 자리에 화분을 놓으며 조용한 목소리로 말씀하셨다. \u201C할머니가 보고 싶으면 이 꽃한테 이야기해 봐. 분꽃은 저녁에 피거든, 기다리는 마음을 알아.\u201D 나는 고개를 끄덕이면서도 꽃 한 송이가 빈자리를 채울 수 있을까 의심이 들었다. 그날 저녁, 해가 지자 정말로 분꽃 한 송이가 소리 없이 피어났다. 그 순간 나도 모르게 \u201C할머니, 오늘 학교에서 칭찬받았어.\u201D 하고 중얼거렸다."
  },
  {
    id: "p3",
    text: "그 뒤로 나는 매일 저녁 분꽃 앞에 앉아 하루를 되돌아보았다. 시험 성적이 떨어져 속상한 날에는 꽃잎을 가만히 만지며 한숨을 쉬었고, 친구와 다투어 마음이 어지러운 날에는 물을 주며 할머니라면 뭐라고 하셨을까 생각했다. 놀라운 것은, 꽃에게 말을 건네고 나면 마음이 한결 가벼워진다는 점이었다. 할머니가 곁에 계실 때도 나는 말보다 할머니의 존재 자체에서 위로를 받았는데, 분꽃이 바로 그 역할을 이어 주는 듯했다. 물을 줄 때마다 잎이 조금씩 더 짙어지는 것을 바라보면, 내 마음도 함께 단단하게 자라는 기분이 들었다."
  },
  {
    id: "p4",
    text: "어느 날 문득, 내가 달라졌다는 것을 깨달았다. 학교 가는 길에 문구점 아저씨에게 먼저 인사하게 되었고, 같은 반 친구에게 먼저 말을 걸게 되었다. 낯선 동네가 조금씩 \u2018내 동네\u2019로 바뀌고 있었다. 분꽃은 여전히 저녁마다 피었다가 아침이면 조용히 오므라들었다. 나는 그 반복 속에서 하루를 마무리하고 다시 시작하는 법을 배웠다. 할머니가 분꽃을 좋아하신 까닭을 이제야 조금은 알 것 같다. 분꽃은 매일 지고 다시 피면서, 어제의 슬픔을 내려놓고 오늘을 맞이하라고 조용히 말해 주기 때문이다."
  }
];

// ── 글자 수 확인 ──
const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1150 || totalLen > 1250) {
  console.error("경고: 글자 수 범위 벗어남! 1150~1250이어야 합니다.");
}

// ── 문장 경계 (수동 지정) ──
const p1Text = paragraphs[0].text;
const p1Sentences = [
  [0, p1Text.indexOf("골목 끝에")],
  [p1Text.indexOf("골목 끝에"), p1Text.indexOf("예전 집")],
  [p1Text.indexOf("예전 집"), p1Text.indexOf("문을 열면")],
  [p1Text.indexOf("문을 열면"), p1Text.indexOf("지금은 빈")],
  [p1Text.indexOf("지금은 빈"), p1Text.indexOf("가방을 내려놓고")],
  [p1Text.indexOf("가방을 내려놓고"), p1Text.indexOf("나는 침대에")],
  [p1Text.indexOf("나는 침대에"), p1Text.length]
].map(([s, e]) => ({ start: s, end: e }));

const p2Text = paragraphs[1].text;
const p2Sentences = [
  [0, p2Text.indexOf("분꽃이었다.")],
  [p2Text.indexOf("분꽃이었다."), p2Text.indexOf("봉오리는 아직")],
  [p2Text.indexOf("봉오리는 아직"), p2Text.indexOf("엄마는 내 책상")],
  [p2Text.indexOf("엄마는 내 책상"), p2Text.indexOf("나는 고개를")],
  [p2Text.indexOf("나는 고개를"), p2Text.indexOf("그날 저녁,")],
  [p2Text.indexOf("그날 저녁,"), p2Text.indexOf("그 순간")],
  [p2Text.indexOf("그 순간"), p2Text.length]
].map(([s, e]) => ({ start: s, end: e }));

const p3Text = paragraphs[2].text;
const p3Sentences = [
  [0, p3Text.indexOf("시험 성적이")],
  [p3Text.indexOf("시험 성적이"), p3Text.indexOf("친구와 다투어")],
  [p3Text.indexOf("친구와 다투어"), p3Text.indexOf("놀라운 것은,")],
  [p3Text.indexOf("놀라운 것은,"), p3Text.indexOf("할머니가 곁에")],
  [p3Text.indexOf("할머니가 곁에"), p3Text.indexOf("물을 줄 때마다")],
  [p3Text.indexOf("물을 줄 때마다"), p3Text.length]
].map(([s, e]) => ({ start: s, end: e }));

const p4Text = paragraphs[3].text;
const p4Sentences = [
  [0, p4Text.indexOf("학교 가는 길에")],
  [p4Text.indexOf("학교 가는 길에"), p4Text.indexOf("낯선 동네가")],
  [p4Text.indexOf("낯선 동네가"), p4Text.indexOf("분꽃은 여전히")],
  [p4Text.indexOf("분꽃은 여전히"), p4Text.indexOf("나는 그 반복")],
  [p4Text.indexOf("나는 그 반복"), p4Text.indexOf("할머니가 분꽃을")],
  [p4Text.indexOf("할머니가 분꽃을"), p4Text.indexOf("분꽃은 매일")],
  [p4Text.indexOf("분꽃은 매일"), p4Text.length]
].map(([s, e]) => ({ start: s, end: e }));

// ── ranges 유효성 검증 ──
function validateRanges(pid, text, sentences) {
  let ok = true;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (s.start < 0 || s.end < 0) {
      console.error(`FAIL ${pid} 문장${i+1}: indexOf 실패 (start=${s.start}, end=${s.end})`);
      ok = false;
    }
    if (s.start >= s.end) {
      console.error(`FAIL ${pid} 문장${i+1}: start(${s.start}) >= end(${s.end})`);
      ok = false;
    }
    const excerpt = text.substring(s.start, Math.min(s.start + 20, s.end));
    console.log(`  ${pid} 문장${i+1}: [${s.start},${s.end}] "${excerpt}..."`);
  }
  return ok;
}

console.log("\n=== ranges 검증 ===");
let allOk = true;
allOk = validateRanges("p1", p1Text, p1Sentences) && allOk;
allOk = validateRanges("p2", p2Text, p2Sentences) && allOk;
allOk = validateRanges("p3", p3Text, p3Sentences) && allOk;
allOk = validateRanges("p4", p4Text, p4Sentences) && allOk;
if (!allOk) {
  console.error("ABORT: ranges에 오류가 있습니다.");
  process.exit(1);
}

// ── 정독 timeline 생성 ──
const timeline = [];
let stepNum = 1;

function addSentenceSteps(pid, sentences, questions) {
  for (let i = 0; i < sentences.length; i++) {
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: {
        ranges: [{ paragraphId: pid, start: sentences[i].start, end: sentences[i].end }]
      },
      question: {
        prompt: questions[i].prompt,
        choices: questions[i].choices,
        answerId: questions[i].answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
  }
}

function addParagraphStep(pid, text, question) {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: {
      ranges: [{ paragraphId: pid, start: 0, end: text.length }]
    },
    question: {
      prompt: question.prompt,
      choices: question.choices,
      answerId: question.answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// p1 문장별 질문
addSentenceSteps("p1", p1Sentences, [
  {
    prompt: "첫 문장에서 '나'의 상황을 바르게 이해한 것은?",
    choices: [
      { id: "A", text: "이사한 지 한 달이 지났으나 새 동네에 좀처럼 익숙해지지 못했다." },
      { id: "B", text: "이사한 지 한 달 만에 새 동네가 매우 편안해졌다." },
      { id: "C", text: "이사하기 전부터 새 동네를 잘 알고 있었다." },
      { id: "D", text: "이사한 지 일주일 만에 친구를 모두 사귀었다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 드러내는 '나'의 심리로 알맞은 것은?",
    choices: [
      { id: "A", text: "문구점조차 낯설고 현관 앞에서 멈칫하는 등 어색함을 느낀다." },
      { id: "B", text: "문구점이 반갑고 현관에서 달려 들어갈 만큼 즐겁다." },
      { id: "C", text: "문구점을 매일 들러 친해졌고 현관에서 여유를 느낀다." },
      { id: "D", text: "문구점은 알지만 현관이 어디인지 기억나지 않는다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 떠올리는 예전 집의 모습으로 알맞은 것은?",
    choices: [
      { id: "A", text: "예전 집 현관에는 할머니가 키우던 분꽃 화분이 놓여 있었다." },
      { id: "B", text: "예전 집 현관에는 엄마가 키우던 장미 화분이 놓여 있었다." },
      { id: "C", text: "예전 집 현관에는 아무 화분도 없이 깨끗했다." },
      { id: "D", text: "예전 집 현관에는 할머니가 키우던 선인장이 놓여 있었다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 보여 주는 예전 집의 분위기로 알맞은 것은?",
    choices: [
      { id: "A", text: "꽃향기가 반겨 주고 할머니가 거실 소파에서 '나'를 바라보시는 따뜻한 분위기이다." },
      { id: "B", text: "꽃향기가 없고 할머니가 외출해 계시지 않는 쓸쓸한 분위기이다." },
      { id: "C", text: "강한 꽃냄새가 나고 할머니가 창문을 닫아 달라 하시는 답답한 분위기이다." },
      { id: "D", text: "향기 대신 음식 냄새가 나고 할머니가 부엌에만 계시는 바쁜 분위기이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장이 드러내는 현재 현관의 느낌으로 알맞은 것은?",
    choices: [
      { id: "A", text: "빈 현관만이 '나'를 맞이하여 쓸쓸함이 느껴진다." },
      { id: "B", text: "현관에 새 화분이 놓여 예전과 같은 따뜻함이 느껴진다." },
      { id: "C", text: "현관에 친구가 기다리고 있어 반가움이 느껴진다." },
      { id: "D", text: "현관이 매우 넓어져 시원함이 느껴진다." }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 방에 들어선 '나'가 보는 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "창밖으로 낯선 아파트 단지만 끝없이 이어져 있다." },
      { id: "B", text: "창밖으로 예전 동네의 골목이 보인다." },
      { id: "C", text: "창밖으로 할머니 집의 마당이 보인다." },
      { id: "D", text: "창밖으로 학교 운동장이 보인다." }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장이 드러내는 '나'의 마음으로 알맞은 것은?",
    choices: [
      { id: "A", text: "침대에 누워 천장을 올려다보며 할머니와 보냈던 따뜻한 시간들을 그리워한다." },
      { id: "B", text: "침대에서 일어나 새 동네를 탐험하러 나간다." },
      { id: "C", text: "침대에 누워 새 집이 마음에 들어 기뻐한다." },
      { id: "D", text: "침대에서 친구에게 전화하며 즐겁게 이야기한다." }
    ],
    answerId: "A"
  }
]);

// p1 문단 중심내용
addParagraphStep("p1", p1Text, {
  prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "이사 후 낯선 환경에 적응하지 못하는 '나'가 할머니와 예전 집을 그리워한다." },
    { id: "B", text: "이사 후 '나'가 새 동네에 완전히 적응하여 즐거운 나날을 보낸다." },
    { id: "C", text: "이사 전 할머니와 다툰 '나'가 후회하며 사과를 준비한다." },
    { id: "D", text: "이사 후 '나'가 학교에서 새 친구를 사귀어 외로움을 잊는다." }
  ],
  answerId: "A"
});

// p2 문장별 질문
addSentenceSteps("p2", p2Sentences, [
  {
    prompt: "첫 문장에서 일요일 아침에 일어난 일로 알맞은 것은?",
    choices: [
      { id: "A", text: "엄마가 베란다에서 작은 화분 하나를 들고 들어오셨다." },
      { id: "B", text: "'나'가 직접 꽃집에 가서 화분을 샀다." },
      { id: "C", text: "할머니가 택배로 화분을 보내 주셨다." },
      { id: "D", text: "친구가 생일 선물로 화분을 가져왔다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 밝히는 화분 속 꽃의 이름으로 알맞은 것은?",
    choices: [
      { id: "A", text: "분꽃이다." },
      { id: "B", text: "장미이다." },
      { id: "C", text: "해바라기이다." },
      { id: "D", text: "국화이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 묘사하는 분꽃의 모습으로 알맞은 것은?",
    choices: [
      { id: "A", text: "봉오리는 아직 오므라들어 있지만 잎은 연둣빛으로 싱싱하다." },
      { id: "B", text: "꽃이 활짝 피어 있지만 잎은 누렇게 시들어 있다." },
      { id: "C", text: "봉오리도 잎도 모두 말라 있어 생기가 없다." },
      { id: "D", text: "꽃잎이 붉게 펴 있고 잎은 짙은 초록이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째~다섯째 부분에서 엄마가 전하는 말의 뜻으로 알맞은 것은?",
    choices: [
      { id: "A", text: "분꽃은 저녁에 피니 기다리는 마음을 알아줄 것이라는 위로이다." },
      { id: "B", text: "분꽃은 아침에 피니 일찍 일어나라는 당부이다." },
      { id: "C", text: "분꽃은 빨리 시드니 소중히 다루라는 경고이다." },
      { id: "D", text: "분꽃은 향이 없으니 다른 꽃으로 바꾸자는 제안이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 부분에서 '나'가 의심한 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "꽃 한 송이가 할머니의 빈자리를 채울 수 있을지 의심했다." },
      { id: "B", text: "분꽃이 진짜 분꽃인지 종류를 의심했다." },
      { id: "C", text: "엄마가 화분을 잘 키울 수 있을지 의심했다." },
      { id: "D", text: "화분 값이 비쌌을지 의심했다." }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 부분에서 저녁에 일어난 일로 알맞은 것은?",
    choices: [
      { id: "A", text: "해가 지자 분꽃 한 송이가 소리 없이 피어났다." },
      { id: "B", text: "분꽃이 피지 않고 봉오리째 떨어졌다." },
      { id: "C", text: "분꽃 대신 다른 꽃이 피어났다." },
      { id: "D", text: "분꽃 잎이 모두 시들어 버렸다." }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 부분에서 '나'가 중얼거린 말이 보여 주는 심리로 알맞은 것은?",
    choices: [
      { id: "A", text: "분꽃을 보자 할머니에게 말을 건네듯 자연스럽게 마음을 열었다." },
      { id: "B", text: "분꽃이 무섭워 할머니에게 도움을 요청했다." },
      { id: "C", text: "칭찬을 자랑하고 싶어 친구에게 전화하려 한다." },
      { id: "D", text: "분꽃에 관심이 없어 혼잣말로 불평했다." }
    ],
    answerId: "A"
  }
]);

// p2 문단 중심내용
addParagraphStep("p2", p2Text, {
  prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "엄마가 가져다준 분꽃을 통해 '나'가 할머니를 향한 마음을 조금씩 표현하기 시작한다." },
    { id: "B", text: "'나'가 분꽃에 전혀 관심을 보이지 않고 방치한다." },
    { id: "C", text: "엄마가 분꽃을 베란다에 두고 '나'에게 알려 주지 않는다." },
    { id: "D", text: "'나'가 분꽃을 친구에게 선물하기로 결심한다." }
  ],
  answerId: "A"
});

// p3 문장별 질문
addSentenceSteps("p3", p3Sentences, [
  {
    prompt: "첫 문장이 보여 주는 '나'의 새로운 습관으로 알맞은 것은?",
    choices: [
      { id: "A", text: "매일 저녁 분꽃 앞에 앉아 하루를 되돌아보는 것이 습관이 되었다." },
      { id: "B", text: "매일 아침 분꽃에 물을 주고 바로 학교로 간다." },
      { id: "C", text: "매일 저녁 친구와 전화하며 분꽃 이야기를 한다." },
      { id: "D", text: "매일 저녁 분꽃 사진을 찍어 할머니에게 보낸다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 드러내는 속상한 날의 행동으로 알맞은 것은?",
    choices: [
      { id: "A", text: "꽃잎을 가만히 만지며 한숨을 쉬었다." },
      { id: "B", text: "꽃잎을 꺾어서 책 사이에 끼웠다." },
      { id: "C", text: "꽃잎에 물감을 칠하며 그림을 그렸다." },
      { id: "D", text: "꽃잎을 세어 보며 점수를 계산했다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 친구와 다투었을 때 '나'가 한 행동으로 알맞은 것은?",
    choices: [
      { id: "A", text: "물을 주며 할머니라면 뭐라고 하셨을까 생각했다." },
      { id: "B", text: "물을 주지 않고 화가 나서 방에서 나갔다." },
      { id: "C", text: "엄마에게 전화해 친구의 잘못을 이야기했다." },
      { id: "D", text: "분꽃을 베란다로 옮기고 문을 닫았다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 말하는 놀라운 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "꽃에게 말을 건네고 나면 마음이 한결 가벼워진다는 것이다." },
      { id: "B", text: "꽃에게 말을 걸면 꽃이 소리를 내어 대답한다는 것이다." },
      { id: "C", text: "꽃에게 말을 걸면 성적이 바로 오른다는 것이다." },
      { id: "D", text: "꽃에게 말을 걸면 친구와의 다툼이 자동으로 해결된다는 것이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장이 깨닫게 해 주는 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "할머니의 존재 자체에서 받던 위로를 분꽃이 이어 주는 듯하다는 것이다." },
      { id: "B", text: "할머니가 직접 전화로 위로를 해 주셨다는 것이다." },
      { id: "C", text: "분꽃이 말을 하여 할머니 대신 대화를 나눈다는 것이다." },
      { id: "D", text: "할머니 없이도 아무런 외로움을 느끼지 않는다는 것이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장이 나타내는 '나'의 성장으로 알맞은 것은?",
    choices: [
      { id: "A", text: "잎이 짙어지는 것을 보며 자신의 마음도 함께 단단하게 자란다고 느낀다." },
      { id: "B", text: "잎이 시드는 것을 보며 할머니에 대한 기억이 사라지는 기분이 든다." },
      { id: "C", text: "잎이 변하지 않아 시간이 멈춘 기분이 든다." },
      { id: "D", text: "잎이 너무 커져 화분을 버려야 하는 기분이 든다." }
    ],
    answerId: "A"
  }
]);

// p3 문단 중심내용
addParagraphStep("p3", p3Text, {
  prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "'나'는 분꽃에게 말을 건네며 위로를 받고 마음이 성장해 간다." },
    { id: "B", text: "'나'는 분꽃에 관심을 잃고 다른 취미를 찾는다." },
    { id: "C", text: "'나'는 분꽃이 시들어 슬퍼하며 새 화분을 산다." },
    { id: "D", text: "'나'는 분꽃보다 친구에게 위로를 받아 더 이상 꽃이 필요 없다." }
  ],
  answerId: "A"
});

// p4 문장별 질문
addSentenceSteps("p4", p4Sentences, [
  {
    prompt: "첫 문장에서 '나'가 깨달은 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "자신이 달라졌다는 것을 깨달았다." },
      { id: "B", text: "동네가 예전과 똑같다는 것을 깨달았다." },
      { id: "C", text: "할머니가 이사 오셨다는 것을 깨달았다." },
      { id: "D", text: "분꽃이 시들었다는 것을 깨달았다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 보여 주는 '나'의 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "문구점 아저씨에게 먼저 인사하고 친구에게 먼저 말을 걸게 되었다." },
      { id: "B", text: "문구점 아저씨를 피하고 친구에게도 말을 걸지 않는다." },
      { id: "C", text: "문구점은 가지 않고 친구만 만나게 되었다." },
      { id: "D", text: "문구점에서 물건만 사고 인사는 하지 않는다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 나타내는 동네에 대한 인식 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "낯선 동네가 조금씩 '내 동네'로 바뀌고 있다." },
      { id: "B", text: "낯선 동네가 점점 더 낯설어지고 있다." },
      { id: "C", text: "동네는 변함없고 '나'만 떠나고 싶어진다." },
      { id: "D", text: "동네가 너무 익숙해져 지루해지고 있다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 묘사하는 분꽃의 모습으로 알맞은 것은?",
    choices: [
      { id: "A", text: "저녁마다 피었다가 아침이면 조용히 오므라드는 모습이다." },
      { id: "B", text: "아침마다 피었다가 저녁이면 떨어지는 모습이다." },
      { id: "C", text: "한 번 피면 며칠 동안 그대로 유지되는 모습이다." },
      { id: "D", text: "피지 않고 봉오리 상태로만 남아 있는 모습이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 '나'가 분꽃의 반복에서 배운 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "하루를 마무리하고 다시 시작하는 법을 배웠다." },
      { id: "B", text: "꽃을 꺾어 말리는 방법을 배웠다." },
      { id: "C", text: "매일 같은 일상이 지루하다는 것을 배웠다." },
      { id: "D", text: "밤에는 아무것도 하지 않는 것이 좋다는 것을 배웠다." }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 '나'가 이제야 알게 된 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "할머니가 분꽃을 좋아하신 까닭을 조금은 알 것 같다." },
      { id: "B", text: "할머니가 분꽃을 싫어하셨다는 사실을 알게 되었다." },
      { id: "C", text: "분꽃이 할머니가 직접 심은 것이 아니었다는 사실을 알게 되었다." },
      { id: "D", text: "할머니가 다른 꽃을 더 좋아하셨다는 사실을 알게 되었다." }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장이 말하는 분꽃의 의미로 알맞은 것은?",
    choices: [
      { id: "A", text: "매일 지고 피면서 어제의 슬픔을 내려놓고 오늘을 맞이하라고 말해 준다." },
      { id: "B", text: "한 번 지면 다시 피지 않아 슬픔이 영원하다고 말해 준다." },
      { id: "C", text: "꽃이 피는 것은 아무 의미 없는 자연 현상일 뿐이라고 말해 준다." },
      { id: "D", text: "슬픔을 잊으려면 꽃을 꺾어야 한다고 말해 준다." }
    ],
    answerId: "A"
  }
]);

// p4 문단 중심내용
addParagraphStep("p4", p4Text, {
  prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "'나'는 분꽃의 반복되는 개화에서 삶의 태도를 배우며 새 환경에 적응해 간다." },
    { id: "B", text: "'나'는 분꽃이 시들자 새 화분을 사러 나간다." },
    { id: "C", text: "'나'는 동네에 적응하지 못해 다시 이사를 결심한다." },
    { id: "D", text: "'나'는 할머니를 완전히 잊고 새 생활에만 집중한다." }
  ],
  answerId: "A"
});

// ── 복기(recall) 8카드 ──
const recall = {
  cards: [
    { id: "c1", text: "이사 후 새 동네에 적응하지 못한 '나'는 할머니와 예전 집을 그리워했다." },
    { id: "c2", text: "예전 집 현관에는 할머니가 키우던 분꽃 화분이 있었고 따뜻한 꽃향기가 났다." },
    { id: "c3", text: "엄마가 분꽃 화분을 가져오며 기다리는 마음을 분꽃이 안다고 말씀하셨다." },
    { id: "c4", text: "저녁에 핀 분꽃을 보고 '나'는 할머니에게 말하듯 중얼거리기 시작했다." },
    { id: "c5", text: "매일 분꽃 앞에 앉아 속마음을 이야기하면 마음이 한결 가벼워졌다." },
    { id: "c6", text: "분꽃에게 물을 주며 잎이 짙어지는 것을 보고 자신도 성장한다고 느꼈다." },
    { id: "c7", text: "문구점 아저씨에게 인사하고 친구에게 먼저 말을 걸며 동네에 적응했다." },
    { id: "c8", text: "분꽃이 매일 지고 피는 모습에서 슬픔을 내려놓고 오늘을 맞이하는 법을 배웠다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ── 확인학습(confirm) ──
function findRange(pid, answer) {
  const pText = paragraphs.find(p => p.id === pid).text;
  const idx = pText.indexOf(answer);
  if (idx === -1) {
    console.error(`FAIL confirm: "${answer}" not found in ${pid}`);
    return { paragraphId: pid, start: 0, end: 0 };
  }
  return { paragraphId: pid, start: idx, end: idx + answer.length };
}

const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "예전 집 현관에 놓여 있던, 할머니가 키우시던 꽃의 이름은 무엇인가요?",
      answerText: "분꽃",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "분꽃")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "문을 열면 먼저 반겨 주었던 것은 무엇인가요?",
      answerText: "꽃향기",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "꽃향기")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "엄마가 말씀하신, 분꽃이 피는 시간대는 언제인가요?",
      answerText: "저녁",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "저녁에 피거든")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "'나'가 분꽃에게 중얼거린 말 가운데, 학교에서 있었던 좋은 일은 무엇인가요?",
      answerText: "칭찬",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "칭찬")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "'나'가 분꽃에게 물을 줄 때 조금씩 짙어지는 부분은 무엇인가요?",
      answerText: "잎",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "잎이 조금씩 더 짙어지는")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "'나'가 학교 가는 길에 먼저 인사하게 된 사람은 누구인가요?",
      answerText: "문구점 아저씨",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "문구점 아저씨")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "분꽃이 매일 반복하는 행동 가운데, 저녁에 하는 것은 무엇인가요?",
      answerText: "피었다가",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "피었다가")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "분꽃이 조용히 전해 주는 메시지에서, 내려놓으라고 한 것은 무엇인가요?",
      answerText: "어제의 슬픔",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "어제의 슬픔")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ── 최종 JSON 조립 ──
const content = {
  contentId: "dr-r2-002",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 2 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: {
      format: "TEXT",
      paragraphs: paragraphs
    },
    intensive: { timeline },
    recall,
    confirm
  }
};

// ── 최종 검증 ──
console.log("\n=== 최종 검증 ===");
console.log("총 글자 수:", totalLen);
console.log("정독 step 수:", timeline.length);
console.log("복기 카드 수:", recall.cards.length);
console.log("확인 문항 수:", confirm.questions.length);

// 파일 출력
const fs = require('fs');
const path = require('path');

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2', '002.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log("정적 파일 저장:", staticPath);

// 배치 파일 업데이트 (items[1] 교체)
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[1] = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 2,
  module_key: "reading_training",
  schema_version: "1.0",
  content: content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("배치 파일 items[1] 교체:", batchPath);

console.log("\n=== Day 2 완료 ===");
