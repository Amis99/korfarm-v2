// 러셀3 Day 8 - 문학 (소설: 창작 - 미술 시간의 자화상)
// 중2~중3 수준, 1300자 ±50

const fs = require('fs');

const p1 = "미술 시간, 선생님이 자화상을 그리라고 하셨다. 교실 여기저기서 거울을 꺼내 드는 소리가 들렸고, 나는 가방에서 작은 손거울을 꺼냈다. 거울 속에는 매일 보아 온 익숙한 얼굴이 있었지만, 그것을 종이 위에 옮기는 일은 전혀 다른 문제였다. 연필을 들었다가 내려놓기를 몇 번, 나는 어디서부터 시작해야 할지 몰라 멍하니 거울만 들여다보았다. 옆자리의 수진이는 벌써 자신감 있게 윤곽선을 그리기 시작했는데, 그 모습을 보니 마음이 한층 더 조급해졌다. 늘 그랬다. 나는 무엇이든 시작하기 전에 완벽한 결과를 미리 머릿속으로 그려 보려 했고, 그 완벽함에 미치지 못할 것 같으면 손을 대지 못하는 아이였다.";

const p2 = "선생님이 내 자리로 다가오셔서 빈 종이를 보시더니 조용히 말씀하셨다. \"자화상은 닮게 그리는 게 아니라, 자기 자신을 들여다보는 시간이란다.\" 그 말이 무슨 뜻인지 바로 이해되지는 않았지만, 왠지 마음속의 긴장이 조금 풀리는 느낌이었다. 나는 조심스럽게 연필을 움직여 눈의 윤곽을 그리기 시작했다. 선이 삐뚤어졌다. 지우개로 지우려다가 문득 선생님의 말이 떠올라 그대로 두었다. 삐뚤어진 선 위에 다시 선을 겹쳐 그리자, 오히려 눈에 깊이가 생기는 것 같았다. 실수가 그림의 일부가 될 수 있다는 것을 나는 그때 처음으로 알았다.";

const p3 = "그려 나갈수록 신기한 일이 벌어졌다. 거울 속 얼굴이 점점 낯설게 느껴지기 시작한 것이다. 매일 아침 세수할 때 보는 얼굴인데, 연필을 들고 자세히 들여다보니 처음 보는 것 같은 부분들이 있었다. 코 옆의 작은 점, 눈썹 끝이 살짝 올라간 모양, 입꼬리 주변의 희미한 주름. 나는 이런 세부적인 것들을 한 번도 주의 깊게 본 적이 없었다. 연필로 하나하나 정성스럽게 따라 그리면서, 나는 나 자신의 얼굴을 처음으로 제대로 마주하고 있다는 느낌을 받았다. 그것은 단순히 외모를 관찰하는 것이 아니라, 지금의 내가 누구인지를 조용히 묻는 시간이었다.";

const p4 = "수업이 끝나고 완성된 자화상을 바라보았다. 솔직히 말해서 잘 그린 그림은 아니었다. 선은 고르지 않았고, 음영도 어색했다. 하지만 그 그림에는 내가 들어 있었다. 삐뚤어진 선에는 처음의 두려움이, 겹쳐진 선에는 포기하지 않은 용기가 담겨 있었다. 수진이가 내 그림을 보더니 말했다. \"이 눈이 진짜 너 같다.\" 그 말에 나는 웃었다. 거울 속 내 얼굴이 아니라 종이 위의 내 얼굴이 더 진짜 같다는 느낌이 들었기 때문이다. 그날 이후 나는 완벽하지 않아도 일단 시작해 보겠다는 마음을 갖게 되었다. 삐뚤어진 선도 나의 일부라는 것을 미술 시간이 가르쳐 주었다.";

const paragraphs = [
  { id: "p1", text: p1 },
  { id: "p2", text: p2 },
  { id: "p3", text: p3 },
  { id: "p4", text: p4 }
];

const totalLen = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log("총 글자수:", totalLen);
if (totalLen < 1250 || totalLen > 1350) {
  console.error("!!! 글자수 범위 이탈:", totalLen);
}

function findRange(text, substring) {
  const idx = text.indexOf(substring);
  if (idx === -1) throw new Error(`못 찾음: "${substring.substring(0, 40)}..."`);
  return { start: idx, end: idx + substring.length };
}

const p1_sents = [
  findRange(p1, "미술 시간, 선생님이 자화상을 그리라고 하셨다."),
  findRange(p1, "교실 여기저기서 거울을 꺼내 드는 소리가 들렸고, 나는 가방에서 작은 손거울을 꺼냈다."),
  findRange(p1, "거울 속에는 매일 보아 온 익숙한 얼굴이 있었지만, 그것을 종이 위에 옮기는 일은 전혀 다른 문제였다."),
  findRange(p1, "연필을 들었다가 내려놓기를 몇 번, 나는 어디서부터 시작해야 할지 몰라 멍하니 거울만 들여다보았다."),
  findRange(p1, "옆자리의 수진이는 벌써 자신감 있게 윤곽선을 그리기 시작했는데, 그 모습을 보니 마음이 한층 더 조급해졌다."),
  findRange(p1, "늘 그랬다."),
  findRange(p1, "나는 무엇이든 시작하기 전에 완벽한 결과를 미리 머릿속으로 그려 보려 했고, 그 완벽함에 미치지 못할 것 같으면 손을 대지 못하는 아이였다.")
];

const p2_sents = [
  findRange(p2, "선생님이 내 자리로 다가오셔서 빈 종이를 보시더니 조용히 말씀하셨다."),
  findRange(p2, "\"자화상은 닮게 그리는 게 아니라, 자기 자신을 들여다보는 시간이란다.\""),
  findRange(p2, "그 말이 무슨 뜻인지 바로 이해되지는 않았지만, 왠지 마음속의 긴장이 조금 풀리는 느낌이었다."),
  findRange(p2, "나는 조심스럽게 연필을 움직여 눈의 윤곽을 그리기 시작했다."),
  findRange(p2, "선이 삐뚤어졌다."),
  findRange(p2, "지우개로 지우려다가 문득 선생님의 말이 떠올라 그대로 두었다."),
  findRange(p2, "삐뚤어진 선 위에 다시 선을 겹쳐 그리자, 오히려 눈에 깊이가 생기는 것 같았다."),
  findRange(p2, "실수가 그림의 일부가 될 수 있다는 것을 나는 그때 처음으로 알았다.")
];

const p3_sents = [
  findRange(p3, "그려 나갈수록 신기한 일이 벌어졌다."),
  findRange(p3, "거울 속 얼굴이 점점 낯설게 느껴지기 시작한 것이다."),
  findRange(p3, "매일 아침 세수할 때 보는 얼굴인데, 연필을 들고 자세히 들여다보니 처음 보는 것 같은 부분들이 있었다."),
  findRange(p3, "코 옆의 작은 점, 눈썹 끝이 살짝 올라간 모양, 입꼬리 주변의 희미한 주름."),
  findRange(p3, "나는 이런 세부적인 것들을 한 번도 주의 깊게 본 적이 없었다."),
  findRange(p3, "연필로 하나하나 정성스럽게 따라 그리면서, 나는 나 자신의 얼굴을 처음으로 제대로 마주하고 있다는 느낌을 받았다."),
  findRange(p3, "그것은 단순히 외모를 관찰하는 것이 아니라, 지금의 내가 누구인지를 조용히 묻는 시간이었다.")
];

const p4_sents = [
  findRange(p4, "수업이 끝나고 완성된 자화상을 바라보았다."),
  findRange(p4, "솔직히 말해서 잘 그린 그림은 아니었다."),
  findRange(p4, "선은 고르지 않았고, 음영도 어색했다."),
  findRange(p4, "하지만 그 그림에는 내가 들어 있었다."),
  findRange(p4, "삐뚤어진 선에는 처음의 두려움이, 겹쳐진 선에는 포기하지 않은 용기가 담겨 있었다."),
  findRange(p4, "수진이가 내 그림을 보더니 말했다."),
  findRange(p4, "\"이 눈이 진짜 너 같다.\""),
  findRange(p4, "그 말에 나는 웃었다."),
  findRange(p4, "거울 속 내 얼굴이 아니라 종이 위의 내 얼굴이 더 진짜 같다는 느낌이 들었기 때문이다."),
  findRange(p4, "그날 이후 나는 완벽하지 않아도 일단 시작해 보겠다는 마음을 갖게 되었다."),
  findRange(p4, "삐뚤어진 선도 나의 일부라는 것을 미술 시간이 가르쳐 주었다.")
];

// 검증
for (const [pid, sents, text] of [["p1", p1_sents, p1], ["p2", p2_sents, p2], ["p3", p3_sents, p3], ["p4", p4_sents, p4]]) {
  console.log(`\n${pid} (${text.length}자, ${sents.length}문장):`);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    console.log(`  [${s.start}, ${s.end}] "${text.substring(s.start, Math.min(s.end, s.start+50))}..."`);
  }
}

let stepCounter = 0;
function makeStep(pid, range, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId: pid, start: range.start, end: range.end }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}
function makeSummary(pid, len, prompt, choices) {
  stepCounter++;
  return {
    stepId: `s${stepCounter}`,
    highlight: { ranges: [{ paragraphId: pid, start: 0, end: len }] },
    question: {
      prompt, choices: choices.map((c, i) => ({ id: ["A","B","C","D"][i], text: c })),
      answerId: "A",
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  };
}

const timeline = [
  // p1
  makeStep("p1", p1_sents[0],
    "첫 문장에서 선생님이 내준 과제는?",
    ["자화상을 그리라는 것이다.", "풍경화를 그리라는 것이다.", "정물화를 그리라는 것이다.", "추상화를 그리라는 것이다."]),
  makeStep("p1", p1_sents[1],
    "둘째 문장에서 '나'가 꺼낸 것은?",
    ["가방에서 작은 손거울을 꺼냈다.", "필통에서 색연필을 꺼냈다.", "서랍에서 스케치북을 꺼냈다.", "주머니에서 사진을 꺼냈다."]),
  makeStep("p1", p1_sents[2],
    "셋째 문장에서 '나'가 느낀 어려움은?",
    ["익숙한 얼굴을 종이에 옮기는 것이 전혀 다른 문제였다.", "거울이 너무 작아서 얼굴이 잘 안 보였다.", "연필이 부러져서 그릴 수 없었다.", "얼굴이 익숙하지 않아 기억이 안 났다."]),
  makeStep("p1", p1_sents[3],
    "넷째 문장에서 '나'의 행동은?",
    ["어디서 시작할지 몰라 멍하니 거울만 들여다보았다.", "즉시 자신 있게 그리기 시작했다.", "친구에게 도움을 요청했다.", "선생님께 과제를 바꿔 달라고 했다."]),
  makeStep("p1", p1_sents[4],
    "다섯째 문장에서 '나'의 감정은?",
    ["수진이가 먼저 그리는 것을 보고 마음이 한층 더 조급해졌다.", "수진이의 그림을 보고 감탄했다.", "수진이와 함께 즐겁게 그렸다.", "수진이를 무시하고 혼자 집중했다."]),
  makeStep("p1", p1_sents[5],
    "여섯째 문장 '늘 그랬다'가 가리키는 것은?",
    ["항상 시작하기 전에 두려워하는 성격이다.", "항상 그림을 잘 그리는 자신감이다.", "항상 친구보다 빨리 끝내는 습관이다.", "항상 선생님의 칭찬을 받는 경험이다."]),
  makeStep("p1", p1_sents[6],
    "마지막 문장에서 '나'의 성격적 특징은?",
    ["완벽함에 미치지 못할 것 같으면 손대지 못하는 아이다.", "무엇이든 과감하게 도전하는 아이다.", "실수를 두려워하지 않는 아이다.", "결과에 상관없이 즐기는 아이다."]),
  makeSummary("p1", p1.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["자화상 과제 앞에서 완벽주의 때문에 시작하지 못하는 모습이다.", "'나'가 자화상을 빠르게 완성하는 모습이다.", "미술 시간에 친구와 경쟁하는 장면이다.", "선생님이 그림 그리는 방법을 가르치는 장면이다."]),

  // p2
  makeStep("p2", p2_sents[0],
    "첫 문장에서 선생님이 본 것은?",
    ["'나'의 빈 종이이다.", "'나'의 완성된 그림이다.", "수진이의 윤곽선이다.", "교실 전체의 분위기이다."]),
  makeStep("p2", p2_sents[1],
    "선생님의 대사가 전하는 뜻은?",
    ["자화상은 닮게 그리는 것이 아니라 자신을 들여다보는 시간이다.", "자화상은 반드시 실물과 똑같이 그려야 한다.", "그림은 빠르게 완성하는 것이 중요하다.", "자화상보다 풍경화가 더 쉽다."]),
  makeStep("p2", p2_sents[2],
    "셋째 문장에서 '나'의 반응은?",
    ["말의 뜻이 바로 이해되지 않았지만 긴장이 풀렸다.", "말을 듣고 즉시 빠르게 그리기 시작했다.", "선생님의 말에 반발하여 더 긴장했다.", "뜻을 정확히 이해하고 감동받았다."]),
  makeStep("p2", p2_sents[3],
    "넷째 문장에서 '나'가 한 행동은?",
    ["조심스럽게 연필을 움직여 눈의 윤곽을 그리기 시작했다.", "대담하게 얼굴 전체를 한 번에 그렸다.", "색연필로 바로 채색을 시작했다.", "지우개로 종이를 깨끗이 닦았다."]),
  makeStep("p2", p2_sents[4],
    "다섯째 문장에서 벌어진 일은?",
    ["선이 삐뚤어졌다.", "그림이 완벽하게 나왔다.", "연필이 부러졌다.", "종이가 찢어졌다."]),
  makeStep("p2", p2_sents[5],
    "여섯째 문장에서 '나'가 삐뚤어진 선을 지우지 않은 이유는?",
    ["선생님의 말이 떠올라 그대로 두었다.", "지우개를 가져오지 않았다.", "시간이 부족했다.", "삐뚤어진 것이 보이지 않았다."]),
  makeStep("p2", p2_sents[6],
    "일곱째 문장에서 겹쳐 그린 결과는?",
    ["오히려 눈에 깊이가 생기는 것 같았다.", "그림이 더 지저분해졌다.", "원래 선이 완전히 가려졌다.", "종이에 구멍이 났다."]),
  makeStep("p2", p2_sents[7],
    "마지막 문장에서 '나'가 깨달은 것은?",
    ["실수가 그림의 일부가 될 수 있다는 것을 처음 알았다.", "실수는 반드시 지워야 한다는 것이다.", "그림은 한 번에 완성해야 한다는 것이다.", "자화상은 사진처럼 정확해야 한다는 것이다."]),
  makeSummary("p2", p2.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["선생님의 조언으로 삐뚤어진 선을 받아들이며 실수의 가치를 깨닫는다.", "선생님이 '나'를 꾸짖어 반성하게 한다.", "'나'가 완벽한 자화상을 그려 칭찬받는다.", "친구가 '나'의 그림을 대신 그려 준다."]),

  // p3
  makeStep("p3", p3_sents[0],
    "첫 문장에서 벌어진 신기한 일이란?",
    ["그림을 그릴수록 예상치 못한 경험을 하게 된 것이다.", "그림이 저절로 완성된 것이다.", "거울이 깨진 것이다.", "선생님이 상을 주신 것이다."]),
  makeStep("p3", p3_sents[1],
    "둘째 문장에서 '나'에게 일어난 변화는?",
    ["거울 속 얼굴이 점점 낯설게 느껴지기 시작했다.", "거울 속 얼굴이 더 익숙해졌다.", "거울이 흐려져 보이지 않게 되었다.", "얼굴에 변화가 전혀 없었다."]),
  makeStep("p3", p3_sents[2],
    "셋째 문장에서 '나'가 발견한 것은?",
    ["매일 보는 얼굴인데 처음 보는 것 같은 부분들이 있었다.", "자신의 얼굴이 완전히 바뀌어 있었다.", "거울에 다른 사람의 얼굴이 비쳤다.", "얼굴의 모든 부분을 이미 알고 있었다."]),
  makeStep("p3", p3_sents[3],
    "넷째 문장이 나열하는 세부 특징은?",
    ["코 옆의 작은 점, 눈썹 끝 모양, 입꼬리 주변의 주름이다.", "이마의 넓이, 귀의 크기, 턱의 각도이다.", "눈의 색깔, 코의 높이, 입의 크기이다.", "머리카락의 길이, 피부의 색, 손의 모양이다."]),
  makeStep("p3", p3_sents[4],
    "다섯째 문장에서 '나'가 인정한 것은?",
    ["이런 세부적인 것들을 한 번도 주의 깊게 본 적이 없었다.", "이 특징들을 매일 관찰해 왔다.", "이런 것들이 중요하지 않다고 생각했다.", "이미 모든 특징을 외우고 있었다."]),
  makeStep("p3", p3_sents[5],
    "여섯째 문장에서 '나'가 느낀 것은?",
    ["나 자신의 얼굴을 처음으로 제대로 마주하고 있다는 느낌이다.", "그림 실력이 크게 향상되었다는 자부심이다.", "그림을 빨리 끝내고 싶다는 조급함이다.", "다른 사람의 얼굴을 그리고 싶다는 욕구이다."]),
  makeStep("p3", p3_sents[6],
    "마지막 문장에서 자화상 그리기의 의미는?",
    ["외모 관찰이 아니라 지금의 자신이 누구인지를 묻는 시간이다.", "외모를 정확히 기록하는 작업이다.", "미술 기법을 연습하는 시간이다.", "친구와 비교하여 차이를 확인하는 시간이다."]),
  makeSummary("p3", p3.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["자화상을 그리며 자기 얼굴을 처음으로 깊이 마주하는 경험이다.", "자화상의 미술 기법을 배우는 과정이다.", "거울의 과학적 원리를 탐구하는 내용이다.", "친구들과 얼굴 특징을 비교하는 장면이다."]),

  // p4
  makeStep("p4", p4_sents[0],
    "첫 문장의 상황은?",
    ["수업이 끝나고 완성된 자화상을 바라보고 있다.", "수업 중에 자화상을 막 시작한다.", "수업 전에 준비물을 챙기고 있다.", "방과 후에 그림을 다시 그리고 있다."]),
  makeStep("p4", p4_sents[1],
    "둘째 문장에서 '나'의 평가는?",
    ["솔직히 말해서 잘 그린 그림은 아니었다.", "매우 훌륭한 작품이었다.", "사진처럼 정확했다.", "전혀 자신의 얼굴 같지 않았다."]),
  makeStep("p4", p4_sents[2],
    "셋째 문장이 묘사하는 그림의 상태는?",
    ["선이 고르지 않고 음영도 어색했다.", "선이 완벽하고 음영이 자연스러웠다.", "색감이 화려하고 구도가 훌륭했다.", "사실적이고 세밀한 표현이 돋보였다."]),
  makeStep("p4", p4_sents[3],
    "넷째 문장에서 '나'가 느낀 것은?",
    ["그 그림에는 내가 들어 있었다.", "그 그림은 나와 전혀 관련이 없었다.", "그 그림을 버리고 싶었다.", "그 그림이 다른 사람처럼 보였다."]),
  makeStep("p4", p4_sents[4],
    "다섯째 문장에서 선에 담긴 의미는?",
    ["삐뚤어진 선에는 두려움이, 겹쳐진 선에는 용기가 담겨 있다.", "삐뚤어진 선에는 실력 부족이 드러난다.", "겹쳐진 선은 시간 낭비의 결과이다.", "모든 선이 동일한 의미를 가진다."]),
  makeStep("p4", p4_sents[5],
    "여섯째 문장에서 수진이의 행동은?",
    ["'나'의 그림을 보더니 말했다.", "'나'의 그림을 비판했다.", "'나'의 그림을 무시했다.", "'나'의 그림을 가져갔다."]),
  makeStep("p4", p4_sents[6],
    "수진이의 대사가 뜻하는 바는?",
    ["그림 속 눈이 '나'를 잘 표현하고 있다는 것이다.", "그림이 실물과 전혀 다르다는 것이다.", "'나'의 눈이 이상하다는 것이다.", "다시 그려야 한다는 것이다."]),
  makeStep("p4", p4_sents[8],
    "아홉째 문장에서 '나'의 느낌은?",
    ["종이 위의 얼굴이 거울보다 더 진짜 같다는 것이다.", "거울 속 얼굴이 더 정확하다는 것이다.", "사진이 가장 진짜에 가깝다는 것이다.", "그림은 진짜와 거리가 멀다는 것이다."]),
  makeStep("p4", p4_sents[9],
    "열째 문장에서 '나'의 변화는?",
    ["완벽하지 않아도 일단 시작해 보겠다는 마음을 갖게 되었다.", "앞으로 그림을 그리지 않겠다고 결심했다.", "완벽하지 않으면 시작하지 않기로 했다.", "미술 대회에 출전하기로 했다."]),
  makeStep("p4", p4_sents[10],
    "마지막 문장에서 미술 시간이 가르쳐 준 것은?",
    ["삐뚤어진 선도 나의 일부라는 것이다.", "직선만이 올바른 선이라는 것이다.", "실수는 반드시 고쳐야 한다는 것이다.", "미술은 재능이 있어야 한다는 것이다."]),
  makeSummary("p4", p4.length,
    "이 문단의 중심 내용으로 가장 적절한 것은?",
    ["불완전한 자화상을 통해 완벽주의를 내려놓고 성장하는 모습이다.", "'나'가 자화상을 버리고 새로 그리는 모습이다.", "수진이와 그림 실력을 비교하며 좌절하는 장면이다.", "미술 대회에서 상을 받는 장면이다."])
];

// 복기 카드 (8)
const fullText = p1 + " " + p2 + " " + p3 + " " + p4;
const cardCount = 8;
const cardLen = Math.ceil(fullText.length / cardCount);
const cards = [];
for (let i = 0; i < cardCount; i++) {
  const start = i * cardLen;
  const end = Math.min(start + cardLen, fullText.length);
  cards.push({ id: `c${i+1}`, text: fullText.substring(start, end) });
}

// 확인 문항 (8)
function findConfirm(pid, text, sub) {
  const idx = text.indexOf(sub);
  if (idx === -1) throw new Error(`확인: "${sub}"`);
  return { paragraphId: pid, start: idx, end: idx + sub.length };
}

const confirmQuestions = [
  { id: "q1", prompt: "지문에서 '손거울'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p1", p1, "손거울")] },
  { id: "q2", prompt: "지문에서 '조급해졌다'를 찾아 클릭하세요.",
    answerRanges: [findConfirm("p1", p1, "조급해졌다")] },
  { id: "q3", prompt: "지문에서 '삐뚤어졌다'를 찾아 클릭하세요.",
    answerRanges: [findConfirm("p2", p2, "삐뚤어졌다")] },
  { id: "q4", prompt: "지문에서 '깊이가 생기는'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p2", p2, "깊이가 생기는")] },
  { id: "q5", prompt: "지문에서 '낯설게'를 찾아 클릭하세요.",
    answerRanges: [findConfirm("p3", p3, "낯설게")] },
  { id: "q6", prompt: "지문에서 '희미한 주름'을 찾아 클릭하세요.",
    answerRanges: [findConfirm("p3", p3, "희미한 주름")] },
  { id: "q7", prompt: "지문에서 '용기'를 찾아 클릭하세요.",
    answerRanges: [findConfirm("p4", p4, "용기")] },
  { id: "q8", prompt: "지문에서 '나의 일부'를 찾아 클릭하세요.",
    answerRanges: [findConfirm("p4", p4, "나의 일부")] }
];

// JSON
const staticContent = {
  contentId: "dr-r3-008", contentType: "DAILY_READING",
  version: 1, status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 8 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING", subArea: "LITERATURE",
  competencies: ["READING"], tags: ["daily"],
  access: { mode: "FREE" },
  seedReward: { seedType: "WHEAT", count: 3, multiplier: 1 },
  timeLimitSec: 300, assets: {},
  payload: {
    passage: { format: "TEXT", paragraphs },
    intensive: { timeline },
    recall: { cards, correctOrder: cards.map(c => c.id), seedPenalty: 1 },
    confirm: {
      questions: confirmQuestions.map(q => ({
        id: q.id, prompt: q.prompt, answerRanges: q.answerRanges,
        scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
        revealOnWrong: true, answerMatchMode: "ANY"
      }))
    }
  }
};

const batchItem = {
  content_type: "DAILY_READING", level_id: "RUSSELL_3",
  area: "READING", sub_area: "LITERATURE",
  day_index: 8, module_key: "reading_training", schema_version: "1.0",
  content: staticContent
};

fs.writeFileSync("frontend/public/daily-reading/russell3/008.json", JSON.stringify(staticContent, null, 2), "utf-8");
console.log("\n✅ static 저장: 008.json");

const batch = JSON.parse(fs.readFileSync("generated/daily-batch-reading-russell3.json", "utf-8"));
batch.items[7] = batchItem;
fs.writeFileSync("generated/daily-batch-reading-russell3.json", JSON.stringify(batch, null, 2), "utf-8");
console.log("✅ 배치 업데이트: items[7]");

console.log("\n=== Day 8 완료 ===");
console.log("타임라인:", timeline.length, "복기:", cards.length, "확인:", confirmQuestions.length);
