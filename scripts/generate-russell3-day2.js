// 러셀3 Day 2 - 문학 (현대 소설/수필 직접 창작)
// 중3 수준, 1300자 ±50

const fs = require('fs');

// ────────────── 지문 (3~4문단, 현대 수필 창작) ──────────────
// 주제: "할머니의 장독대" - 기억과 상실, 가족의 의미를 다룬 수필

const p1 = "할머니 댁 마당 한쪽에는 장독대가 있었다. 크고 작은 옹기가 일곱 개쯤 모여 햇볕을 받고 있었는데, 그 위에 놓인 소금 접시마다 빗물이 고이면 할머니는 새벽같이 일어나 정성스레 닦아 내셨다. 나는 어릴 때 그 모습이 왜 그리 느리고 지루해 보였는지 모른다. 할머니는 옹기 하나하나에 이름이라도 붙인 듯 어느 것에 고추장이 있고 어느 것에 간장이 있는지 정확히 아셨다. 장독 뚜껑을 여실 때마다 풍기는 된장 냄새가 코를 찌르면, 나는 괜히 얼굴을 찡그리며 마당 저편으로 도망치곤 했다. 그때의 나에게 장독대는 낡고 거추장스러운 것, 빨리 벗어나고 싶은 시골의 상징이었다.";

const p2 = "도시로 올라와 중학생이 된 뒤, 나는 마트에서 사 온 된장으로 찌개를 끓이는 어머니의 뒷모습을 자주 보았다. 어머니는 가끔 국을 한 숟갈 떠서 맛을 보시더니, 이상하게도 한숨을 쉬곤 하셨다. 왜 한숨을 쉬는지 그때는 몰랐지만, 나중에야 그것이 할머니의 된장 맛을 떠올리며 내쉬는 그리움의 한숨이라는 걸 알게 되었다. 장독에서 익어 가던 된장에는 할머니의 시간과 정성이 고스란히 스며 있었고, 마트의 비닐 포장 안에는 그런 것이 담길 자리가 없었던 것이다. 공장에서 대량으로 만들어진 된장은 맛은 비슷할지 몰라도, 오랜 세월 정성을 들여 발효시킨 손맛까지 담아내기는 어려웠다. 어머니의 한숨 속에는 어린 시절 마당에서 맡던 냄새, 뚜껑을 열 때 올라오던 김, 그리고 다시 돌아갈 수 없는 시간에 대한 아쉬움이 뒤섞여 있었다.";

const p3 = "할머니가 돌아가신 뒤, 장독대는 사촌 형이 정리하면서 모두 깨어졌다고 들었다. 옹기 파편들이 마당 흙 속에 묻혀 있다가 비가 오면 드러난다고 했다. 그 소식을 듣던 날, 나는 이상하게 가슴 한쪽이 텅 빈 느낌이 들었다. 어릴 때 그토록 도망치고 싶던 그 냄새와 풍경이 이제는 다시 맡을 수 없는 것이 되어 버렸기 때문이다. 사라진 것들은 돌이킬 수 없다는 사실이 그제야 가슴에 와닿았다. 잃어버리고 나서야 비로소 그것의 무게를 느끼게 된다는 말이 이런 뜻인가 싶었다.";

const p4 = "요즘 나는 가끔 베란다에 작은 항아리 하나를 놓고 된장을 담가 본다. 할머니처럼 새벽에 소금 접시를 닦지는 못하지만, 뚜껑을 열 때 올라오는 냄새를 맡으면 마치 할머니 마당에 서 있는 듯한 착각이 든다. 그 냄새 속에서 옹기를 어루만지던 할머니의 손끝과 마당에 내리쬐던 따스한 햇살이 함께 떠오른다. 장독대는 사라졌지만, 그 안에 담겨 있던 시간과 마음만은 내가 기억하는 한 사라지지 않을 것이다. 기억이란 냄새처럼 보이지 않지만, 어느 순간 불현듯 되살아나 가슴을 데우는 것이기 때문이다.";

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

// ────────────── 문장 경계 계산 ──────────────
function splitSentences(text) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '.' && i + 1 <= text.length) {
      if (i + 1 < text.length && text[i+1] === ' ') {
        parts.push({ start, end: i + 1 });
        start = i + 2;
      } else if (i + 1 === text.length) {
        parts.push({ start, end: i + 1 });
        start = i + 1;
      }
    }
  }
  if (start < text.length) {
    parts.push({ start, end: text.length });
  }
  return parts;
}

for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  console.log(`\n${p.id} (${p.text.length}자, ${sents.length}문장):`);
  for (const s of sents) {
    const fragment = p.text.substring(s.start, s.end);
    console.log(`  [${s.start}, ${s.end}] "${fragment.substring(0, 50)}..."`);
  }
}

// ────────────── intensive 질문 ──────────────
const questions_by_paragraph = {
  p1: [
    // 문장 1: 할머니 댁 마당 한쪽에는 장독대가 있었다.
    {
      prompt: "첫 문장이 소개하는 장소와 대상으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니 댁 마당 한쪽에 장독대가 있었다." },
        { id: "B", text: "할머니 댁 지붕 위에 항아리가 놓여 있었다." },
        { id: "C", text: "할머니 댁 부엌 안에 장독대가 가득했다." },
        { id: "D", text: "할머니 댁 뒷산 꼭대기에 장독이 있었다." }
      ],
      answerId: "A"
    },
    // 문장 2: 크고 작은 옹기가 일곱 개쯤 모여 햇볕을 받고 있었는데...
    {
      prompt: "둘째 문장에서 할머니가 새벽에 한 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "소금 접시에 고인 빗물을 정성스레 닦아 내셨다." },
        { id: "B", text: "옹기를 하나하나 들어 물로 깨끗이 씻으셨다." },
        { id: "C", text: "장독 뚜껑을 모두 열어 바람을 통하게 하셨다." },
        { id: "D", text: "마당 전체에 물을 뿌려 먼지를 가라앉히셨다." }
      ],
      answerId: "A"
    },
    // 문장 3: 나는 어릴 때 그 모습이 왜 그리 느리고 지루해 보였는지 모른다.
    {
      prompt: "셋째 문장에서 어린 시절 글쓴이가 느낀 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니의 행동이 느리고 지루하게 보였다." },
        { id: "B", text: "할머니의 행동이 신기하고 재미있게 느껴졌다." },
        { id: "C", text: "할머니의 행동이 무섭고 두렵게 느껴졌다." },
        { id: "D", text: "할머니의 행동이 빠르고 능숙하게 보였다." }
      ],
      answerId: "A"
    },
    // 문장 4: 할머니는 옹기 하나하나에 이름이라도 붙인 듯...
    {
      prompt: "넷째 문장에서 할머니의 모습으로 알맞은 것은?",
      choices: [
        { id: "A", text: "옹기마다 무엇이 담겨 있는지 정확히 알고 계셨다." },
        { id: "B", text: "옹기에 실제로 이름표를 하나하나 붙여 두셨다." },
        { id: "C", text: "옹기의 종류를 자주 헷갈려 다른 것을 꺼내셨다." },
        { id: "D", text: "옹기를 매년 새것으로 교체하셨다." }
      ],
      answerId: "A"
    },
    // 문장 5: 장독 뚜껑을 여실 때마다 풍기는 된장 냄새가 코를 찌르면...
    {
      prompt: "다섯째 문장에서 글쓴이가 된장 냄새에 보인 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "얼굴을 찡그리며 마당 저편으로 도망쳤다." },
        { id: "B", text: "냄새를 깊이 들이마시며 맛을 상상했다." },
        { id: "C", text: "할머니 곁으로 다가가 함께 뚜껑을 닫았다." },
        { id: "D", text: "장독대 앞에 앉아 오래도록 구경했다." }
      ],
      answerId: "A"
    },
    // 문장 6: 그때의 나에게 장독대는 낡고 거추장스러운 것, 빨리 벗어나고 싶은 시골의 상징이었다.
    {
      prompt: "여섯째 문장에서 어린 글쓴이가 장독대를 바라보는 시각으로 알맞은 것은?",
      choices: [
        { id: "A", text: "낡고 거추장스러운 것, 빨리 벗어나고 싶은 시골의 상징이었다." },
        { id: "B", text: "소중하고 아름다운 것, 언제까지나 간직하고 싶은 보물이었다." },
        { id: "C", text: "신비롭고 흥미로운 것, 항상 가까이 있고 싶은 놀이터였다." },
        { id: "D", text: "평범하지만 편안한 것, 마음의 안정을 주는 공간이었다." }
      ],
      answerId: "A"
    }
  ],
  p2: [
    // 문장 1: 도시로 올라와 중학생이 된 뒤, 나는 마트에서 사 온 된장으로 찌개를 끓이는 어머니의 뒷모습을 자주 보았다.
    {
      prompt: "첫 문장이 전하는 변화된 상황으로 알맞은 것은?",
      choices: [
        { id: "A", text: "도시에서 마트 된장으로 찌개를 끓이는 어머니의 뒷모습을 보았다." },
        { id: "B", text: "시골에서 할머니가 직접 된장을 담가 찌개를 끓이셨다." },
        { id: "C", text: "도시에서 어머니가 장독대에 직접 된장을 담그셨다." },
        { id: "D", text: "시골 마트에서 가족 모두 함께 된장을 골랐다." }
      ],
      answerId: "A"
    },
    // 문장 2: 어머니는 가끔 국을 한 숟갈 떠서 맛을 보시더니, 이상하게도 한숨을 쉬곤 하셨다.
    {
      prompt: "둘째 문장에서 어머니가 맛을 본 뒤 보인 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "이상하게도 한숨을 쉬곤 하셨다." },
        { id: "B", text: "만족스러운 표정으로 미소를 지으셨다." },
        { id: "C", text: "소금을 더 넣어야 한다며 서둘러 움직이셨다." },
        { id: "D", text: "맛이 좋다며 글쓴이를 불러 함께 맛보셨다." }
      ],
      answerId: "A"
    },
    // 문장 3: 왜 한숨을 쉬는지 그때는 몰랐지만...
    {
      prompt: "셋째 문장에서 글쓴이가 나중에 깨달은 한숨의 의미로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니의 된장 맛을 떠올리며 내쉬는 그리움의 한숨이었다." },
        { id: "B", text: "요리가 어렵다는 불만에서 나오는 짜증의 한숨이었다." },
        { id: "C", text: "마트 된장의 가격이 비싸 걱정하는 한숨이었다." },
        { id: "D", text: "할머니에게 요리를 배우지 못한 후회의 한숨이었다." }
      ],
      answerId: "A"
    },
    // 문장 4: 장독에서 익어 가던 된장에는 할머니의 시간과 정성이 고스란히 스며 있었고...
    {
      prompt: "넷째 문장이 대비하는 두 가지로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니의 시간과 정성이 담긴 된장과 그런 것이 없는 마트 된장이다." },
        { id: "B", text: "시골의 값싼 된장과 도시의 고급 된장이다." },
        { id: "C", text: "할머니가 만든 간장과 어머니가 만든 고추장이다." },
        { id: "D", text: "장독대의 크기와 마트 용기의 크기이다." }
      ],
      answerId: "A"
    },
    // 문장 5: 공장에서 대량으로 만들어진 된장은 맛은 비슷할지 몰라도...
    {
      prompt: "다섯째 문장이 지적하는 공장 된장의 한계로 알맞은 것은?",
      choices: [
        { id: "A", text: "맛은 비슷하더라도 오랜 정성으로 발효시킨 손맛을 담기 어렵다." },
        { id: "B", text: "가격이 너무 비싸서 일반 가정에서 사기 어렵다." },
        { id: "C", text: "유통 기한이 짧아 오래 보관할 수 없다." },
        { id: "D", text: "색깔이 다르기 때문에 찌개의 맛이 완전히 달라진다." }
      ],
      answerId: "A"
    },
    // 문장 6: 어머니의 한숨 속에는...
    {
      prompt: "여섯째 문장이 열거하는 어머니 한숨 속의 요소로 알맞은 것은?",
      choices: [
        { id: "A", text: "마당의 냄새, 뚜껑의 김, 돌아갈 수 없는 시간에 대한 아쉬움이다." },
        { id: "B", text: "도시 생활의 편리함, 마트의 다양함, 미래에 대한 기대감이다." },
        { id: "C", text: "요리 실력의 부족, 된장의 짠맛, 건강에 대한 걱정이다." },
        { id: "D", text: "이사 비용, 교통의 불편함, 새 집에 대한 불안감이다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    // 문장 1: 할머니가 돌아가신 뒤, 장독대는 사촌 형이 정리하면서 모두 깨어졌다고 들었다.
    {
      prompt: "첫 문장이 전하는 소식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니 사후 사촌 형이 정리하면서 장독대가 모두 깨어졌다." },
        { id: "B", text: "할머니가 살아 계실 때 장독대를 새것으로 교체하셨다." },
        { id: "C", text: "사촌 형이 장독대를 수리하여 더욱 튼튼하게 만들었다." },
        { id: "D", text: "할머니가 직접 장독대를 이웃에게 나누어 주셨다." }
      ],
      answerId: "A"
    },
    // 문장 2: 옹기 파편들이 마당 흙 속에 묻혀 있다가 비가 오면 드러난다고 했다.
    {
      prompt: "둘째 문장이 전하는 장독대의 흔적으로 알맞은 것은?",
      choices: [
        { id: "A", text: "옹기 파편들이 마당 흙 속에 묻혀 있다가 비가 오면 드러났다." },
        { id: "B", text: "옹기 파편들을 모아 새로운 항아리를 만들었다." },
        { id: "C", text: "옹기 파편들을 사촌 형이 깨끗이 치워 아무 흔적이 없었다." },
        { id: "D", text: "옹기 파편들을 글쓴이가 직접 수거하여 보관했다." }
      ],
      answerId: "A"
    },
    // 문장 3: 그 소식을 듣던 날, 나는 이상하게 가슴 한쪽이 텅 빈 느낌이 들었다.
    {
      prompt: "셋째 문장에서 글쓴이가 느낀 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "가슴 한쪽이 텅 빈 듯한 상실감을 느꼈다." },
        { id: "B", text: "무거운 짐을 내려놓은 듯한 후련함을 느꼈다." },
        { id: "C", text: "새로운 시작에 대한 기대감으로 가슴이 벅찼다." },
        { id: "D", text: "사촌 형의 행동에 화가 나서 분노를 느꼈다." }
      ],
      answerId: "A"
    },
    // 문장 4: 어릴 때 그토록 도망치고 싶던 그 냄새와 풍경이...
    {
      prompt: "넷째 문장이 드러내는 글쓴이의 인식 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "도망치고 싶었던 냄새와 풍경이 다시 맡을 수 없는 것이 되었다." },
        { id: "B", text: "도망치고 싶었던 냄새를 도시에서도 여전히 맡을 수 있다." },
        { id: "C", text: "어릴 때 좋아했던 냄새가 이제는 싫어졌다." },
        { id: "D", text: "냄새와 풍경에 대한 기억이 완전히 사라졌다." }
      ],
      answerId: "A"
    },
    // 문장 5: 사라진 것들은 돌이킬 수 없다는 사실이 그제야 가슴에 와닿았다.
    {
      prompt: "다섯째 문장에서 글쓴이가 깨달은 사실로 알맞은 것은?",
      choices: [
        { id: "A", text: "사라진 것들은 돌이킬 수 없다는 사실을 비로소 느꼈다." },
        { id: "B", text: "사라진 것들은 노력하면 반드시 되돌릴 수 있다고 생각했다." },
        { id: "C", text: "사라진 것에 대해서는 아무런 감정도 들지 않았다." },
        { id: "D", text: "사라진 것보다 새로운 것을 만드는 일이 더 중요하다고 느꼈다." }
      ],
      answerId: "A"
    },
    // 문장 6: 잃어버리고 나서야 비로소 그것의 무게를 느끼게 된다는 말이...
    {
      prompt: "여섯째 문장이 담고 있는 깨달음으로 알맞은 것은?",
      choices: [
        { id: "A", text: "소중한 것은 잃어버린 뒤에야 그 무게를 느끼게 된다." },
        { id: "B", text: "무거운 것은 미리 버려야 나중에 후회하지 않는다." },
        { id: "C", text: "잃어버린 물건은 반드시 다시 찾을 수 있다." },
        { id: "D", text: "가벼운 것일수록 오래 기억에 남는 법이다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    // 문장 1: 요즘 나는 가끔 베란다에 작은 항아리 하나를 놓고 된장을 담가 본다.
    {
      prompt: "첫 문장에서 글쓴이가 요즘 하는 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "베란다에 작은 항아리를 놓고 된장을 담가 본다." },
        { id: "B", text: "마트에서 할머니 된장과 비슷한 제품을 찾아본다." },
        { id: "C", text: "시골 할머니 댁에 내려가 장독대를 수리한다." },
        { id: "D", text: "사촌 형에게 연락하여 새 항아리를 보내 달라고 한다." }
      ],
      answerId: "A"
    },
    // 문장 2: 할머니처럼 새벽에 소금 접시를 닦지는 못하지만...
    {
      prompt: "둘째 문장에서 글쓴이가 경험하는 감각으로 알맞은 것은?",
      choices: [
        { id: "A", text: "뚜껑을 열 때 나는 냄새로 할머니 마당에 서 있는 듯한 착각을 느낀다." },
        { id: "B", text: "새벽에 일어나면 할머니의 목소리가 들리는 듯하다." },
        { id: "C", text: "항아리를 만지면 할머니의 따뜻한 손길이 느껴진다." },
        { id: "D", text: "된장을 맛보면 마트 된장과 똑같은 맛이 난다." }
      ],
      answerId: "A"
    },
    // 문장 3: 그 냄새 속에서 옹기를 어루만지던 할머니의 손끝과...
    {
      prompt: "셋째 문장에서 냄새와 함께 떠오르는 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "옹기를 어루만지던 할머니의 손끝과 마당의 따스한 햇살이다." },
        { id: "B", text: "시골 마을의 개울 소리와 새벽 닭 울음소리이다." },
        { id: "C", text: "어머니가 찌개를 끓이던 부엌의 풍경이다." },
        { id: "D", text: "사촌 형이 장독대를 정리하던 모습이다." }
      ],
      answerId: "A"
    },
    // 문장 4: 장독대는 사라졌지만, 그 안에 담겨 있던 시간과 마음만은...
    {
      prompt: "넷째 문장이 전하는 글쓴이의 다짐으로 알맞은 것은?",
      choices: [
        { id: "A", text: "장독대는 사라져도 그 안의 시간과 마음은 기억하는 한 사라지지 않는다." },
        { id: "B", text: "장독대가 사라졌으니 된장 만드는 전통도 함께 끝났다." },
        { id: "C", text: "장독대를 새로 만들어 할머니 댁 자리에 다시 놓겠다." },
        { id: "D", text: "시간이 지나면 장독대에 대한 기억도 자연스레 사라질 것이다." }
      ],
      answerId: "A"
    },
    // 문장 5: 기억이란 냄새처럼 보이지 않지만...
    {
      prompt: "다섯째 문장에서 글쓴이가 '기억'을 비유하는 방식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "냄새처럼 보이지 않지만 불현듯 되살아나 가슴을 데운다고 비유한다." },
        { id: "B", text: "사진처럼 선명하게 남아 시간이 지나도 변하지 않는다고 비유한다." },
        { id: "C", text: "강물처럼 끊임없이 흘러가 다시 돌아오지 않는다고 비유한다." },
        { id: "D", text: "바람처럼 지나가면 아무런 흔적도 남기지 않는다고 비유한다." }
      ],
      answerId: "A"
    }
  ]
};

const centralQuestions = {
  p1: {
    prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "어린 시절 글쓴이에게 장독대는 낡고 벗어나고 싶은 시골의 상징이었다." },
      { id: "B", text: "할머니는 장독대를 소홀히 관리하여 옹기가 자주 깨졌다." },
      { id: "C", text: "글쓴이는 어릴 때부터 된장 냄새를 무척 좋아했다." },
      { id: "D", text: "장독대는 도시의 아파트 베란다에서도 흔히 볼 수 있었다." }
    ],
    answerId: "A"
  },
  p2: {
    prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "어머니의 한숨에는 할머니 된장에 담긴 시간과 정성에 대한 그리움이 있었다." },
      { id: "B", text: "마트의 된장이 할머니의 된장보다 맛이 좋아서 어머니가 만족하셨다." },
      { id: "C", text: "도시로 이사한 뒤 가족 모두 된장찌개를 먹지 않게 되었다." },
      { id: "D", text: "어머니는 요리 실력이 부족해서 항상 한숨을 쉬셨다." }
    ],
    answerId: "A"
  },
  p3: {
    prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "장독대가 사라진 뒤에야 글쓴이는 그것의 소중함을 깨닫게 되었다." },
      { id: "B", text: "사촌 형이 장독대를 깨뜨려서 글쓴이는 크게 화를 냈다." },
      { id: "C", text: "할머니가 돌아가신 뒤 가족 간의 갈등이 심해졌다." },
      { id: "D", text: "장독대가 깨지면서 글쓴이는 시골에 대한 관심을 완전히 잃었다." }
    ],
    answerId: "A"
  },
  p4: {
    prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
    choices: [
      { id: "A", text: "글쓴이는 된장을 담그며 기억 속 할머니의 시간과 마음을 이어 가고 있다." },
      { id: "B", text: "글쓴이는 할머니의 된장 레시피를 완벽하게 복원하는 데 성공했다." },
      { id: "C", text: "글쓴이는 시골로 다시 내려가 장독대를 새로 만들 계획이다." },
      { id: "D", text: "기억은 시간이 지나면 반드시 사라지므로 집착하지 말아야 한다." }
    ],
    answerId: "A"
  }
};

// ────────────── intensive timeline 생성 ──────────────
const timeline = [];
let stepNum = 1;

for (const p of paragraphs) {
  const sents = splitSentences(p.text);
  const qs = questions_by_paragraph[p.id];

  for (let i = 0; i < sents.length; i++) {
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: { ranges: [{ paragraphId: p.id, start: sents[i].start, end: sents[i].end }] },
      question: {
        prompt: qs[i].prompt,
        choices: qs[i].choices,
        answerId: qs[i].answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
  }

  const cq = centralQuestions[p.id];
  timeline.push({
    stepId: `s${stepNum}`,
    highlight: { ranges: [{ paragraphId: p.id, start: 0, end: p.text.length }] },
    question: {
      prompt: cq.prompt,
      choices: cq.choices,
      answerId: cq.answerId,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
  stepNum++;
}

// ────────────── recall 8카드 ──────────────
const recall = {
  cards: [
    { id: "c1", text: "할머니 댁 마당의 장독대에는 옹기가 일곱 개쯤 모여 있었다." },
    { id: "c2", text: "어린 글쓴이에게 장독대는 낡고 거추장스러운 시골의 상징이었다." },
    { id: "c3", text: "도시에서 어머니는 마트 된장으로 찌개를 끓이며 한숨을 쉬셨다." },
    { id: "c4", text: "어머니의 한숨은 할머니 된장에 담긴 시간과 정성에 대한 그리움이었다." },
    { id: "c5", text: "할머니 사후 장독대는 정리 과정에서 모두 깨어졌다." },
    { id: "c6", text: "글쓴이는 잃어버리고 나서야 장독대의 소중함을 깨달았다." },
    { id: "c7", text: "요즘 글쓴이는 베란다에 항아리를 놓고 된장을 담가 본다." },
    { id: "c8", text: "기억은 냄새처럼 보이지 않지만 불현듯 되살아나 가슴을 데운다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ────────────── confirm 질문 ──────────────
function findAnswerRanges(answerText, paragraphs) {
  const ranges = [];
  for (const p of paragraphs) {
    let idx = p.text.indexOf(answerText);
    while (idx !== -1) {
      ranges.push({ paragraphId: p.id, start: idx, end: idx + answerText.length });
      idx = p.text.indexOf(answerText, idx + 1);
    }
  }
  return ranges;
}

const confirmQuestionsRaw = [
  {
    id: "q1",
    prompt: "할머니가 새벽에 정성스레 닦아 내신 것 위에 고인 것은 무엇인가?",
    answerText: "빗물",
    answerMatchMode: "ANY"
  },
  {
    id: "q2",
    prompt: "어린 글쓴이가 장독 뚜껑을 열 때 코를 찌르는 것으로 느낀 냄새는 무엇인가?",
    answerText: "된장 냄새",
    answerMatchMode: "ANY"
  },
  {
    id: "q3",
    prompt: "도시에서 어머니가 찌개를 끓이다가 맛을 본 뒤 보인 행동은 무엇인가?",
    answerText: "한숨",
    answerMatchMode: "ANY"
  },
  {
    id: "q4",
    prompt: "할머니 사후 장독대를 정리한 사람은 누구인가?",
    answerText: "사촌 형",
    answerMatchMode: "ANY"
  },
  {
    id: "q5",
    prompt: "요즘 글쓴이가 베란다에 놓고 된장을 담가 보는 그릇은 무엇인가?",
    answerText: "항아리",
    answerMatchMode: "ANY"
  },
  {
    id: "q6",
    prompt: "글쓴이가 기억을 비유하면서 '보이지 않지만 되살아나 가슴을 데운다'고 말한 감각은 무엇인가?",
    answerText: "냄새",
    answerMatchMode: "ANY"
  },
  {
    id: "q7",
    prompt: "어린 시절 글쓴이에게 장독대가 상징하던 곳은 어디인가?",
    answerText: "시골",
    answerMatchMode: "ANY"
  }
];

const confirmQuestions = confirmQuestionsRaw.map(q => {
  const ranges = findAnswerRanges(q.answerText, paragraphs);
  if (ranges.length === 0) {
    console.error(`!!! answerText "${q.answerText}" 를 본문에서 찾을 수 없음!`);
  } else {
    console.log(`confirm ${q.id}: "${q.answerText}" → ${JSON.stringify(ranges)}`);
  }
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: q.answerMatchMode,
    answerRanges: ranges,
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

// ────────────── JSON 조합 ──────────────
const content = {
  contentId: "dr-r3-002",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 2 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
  schoolGradeRange: { min: 9, max: 9 },
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
    recall,
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log("\n===== 검증 =====");
console.log("총 글자수:", totalLen, totalLen >= 1250 && totalLen <= 1350 ? "OK" : "FAIL");
console.log("recall 카드 수:", recall.cards.length, recall.cards.length === 8 ? "OK" : "FAIL");
console.log("confirm 문항 수:", confirmQuestions.length, confirmQuestions.length >= 5 ? "OK" : "FAIL");
console.log("intensive step 수:", timeline.length);

let rangeOk = true;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`!!! 문단 ${r.paragraphId} 없음`); rangeOk = false; continue; }
    if (r.start < 0 || r.end > p.text.length || r.start >= r.end) {
      console.error(`!!! ${step.stepId} 범위 오류: [${r.start}, ${r.end}] (문단길이: ${p.text.length})`);
      rangeOk = false;
    }
  }
}
for (const q of confirmQuestions) {
  for (const r of q.answerRanges) {
    const p = paragraphs.find(pp => pp.id === r.paragraphId);
    if (!p) { console.error(`!!! 문단 ${r.paragraphId} 없음`); rangeOk = false; continue; }
    const found = p.text.substring(r.start, r.end);
    if (found !== q.answerText) {
      console.error(`!!! ${q.id} answerRange 불일치: "${found}" !== "${q.answerText}"`);
      rangeOk = false;
    }
  }
}
console.log("ranges 검증:", rangeOk ? "OK" : "FAIL");

// 파일 출력
const outPath = 'frontend/public/daily-reading/russell3/002.json';
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outPath}`);

// 배치 파일 업데이트
const batchPath = 'generated/daily-batch-reading-russell3.json';
if (fs.existsSync(batchPath)) {
  const data = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  data.items[1] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_3",
    area: "READING",
    sub_area: "LITERATURE",
    day_index: 2,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`배치 파일 업데이트: ${batchPath}`);
}
