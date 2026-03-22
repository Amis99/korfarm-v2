const fs = require('fs');
const path = require('path');

// ─── 1. 지문 정의 (문학 - 소설) ───
const paragraphs = [
  {
    id: "p1",
    text: "마을 어귀에 자리한 오래된 우체국은 벽돌 사이로 이끼가 피어오를 만큼 낡았지만, 마을 사람들에게는 여전히 소중한 공간이었다.우체국 안에 들어서면 나무 바닥이 삐걱거리며 발자국 소리를 크게 울렸고, 높은 천장 아래 매달린 노란 전등은 늘 한 박자 느리게 깜박였다.창구 뒤에 앉은 할아버지는 반백의 머리카락을 빗으로 단정히 넘기고, 낡은 안경 너머로 편지를 하나하나 살피곤 했다.누군가 편지를 부치러 오면 할아버지는 봉투의 글씨를 손가락으로 짚어 가며 읽은 뒤, '잘 가겠구먼' 하고 작게 중얼거렸다.그 목소리는 마치 편지를 배웅하는 것 같아서, 사람들은 괜히 마음이 놓이곤 했다."
  },
  {
    id: "p2",
    text: "어느 겨울, 마을에 큰 눈이 내려 길이 끊겼다.우체부 아저씨가 오지 못하자 편지가 쌓이기 시작했다.할아버지는 창구에 편지 더미를 쌓아 두고 하루에도 몇 번씩 바깥 날씨를 살폈다.사흘째 되는 날 아침, 할아버지는 두꺼운 외투를 입고 편지 보따리를 등에 졌다.'내가 직접 가져다주지 않으면 급한 소식을 기다리는 사람이 있을 거야.' 할아버지는 무릎까지 빠지는 눈길을 한 발 한 발 걸었다.첫 번째 집에 도착해 편지를 건네자, 문을 연 아주머니는 눈시울을 붉히며 고맙다는 말을 되풀이했다.그 편지에는 멀리 도시에서 일하는 아들이 곧 돌아오겠다는 소식이 적혀 있었다."
  },
  {
    id: "p3",
    text: "할아버지는 마을을 한 바퀴 돌며 열두 통의 편지를 모두 전했다.돌아오는 길, 해가 지고 눈이 다시 내리기 시작했지만 할아버지의 발걸음은 아침보다 가벼웠다.우체국 문을 열고 들어서자 텅 빈 창구가 눈에 들어왔는데, 그 모습이 오히려 뿌듯하게 느껴졌다.할아버지는 젖은 외투를 벗어 걸고 의자에 앉아 조용히 눈을 감았다.밖에서는 눈이 세상을 하얗게 덮고 있었지만, 우체국 안의 노란 전등은 여전히 따뜻하게 빛나고 있었다.그날 밤, 마을 사람들은 저마다 받은 편지를 펼쳐 놓고 가족의 안부를 소리 내어 읽었다."
  }
];

// ─── 2. 유틸리티 ───
function findRange(pid, search) {
  const p = paragraphs.find(x => x.id === pid);
  if (!p) throw new Error(`Paragraph ${pid} not found`);
  const s = p.text.indexOf(search);
  if (s === -1) throw new Error(`"${search}" not found in ${pid}. Text: ${p.text.substring(0, 100)}...`);
  return { paragraphId: pid, start: s, end: s + search.length };
}

// 문장별 범위 계산 (마침표+다음문장시작 기준)
function sentenceRanges(pid) {
  const p = paragraphs.find(x => x.id === pid);
  const text = p.text;
  const ranges = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 < text.length) {
      ranges.push({ paragraphId: pid, start, end: i + 1 });
      start = i + 1;
    } else if (text[i] === '.' && i + 1 === text.length) {
      ranges.push({ paragraphId: pid, start, end: i + 1 });
      start = i + 1;
    }
  }
  if (start < text.length) {
    ranges.push({ paragraphId: pid, start, end: text.length });
  }
  return ranges;
}

// ─── 3. intensive timeline 구축 ───
const timeline = [];
let stepNum = 1;

// p1 문장별
const p1Sentences = sentenceRanges("p1");
const p1Questions = [
  {
    prompt: "첫 문장은 우체국의 상태를 어떻게 묘사하나요?",
    choices: [
      { id: "A", text: "벽돌 사이로 이끼가 필 만큼 낡았지만 소중한 공간이었다" },
      { id: "B", text: "최근에 새로 지어 반짝이는 건물이었다" },
      { id: "C", text: "마을 사람들이 꺼리는 무서운 장소였다" },
      { id: "D", text: "벽돌이 모두 새것이어서 이끼가 전혀 없었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 우체국 안의 분위기를 알 수 있는 묘사는 무엇인가요?",
    choices: [
      { id: "A", text: "나무 바닥이 삐걱거리고 노란 전등이 느리게 깜박였다" },
      { id: "B", text: "대리석 바닥이 반짝이고 형광등이 환하게 비췄다" },
      { id: "C", text: "콘크리트 바닥에 소리가 나지 않고 조용했다" },
      { id: "D", text: "카펫 바닥이 깔려 있어 발소리가 전혀 나지 않았다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 할아버지의 외모를 어떻게 묘사하고 있나요?",
    choices: [
      { id: "A", text: "반백의 머리카락을 단정히 넘기고 낡은 안경을 쓰고 있었다" },
      { id: "B", text: "새까만 머리카락에 새 안경을 쓰고 있었다" },
      { id: "C", text: "안경 없이 맨눈으로 편지를 읽고 있었다" },
      { id: "D", text: "모자를 깊이 눌러쓰고 얼굴을 가리고 있었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 할아버지가 편지를 부칠 때 하는 행동은 무엇인가요?",
    choices: [
      { id: "A", text: "봉투의 글씨를 손가락으로 짚어 가며 읽고 중얼거렸다" },
      { id: "B", text: "봉투를 열어 내용을 확인한 뒤 도장을 찍었다" },
      { id: "C", text: "편지를 읽지 않고 바로 상자에 넣었다" },
      { id: "D", text: "편지 내용을 큰 소리로 낭독해 주었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 할아버지의 목소리가 사람들에게 주는 느낌은 무엇인가요?",
    choices: [
      { id: "A", text: "편지를 배웅하는 것 같아 마음이 놓였다" },
      { id: "B", text: "너무 큰 소리여서 깜짝 놀라곤 했다" },
      { id: "C", text: "무뚝뚝해서 사람들이 불편해했다" },
      { id: "D", text: "듣기 어려울 만큼 작아 짜증이 났다" }
    ],
    answerId: "A"
  }
];

p1Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p1Questions[i].prompt,
      choices: p1Questions[i].choices,
      answerId: p1Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p1 전체 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p1", start: 0, end: paragraphs[0].text.length }] },
  question: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "오래된 우체국과 편지를 소중히 다루는 할아버지의 일상을 보여 준다" },
      { id: "B", text: "마을에 새 우체국이 세워져 모두가 기뻐하는 장면을 보여 준다" },
      { id: "C", text: "할아버지가 우체국을 떠나기로 결심하는 장면을 보여 준다" },
      { id: "D", text: "마을 사람들이 편지를 쓰지 않게 된 이유를 설명한다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p2 문장별
const p2Sentences = sentenceRanges("p2");
const p2Questions = [
  {
    prompt: "첫 문장에서 마을에 무슨 일이 일어났나요?",
    choices: [
      { id: "A", text: "큰 눈이 내려 길이 끊겼다" },
      { id: "B", text: "큰 비가 와서 다리가 무너졌다" },
      { id: "C", text: "태풍이 불어 지붕이 날아갔다" },
      { id: "D", text: "가뭄이 들어 우물이 말랐다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장은 우체부가 오지 못하자 어떤 일이 벌어졌다고 하나요?",
    choices: [
      { id: "A", text: "편지가 쌓이기 시작했다" },
      { id: "B", text: "마을 사람들이 직접 편지를 가져갔다" },
      { id: "C", text: "할아버지가 편지를 모두 버렸다" },
      { id: "D", text: "우체국 문을 닫았다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 할아버지가 반복한 행동은 무엇인가요?",
    choices: [
      { id: "A", text: "편지 더미를 쌓아 두고 하루에도 몇 번씩 바깥 날씨를 살폈다" },
      { id: "B", text: "편지를 한 통씩 열어 내용을 읽어 보았다" },
      { id: "C", text: "마을 사람들에게 전화를 걸었다" },
      { id: "D", text: "우체부에게 빨리 오라고 편지를 보냈다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 사흘째 아침에 할아버지가 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "두꺼운 외투를 입고 편지 보따리를 등에 졌다" },
      { id: "B", text: "우체국 안에서 난로를 피우고 기다렸다" },
      { id: "C", text: "이웃에게 편지 배달을 부탁했다" },
      { id: "D", text: "편지를 모두 창고에 넣어 두었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 할아버지가 직접 나선 이유는 무엇인가요?",
    choices: [
      { id: "A", text: "급한 소식을 기다리는 사람이 있을 거라고 생각했기 때문이다" },
      { id: "B", text: "우체국에 편지가 너무 많아 공간이 부족했기 때문이다" },
      { id: "C", text: "마을 이장이 배달을 명령했기 때문이다" },
      { id: "D", text: "산책을 겸해 운동하고 싶었기 때문이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 눈길을 걷는 할아버지의 모습은 어떠했나요?",
    choices: [
      { id: "A", text: "무릎까지 빠지는 눈길을 한 발 한 발 걸었다" },
      { id: "B", text: "눈이 거의 녹아 가벼운 발걸음으로 걸었다" },
      { id: "C", text: "자전거를 타고 빠르게 이동했다" },
      { id: "D", text: "마을 사람들이 길을 치워 주어 편하게 걸었다" }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장에서 편지를 받은 아주머니가 눈시울을 붉힌 까닭은 무엇인가요?",
    choices: [
      { id: "A", text: "눈 속에서 편지를 가져다준 할아버지에게 감사했기 때문이다" },
      { id: "B", text: "편지에 슬픈 소식이 적혀 있었기 때문이다" },
      { id: "C", text: "할아버지에게 화가 나서 눈물이 났기 때문이다" },
      { id: "D", text: "바깥 찬바람이 눈에 들어가서 눈물이 났기 때문이다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여덟째 문장에서 편지의 내용은 무엇이었나요?",
    choices: [
      { id: "A", text: "도시에서 일하는 아들이 곧 돌아오겠다는 소식이었다" },
      { id: "B", text: "도시에서 새 직장을 구했다는 소식이었다" },
      { id: "C", text: "먼 나라로 이민 간다는 소식이었다" },
      { id: "D", text: "마을에 새 우체국이 생긴다는 소식이었다" }
    ],
    answerId: "A"
  }
];

p2Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p2Questions[i].prompt,
      choices: p2Questions[i].choices,
      answerId: p2Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p2 전체 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p2", start: 0, end: paragraphs[1].text.length }] },
  question: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "눈이 길을 막자 할아버지가 직접 편지를 배달하러 나섰다" },
      { id: "B", text: "우체부가 와서 편지를 모두 가져갔다" },
      { id: "C", text: "마을 사람들이 함께 눈을 치우고 길을 열었다" },
      { id: "D", text: "눈이 녹을 때까지 아무도 편지를 받지 못했다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});
stepNum++;

// p3 문장별
const p3Sentences = sentenceRanges("p3");
const p3Questions = [
  {
    prompt: "첫 문장은 할아버지가 몇 통의 편지를 전했다고 하나요?",
    choices: [
      { id: "A", text: "열두 통의 편지를 모두 전했다" },
      { id: "B", text: "다섯 통만 전하고 나머지는 남겨 두었다" },
      { id: "C", text: "세 통만 전하고 돌아왔다" },
      { id: "D", text: "스무 통 이상의 편지를 전했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장에서 돌아오는 할아버지의 발걸음이 어떠했나요?",
    choices: [
      { id: "A", text: "해가 지고 눈이 내렸지만 아침보다 가벼웠다" },
      { id: "B", text: "피곤하여 거의 기다시피 했다" },
      { id: "C", text: "마을 사람이 업어서 돌아왔다" },
      { id: "D", text: "달리기를 하며 서둘러 돌아왔다" }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장에서 텅 빈 창구를 본 할아버지의 느낌은 어떠했나요?",
    choices: [
      { id: "A", text: "오히려 뿌듯하게 느껴졌다" },
      { id: "B", text: "허전하고 슬펐다" },
      { id: "C", text: "편지가 없어 화가 났다" },
      { id: "D", text: "무섭고 쓸쓸했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 할아버지가 돌아와 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "젖은 외투를 벗어 걸고 의자에 앉아 조용히 눈을 감았다" },
      { id: "B", text: "바로 저녁 식사를 차려 먹었다" },
      { id: "C", text: "마을 사람들에게 전화를 걸었다" },
      { id: "D", text: "다음 날 배달할 편지를 미리 정리했다" }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 대비되는 두 가지 이미지는 무엇인가요?",
    choices: [
      { id: "A", text: "밖의 하얀 눈과 안의 따뜻한 노란 전등이 대비된다" },
      { id: "B", text: "밖의 뜨거운 햇살과 안의 차가운 바람이 대비된다" },
      { id: "C", text: "밖의 꽃과 안의 낙엽이 대비된다" },
      { id: "D", text: "밖의 어둠과 안의 어둠이 같다고 말한다" }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 그날 밤 마을 사람들이 한 일은 무엇인가요?",
    choices: [
      { id: "A", text: "받은 편지를 펼쳐 놓고 가족의 안부를 소리 내어 읽었다" },
      { id: "B", text: "편지를 읽지 않고 서랍에 넣어 두었다" },
      { id: "C", text: "할아버지에게 답장을 바로 썼다" },
      { id: "D", text: "편지를 이웃과 바꿔 읽었다" }
    ],
    answerId: "A"
  }
];

p3Sentences.forEach((range, i) => {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [range] },
    question: {
      prompt: p3Questions[i].prompt,
      choices: p3Questions[i].choices,
      answerId: p3Questions[i].answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
});

// p3 전체 중심내용
timeline.push({
  stepId: `s${stepNum}`,
  highlight: { ranges: [{ paragraphId: "p3", start: 0, end: paragraphs[2].text.length }] },
  question: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      { id: "A", text: "배달을 마친 할아버지의 뿌듯함과 마을의 따뜻한 저녁을 보여 준다" },
      { id: "B", text: "할아버지가 우체국을 그만두기로 결심하는 장면이다" },
      { id: "C", text: "마을 사람들이 편지를 돌려보내는 장면이다" },
      { id: "D", text: "눈이 그쳐서 우체부가 도착하는 장면이다" }
    ],
    answerId: "A",
    scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
  }
});

// ─── 4. recall 카드 (8장) ───
const recall = {
  cards: [
    { id: "c1", text: "마을 어귀의 오래된 우체국은 낡았지만 마을 사람들에게 소중한 공간이었다." },
    { id: "c2", text: "할아버지는 편지를 손가락으로 짚어 읽고 '잘 가겠구먼' 하고 배웅하듯 중얼거렸다." },
    { id: "c3", text: "겨울에 큰 눈이 내려 길이 끊기자 우체부가 올 수 없어 편지가 쌓였다." },
    { id: "c4", text: "사흘째 되는 날, 할아버지는 직접 편지 보따리를 등에 지고 눈길을 걸었다." },
    { id: "c5", text: "첫 번째 집의 아주머니는 도시의 아들이 돌아온다는 편지를 받고 눈시울을 붉혔다." },
    { id: "c6", text: "할아버지는 마을을 돌며 열두 통의 편지를 모두 전했고, 돌아오는 발걸음은 가벼웠다." },
    { id: "c7", text: "텅 빈 창구를 본 할아버지는 오히려 뿌듯함을 느끼며 조용히 눈을 감았다." },
    { id: "c8", text: "그날 밤 마을 사람들은 받은 편지를 펼쳐 놓고 가족의 안부를 소리 내어 읽었다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ─── 5. confirm 문항 (7개) ───
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "우체국 안에서 늘 한 박자 느리게 깜박이던 것은 무엇인가요?",
      answerText: "노란 전등",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "노란 전등")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "할아버지가 편지를 부치는 사람에게 작게 중얼거린 말은 무엇인가요?",
      answerText: "잘 가겠구먼",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "잘 가겠구먼")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "길이 끊긴 원인은 무엇인가요?",
      answerText: "큰 눈",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "큰 눈이 내려 길이 끊겼다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "할아버지가 직접 나선 것은 눈이 내린 지 며칠째 되는 날인가요?",
      answerText: "사흘째",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "사흘째 되는 날")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "편지를 받은 아주머니의 아들은 어디에서 일하고 있었나요?",
      answerText: "도시",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "멀리 도시에서 일하는 아들")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "할아버지가 마을을 돌며 전한 편지는 모두 몇 통인가요?",
      answerText: "열두 통",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "열두 통의 편지를 모두 전했다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "그날 밤 마을 사람들이 편지에서 소리 내어 읽은 것은 무엇인가요?",
      answerText: "가족의 안부",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "가족의 안부를 소리 내어 읽었다")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ─── 6. 콘텐츠 조립 ───
const content = {
  contentId: "dr-f3-012",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(프레게 3) Day 12 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "FREGE_3",
  schoolGradeRange: { min: 6, max: 7 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 5, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// ─── 7. 배치 파일 업데이트 ───
const batchPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\generated\\daily-batch-reading-frege3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const dayIndex = 11; // 0-based index for Day 12
batch.items[dayIndex] = {
  content_type: "DAILY_READING",
  level_id: "FREGE_3",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 12,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');

// ─── 8. static 파일 업데이트 ───
const staticPath = path.join('C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지\\frontend\\public\\daily-reading\\frege3', '012.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');

const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log('Day 12 완료! 지문 길이:', totalLen, '자');
console.log('intensive steps:', timeline.length);
console.log('recall cards:', recall.cards.length);
console.log('confirm questions:', confirm.questions.length);
