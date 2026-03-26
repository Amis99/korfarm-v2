// 러셀2 Day 12 문학 - 일일독해 콘텐츠 생성
const fs = require('fs');
const path = require('path');

// ── 지문 (문학: 현대소설 - 황순원 「소나기」 일부 재구성) ──
const p1 = "소년은 개울가에서 소녀를 처음 보았다. 여름 햇살이 물 위에 잘게 부서져 반짝이던 오후였다. 소녀는 개울 건너편에 앉아 물속에 손을 넣었다 뺐다 하고 있었다. 소년은 소녀가 그렇게 하는 것이 궁금했지만, 모르는 척 멀리서 바라만 보았다. 그러다 하루는 소녀가 개울 둑 위에 앉아 무엇을 주워 모으고 있었다. 소년이 가만히 다가가 보니, 그것은 크고 작은 조약돌이었다. 소녀는 조약돌을 하나하나 물에 던져 보며 동그란 물결이 퍼져 나가는 것을 지그시 들여다보았다. 소년은 소녀의 그런 모습에서 어떤 쓸쓸함 같은 것을 느꼈다.";
const p2 = "다음 날 소년은 일부러 개울가로 갔다. 소녀는 어제와 같은 자리에 앉아 있었다. 소년은 조심스럽게 다가가 옆에 앉았다. 소녀는 고개를 살짝 들어 소년을 보더니 아무 말 없이 다시 물을 들여다보았다. 한동안 물소리만 두 사람 사이를 흘렀다. 소년은 주머니에서 집 앞 개울에서 주워 온 예쁜 조약돌 하나를 꺼내 소녀 앞에 조용히 놓았다. 소녀는 그것을 말없이 손에 쥐고 한참 동안 물끄러미 바라보았다. 어색한 침묵이 흐르다가, 소녀가 작은 목소리로 '고마워.'라고 말했다. 그 한마디에 소년의 귀가 발그레해졌다.";
const p3 = "그 뒤로 소년과 소녀는 개울가에서 종종 만났다. 소녀는 서울에서 온 아이였다. 아버지 사업이 잘 안 되어 시골 할머니 댁에 맡겨진 것이었다. 소녀는 말수가 적었지만, 가끔 서울 이야기를 할 때면 눈이 반짝였다. 높은 건물 사이로 바라본 노을이 예뻤다는 이야기를 할 때면 특히 그랬다. 소년은 그런 소녀에게 들판의 꽃 이름을 알려 주고, 냇물에 사는 물고기 잡는 법을 가르쳐 주었다. 소녀가 물고기를 처음 잡았을 때 두 손으로 꼭 쥔 채 웃는 얼굴을 소년은 오래도록 잊을 수 없었다. 그 웃음은 소녀의 얼굴에서 처음 본 환한 표정이었다.";
const p4 = "어느 날 갑자기 소나기가 쏟아졌다. 먹구름이 빠르게 밀려오더니 굵은 빗방울이 떨어지기 시작했다. 둘은 들판 한가운데서 비를 맞았다. 소년은 주변을 둘러보다가 낡은 수숫단 무더기를 발견하고 소녀의 손을 잡아끌었다. 수숫단 아래서 비를 피하면서 소년은 심장이 쿵쿵 뛰는 것을 느꼈다. 소녀는 젖은 머리카락을 쓸어 넘기며 웃었다. 빗소리가 사방을 감싸고, 풀 냄새가 코끝을 스치는 그 순간이 마치 세상 전부인 것 같았다. 비가 그친 뒤 들판 너머로 무지개가 걸렸다. 소녀가 무지개를 가리키며 '저거 정말 예쁘다.'라고 했을 때, 소년은 무지개보다 소녀의 눈이 더 빛나 보였다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log(`지문 총 글자 수: ${totalLen}`);
console.log(`p1: ${p1.length}, p2: ${p2.length}, p3: ${p3.length}, p4: ${p4.length}`);

// 인덱스 찾기 유틸
function fi(text, keyword) {
  const i = text.indexOf(keyword);
  if (i === -1) throw new Error(`"${keyword}" not found in text`);
  return { start: i, end: i + keyword.length };
}

// ── 정독 타임라인 ──
const timeline = [
  {
    stepId: "s1",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: fi(p1, "처음 보았다.").end }] },
    question: {
      prompt: "첫 문장에서 소년이 소녀를 처음 본 장소로 알맞은 것은?",
      choices: [
        { id: "A", text: "개울가이다." },
        { id: "B", text: "학교 운동장이다." },
        { id: "C", text: "마을 어귀이다." },
        { id: "D", text: "들판 한가운데이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s2",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "소녀는 개울 건너편").start, end: fi(p1, "있었다.").end }] },
    question: {
      prompt: "소녀가 물가에서 하고 있던 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "물속에 손을 넣었다 뺐다 하고 있었다." },
        { id: "B", text: "물고기를 잡고 있었다." },
        { id: "C", text: "빨래를 하고 있었다." },
        { id: "D", text: "수영을 하고 있었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s3",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "소년은 소녀가").start, end: fi(p1, "바라만 보았다.").end }] },
    question: {
      prompt: "소년이 소녀에 대해 취한 태도로 알맞은 것은?",
      choices: [
        { id: "A", text: "궁금했지만 모르는 척 멀리서 바라만 보았다." },
        { id: "B", text: "곧바로 다가가 말을 걸었다." },
        { id: "C", text: "관심이 없어 돌아서 갔다." },
        { id: "D", text: "친구들과 함께 놀러 갔다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s4",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "그러다 하루는").start, end: fi(p1, "들여다보았다.").end }] },
    question: {
      prompt: "소녀가 조약돌을 물에 던지며 한 행동에서 느껴지는 분위기로 알맞은 것은?",
      choices: [
        { id: "A", text: "조용하고 사색적인 분위기이다." },
        { id: "B", text: "활기차고 시끌벅적한 분위기이다." },
        { id: "C", text: "화가 나서 짜증을 내는 분위기이다." },
        { id: "D", text: "무섭고 긴장감이 도는 분위기이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s5",
    highlight: { ranges: [{ paragraphId: "p1", start: fi(p1, "소년은 소녀의 그런").start, end: fi(p1, "느꼈다.").end }] },
    question: {
      prompt: "소년이 소녀의 모습에서 느낀 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "어떤 쓸쓸함 같은 것을 느꼈다." },
        { id: "B", text: "신나고 즐거운 기분을 느꼈다." },
        { id: "C", text: "화가 치밀어 오르는 것을 느꼈다." },
        { id: "D", text: "두려움과 공포를 느꼈다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s6",
    highlight: { ranges: [{ paragraphId: "p1", start: 0, end: p1.length }] },
    question: {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "소년이 개울가에서 소녀를 처음 보고, 소녀의 쓸쓸해 보이는 모습에 이끌린다." },
        { id: "B", text: "소년과 소녀가 개울에서 함께 물고기를 잡는다." },
        { id: "C", text: "소녀가 소년에게 먼저 다가와 말을 건다." },
        { id: "D", text: "소년이 소녀에게 화를 내며 자리를 뜬다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s7",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: fi(p2, "앉아 있었다.").end }] },
    question: {
      prompt: "다음 날 소년이 개울가로 간 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "일부러 소녀를 만나러 간 것이다." },
        { id: "B", text: "물고기를 잡으려고 간 것이다." },
        { id: "C", text: "어머니의 심부름으로 간 것이다." },
        { id: "D", text: "길을 잃어서 우연히 간 것이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s8",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "소년은 주머니에서").start, end: fi(p2, "바라보았다.").end }] },
    question: {
      prompt: "소년이 소녀에게 준 것과 소녀의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "예쁜 조약돌을 주었고, 소녀는 말없이 한참 바라보았다." },
        { id: "B", text: "꽃다발을 주었고, 소녀는 크게 웃었다." },
        { id: "C", text: "물고기를 주었고, 소녀는 놀라서 도망갔다." },
        { id: "D", text: "편지를 주었고, 소녀는 바로 읽었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s9",
    highlight: { ranges: [{ paragraphId: "p2", start: fi(p2, "어색한 침묵이").start, end: fi(p2, "발그레해졌다.").end }] },
    question: {
      prompt: "소녀가 '고마워.'라고 말한 뒤 소년에게 나타난 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "귀가 발그레해졌다." },
        { id: "B", text: "큰 소리로 웃었다." },
        { id: "C", text: "그 자리에서 울었다." },
        { id: "D", text: "아무 반응이 없었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s10",
    highlight: { ranges: [{ paragraphId: "p2", start: 0, end: p2.length }] },
    question: {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "소년이 소녀에게 조약돌을 건네며 두 사람 사이에 작은 교감이 시작된다." },
        { id: "B", text: "소녀가 소년에게 서울 이야기를 자세히 들려준다." },
        { id: "C", text: "소년과 소녀가 크게 다투어 사이가 멀어진다." },
        { id: "D", text: "소녀가 마을을 떠나서 다시 만나지 못한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s11",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: fi(p3, "것이었다.").end }] },
    question: {
      prompt: "소녀가 시골에 오게 된 사연으로 알맞은 것은?",
      choices: [
        { id: "A", text: "아버지 사업이 잘 안 되어 할머니 댁에 맡겨졌다." },
        { id: "B", text: "학교 전학을 위해 자발적으로 왔다." },
        { id: "C", text: "방학 동안 놀러 온 것이다." },
        { id: "D", text: "병원 치료를 위해 시골로 왔다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s12",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "소녀는 말수가").start, end: fi(p3, "반짝였다.").end }] },
    question: {
      prompt: "소녀가 서울 이야기를 할 때 보이는 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "눈이 반짝였다." },
        { id: "B", text: "울음을 터뜨렸다." },
        { id: "C", text: "화를 내었다." },
        { id: "D", text: "말없이 고개를 숙였다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s13",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "소년은 그런 소녀에게").start, end: fi(p3, "주었다.").end }] },
    question: {
      prompt: "소년이 소녀에게 가르쳐 준 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "들판의 꽃 이름과 물고기 잡는 법이다." },
        { id: "B", text: "학교 공부와 글쓰기 방법이다." },
        { id: "C", text: "서울로 돌아가는 길이다." },
        { id: "D", text: "조약돌을 모으는 방법이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s14",
    highlight: { ranges: [{ paragraphId: "p3", start: fi(p3, "소녀가 물고기를").start, end: fi(p3, "표정이었다.").end }] },
    question: {
      prompt: "소녀가 물고기를 처음 잡았을 때의 표정을 소년이 어떻게 기억하는지 알맞은 것은?",
      choices: [
        { id: "A", text: "환한 웃음으로, 소년은 그 얼굴을 오래도록 잊을 수 없었다." },
        { id: "B", text: "놀란 표정으로, 소년은 곧 잊어버렸다." },
        { id: "C", text: "무표정으로, 소년은 실망했다." },
        { id: "D", text: "우는 얼굴로, 소년은 위로해 주었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s15",
    highlight: { ranges: [{ paragraphId: "p3", start: 0, end: p3.length }] },
    question: {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "소년과 소녀가 점차 가까워지며, 소녀의 사연과 환한 웃음이 드러난다." },
        { id: "B", text: "소녀가 시골 생활에 적응하지 못해 서울로 돌아간다." },
        { id: "C", text: "소년이 소녀에게 실망하여 더 이상 만나지 않는다." },
        { id: "D", text: "소녀의 아버지가 사업에 성공하여 온 가족이 기뻐한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s16",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: fi(p4, "잡아끌었다.").end }] },
    question: {
      prompt: "소나기가 쏟아졌을 때 소년이 취한 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "수숫단 무더기를 발견하고 소녀의 손을 잡아끌었다." },
        { id: "B", text: "비를 맞으며 그냥 서 있었다." },
        { id: "C", text: "혼자 뛰어서 집으로 돌아갔다." },
        { id: "D", text: "나무 위로 올라갔다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s17",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "수숫단 아래서").start, end: fi(p4, "같았다.").end }] },
    question: {
      prompt: "수숫단 아래에서 두 사람이 경험한 순간의 묘사로 알맞은 것은?",
      choices: [
        { id: "A", text: "빗소리와 풀 냄새 속에서 마치 세상 전부인 것 같은 순간이었다." },
        { id: "B", text: "추위에 떨면서 빨리 비가 그치기만을 바랐다." },
        { id: "C", text: "서로 다투면서 불편한 시간을 보냈다." },
        { id: "D", text: "아무 감흥 없이 조용히 앉아 있었다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s18",
    highlight: { ranges: [{ paragraphId: "p4", start: fi(p4, "비가 그친 뒤").start, end: fi(p4, "빛나 보였다.").end }] },
    question: {
      prompt: "비가 그친 뒤 소년이 무지개보다 더 빛나 보인다고 느낀 것은?",
      choices: [
        { id: "A", text: "소녀의 눈이다." },
        { id: "B", text: "들판의 꽃이다." },
        { id: "C", text: "젖은 수숫단이다." },
        { id: "D", text: "하늘의 구름이다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  },
  {
    stepId: "s19",
    highlight: { ranges: [{ paragraphId: "p4", start: 0, end: p4.length }] },
    question: {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "소나기 속에서 둘만의 특별한 순간을 경험하며, 소년의 마음이 깊어진다." },
        { id: "B", text: "소나기 때문에 둘이 다투고 사이가 멀어진다." },
        { id: "C", text: "소녀가 비를 맞아 아파서 병원에 간다." },
        { id: "D", text: "소년이 무지개를 보고 혼자 감탄한다." }
      ],
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  }
];

// ── 복기 카드 (정확히 8장) ──
const recall = {
  cards: [
    { id: "c1", text: "소년은 개울가에서 소녀를 처음 보고, 물가에서 조약돌을 던지는 소녀의 쓸쓸한 모습에 이끌렸다." },
    { id: "c2", text: "다음 날 소년은 일부러 개울가로 가서 소녀에게 예쁜 조약돌을 건넸다." },
    { id: "c3", text: "소녀가 '고마워.'라고 말하자 소년의 귀가 발그레해지며 교감이 시작되었다." },
    { id: "c4", text: "소녀는 아버지 사업 실패로 시골 할머니 댁에 맡겨진 서울 아이였다." },
    { id: "c5", text: "소년은 소녀에게 꽃 이름과 물고기 잡는 법을 알려 주었다." },
    { id: "c6", text: "소녀가 물고기를 처음 잡고 웃을 때의 환한 표정을 소년은 잊지 못했다." },
    { id: "c7", text: "소나기가 쏟아지자 소년은 수숫단 아래로 소녀를 이끌었고, 빗소리 속 순간이 특별했다." },
    { id: "c8", text: "비가 그친 뒤 무지개가 걸렸고, 소년은 무지개보다 소녀의 눈이 더 빛나 보였다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// ── 확인 문항 (7문항) ──
const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "지문에서 '조약돌'이라는 단어를 첫째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p1", start: fi(p1, "조약돌이었다").start, end: fi(p1, "조약돌이었다").start + 3 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "지문에서 소녀가 소년에게 처음 한 말을 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p2", start: fi(p2, "'고마워.'").start, end: fi(p2, "'고마워.'").end }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "지문에서 소년의 감정을 나타내는 '귀가 발그레해졌다'를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p2", start: fi(p2, "귀가 발그레해졌다").start, end: fi(p2, "귀가 발그레해졌다").end }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "지문에서 소녀가 시골에 오게 된 원인인 '사업'이라는 단어를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p3", start: fi(p3, "사업이").start, end: fi(p3, "사업이").start + 2 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "지문에서 비를 피한 장소인 '수숫단'이라는 단어를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", start: fi(p4, "수숫단 무더기").start, end: fi(p4, "수숫단 무더기").start + 3 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "지문에서 비가 그친 뒤 나타난 '무지개'라는 단어를 넷째 문단에서 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", start: fi(p4, "무지개가 걸렸다").start, end: fi(p4, "무지개가 걸렸다").start + 3 }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    },
    {
      id: "q7",
      prompt: "지문에서 '소녀의 눈이 더 빛나 보였다'를 찾아 클릭하세요.",
      answerRanges: [{ paragraphId: "p4", start: fi(p4, "소녀의 눈이 더 빛나 보였다").start, end: fi(p4, "소녀의 눈이 더 빛나 보였다").end }],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true,
      answerMatchMode: "ANY"
    }
  ]
};

// ── 최종 JSON ──
const content = {
  contentId: "dr-r2-012",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 12 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 480,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall,
    confirm
  }
};

// 검증
function verifyRanges(content) {
  const pMap = {};
  for (const p of content.payload.passage.paragraphs) pMap[p.id] = p.text;
  let errors = 0;
  for (const q of content.payload.confirm.questions) {
    for (const r of q.answerRanges) {
      const text = pMap[r.paragraphId];
      if (!text) { console.error(`없는 문단: ${r.paragraphId}`); errors++; continue; }
      const slice = text.substring(r.start, r.end);
      console.log(`[확인 ${q.id}] "${q.prompt.substring(0,30)}..." → [${r.start}:${r.end}] = "${slice}"`);
    }
  }
  for (const step of content.payload.intensive.timeline) {
    for (const r of step.highlight.ranges) {
      const text = pMap[r.paragraphId];
      if (r.end > text.length) { console.error(`[정독 ${step.stepId}] 범위 초과: ${r.end} > ${text.length}`); errors++; }
    }
  }
  if (errors === 0) console.log('\n모든 범위 검증 통과');
  else console.error(`\n${errors}개 오류`);
  return errors;
}

const errs = verifyRanges(content);

// 파일 쓰기
const staticDir = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2');
fs.writeFileSync(path.join(staticDir, '012.json'), JSON.stringify(content, null, 2), 'utf8');
console.log('static 파일 생성: 012.json');

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_2", area: "READING",
  sub_area: "LITERATURE", day_index: 12, module_key: "reading_training",
  schema_version: "1.0", content
};
const idx = batch.items.findIndex(i => i.day_index === 12 && i.level_id === "RUSSELL_2");
if (idx >= 0) { batch.items[idx] = batchItem; console.log(`배치 Day 12 교체`); }
else { batch.items.push(batchItem); console.log('배치 Day 12 추가'); }
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 갱신');

if (errs > 0) process.exit(1);
