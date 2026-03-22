// 비트겐슈타인1 Day 8 문학(LITERATURE) - 현대시 감상 (고1~고2, 1400±50자)
// 주제: 고향을 그리워하는 마음 (정지용 '향수' 모티프 참조 재작성)
const fs = require('fs');
const path = require('path');

const p1 = "넓은 들판 가득 익어 가는 벼 이삭 사이로 선선한 바람이 불어왔다. 논둑에 앉아 그 바람을 가만히 맞으면 코끝에 흙냄새와 볏짚 냄새가 뒤섞여 들어왔다. 그것은 유년 시절 고향 마을의 가을이었다. 할아버지는 새벽이면 낫을 어깨에 걸치고 논으로 나가셨고, 할머니는 부엌에서 갓 지은 밥 위에 김이 모락모락 피어오르게 하셨다. 저녁이면 마당에 멍석을 깔고 온 가족이 둘러앉아 수확한 곡식의 양을 가늠하며 이야기꽃을 피웠다. 그때의 가을은 풍요로움 그 자체였으며, 사람과 사람 사이에 따뜻한 정이 넘치는 평화로운 계절이었다. 돌아갈 수 없는 그 시간이 기억 속에서는 여전히 황금빛으로 반짝이며 빛나고 있었다.";
const p2 = "고향을 떠나온 것은 열여섯 살 봄이었다. 도시에서 더 넓은 세상을 보겠다는 꿈을 품고 완행 기차에 올랐을 때, 차창 밖으로 스쳐 지나가는 논밭과 산등성이가 점점 작아지는 것을 바라보며 마음 한구석이 시리게 저려 왔다. 도시에 도착해 보니 높은 건물과 끊임없이 달리는 자동차, 쏟아지는 사람들의 물결 속에서 모든 것이 숨 가쁘게 돌아갔다. 그 속도에 적응하느라 눈코 뜰 새 없이 바쁜 나날을 보냈지만, 밤이 되어 좁은 방에 혼자 누우면 고향의 넓은 하늘과 쏟아지는 별빛이 선명하게 떠올라 가슴이 먹먹해지곤 했다. 특히 가을바람이 불기 시작하면, 수확 철 들녘의 황금빛 풍경이 눈앞에 아른거려 좀처럼 잠들 수가 없었다.";
const p3 = "세월이 흘러 어느덧 머리에 서리가 내릴 나이가 되었다. 그동안 도시에서의 삶은 어느 정도 자리를 잡고 안정되었지만, 고향에 대한 그리움만큼은 세월이 아무리 지나도 옅어지지 않았다. 오히려 나이가 들수록 유년 시절의 기억이 더욱 또렷하게 되살아나는 것이 신기하기까지 했다. 할아버지가 논둑에 서서 먼 산을 바라보시던 넓은 뒷모습, 할머니가 부엌에서 불러 주시던 노래 한 자락, 마당에 깔린 멍석 위에서 별을 하나씩 세던 밤이 모두 어제 일처럼 생생했다. 이제는 할아버지도 할머니도 안 계시고, 마을의 논밭도 절반 이상 공터로 변해 버렸다는 소식을 듣고는 한참을 멍하니 앉아 있을 수밖에 없었다.";
const p4 = "그래도 나는 올가을에 고향에 다녀오기로 마음먹었다. 비록 예전의 풍경이 그대로 남아 있지 않더라도, 그 땅을 두 발로 밟으면 발바닥으로 전해지는 흙의 감촉만으로도 마음이 놓일 것 같았다. 논둑에 서서 바람을 맞으면, 비록 벼 이삭은 줄었을지언정 흙냄새만큼은 예전과 다름없이 변하지 않았을 것이다. 나는 그곳에서 할아버지와 할머니가 오랜 세월에 걸쳐 남기신 따뜻한 온기를 다시 한번 느끼고 싶었다. 고향은 돌아갈 수 없는 시간이 아니라, 언제든 발걸음을 옮기면 지친 마음을 어루만져 주는 장소라는 것을 이제야 비로소 깨달았다. 비록 풍경은 달라졌더라도 그곳의 흙과 바람에 서린 사람들의 정은 쉽게 사라지지 않을 것이며, 그 정이 남아 있는 한 고향은 영원히 내 마음속에 살아 있을 것이다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = p1.length + p2.length + p3.length + p4.length;
console.log("=== 지문 길이 검증 ===");
console.log(`p1: ${p1.length}자, p2: ${p2.length}자, p3: ${p3.length}자, p4: ${p4.length}자`);
console.log(`합계: ${totalLen}자`);
if (totalLen < 1350 || totalLen > 1450) console.error(`경고: 목표 범위(1400±50) 벗어남!`);

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

function findRange(pid, searchText) {
  const para = paragraphs.find(p => p.id === pid);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}" not found in ${pid}`);
  return { paragraphId: pid, start, end: start + searchText.length };
}

const p1S = findSentences(p1), p2S = findSentences(p2), p3S = findSentences(p3), p4S = findSentences(p4);
for (const p of paragraphs) {
  const s = findSentences(p.text);
  console.log(`\n${p.id}: ${s.length}문장`);
  s.forEach((x,i) => console.log(`  [${i}] ${x.start}-${x.end}: "${x.text.substring(0,40)}..."`));
}

const timeline = [];
let sn = 1;
function addStep(pId, start, end, prompt, choices, answerId) {
  timeline.push({
    stepId: `s${sn++}`,
    highlight: { ranges: [{ paragraphId: pId, start, end }] },
    question: {
      prompt, choices: choices.map((t,i) => ({ id: ["A","B","C","D"][i], text: t })),
      answerId, scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// === p1 정독 (7문장) ===
addStep("p1", p1S[0].start, p1S[0].end,
  "첫 문장이 그려내는 풍경으로 알맞은 것은 무엇인가요?",
  ["넓은 들판에 벼 이삭이 익어 가고 그 사이로 바람이 불어오는 모습이다.", "눈 덮인 들판에 찬바람이 부는 겨울 풍경이다.", "봄비가 내려 논에 물이 차오르는 모습이다.", "여름 햇살에 꽃이 활짝 피어 있는 정원이다."], "A");

addStep("p1", p1S[1].start, p1S[1].end,
  "둘째 문장에서 화자가 느끼는 감각으로 알맞은 것은 무엇인가요?",
  ["코끝에 흙냄새와 볏짚 냄새가 뒤섞여 들어오는 후각적 경험이다.", "눈에 보이는 화려한 색채의 시각적 경험이다.", "귀에 들리는 새소리의 청각적 경험이다.", "손끝으로 느끼는 차가운 바람의 촉각적 경험이다."], "A");

addStep("p1", p1S[2].start, p1S[2].end,
  "셋째 문장에서 알 수 있는 시간적 배경으로 알맞은 것은 무엇인가요?",
  ["유년 시절 고향 마을의 가을이다.", "현재 화자가 살고 있는 도시의 봄이다.", "성인이 된 후 처음 방문한 고향의 여름이다.", "학창 시절 수학여행을 간 바닷가의 겨울이다."], "A");

addStep("p1", p1S[3].start, p1S[4].end,
  "넷째, 다섯째 문장이 묘사하는 가족의 모습으로 알맞은 것은 무엇인가요?",
  ["할아버지는 논으로, 할머니는 부엌에서 일하고, 저녁이면 온 가족이 모여 이야기를 나누었다.", "온 가족이 도시로 떠나기 위해 짐을 싸고 있었다.", "할아버지만 논에서 일하고 나머지 가족은 쉬고 있었다.", "가족이 각자 방에서 텔레비전을 보고 있었다."], "A");

addStep("p1", p1S[5].start, p1S[5].end,
  "여섯째 문장이 전달하는 당시 가을의 의미로 알맞은 것은 무엇인가요?",
  ["풍요로움 그 자체이며 사람들 사이에 따뜻한 정이 넘치던 계절이었다.", "수확할 것이 없어 가난하고 힘든 계절이었다.", "이웃 간의 갈등이 심했던 어두운 계절이었다.", "추위가 일찍 찾아와 모두가 힘들어하던 계절이었다."], "A");

addStep("p1", p1S[6].start, p1S[6].end,
  "마지막 문장에서 '황금빛으로 빛나고 있었다'가 의미하는 것으로 알맞은 것은 무엇인가요?",
  ["돌아갈 수 없는 시간이지만 기억 속에서는 여전히 아름답고 소중하게 남아 있다.", "실제로 금으로 된 장식물이 마을에 있었다.", "기억이 흐려져 아무것도 떠오르지 않는다.", "그 시절을 잊고 싶어 애쓰고 있다."], "A");

addStep("p1", 0, p1.length,
  "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["유년 시절 고향의 풍요로운 가을과 가족의 따뜻한 정을 아름다운 기억으로 간직하고 있다.", "고향의 가을은 추하고 힘든 기억으로 남아 있다.", "화자는 고향에서 가족과 함께 도시로 이사했다.", "고향 마을에는 논밭이 전혀 없었다."], "A");

// === p2 정독 (5문장) ===
addStep("p2", p2S[0].start, p2S[0].end,
  "첫 문장이 전달하는 사건으로 알맞은 것은 무엇인가요?",
  ["열여섯 살 봄에 고향을 떠났다.", "스무 살에 고향으로 돌아왔다.", "어린 시절 내내 도시에서 살았다.", "고향을 떠난 적이 없다."], "A");

addStep("p2", p2S[1].start, p2S[1].end,
  "둘째 문장에서 화자가 느낀 감정으로 알맞은 것은 무엇인가요?",
  ["차창 밖 풍경이 작아지는 것을 보며 마음 한구석이 시리게 저려 왔다.", "새로운 도시에 대한 기대감으로 마음이 들떠 있었다.", "기차 안에서 잠이 와서 아무 감정도 느끼지 못했다.", "고향을 떠나는 것이 기뻐서 웃음이 나왔다."], "A");

addStep("p2", p2S[2].start, p2S[2].end,
  "셋째 문장이 묘사하는 도시의 모습으로 알맞은 것은 무엇인가요?",
  ["높은 건물, 달리는 자동차, 수많은 사람들 사이에서 모든 것이 빠르게 돌아갔다.", "도시는 고향보다 조용하고 한적한 곳이었다.", "도시에는 건물이 없고 넓은 논밭만 있었다.", "도시의 속도가 고향과 같아 적응이 쉬웠다."], "A");

addStep("p2", p2S[3].start, p2S[3].end,
  "넷째 문장에서 밤마다 화자에게 떠오르는 것으로 알맞은 것은 무엇인가요?",
  ["고향의 넓은 하늘이 떠올라 가슴이 먹먹해졌다.", "도시의 화려한 야경이 떠올라 행복했다.", "직장 업무가 떠올라 스트레스를 받았다.", "아무것도 생각나지 않아 편안히 잠들었다."], "A");

addStep("p2", p2S[4].start, p2S[4].end,
  "마지막 문장이 전달하는 화자의 심경으로 알맞은 것은 무엇인가요?",
  ["가을바람이 불면 수확 철 황금빛 풍경이 눈앞에 아른거려 잠들기 어려웠다.", "가을이 되면 도시 생활에 완전히 적응하여 고향 생각이 사라졌다.", "가을바람은 화자에게 아무런 감정을 불러일으키지 않았다.", "가을이 오면 고향보다 도시가 더 그리워졌다."], "A");

addStep("p2", 0, p2.length,
  "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["도시로 떠난 화자가 바쁜 생활 속에서도 고향을 그리워하며 외로움을 느끼고 있다.", "화자는 도시에 완벽하게 적응하여 고향을 전혀 생각하지 않는다.", "화자는 도시가 싫어서 바로 고향으로 돌아갔다.", "도시 생활이 고향보다 훨씬 평화롭고 행복했다."], "A");

// === p3 정독 (5문장) ===
addStep("p3", p3S[0].start, p3S[0].end,
  "첫 문장이 전달하는 화자의 현재 상황으로 알맞은 것은 무엇인가요?",
  ["세월이 흘러 머리에 서리가 내릴 정도로 나이가 들었다.", "아직 젊어서 고향 생각이 별로 나지 않는다.", "최근에야 고향을 처음 떠났다.", "머리가 까맣고 건강한 청년 시절이다."], "A");

addStep("p3", p3S[1].start, p3S[2].end,
  "둘째, 셋째 문장이 전달하는 내용으로 알맞은 것은 무엇인가요?",
  ["도시 생활은 안정되었지만 고향 그리움은 줄지 않았고, 오히려 나이 들수록 기억이 더렷해졌다.", "세월이 지나자 고향에 대한 그리움이 완전히 사라졌다.", "도시 생활이 불안정하여 고향으로 돌아갔다.", "나이가 들자 유년 시절의 기억을 모두 잊어버렸다."], "A");

addStep("p3", p3S[3].start, p3S[3].end,
  "넷째 문장이 나열하는 구체적 기억으로 알맞은 것은 무엇인가요?",
  ["할아버지의 뒷모습, 할머니의 노래, 멍석 위에서 별을 세던 밤 등이다.", "도시에서 친구들과 놀던 추억이다.", "학교에서 시험을 보던 기억이다.", "직장에서 성공을 거두던 순간이다."], "A");

addStep("p3", p3S[4].start, p3S[4].end,
  "마지막 문장에서 화자가 알게 된 고향의 변화로 알맞은 것은 무엇인가요?",
  ["할아버지와 할머니가 돌아가시고 마을 논밭의 절반 이상이 공터로 변했다.", "고향이 더욱 번영하여 큰 도시가 되었다.", "논밭이 늘어나 마을이 더욱 풍요로워졌다.", "할아버지와 할머니가 도시로 이사 오셨다."], "A");

addStep("p3", 0, p3.length,
  "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["나이가 들수록 고향 기억이 선명해지지만, 이미 고향의 풍경과 사람들이 사라져 안타까워하고 있다.", "화자는 고향에 대한 기억을 완전히 잊었다.", "고향은 예전 그대로 변하지 않았다.", "도시 생활에 만족하여 고향을 생각하지 않는다."], "A");

// === p4 정독 (6문장) ===
addStep("p4", p4S[0].start, p4S[0].end,
  "첫 문장이 전달하는 화자의 결심으로 알맞은 것은 무엇인가요?",
  ["올가을에 고향을 다녀오기로 마음먹었다.", "고향에 절대 돌아가지 않겠다고 결심했다.", "도시를 떠나 다른 나라로 이민을 가기로 했다.", "고향 대신 관광지를 여행하기로 했다."], "A");

addStep("p4", p4S[1].start, p4S[1].end,
  "둘째 문장에서 화자가 기대하는 것으로 알맞은 것은 무엇인가요?",
  ["발바닥으로 전해지는 흙의 감촉만으로도 마음이 편안해질 것이라는 기대이다.", "예전 풍경이 그대로 남아 있을 것이라는 확신이다.", "고향에 가면 새로운 건물들이 반길 것이라는 기대이다.", "고향의 땅이 모두 콘크리트로 뒤덮여 있을 것이라는 예상이다."], "A");

addStep("p4", p4S[2].start, p4S[2].end,
  "셋째 문장에서 변하지 않았을 것이라 믿는 것으로 알맞은 것은 무엇인가요?",
  ["벼 이삭은 줄었을지라도 흙냄새만큼은 그대로일 것이라는 믿음이다.", "벼 이삭이 이전보다 더 많이 자랐을 것이라는 기대이다.", "논둑이 완전히 사라졌을 것이라는 걱정이다.", "바람 자체가 불지 않을 것이라는 우려이다."], "A");

addStep("p4", p4S[3].start, p4S[3].end,
  "넷째 문장에서 화자가 느끼고 싶은 것으로 알맞은 것은 무엇인가요?",
  ["할아버지와 할머니가 남기신 따뜻한 온기를 다시 느끼고 싶다.", "도시의 세련된 분위기를 고향에서도 느끼고 싶다.", "고향에서 새로운 사업을 시작하고 싶다.", "할아버지와 할머니를 잊어버리고 싶다."], "A");

addStep("p4", p4S[4].start, p4S[4].end,
  "다섯째 문장에서 화자가 깨달은 것으로 알맞은 것은 무엇인가요?",
  ["고향은 돌아갈 수 없는 시간이 아니라 언제든 마음을 어루만져 주는 장소라는 깨달음이다.", "고향은 더 이상 존재하지 않는 곳이라는 깨달음이다.", "고향에 다시는 갈 수 없다는 절망적 깨달음이다.", "고향은 마음속에만 있으므로 찾아갈 필요가 없다는 깨달음이다."], "A");

addStep("p4", p4S[5].start, p4S[5].end,
  "마지막 문장이 전달하는 메시지로 알맞은 것은 무엇인가요?",
  ["풍경은 달라져도 사람들의 정이 남아 있는 한 고향은 마음속에 영원히 살아 있다.", "풍경이 달라지면 고향도 완전히 사라진다.", "사람들의 정은 시간이 지나면 반드시 사라진다.", "고향은 물질적 풍요가 있어야만 의미가 있다."], "A");

addStep("p4", 0, p4.length,
  "넷째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
  ["고향을 다시 찾아가기로 결심하며, 풍경은 변해도 사람의 정이 있는 한 고향은 영원하다는 깨달음을 얻었다.", "고향에 가는 것을 포기하고 도시에서만 살겠다고 결심했다.", "고향의 모든 것이 사라져 더 이상 의미가 없다고 판단했다.", "화자는 고향보다 도시가 더 따뜻하다고 느끼고 있다."], "A");

// === 복기 카드 (8장) ===
const recall = {
  cards: [
    { id: "c1", text: "유년 시절 고향의 가을은 벼 이삭이 익어 가는 들판과 흙냄새, 온 가족의 따뜻한 정이 넘치던 풍요로운 계절이었다." },
    { id: "c2", text: "열여섯 살 봄에 도시로 떠나면서 차창 밖의 고향 풍경이 작아지는 것을 보며 마음이 시렸다." },
    { id: "c3", text: "도시의 빠른 생활 속에서도 밤이 되면 고향의 넓은 하늘이 떠올라 가슴이 먹먹해졌다." },
    { id: "c4", text: "나이가 들수록 유년 시절의 기억이 오히려 더 선명하게 되살아났다." },
    { id: "c5", text: "할아버지와 할머니가 돌아가시고 마을 논밭이 공터로 변했다는 소식을 듣고 안타까워했다." },
    { id: "c6", text: "올가을 고향에 다녀오기로 마음먹으며, 흙의 감촉과 냄새가 변하지 않았을 것이라 기대했다." },
    { id: "c7", text: "고향은 돌아갈 수 없는 시간이 아니라 언제든 마음을 어루만져 주는 장소라고 깨달았다." },
    { id: "c8", text: "풍경은 달라져도 사람들의 정이 남아 있는 한 고향은 마음속에 영원히 살아 있을 것이다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// === 확인 문항 (8문항) ===
const confirm = {
  questions: [
    {
      id: "q1", prompt: "논둑에 앉아 바람을 맞으면 코끝에 들어오는 냄새는 무엇인가요?",
      answerText: "흙냄새와 볏짚 냄새", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "흙냄새와 볏짚 냄새")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q2", prompt: "저녁이면 마당에 깔고 가족이 둘러앉던 것은 무엇인가요?",
      answerText: "멍석", answerMatchMode: "ANY",
      answerRanges: [findRange("p1", "멍석")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q3", prompt: "화자가 고향을 떠나온 나이는 몇 살인가요?",
      answerText: "열여섯 살", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "열여섯 살")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q4", prompt: "밤에 좁은 방에 누우면 떠올라 가슴이 먹먹해지는 것은 무엇인가요?",
      answerText: "고향의 넓은 하늘", answerMatchMode: "ANY",
      answerRanges: [findRange("p2", "고향의 넓은 하늘")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q5", prompt: "할머니가 부엌에서 불러 주시던 것은 무엇인가요?",
      answerText: "노래 한 자락", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "노래 한 자락")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q6", prompt: "마을의 논밭이 절반 이상 무엇으로 변했나요?",
      answerText: "공터", answerMatchMode: "ANY",
      answerRanges: [findRange("p3", "공터")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q7", prompt: "화자가 고향의 땅을 밟으면 전해질 것으로 기대하는 감촉은 무엇인가요?",
      answerText: "흙의 감촉", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "흙의 감촉")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    },
    {
      id: "q8", prompt: "화자가 깨달은 바에 따르면, 고향은 돌아갈 수 없는 시간이 아니라 무엇인가요?",
      answerText: "마음을 어루만져 주는 장소", answerMatchMode: "ANY",
      answerRanges: [findRange("p4", "마음을 어루만져 주는 장소")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 }, revealOnWrong: true
    }
  ]
};

const content = {
  contentId: "dr-w1-008", contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(비트겐슈타인 1) Day 8 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "WITTGENSTEIN_1", schoolGradeRange: { min: 9, max: 10 },
  area: "READING", subArea: "LITERATURE",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs: paragraphs.map(p => ({ id: p.id, text: p.text })) },
    intensive: { timeline }, recall, confirm
  }
};

console.log("\n=== 최종 검증 ===");
console.log(`정독: ${timeline.length}, 복기: ${recall.cards.length}, 확인: ${confirm.questions.length}`);
console.log("\n=== answerRanges 검증 ===");
for (const q of confirm.questions) {
  for (const r of q.answerRanges) {
    const para = paragraphs.find(p => p.id === r.paragraphId);
    console.log(`${q.id}: [${r.start},${r.end}] "${para.text.substring(r.start, r.end)}"`);
  }
}

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'wittgenstein1', '008.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\nstatic: ${staticPath}`);

const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-wittgenstein1.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[7] = {
  content_type: "DAILY_READING", level_id: "WITTGENSTEIN_1",
  area: "READING", sub_area: "LITERATURE", day_index: 8,
  module_key: "reading_training", schema_version: "1.0", content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log(`배치 업데이트 완료 (items[7])`);
