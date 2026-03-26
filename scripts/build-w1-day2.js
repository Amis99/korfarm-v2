// 비트겐슈타인1 Day 2 문학 - 현대 소설 (중3~고1 수준)
// 황순원 '소나기' 감상 분석 지문 (직접 창작)

const p1 = "황순원의 단편 소설 '소나기'는 시골 마을을 배경으로 소년과 소녀의 순수한 만남과 이별을 그린 작품이다. 이 작품은 1953년에 발표되었으며, 간결한 문장과 서정적인 분위기로 많은 독자에게 사랑받아 왔다. 소년은 개울가에서 물장난을 치다가 윗마을에서 온 소녀를 처음 만나게 된다. 소녀는 분홍색 스웨터를 입고 징검다리를 건너는데, 소년은 그 모습을 멀리서 바라보기만 한다. 이 장면에서 작가는 소년의 수줍은 마음을 직접적으로 서술하지 않고, 소년이 소녀를 바라보는 시선과 행동만을 통해 간접적으로 드러낸다. 이러한 서술 방식은 독자가 소년의 감정을 스스로 추측하도록 유도하며, 작품에 여운을 더하는 효과를 지닌다.";
const p2 = "소년과 소녀가 함께 들판을 걸으며 꽃을 꺾고 조약돌을 주우며 시간을 보내는 장면은 이 소설의 중심부에 해당한다. 두 사람은 아직 사랑이 무엇인지 정확히 모르지만, 함께 있을 때 느끼는 설렘과 기쁨을 자연스럽게 나눈다. 작가는 들판의 코스모스와 메밀꽃, 수숫단 같은 자연물을 통해 두 사람의 감정을 상징적으로 표현한다. 특히 소나기가 쏟아지는 장면에서 소년이 소녀를 비로부터 보호하려는 행동은 소년의 마음이 단순한 호기심을 넘어 상대를 아끼는 감정으로 깊어졌음을 보여 준다. 비를 피해 수숫단 속에 함께 숨는 장면은 두 사람만의 닫힌 공간을 만들어 내며, 잠시나마 외부 세계와 단절된 친밀한 시간을 상징한다. 이처럼 자연 배경은 단순한 무대를 넘어 인물의 심리를 비추는 거울 역할을 한다.";
const p3 = "소설의 후반부에서 소녀의 가족이 마을을 떠난다는 소식이 전해지면서 이야기는 급격히 전환된다. 소년은 소녀가 떠난다는 사실을 받아들이지 못하고, 이전에 함께 걸었던 들판과 개울가를 배회하며 그리움에 잠긴다. 소년에게 그 장소들은 단순한 풍경이 아니라 소녀와의 추억이 깃든 공간이기 때문이다. 그리고 마침내 소녀가 병으로 세상을 떠났다는 소식이 전해진다. 소녀는 죽기 전에 자신이 입고 있던 옷을 그대로 묻어 달라는 유언을 남기는데, 그 옷은 소나기를 맞으며 소년과 함께했을 때 입었던 바로 그 옷이다. 이 유언은 소녀가 소년과 함께한 시간을 얼마나 소중하게 여겼는지를 보여 주는 결정적인 장치로 기능한다.";
const p4 = "이 작품이 오랫동안 사랑받는 이유는 인간의 순수한 감정을 담백하고 절제된 문체로 그려냈기 때문이다. 작가는 등장인물의 내면을 직접 설명하지 않고, 행동과 자연 풍경의 변화를 통해 감정의 흐름을 전달한다. 소나기라는 자연 현상은 갑작스럽게 다가와 순식간에 지나가는 것으로, 소년과 소녀의 짧고 강렬한 만남을 은유한다. 또한 소설 속 계절이 여름에서 가을로 바뀌는 것은 생명력 넘치는 만남이 이별과 상실로 이어지는 흐름을 자연스럽게 암시한다. 결국 '소나기'는 사랑과 상실이라는 보편적 주제를 자연과 인간의 관계 속에서 섬세하게 풀어내어 시대를 초월한 감동을 선사하는 작품이라 할 수 있다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("=== 지문 길이 검증 ===");
console.log(`p1: ${p1.length}자`);
console.log(`p2: ${p2.length}자`);
console.log(`p3: ${p3.length}자`);
console.log(`p4: ${p4.length}자`);
console.log(`합계: ${totalLen}자`);

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
  if (start < text.length) {
    sentences.push({ start, end: text.length, text: text.substring(start) });
  }
  return sentences;
}

for (const p of paragraphs) {
  const sents = findSentences(p.text);
  console.log(`\n=== ${p.id} 문장 분석 (${sents.length}개) ===`);
  sents.forEach((s, i) => {
    console.log(`  [${i}] start=${s.start}, end=${s.end}: "${s.text.substring(0, 50)}..."`);
  });
}

const p1Sents = findSentences(p1);
const p2Sents = findSentences(p2);
const p3Sents = findSentences(p3);
const p4Sents = findSentences(p4);

const timeline = [];
let stepNum = 1;

function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt,
      choices,
      answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// ===== p1 (6문장) =====
addStep("p1", p1Sents[0].start, p1Sents[0].end,
  "첫 문장이 소개하는 소설의 특징으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "시골 마을을 배경으로 소년과 소녀의 순수한 만남과 이별을 그린 작품이다." },
    { id: "B", text: "도시를 배경으로 성인 남녀의 사랑을 그린 장편 소설이다." },
    { id: "C", text: "전쟁을 배경으로 군인의 용기를 다룬 역사 소설이다." },
    { id: "D", text: "학교를 배경으로 친구 간의 갈등을 다룬 성장 소설이다." }
  ], "A");

addStep("p1", p1Sents[1].start, p1Sents[1].end,
  "둘째 문장이 전달하는 작품의 배경 정보로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "1953년에 발표되었으며 간결한 문장과 서정적 분위기로 사랑받아 왔다." },
    { id: "B", text: "1970년대에 발표되어 사회 비판적인 내용으로 주목받았다." },
    { id: "C", text: "일제 강점기에 발표되어 독립 의지를 담고 있다." },
    { id: "D", text: "2000년대에 발표되어 현대 도시 생활을 반영한다." }
  ], "A");

addStep("p1", p1Sents[2].start, p1Sents[2].end,
  "셋째 문장에서 소년이 소녀를 처음 만난 장소로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "개울가에서 물장난을 치다가 만나게 되었다." },
    { id: "B", text: "학교 운동장에서 공놀이를 하다가 만나게 되었다." },
    { id: "C", text: "마을 장터에서 물건을 사다가 만나게 되었다." },
    { id: "D", text: "산길을 걷다가 우연히 만나게 되었다." }
  ], "A");

addStep("p1", p1Sents[3].start, p1Sents[3].end,
  "넷째 문장에서 소녀가 징검다리를 건널 때의 모습으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "분홍색 스웨터를 입고 있었으며, 소년은 멀리서 바라보기만 했다." },
    { id: "B", text: "파란색 치마를 입고 있었으며, 소년이 먼저 말을 걸었다." },
    { id: "C", text: "하얀 원피스를 입고 있었으며, 소녀가 먼저 인사를 했다." },
    { id: "D", text: "노란색 모자를 쓰고 있었으며, 두 사람이 함께 건넜다." }
  ], "A");

addStep("p1", p1Sents[4].start, p1Sents[4].end,
  "다섯째 문장이 설명하는 작가의 서술 방식으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소년의 마음을 직접 서술하지 않고 시선과 행동으로 간접적으로 드러낸다." },
    { id: "B", text: "소년의 마음을 독백 형식으로 상세하게 서술한다." },
    { id: "C", text: "소녀의 입장에서 소년의 감정을 직접 설명한다." },
    { id: "D", text: "서술자가 소년의 내면을 분석적으로 해설한다." }
  ], "A");

addStep("p1", p1Sents[5].start, p1Sents[5].end,
  "마지막 문장이 말하는 이러한 서술 방식의 효과로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "독자가 소년의 감정을 스스로 추측하게 하여 작품에 여운을 더한다." },
    { id: "B", text: "독자가 소년의 감정을 정확하게 파악하여 혼란이 없어진다." },
    { id: "C", text: "독자가 작품의 결말을 미리 예측할 수 있게 한다." },
    { id: "D", text: "독자가 소녀의 감정에만 집중하게 하여 소년을 잊게 만든다." }
  ], "A");

// p1 문단 중심내용
addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "작가는 소년의 수줍은 마음을 간접적 서술로 드러내어 독자에게 여운을 남긴다." },
    { id: "B", text: "소년과 소녀가 처음 만나 바로 사랑에 빠졌다는 것을 설명한다." },
    { id: "C", text: "소녀가 소년에게 먼저 다가가는 장면을 분석한다." },
    { id: "D", text: "작가가 소년의 내면을 상세하게 독백으로 서술한다고 설명한다." }
  ], "A");

// ===== p2 (6문장) =====
addStep("p2", p2Sents[0].start, p2Sents[0].end,
  "첫 문장이 말하는 소설의 중심부 장면으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소년과 소녀가 들판을 걸으며 꽃을 꺾고 조약돌을 주우며 시간을 보내는 장면이다." },
    { id: "B", text: "소년이 혼자 산을 오르며 자연을 관찰하는 장면이다." },
    { id: "C", text: "소녀가 마을 사람들과 함께 축제를 즐기는 장면이다." },
    { id: "D", text: "소년과 소녀가 학교에서 공부하는 장면이다." }
  ], "A");

addStep("p2", p2Sents[1].start, p2Sents[1].end,
  "둘째 문장이 전달하는 두 사람의 감정 상태로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "사랑이 무엇인지 모르지만 함께 있을 때 느끼는 설렘과 기쁨을 나눈다." },
    { id: "B", text: "서로에 대한 사랑을 분명히 알고 고백을 준비한다." },
    { id: "C", text: "서로에게 무관심하여 각자 다른 활동을 한다." },
    { id: "D", text: "서로 경쟁하며 누가 더 많은 꽃을 꺾는지 겨룬다." }
  ], "A");

addStep("p2", p2Sents[2].start, p2Sents[2].end,
  "셋째 문장이 말하는 작가의 표현 방식으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "코스모스, 메밀꽃, 수숫단 같은 자연물로 감정을 상징적으로 표현한다." },
    { id: "B", text: "두 사람의 대화를 통해 감정을 직접적으로 전달한다." },
    { id: "C", text: "서술자의 해설을 통해 감정을 분석적으로 설명한다." },
    { id: "D", text: "등장인물의 일기를 인용하여 내면을 보여 준다." }
  ], "A");

addStep("p2", p2Sents[3].start, p2Sents[3].end,
  "넷째 문장에서 소나기 장면이 보여 주는 소년의 감정 변화로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "단순한 호기심을 넘어 상대를 아끼는 감정으로 깊어졌음을 보여 준다." },
    { id: "B", text: "소녀에 대한 관심이 완전히 사라졌음을 보여 준다." },
    { id: "C", text: "소년이 비를 무서워하여 도망치려는 모습을 보여 준다." },
    { id: "D", text: "소년이 소녀보다 자연 현상에 더 관심을 가지게 되었음을 보여 준다." }
  ], "A");

addStep("p2", p2Sents[4].start, p2Sents[4].end,
  "다섯째 문장에서 수숫단 속에 숨는 장면이 상징하는 바로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "외부 세계와 단절된 두 사람만의 친밀한 시간을 상징한다." },
    { id: "B", text: "두 사람이 비를 피하기 위해 어쩔 수 없이 머문 것을 뜻한다." },
    { id: "C", text: "소년이 소녀에게 화가 나서 숨는 것을 뜻한다." },
    { id: "D", text: "두 사람이 서로 멀어지기 시작하는 것을 상징한다." }
  ], "A");

addStep("p2", p2Sents[5].start, p2Sents[5].end,
  "마지막 문장이 말하는 자연 배경의 역할로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "단순한 무대를 넘어 인물의 심리를 비추는 거울 역할을 한다." },
    { id: "B", text: "이야기의 배경을 아름답게 꾸미는 장식적 역할만 한다." },
    { id: "C", text: "독자에게 지리적 정보를 전달하는 역할을 한다." },
    { id: "D", text: "등장인물의 대화를 대신하는 역할을 한다." }
  ], "A");

// p2 문단 중심내용
addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "들판과 소나기 장면을 통해 두 사람의 감정이 점차 깊어지는 과정을 자연물로 상징적으로 표현한다." },
    { id: "B", text: "소년과 소녀가 처음 만나는 장면을 상세하게 묘사한다." },
    { id: "C", text: "소녀가 마을을 떠나는 장면의 슬픔을 분석한다." },
    { id: "D", text: "소년이 혼자 들판에서 꽃을 관찰하는 모습을 서술한다." }
  ], "A");

// ===== p3 (6문장) =====
addStep("p3", p3Sents[0].start, p3Sents[0].end,
  "첫 문장이 전달하는 이야기 전환의 계기로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소녀의 가족이 마을을 떠난다는 소식이 전해지면서 이야기가 급격히 전환된다." },
    { id: "B", text: "소년이 다른 마을로 이사를 가게 되면서 이야기가 전환된다." },
    { id: "C", text: "소녀가 소년에게 화를 내면서 이야기가 갈등 구조로 바뀐다." },
    { id: "D", text: "새로운 등장인물이 나타나면서 이야기의 배경이 바뀐다." }
  ], "A");

addStep("p3", p3Sents[1].start, p3Sents[1].end,
  "둘째 문장이 묘사하는 소년의 행동으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소녀가 떠난다는 사실을 받아들이지 못하고 함께 걸었던 곳을 배회하며 그리움에 잠긴다." },
    { id: "B", text: "소녀가 떠나는 것을 담담하게 받아들이고 일상으로 돌아간다." },
    { id: "C", text: "소녀를 찾아 다른 마을까지 따라간다." },
    { id: "D", text: "소녀의 가족에게 떠나지 말라고 부탁한다." }
  ], "A");

addStep("p3", p3Sents[2].start, p3Sents[2].end,
  "셋째 문장이 설명하는 장소의 의미로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소년에게 그 장소들은 소녀와의 추억이 깃든 공간이다." },
    { id: "B", text: "소년에게 그 장소들은 평범한 일상의 공간일 뿐이다." },
    { id: "C", text: "소년에게 그 장소들은 불쾌한 기억이 남아 있는 곳이다." },
    { id: "D", text: "소년에게 그 장소들은 새로운 친구를 만나는 곳이다." }
  ], "A");

addStep("p3", p3Sents[3].start, p3Sents[3].end,
  "넷째 문장에서 전해지는 비극적 소식으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소녀가 병으로 세상을 떠났다는 소식이다." },
    { id: "B", text: "소녀가 다른 마을에서 잘 지내고 있다는 소식이다." },
    { id: "C", text: "소년이 병에 걸렸다는 소식이다." },
    { id: "D", text: "소녀의 가족이 다시 마을로 돌아온다는 소식이다." }
  ], "A");

addStep("p3", p3Sents[4].start, p3Sents[4].end,
  "다섯째 문장에서 소녀의 유언의 내용으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "입고 있던 옷을 그대로 묻어 달라는 것이며, 그 옷은 소나기 때 입었던 옷이다." },
    { id: "B", text: "소년에게 편지를 전해 달라는 것이다." },
    { id: "C", text: "자신의 물건을 모두 소년에게 주라는 것이다." },
    { id: "D", text: "마을로 다시 돌아가고 싶다는 것이다." }
  ], "A");

addStep("p3", p3Sents[5].start, p3Sents[5].end,
  "마지막 문장이 말하는 유언의 의미로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소녀가 소년과 함께한 시간을 얼마나 소중하게 여겼는지를 보여 주는 장치이다." },
    { id: "B", text: "소녀가 옷에 대한 집착이 강했음을 보여 주는 장치이다." },
    { id: "C", text: "소녀의 가족이 가난했음을 암시하는 장치이다." },
    { id: "D", text: "소년에 대한 원망을 간접적으로 표현하는 장치이다." }
  ], "A");

// p3 문단 중심내용
addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "소녀의 이별과 죽음, 그리고 유언을 통해 두 사람의 만남이 지닌 소중함이 드러난다." },
    { id: "B", text: "소년이 소녀를 잊고 새로운 생활을 시작하는 과정을 다룬다." },
    { id: "C", text: "소녀의 가족이 마을을 떠나는 이유를 자세히 설명한다." },
    { id: "D", text: "소년과 소녀가 다시 만나 행복하게 살게 되는 과정을 서술한다." }
  ], "A");

// ===== p4 (5문장) =====
addStep("p4", p4Sents[0].start, p4Sents[0].end,
  "첫 문장이 말하는 이 작품이 사랑받는 이유로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "인간의 순수한 감정을 담백하고 절제된 문체로 그려냈기 때문이다." },
    { id: "B", text: "화려하고 장식적인 문체로 감정을 풍부하게 표현했기 때문이다." },
    { id: "C", text: "역사적 사건을 정확하게 기록했기 때문이다." },
    { id: "D", text: "등장인물이 매우 많아 다양한 이야기를 담고 있기 때문이다." }
  ], "A");

addStep("p4", p4Sents[1].start, p4Sents[1].end,
  "둘째 문장이 설명하는 작가의 감정 전달 방식으로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "등장인물의 내면을 직접 설명하지 않고 행동과 자연 풍경으로 전달한다." },
    { id: "B", text: "등장인물의 내면을 독백으로 상세하게 설명한다." },
    { id: "C", text: "서술자가 감정을 직접 분석하여 독자에게 전한다." },
    { id: "D", text: "등장인물 간의 대화로만 감정을 전달한다." }
  ], "A");

addStep("p4", p4Sents[2].start, p4Sents[2].end,
  "셋째 문장에서 '소나기'라는 자연 현상이 은유하는 바로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "갑작스럽게 다가와 순식간에 지나가는 소년과 소녀의 짧고 강렬한 만남을 은유한다." },
    { id: "B", text: "오래도록 지속되는 소년과 소녀의 우정을 은유한다." },
    { id: "C", text: "소년이 비를 좋아하게 되는 성격 변화를 은유한다." },
    { id: "D", text: "소녀의 밝고 활발한 성격을 은유한다." }
  ], "A");

addStep("p4", p4Sents[3].start, p4Sents[3].end,
  "넷째 문장에서 계절의 변화가 암시하는 바로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "생명력 넘치는 만남이 이별과 상실로 이어지는 흐름을 암시한다." },
    { id: "B", text: "두 사람의 만남이 더욱 행복해지는 과정을 암시한다." },
    { id: "C", text: "소년이 성장하여 어른이 되는 과정을 암시한다." },
    { id: "D", text: "마을의 풍경이 더 아름다워지는 것을 암시한다." }
  ], "A");

addStep("p4", p4Sents[4].start, p4Sents[4].end,
  "마지막 문장이 전달하는 작품의 종합적 평가로 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "사랑과 상실이라는 보편적 주제를 자연과 인간의 관계 속에서 섬세하게 풀어낸 작품이다." },
    { id: "B", text: "특정 시대의 역사적 사건만을 다루어 현대에는 공감하기 어려운 작품이다." },
    { id: "C", text: "유머와 풍자를 중심으로 사회를 비판하는 작품이다." },
    { id: "D", text: "복잡한 줄거리와 많은 등장인물로 추리 소설의 성격을 지닌 작품이다." }
  ], "A");

// p4 문단 중심내용
addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  [
    { id: "A", text: "절제된 문체와 자연 은유를 통해 사랑과 상실이라는 보편적 주제를 시대를 초월하여 전달하는 작품이다." },
    { id: "B", text: "작가가 등장인물의 내면을 직접 설명하여 독자가 쉽게 이해할 수 있는 작품이다." },
    { id: "C", text: "소나기라는 자연 현상의 과학적 원리를 설명하는 작품이다." },
    { id: "D", text: "소년이 소녀를 잊고 새로운 사랑을 시작하는 과정을 담은 작품이다." }
  ], "A");

console.log(`\n정독 스텝 수: ${timeline.length}`);

// 복기 카드 8장
const recallCards = [
  { id: "c1", text: "황순원의 '소나기'는 시골 마을을 배경으로 소년과 소녀의 순수한 만남과 이별을 그린 단편 소설이다." },
  { id: "c2", text: "작가는 소년의 마음을 직접 서술하지 않고 시선과 행동으로 간접 표현하여 독자에게 여운을 남긴다." },
  { id: "c3", text: "들판에서 꽃을 꺾고 조약돌을 주우며 보내는 시간 속에 두 사람의 설렘이 자연물로 상징된다." },
  { id: "c4", text: "소나기 장면에서 소녀를 보호하려는 소년의 행동은 감정이 깊어졌음을 보여 준다." },
  { id: "c5", text: "소녀의 가족이 떠나고, 소년은 함께 걸었던 곳을 배회하며 그리움에 잠긴다." },
  { id: "c6", text: "소녀는 소나기를 맞을 때 입었던 옷을 그대로 묻어 달라는 유언을 남긴다." },
  { id: "c7", text: "소나기라는 자연 현상은 갑작스럽고 짧은 만남을, 계절 변화는 이별과 상실을 은유한다." },
  { id: "c8", text: "'소나기'는 절제된 문체로 사랑과 상실이라는 보편적 주제를 시대를 초월하여 전달하는 작품이다." }
];

// 확인학습 문항
function findInParagraph(pId, pText, answerText) {
  const idx = pText.indexOf(answerText);
  if (idx === -1) {
    console.error(`*** "${answerText}" not found in ${pId}!`);
    return { paragraphId: pId, start: 0, end: 0 };
  }
  return { paragraphId: pId, start: idx, end: idx + answerText.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "작가가 소년의 수줍은 마음을 드러내는 데 사용한 방식은 무엇인가요?", answerText: "시선과 행동", pId: "p1", pText: p1, answerMatchMode: "ANY" },
  { id: "q2", prompt: "작가가 두 사람의 감정을 상징적으로 표현하기 위해 활용한 소재는 무엇인가요?", answerText: "자연물", pId: "p2", pText: p2, answerMatchMode: "ANY" },
  { id: "q3", prompt: "소나기 장면에서 소년의 감정이 어떤 수준으로 깊어졌나요?", answerText: "상대를 아끼는 감정", pId: "p2", pText: p2, answerMatchMode: "ANY" },
  { id: "q4", prompt: "소녀가 떠난 후 소년이 배회하며 느끼는 감정은 무엇인가요?", answerText: "그리움", pId: "p3", pText: p3, answerMatchMode: "ANY" },
  { id: "q5", prompt: "소녀가 죽기 전에 남긴 유언의 핵심 내용은 무엇인가요?", answerText: "옷을 그대로 묻어 달라", pId: "p3", pText: p3, answerMatchMode: "ANY" },
  { id: "q6", prompt: "작가가 등장인물의 감정을 전달하는 데 사용한 것은 행동과 무엇의 변화인가요?", answerText: "자연 풍경", pId: "p4", pText: p4, answerMatchMode: "ANY" },
  { id: "q7", prompt: "소나기라는 자연 현상이 은유하는 것은 소년과 소녀의 어떤 만남인가요?", answerText: "짧고 강렬한 만남", pId: "p4", pText: p4, answerMatchMode: "ANY" },
  { id: "q8", prompt: "이 작품이 다루는 보편적 주제는 사랑과 무엇인가요?", answerText: "상실", pId: "p4", pText: p4, answerMatchMode: "ANY" }
];

const confirmQuestionsWithRanges = confirmQuestions.map(q => {
  const range = findInParagraph(q.pId, q.pText, q.answerText);
  console.log(`확인 ${q.id}: "${q.answerText}" → ${q.pId}[${range.start}:${range.end}] = "${q.pText.substring(range.start, range.end)}"`);
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode,
    answerRanges: [range],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

// 최종 JSON 조립
const content = {
  contentId: "dr-w1-002",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 2 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1",
  schoolGradeRange: { min: 9, max: 10 },
  area: "READING",
  subArea: "LITERATURE",
  competencies: ["READING"],
  tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300,
  assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: {
      cards: recallCards,
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
      seedPenalty: 1
    },
    confirm: { questions: confirmQuestionsWithRanges }
  }
};

// 파일 출력
const fs = require('fs');
const path = require('path');

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '002.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n정적 파일 저장: ${staticPath}`);

// 배치 항목
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "WITTGENSTEIN_1",
  area: "READING",
  sub_area: "LITERATURE",
  day_index: 2,
  module_key: "reading_training",
  schema_version: "1.0",
  content: content
};

// 배치 파일 업데이트
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[1] = batchItem;
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 파일 업데이트: ${batchPath}`);

// 최종 검증
console.log("\n=== 최종 검증 ===");
console.log(`지문 길이: ${totalLen}자 (목표: 1350~1450)`);
console.log(`정독 스텝: ${timeline.length}개`);
console.log(`복기 카드: ${recallCards.length}개 (목표: 8)`);
console.log(`확인 문항: ${confirmQuestionsWithRanges.length}개 (목표: 5~10)`);
console.log(`길이 적합: ${totalLen >= 1350 && totalLen <= 1450 ? 'OK' : 'FAIL'}`);
console.log(`복기 적합: ${recallCards.length === 8 ? 'OK' : 'FAIL'}`);
console.log(`확인 적합: ${confirmQuestionsWithRanges.length >= 5 && confirmQuestionsWithRanges.length <= 10 ? 'OK' : 'FAIL'}`);
