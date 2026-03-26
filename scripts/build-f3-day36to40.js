#!/usr/bin/env node
// 프레게3 Day 36~40 일일독해 콘텐츠 빌더
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH_PATH = path.join(ROOT, 'generated/daily-batch-reading-frege3.json');
const STATIC_DIR = path.join(ROOT, 'frontend/public/daily-reading/frege3');

function findSentences(text) {
  const sentences = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && (i === text.length - 1 || text[i+1] === ' ' || text[i+1] === '\n')) {
      sentences.push({ start, end: i + 1, text: text.substring(start, i + 1) });
      let next = i + 1;
      while (next < text.length && text[next] === ' ') next++;
      start = next;
    }
  }
  if (start < text.length) sentences.push({ start, end: text.length, text: text.substring(start) });
  return sentences;
}

function findRange(paragraphs, pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  if (!para) throw new Error(`문단 ${pid}를 찾을 수 없습니다.`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}: "${para.text.substring(0,50)}..."`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

function charLen(paragraphs) {
  return paragraphs.reduce((sum, p) => sum + p.text.length, 0);
}

function hashIdx(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function truncate(text, maxLen) {
  return text.length > maxLen ? text.substring(0, maxLen) : text;
}

function shuffleChoices(correct, wrongs, seed) {
  const items = [correct, ...wrongs.slice(0, 3)];
  const pos = hashIdx(seed) % 4;
  if (pos !== 0) { const temp = items[0]; items[0] = items[pos]; items[pos] = temp; }
  const ids = ["A", "B", "C", "D"];
  const list = items.map((text, i) => ({ id: ids[i], text }));
  const answerId = ids[items.indexOf(correct)];
  return { list, answerId };
}

function buildTimeline(paragraphs) {
  const timeline = [];
  let stepNum = 1;
  const paraSentMap = {};
  for (const p of paragraphs) paraSentMap[p.id] = findSentences(p.text);

  for (const para of paragraphs) {
    const sentences = paraSentMap[para.id];
    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const correctText = truncate(sent.text, 80);
      const wrongTexts = [];
      const otherParas = paragraphs.filter(p => p.id !== para.id);
      for (let oi = 0; oi < otherParas.length && wrongTexts.length < 3; oi++) {
        const opSents = paraSentMap[otherParas[oi].id];
        const idx = (si + oi) % opSents.length;
        wrongTexts.push(truncate(opSents[idx].text, 80));
      }
      const choices = shuffleChoices(correctText, wrongTexts, `s${stepNum}`);
      timeline.push({
        stepId: `s${stepNum++}`,
        highlight: { ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }] },
        question: {
          prompt: "하이라이트된 문장의 내용으로 알맞은 것은?",
          choices: choices.list, answerId: choices.answerId,
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
    const firstSent = sentences[0];
    const centralCorrect = truncate(firstSent.text, 80);
    const centralWrongs = [];
    const otherParas = paragraphs.filter(p => p.id !== para.id);
    for (const op of otherParas) centralWrongs.push(truncate(paraSentMap[op.id][0].text, 80));
    const centralChoices = shuffleChoices(centralCorrect, centralWrongs, para.id + "_central");
    timeline.push({
      stepId: `s${stepNum++}`,
      highlight: { ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }] },
      question: {
        prompt: "이 문단의 중심 내용으로 가장 적절한 것은?",
        choices: centralChoices.list, answerId: centralChoices.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }
  return timeline;
}

function buildRecallCards(paragraphs, cardCount) {
  const fullText = paragraphs.map(p => p.text).join('\n');
  const totalLen = fullText.length;
  const chunkSize = Math.ceil(totalLen / cardCount);
  const cards = [];
  const correctOrder = [];
  for (let i = 0; i < cardCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLen);
    const cardText = fullText.substring(start, end);
    const cardId = `c${i + 1}`;
    cards.push({ id: cardId, text: cardText });
    correctOrder.push(cardId);
  }
  return { cards, correctOrder, seedPenalty: 1 };
}

function assembleFull(dayIndex, subArea, subAreaKo, paragraphs, confirmQuestions) {
  const timeline = buildTimeline(paragraphs);
  const recall = buildRecallCards(paragraphs, 8);
  const dayStr = String(dayIndex).padStart(3, '0');
  return {
    contentId: `dr-f3-${dayStr}`,
    contentType: "DAILY_READING", version: 1, status: "PUBLISHED",
    title: `일일 독해(프레게 3) Day ${dayIndex} ${subAreaKo}`,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: "FREGE_3",
    schoolGradeRange: { min: 6, max: 7 },
    area: "READING", subArea,
    competencies: ["READING"], tags: ["daily"],
    access: { mode: "FREE" },
    seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
    timeLimitSec: 480, assets: {},
    payload: {
      passage: { format: "TEXT", paragraphs },
      intensive: { timeline }, recall,
      confirm: { questions: confirmQuestions }
    }
  };
}

function wrapBatchItem(content, dayIndex, subArea) {
  return {
    content_type: "DAILY_READING", level_id: "FREGE_3",
    area: "READING", sub_area: subArea,
    day_index: dayIndex, module_key: "reading_training",
    schema_version: "1.0", content
  };
}

// ─── Day 36: 문학 (LITERATURE) - 할머니의 텃밭 가꾸기 (생활문) ───
function buildDay36() {
  const paragraphs = [
    {
      id: "p1",
      text: "할머니네 집 뒤편에는 소박한 텃밭이 하나 있다. 봄이 오면 할머니는 새벽부터 호미를 들고 밭으로 나가신다. 겨울 동안 단단하게 굳어진 흙을 일구고, 잡풀을 뽑아내는 일은 결코 쉽지 않지만, 할머니는 힘든 기색 하나 없이 콧노래를 부르며 정성스럽게 흙을 뒤집으신다. 할머니는 늘 이렇게 말씀하셨다. 흙은 살아 있는 것이니까, 정성을 들이면 반드시 보답한다고. 나는 어릴 때 그 말뜻을 잘 몰랐지만, 해마다 텃밭에서 싱싱하게 자라나는 채소를 보면서 조금씩 이해하게 되었다. 할머니의 손은 거칠고 투박했지만, 그 손이 어루만지는 것마다 새로운 생명이 피어나는 것 같았다."
    },
    {
      id: "p2",
      text: "여름이 되면 텃밭은 싱그러운 초록빛으로 가득 찼다. 상추는 넓고 두툼한 잎사귀를 활짝 펼치고, 고추는 빨갛게 익어가며, 토마토는 탐스럽게 가지마다 매달려 있었다. 할머니는 아침마다 양동이에 물을 길어 와 채소 하나하나에 물을 주시면서 다정하게 말을 거셨다. 잘 자라고 있구나, 오늘도 힘내렴 하고 속삭이시는 할머니의 모습이 처음에는 우습기도 했지만, 나중에는 나도 자연스럽게 따라 하게 되었다. 비가 많이 내리는 날에는 할머니가 텃밭 걱정에 잠을 이루지 못하셨다. 빗물이 고여 채소의 뿌리가 썩을 수 있기 때문이다. 할머니에게 텃밭은 단순한 농사가 아니라, 매일 돌보아야 하는 소중한 가족 같은 존재였다."
    },
    {
      id: "p3",
      text: "가을이 되면 할머니는 수확한 채소를 이웃들에게 아낌없이 나누어 주셨다. 커다란 바구니에 배추와 무를 가득 담아 이웃집 대문 앞에 놓아두시곤 했다. 받는 사람들은 고마워하며 자기 집에서 만든 떡이나 과일을 답례로 가져다주었다. 그렇게 텃밭은 할머니와 이웃을 이어 주는 다리 역할을 했다. 올해 나는 처음으로 할머니를 도와 감자를 캐 보았다. 흙 속에서 동그란 감자가 하나씩 모습을 드러낼 때마다 보물을 찾은 것처럼 가슴이 두근거렸다. 할머니는 환하게 웃으시며 말씀하셨다. 네가 정성 들여 물을 준 감자란다 하고. 그 순간, 내가 준 물과 햇빛이 감자가 되어 되돌아온 것 같아 가슴 한켠이 뭉클하게 벅차올랐다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "할머니가 봄에 텃밭에서 하시는 일은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "겨울 동안 단단하게 굳어진 흙을 일구고, 잡풀을 뽑아내는 일은 결코 쉽지 않지만")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "할머니는 흙에 대해 어떤 말씀을 하셨는가?",
      answerRanges: [findRange(paragraphs, "p1", "흙은 살아 있는 것이니까, 정성을 들이면 반드시 보답한다고.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "비가 많이 오는 날 할머니가 걱정하신 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "빗물이 고여 채소의 뿌리가 썩을 수 있기 때문이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "할머니에게 텃밭은 어떤 존재였는가?",
      answerRanges: [findRange(paragraphs, "p2", "매일 돌보아야 하는 소중한 가족 같은 존재였다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "텃밭이 할머니와 이웃 사이에서 하는 역할은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "텃밭은 할머니와 이웃을 이어 주는 다리 역할을 했다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "글쓴이가 감자를 캘 때 느낀 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "내가 준 물과 햇빛이 감자가 되어 되돌아온 것 같아 가슴 한켠이 뭉클하게 벅차올랐다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(36, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 37: 비문학 (NONFICTION) - 식물의 광합성 과정 (생물) ───
function buildDay37() {
  const paragraphs = [
    {
      id: "p1",
      text: "식물은 동물처럼 먹이를 찾아다니지 않고도 스스로 양분을 만들어 살아간다. 이것을 가능하게 하는 과정이 바로 광합성이다. 광합성은 주로 식물의 잎에서 일어나는데, 잎 속에 들어 있는 엽록체라는 작은 세포 기관이 핵심적인 역할을 담당한다. 엽록체 안에는 엽록소라는 초록색 색소가 들어 있어서 태양의 빛 에너지를 효과적으로 흡수한다. 이렇게 흡수된 빛 에너지는 뿌리에서 올라온 물 분자를 분해하는 데 사용되며, 이 과정에서 산소가 생성되어 기공을 통해 공기 중으로 방출된다. 우리가 매일 숨 쉴 때 들이마시는 산소의 대부분은 바로 식물의 광합성을 통해 만들어진 것이다."
    },
    {
      id: "p2",
      text: "광합성의 다음 단계에서는 이산화탄소가 중요한 재료로 활용된다. 식물은 잎 뒷면에 촘촘히 분포하고 있는 기공이라는 작은 구멍을 통해 공기 속의 이산화탄소를 빨아들인다. 이 이산화탄소는 앞 단계에서 만들어진 화학 에너지와 결합하여 포도당이라는 영양분으로 전환된다. 포도당은 식물이 줄기를 뻗고 꽃을 피우고 열매를 맺는 데 반드시 필요한 에너지원이다. 사용하고 남은 포도당은 녹말의 형태로 변환되어 뿌리나 줄기, 열매 속에 차곡차곡 저장된다. 우리가 먹는 쌀, 감자, 고구마 같은 음식에 녹말이 풍부한 것은 식물이 광합성을 통해 만든 양분을 저장해 두었기 때문이다."
    },
    {
      id: "p3",
      text: "광합성이 원활하게 일어나려면 세 가지 조건이 충족되어야 한다. 첫째, 충분한 양의 햇빛이 필요하다. 빛이 약하면 에너지가 부족하여 광합성 속도가 현저히 느려진다. 둘째, 알맞은 온도가 유지되어야 한다. 너무 춥거나 너무 더우면 엽록체 속의 효소가 제대로 작동하지 못하게 된다. 셋째, 적당한 양의 이산화탄소와 물이 공급되어야 한다. 이 세 가지 조건 가운데 어느 하나라도 부족하면 광합성의 효율이 크게 떨어지게 된다. 이처럼 광합성은 식물뿐 아니라 지구 위의 모든 생물에게 없어서는 안 될 매우 중요한 과정이다. 광합성이 없다면 대기 중의 산소도 줄어들고 먹이 사슬의 바탕이 되는 양분도 사라지기 때문이다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "광합성에서 핵심적인 역할을 하는 세포 기관은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "잎 속에 들어 있는 엽록체라는 작은 세포 기관이 핵심적인 역할을 담당한다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "광합성에서 산소가 만들어지는 과정은 어떠한가?",
      answerRanges: [findRange(paragraphs, "p1", "흡수된 빛 에너지는 뿌리에서 올라온 물 분자를 분해하는 데 사용되며, 이 과정에서 산소가 생성되어 기공을 통해 공기 중으로 방출된다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "식물은 이산화탄소를 어디에서 어떻게 흡수하는가?",
      answerRanges: [findRange(paragraphs, "p2", "식물은 잎 뒷면에 촘촘히 분포하고 있는 기공이라는 작은 구멍을 통해 공기 속의 이산화탄소를 빨아들인다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "남는 포도당은 어떤 형태로 어디에 저장되는가?",
      answerRanges: [findRange(paragraphs, "p2", "사용하고 남은 포도당은 녹말의 형태로 변환되어 뿌리나 줄기, 열매 속에 차곡차곡 저장된다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "광합성이 잘 일어나기 위한 세 가지 조건은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "충분한 양의 햇빛이 필요하다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "광합성이 없으면 어떤 문제가 생기는가?",
      answerRanges: [findRange(paragraphs, "p3", "광합성이 없다면 대기 중의 산소도 줄어들고 먹이 사슬의 바탕이 되는 양분도 사라지기 때문이다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(37, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 38: 문학 (LITERATURE) - 비 오는 날 길 잃은 강아지 (동화풍 소설) ───
function buildDay38() {
  const paragraphs = [
    {
      id: "p1",
      text: "비가 억수같이 쏟아지던 토요일 오후, 수진이는 학원을 마치고 집으로 돌아가는 길이었다. 우산을 쓰고 있었지만 바람이 세차게 불어서 옷자락이 금세 젖어 들었다. 빨리 집에 가고 싶은 마음에 걸음을 재촉하던 수진이는 골목 모퉁이에서 낮고 가느다란 울음소리를 들었다. 쓰레기통 옆에 작은 강아지 한 마리가 온몸이 젖은 채로 부들부들 떨고 있었다. 하얀 털에 갈색 반점이 있는 강아지였는데, 눈이 크고 무척 슬퍼 보였다. 수진이는 차마 강아지를 그냥 지나칠 수가 없었다. 우산을 강아지 쪽으로 기울인 뒤 조심스럽게 손을 내밀어 머리를 쓰다듬어 주었다."
    },
    {
      id: "p2",
      text: "강아지는 처음에 겁을 먹은 듯 뒷걸음질을 쳤지만, 수진이가 부드러운 목소리로 다정하게 말을 건네자 조금씩 다가왔다. 수진이는 가방에서 간식으로 가져온 빵 조각을 꺼내 강아지에게 내밀었다. 강아지는 코를 벌름거리더니 조심스럽게 빵을 받아 먹었다. 수진이는 강아지를 두 팔로 안아 품에 넣고 비를 맞으며 집으로 향했다. 집에 도착하자 엄마가 놀라셨다. 어머, 이 강아지는 대체 어디서 온 거니 하고 물으셨다. 수진이는 비를 맞으며 떨고 있어서 그냥 놔둘 수가 없었다고 대답했다. 엄마는 잠시 고민하시더니 일단 따뜻한 수건으로 강아지를 잘 닦아 주자고 하셨다."
    },
    {
      id: "p3",
      text: "다음 날 아침, 수진이는 강아지 주인을 찾기 위해 동네를 돌아다녔다. 전봇대마다 강아지 사진을 붙이고 문구점 아주머니와 편의점 사장님께도 여쭤보았다. 이틀이 지나자 한 아저씨에게서 전화가 왔다. 아저씨는 강아지 이름이 뽀미라며, 산책 중에 목줄이 풀려서 놓쳤다고 했다. 수진이가 뽀미를 돌려주자 아저씨는 고개를 깊이 숙여 감사의 인사를 전했다. 수진이는 뽀미가 아저씨 품에서 신나게 꼬리를 흔드는 모습을 보며 마음이 따뜻해졌다. 집으로 돌아오는 길에 수진이는 생각했다. 작은 도움이라도 누군가에게는 아주 큰 힘이 될 수 있다는 것을. 그날부터 수진이는 동네 유기 동물 봉사 활동에 참여하기로 마음먹었다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "수진이가 강아지를 발견한 상황은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p1", "쓰레기통 옆에 작은 강아지 한 마리가 온몸이 젖은 채로 부들부들 떨고 있었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "수진이가 강아지에게 처음 한 행동은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "우산을 강아지 쪽으로 기울인 뒤 조심스럽게 손을 내밀어 머리를 쓰다듬어 주었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "강아지가 수진이에게 다가오게 된 계기는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "수진이가 부드러운 목소리로 다정하게 말을 건네자 조금씩 다가왔다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "수진이는 강아지 주인을 찾기 위해 무엇을 했는가?",
      answerRanges: [findRange(paragraphs, "p3", "전봇대마다 강아지 사진을 붙이고 문구점 아주머니와 편의점 사장님께도 여쭤보았다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "수진이가 뽀미를 돌려주며 느낀 감정은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "뽀미가 아저씨 품에서 신나게 꼬리를 흔드는 모습을 보며 마음이 따뜻해졌다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "이 경험을 통해 수진이가 결심한 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "수진이는 동네 유기 동물 봉사 활동에 참여하기로 마음먹었다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(38, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── Day 39: 비문학 (NONFICTION) - 우리나라 전통 한옥의 과학적 원리 (건축/과학) ───
function buildDay39() {
  const paragraphs = [
    {
      id: "p1",
      text: "한옥은 우리나라의 전통 가옥으로, 자연환경에 맞추어 지혜롭게 설계된 건축물이다. 한옥의 가장 큰 특징 가운데 하나는 온돌과 마루를 함께 갖추고 있다는 점이다. 온돌은 바닥 아래에 불길이 지나가는 통로를 만들어 방 전체를 고르게 따뜻하게 데우는 난방 방식이다. 아궁이에서 땔감을 태우면 뜨거운 연기가 바닥 밑 구들장 사이를 지나가면서 돌과 흙에 열을 전달한다. 이 열은 구들장에 저장되어 불을 꺼도 오랫동안 따뜻함이 유지된다. 이처럼 온돌은 열을 저장하고 천천히 내보내는 축열 원리를 이용한 것으로, 추운 겨울에도 매우 효과적으로 실내 온도를 유지해 준다."
    },
    {
      id: "p2",
      text: "마루는 온돌과 반대로 여름의 더위를 이겨 내기 위해 만들어진 개방된 공간이다. 마루는 땅바닥에서 한 뼘 이상 높이 띄워져 있어서 바닥 아래로 시원한 바람이 자유롭게 지나갈 수 있다. 이 구조 덕분에 무더운 여름에도 마루에 앉으면 자연스레 시원한 바람을 느낄 수 있다. 또한 한옥의 처마는 계절에 따라 들어오는 햇빛의 양을 절묘하게 조절하는 역할을 한다. 여름에는 태양이 높이 떠서 길게 뻗은 처마가 강한 햇빛을 효과적으로 막아 주고, 겨울에는 태양이 낮게 떠서 햇빛이 처마 아래를 통과하여 방 안까지 깊숙이 들어온다. 이렇게 한옥은 처마의 길이만으로도 계절에 맞게 빛과 열을 자연스럽게 조절하는 것이다."
    },
    {
      id: "p3",
      text: "한옥에 사용되는 건축 재료 역시 과학적 원리와 깊은 관련이 있다. 벽에 바르는 황토는 습기를 머금었다가 건조할 때 서서히 내보내는 성질이 있어서 실내 습도를 쾌적한 수준으로 유지해 준다. 한지로 만든 창호지 역시 미세한 구멍이 촘촘하게 나 있어 공기가 자연스럽게 드나들면서 환기가 이루어진다. 나무 기둥과 돌 기초도 서로 단단히 맞물려 지진의 충격을 흡수하는 구조로 설계되어 있다. 이처럼 한옥은 나무, 돌, 흙, 종이 같은 자연 재료를 적절히 활용하여 쾌적한 생활 환경을 만들어 냈다. 오늘날에도 한옥의 이러한 과학적 원리를 현대 건축 기술에 응용하려는 연구가 활발히 진행되고 있다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "온돌은 어떤 원리로 방을 따뜻하게 하는가?",
      answerRanges: [findRange(paragraphs, "p1", "아궁이에서 땔감을 태우면 뜨거운 연기가 바닥 밑 구들장 사이를 지나가면서 돌과 흙에 열을 전달한다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "온돌이 이용하는 과학적 원리는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "온돌은 열을 저장하고 천천히 내보내는 축열 원리를 이용한 것으로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "마루가 여름에 시원한 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "마루는 땅바닥에서 한 뼘 이상 높이 띄워져 있어서 바닥 아래로 시원한 바람이 자유롭게 지나갈 수 있다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "한옥의 처마는 계절별로 어떤 기능을 하는가?",
      answerRanges: [findRange(paragraphs, "p2", "여름에는 태양이 높이 떠서 길게 뻗은 처마가 강한 햇빛을 효과적으로 막아 주고, 겨울에는 태양이 낮게 떠서 햇빛이 처마 아래를 통과하여 방 안까지 깊숙이 들어온다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "황토 벽이 실내 환경에 도움이 되는 이유는 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "황토는 습기를 머금었다가 건조할 때 서서히 내보내는 성질이 있어서 실내 습도를 쾌적한 수준으로 유지해 준다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "창호지가 자연 환기에 도움이 되는 까닭은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "한지로 만든 창호지 역시 미세한 구멍이 촘촘하게 나 있어 공기가 자연스럽게 드나들면서 환기가 이루어진다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(39, "NONFICTION", "비문학", paragraphs, confirmQuestions);
}

// ─── Day 40: 문학 (LITERATURE) - 시골 장터에서 만난 아저씨 (수필) ───
function buildDay40() {
  const paragraphs = [
    {
      id: "p1",
      text: "지난여름 방학에 시골 외할머니 댁에 놀러 갔을 때의 일이다. 외할머니께서 오일장이 서는 날이니 함께 가자고 하셔서 설레는 마음으로 따라나섰다. 장터에 도착하니 좁은 길 양옆으로 좌판이 빼곡하게 늘어서 있었다. 싱싱한 채소, 반짝이는 생선, 알록달록한 떡과 과일이 가득 놓여 있었다. 사람들은 서로 안부를 묻고 값을 깎으며 정겨운 웃음꽃을 피웠다. 도시의 번쩍이는 대형 마트에서는 도저히 느끼기 어려운 사람 사이의 따뜻한 온기가 물씬 풍겼다. 나는 신기한 눈으로 이곳저곳을 구경하며 천천히 걸었다. 그때 한쪽 구석에서 부채를 정성스럽게 만들고 계신 아저씨의 모습이 눈에 들어왔다."
    },
    {
      id: "p2",
      text: "아저씨는 대나무를 잘 드는 칼로 얇게 쪼개어 부채의 뼈대를 만들고, 거기에 한지를 풀로 꼼꼼하게 붙이고 계셨다. 손놀림이 어찌나 빠르고 정확한지 마치 오래 숙련된 마술사의 손짓을 보는 것 같았다. 내가 신기해하며 가까이 다가가 쳐다보자 아저씨는 환하게 웃으며 이리 와서 가까이 구경하라고 하셨다. 아저씨는 이 일을 사십 년 넘게 해 오셨다고 했다. 요즘은 에어컨과 선풍기가 있으니 부채를 찾는 사람이 많이 줄었지만, 그래도 사람의 손으로 직접 만든 물건에는 기계가 결코 흉내 낼 수 없는 정성이 담겨 있다고 말씀하셨다. 아저씨의 거친 손등에는 오랜 세월의 흔적이 깊이 새겨져 있었다."
    },
    {
      id: "p3",
      text: "아저씨는 나에게 부채 하나를 기념으로 선물해 주셨다. 대나무 향이 은은하게 나는 부채를 부치니 바람이 시원하면서도 한결 부드러웠다. 외할머니께서는 그 아저씨가 이 동네에서 마지막으로 남은 부채 장인이시라고 조용히 말씀해 주셨다. 집으로 돌아온 뒤에도 그 부채를 부칠 때마다 장터의 활기차고 북적거리는 소리와 아저씨의 너그러운 웃음이 생생하게 떠올랐다. 나는 깨달았다. 오래된 기술과 물건 속에는 사람의 이야기와 따뜻한 마음이 함께 살아 숨 쉬고 있다는 것을. 그 부채는 여전히 내 책상 위에 놓여 있고, 바라볼 때마다 시골 장터에서의 그 아름다운 하루가 한 편의 그림처럼 선명하게 그려진다."
    }
  ];

  const confirmQuestions = [
    {
      id: "q1",
      prompt: "글쓴이가 장터에서 도시 마트와 다르게 느낀 점은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p1", "도시의 번쩍이는 대형 마트에서는 도저히 느끼기 어려운 사람 사이의 따뜻한 온기가 물씬 풍겼다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q2",
      prompt: "아저씨가 부채를 만드는 과정은 어떠했는가?",
      answerRanges: [findRange(paragraphs, "p2", "대나무를 잘 드는 칼로 얇게 쪼개어 부채의 뼈대를 만들고, 거기에 한지를 풀로 꼼꼼하게 붙이고 계셨다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q3",
      prompt: "아저씨가 손으로 만든 물건에 대해 한 말은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p2", "사람의 손으로 직접 만든 물건에는 기계가 결코 흉내 낼 수 없는 정성이 담겨 있다고 말씀하셨다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q4",
      prompt: "그 아저씨는 동네에서 어떤 존재인가?",
      answerRanges: [findRange(paragraphs, "p3", "그 아저씨가 이 동네에서 마지막으로 남은 부채 장인이시라고 조용히 말씀해 주셨다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q5",
      prompt: "글쓴이가 이 경험을 통해 깨달은 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "오래된 기술과 물건 속에는 사람의 이야기와 따뜻한 마음이 함께 살아 숨 쉬고 있다는 것을.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    },
    {
      id: "q6",
      prompt: "부채를 부칠 때마다 글쓴이가 떠올리는 것은 무엇인가?",
      answerRanges: [findRange(paragraphs, "p3", "장터의 활기차고 북적거리는 소리와 아저씨의 너그러운 웃음이 생생하게 떠올랐다.")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true, answerMatchMode: "ANY"
    }
  ];

  return assembleFull(40, "LITERATURE", "문학", paragraphs, confirmQuestions);
}

// ─── 메인 실행 ───
function main() {
  console.log("=== 프레게3 Day 36~40 빌드 시작 ===\n");

  const contents = [
    buildDay36(),
    buildDay37(),
    buildDay38(),
    buildDay39(),
    buildDay40()
  ];

  // 검증
  let hasWarning = false;
  for (const c of contents) {
    const len = c.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
    const dayNum = parseInt(c.contentId.split('-')[2]);
    if (len < 950 || len > 1050) {
      console.warn(`경고: Day ${dayNum} 글자수 ${len}자 (범위: 950~1050)`);
      hasWarning = true;
    } else {
      console.log(`Day ${dayNum}: ${len}자 (적합)`);
    }

    if (c.payload.recall.cards.length !== 8) {
      console.warn(`경고: Day ${dayNum} 복기 카드 ${c.payload.recall.cards.length}장 (8장 필요)`);
      hasWarning = true;
    }

    const qCount = c.payload.confirm.questions.length;
    if (qCount < 5 || qCount > 8) {
      console.warn(`경고: Day ${dayNum} 확인 문항 ${qCount}개 (5~8개 필요)`);
      hasWarning = true;
    }
  }

  if (hasWarning) {
    console.warn("\n경고가 있지만 파일은 생성합니다.\n");
  } else {
    console.log("\n모든 검증 통과!\n");
  }

  // static 파일 생성
  if (!fs.existsSync(STATIC_DIR)) {
    fs.mkdirSync(STATIC_DIR, { recursive: true });
  }

  for (const c of contents) {
    const dayNum = parseInt(c.contentId.split('-')[2]);
    const dayStr = String(dayNum).padStart(3, '0');
    const filePath = path.join(STATIC_DIR, `${dayStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(c, null, 2), 'utf8');
    console.log(`생성: ${dayStr}.json`);
  }

  // 배치 파일 갱신
  console.log("\n배치 파일 갱신 중...");
  const batchData = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
  console.log(`현재 배치 items 수: ${batchData.items.length}`);

  // items 배열이 부족하면 확장
  while (batchData.items.length < 40) {
    batchData.items.push(null);
  }

  const dayIndices = [36, 37, 38, 39, 40];
  for (let i = 0; i < contents.length; i++) {
    const dayIdx = dayIndices[i];
    const batchIdx = dayIdx - 1; // items[35]~items[39]
    const subArea = contents[i].subArea;
    const batchItem = wrapBatchItem(contents[i], dayIdx, subArea);

    if (batchData.items[batchIdx] && batchData.items[batchIdx].content) {
      console.log(`교체: items[${batchIdx}] (${batchData.items[batchIdx].content.contentId} → ${contents[i].contentId})`);
    } else {
      console.log(`추가: items[${batchIdx}] (${contents[i].contentId})`);
    }
    batchData.items[batchIdx] = batchItem;
  }

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batchData, null, 2), 'utf8');
  console.log(`배치 파일 저장 완료 (총 ${batchData.items.length}개 아이템)`);

  console.log("\n=== 빌드 완료 ===");
}

main();
