// Day 6 - LITERATURE (문학) - 러셀3
// 소설 지문: 할아버지의 시계 - 가족과 기억에 대한 이야기

const paragraphs = [
  {
    id: "p1",
    text: "은서는 할아버지가 돌아가신 뒤 가족들과 함께 유품을 정리하다가 서랍 깊숙한 곳에서 낡은 회중시계 하나를 발견했다. 금속 덮개에는 오랜 세월의 흔적인 잔 흠집이 가득했고, 태엽을 감아도 시곗바늘은 미동도 하지 않았다. 은서는 그 시계를 손바닥 위에 올려놓고 가만히 들여다보았다. 시계 뒷면에는 알아보기 힘들 만큼 희미한 글씨가 새겨져 있었는데, 눈을 가늘게 뜨고 한 글자씩 읽어 내려가니 이런 문구가 적혀 있었다. 세상 끝까지 함께, 영원한 나의 벗에게라는 아름다운 문장이었다. 은서는 이 시계가 할아버지에게 대체 어떤 의미를 지닌 물건이었을지 궁금해지기 시작했다."
  },
  {
    id: "p2",
    text: "어머니께 여쭈어 보니, 그 시계는 할아버지의 젊은 시절 가장 친한 벗이었던 종민 할아버지가 선물한 것이라고 했다. 두 분은 중학교 때부터 단짝이었고, 성인이 되어서도 매주 한 번씩 만나 바둑을 두며 우정을 이어 갔다고 한다. 그러나 종민 할아버지가 오십 대에 갑작스러운 병으로 세상을 떠나신 뒤, 할아버지는 한동안 아무 말 없이 그 시계만 바라보며 시간을 보내셨다고 한다. 어머니는 아버지, 그러니까 은서의 할아버지가 가장 슬퍼하시던 시기에도 그 시계를 품에서 놓지 않으셨다고 덧붙이셨다. 은서는 할아버지의 서랍에 고이 간직되어 있던 그 시계가 단순한 물건이 아니라 깊은 우정의 증거였음을 비로소 이해하게 되었다."
  },
  {
    id: "p3",
    text: "은서는 멈춰 있는 시계를 다시 살려 보고 싶다는 생각이 들어 동네의 오래된 시계 수리점을 찾아갔다. 수리점 주인 아저씨는 돋보기를 쓰고 시계를 한참 살펴보더니, 태엽이 녹슬어 작동이 안 되는 것이지 내부 구조 자체는 아직 멀쩡하다고 말했다. 아저씨가 조심스럽게 뒷면을 열고 녹슨 부품을 하나하나 교체하자, 멈춰 있던 시곗바늘이 느릿느릿 움직이기 시작했다. 은서는 뛰는 가슴을 억누르며 째깍째깍 규칙적으로 흘러가는 초침 소리에 귀를 기울였다. 마치 오랫동안 깊이 잠들어 있던 할아버지의 추억이 다시 깨어나는 것 같은 느낌이 들었다."
  },
  {
    id: "p4",
    text: "집으로 돌아온 은서는 되살아난 시계를 책상 위에 올려놓고 한참을 바라보았다. 째깍째깍 규칙적으로 흘러가는 소리가 방 안을 조용히 채웠다. 은서는 문득 할아버지가 생전에 종종 하시던 말씀을 떠올렸다. 할아버지는 시간은 지나가는 것이 아니라 쌓이는 것이라고, 함께 보낸 시간은 절대 사라지지 않는다고 말씀하시곤 했다. 은서는 이제야 그 말씀의 의미를 온전히 이해할 수 있었다. 할아버지와 종민 할아버지가 쌓아 온 우정이 이 작은 시계 안에 고스란히 남아 있듯이, 은서와 할아버지가 함께한 시간도 영원히 자신의 마음속에 살아 있을 것이라 믿었다."
  }
];

const totalLength = paragraphs.reduce((sum, p) => sum + p.text.length, 0);
console.log(`총 글자수: ${totalLength}`);
if (totalLength < 1250 || totalLength > 1350) {
  console.warn(`경고: 목표 범위(1250~1350)를 벗어남!`);
}

function findRange(paragraphId, searchText) {
  const para = paragraphs.find(p => p.id === paragraphId);
  if (!para) throw new Error(`문단 ${paragraphId}을 찾을 수 없음`);
  const start = para.text.indexOf(searchText);
  if (start === -1) throw new Error(`"${searchText}"을(를) ${paragraphId}에서 찾을 수 없음`);
  return { paragraphId, start, end: start + searchText.length };
}

function splitSentences(text) {
  const sentences = [];
  const regex = /[.?!](?:\s|$)/g;
  let start = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const end = match.index + 1;
    const sent = text.substring(start, end).trim();
    if (sent) {
      const actualStart = text.indexOf(sent, start);
      sentences.push({ start: actualStart, end: actualStart + sent.length, text: sent });
    }
    start = match.index + match[0].length;
  }
  if (start < text.length) {
    const remaining = text.substring(start).trim();
    if (remaining) {
      const actualStart = text.indexOf(remaining, start);
      sentences.push({ start: actualStart, end: actualStart + remaining.length, text: remaining });
    }
  }
  return sentences;
}

const paragraphSentences = {};
for (const para of paragraphs) {
  const sentences = splitSentences(para.text);
  paragraphSentences[para.id] = sentences;
  console.log(`${para.id}: ${sentences.length}문장, 길이: ${para.text.length}자`);
}

const timeline = [];
let stepCount = 0;

const questionData = {
  p1: [
    {
      prompt: "첫 문장에서 은서가 발견한 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할아버지 유품 서랍에서 낡은 회중시계를 발견했다." },
        { id: "B", text: "할아버지의 일기장에서 오래된 편지를 발견했다." },
        { id: "C", text: "할아버지의 옷장에서 군복을 발견했다." },
        { id: "D", text: "할아버지의 책장에서 사진첩을 발견했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 시계의 상태로 알맞은 것은?",
      choices: [
        { id: "A", text: "흠집이 가득하고 태엽을 감아도 바늘이 움직이지 않았다." },
        { id: "B", text: "깨끗한 상태였지만 시간이 맞지 않았다." },
        { id: "C", text: "유리가 깨져 있었지만 작동은 되고 있었다." },
        { id: "D", text: "새것처럼 반짝였고 정확한 시간을 가리키고 있었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 은서의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "시계를 손바닥 위에 올려놓고 가만히 들여다보았다." },
        { id: "B", text: "시계를 서랍에 다시 넣고 문을 닫았다." },
        { id: "C", text: "시계를 어머니에게 바로 가져다 드렸다." },
        { id: "D", text: "시계를 분해하여 내부 구조를 살펴보았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 시계 뒷면의 글씨 상태로 알맞은 것은?",
      choices: [
        { id: "A", text: "알아보기 힘들 만큼 희미한 글씨가 새겨져 있었다." },
        { id: "B", text: "선명하고 또렷한 글씨가 크게 적혀 있었다." },
        { id: "C", text: "외국어로 된 글씨가 새겨져 있었다." },
        { id: "D", text: "아무런 글씨도 새겨져 있지 않았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 시계에 새겨진 문구로 알맞은 것은?",
      choices: [
        { id: "A", text: "세상 끝까지 함께, 영원한 나의 벗에게라는 문장이었다." },
        { id: "B", text: "시간은 금이라는 격언이 새겨져 있었다." },
        { id: "C", text: "할아버지의 이름과 생년월일이 적혀 있었다." },
        { id: "D", text: "시계를 만든 회사의 상호가 새겨져 있었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 은서의 심리로 알맞은 것은?",
      choices: [
        { id: "A", text: "시계가 할아버지에게 어떤 의미였을지 궁금해졌다." },
        { id: "B", text: "시계의 금전적 가치가 궁금해졌다." },
        { id: "C", text: "시계를 빨리 팔고 싶다는 생각이 들었다." },
        { id: "D", text: "시계가 고장 난 것에 실망하여 흥미를 잃었다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "은서가 할아버지의 낡은 회중시계를 발견하고 그 의미에 호기심을 갖는다." },
        { id: "B", text: "은서가 할아버지의 유품을 전부 정리하여 기부한다." },
        { id: "C", text: "은서가 시계를 수리점에 가져가 고친다." },
        { id: "D", text: "할아버지가 시계를 어떻게 구입했는지 설명한다." }
      ],
      answerId: "A"
    }
  ],
  p2: [
    {
      prompt: "첫 문장에서 시계를 선물한 사람으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할아버지의 가장 친한 벗이었던 종민 할아버지이다." },
        { id: "B", text: "할아버지의 아버지, 즉 은서의 증조할아버지이다." },
        { id: "C", text: "할아버지가 군대 시절 만난 동료이다." },
        { id: "D", text: "할아버지가 직접 구매한 것이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 두 분의 우정 유지 방식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "중학교 때부터 단짝으로 매주 만나 바둑을 두었다." },
        { id: "B", text: "편지를 주고받으며 연락을 이어 갔다." },
        { id: "C", text: "같은 직장에 다니며 매일 함께 출퇴근했다." },
        { id: "D", text: "해외 여행을 함께 다니며 우정을 쌓았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 종민 할아버지가 세상을 떠난 뒤 할아버지의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "한동안 아무 말 없이 시계만 바라보며 시간을 보내셨다." },
        { id: "B", text: "바둑 동호회에 가입하여 새 친구를 사귀셨다." },
        { id: "C", text: "시계를 서랍에 넣고 다시 꺼내지 않으셨다." },
        { id: "D", text: "곧바로 일상으로 돌아가 평소처럼 지내셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 할아버지가 시계를 어떻게 대하셨는지 알맞은 것은?",
      choices: [
        { id: "A", text: "가장 슬퍼하시던 시기에도 품에서 놓지 않으셨다." },
        { id: "B", text: "슬퍼하다가 결국 시계를 버리셨다." },
        { id: "C", text: "시계를 은서에게 직접 전해 주셨다." },
        { id: "D", text: "시계를 박물관에 기증하셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 은서가 이해한 바로 알맞은 것은?",
      choices: [
        { id: "A", text: "시계가 단순한 물건이 아니라 깊은 우정의 증거였다." },
        { id: "B", text: "시계가 높은 골동품 가치를 지닌 물건이었다." },
        { id: "C", text: "시계가 할아버지의 직업과 관련된 도구였다." },
        { id: "D", text: "시계가 원래 은서에게 줄 생일 선물이었다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "시계에 담긴 할아버지와 종민 할아버지의 깊은 우정 이야기를 알게 되었다." },
        { id: "B", text: "은서가 시계를 수리하기 위해 여러 곳을 돌아다녔다." },
        { id: "C", text: "어머니가 시계의 제조 과정을 상세히 설명해 주었다." },
        { id: "D", text: "할아버지가 종민 할아버지와 사이가 나빠진 이유를 알게 되었다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    {
      prompt: "첫 문장에서 은서가 한 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "시계를 고치고 싶어 동네 시계 수리점을 찾아갔다." },
        { id: "B", text: "시계를 인터넷에서 판매하려고 가격을 알아보았다." },
        { id: "C", text: "시계를 학교에 가져가 친구들에게 보여 주었다." },
        { id: "D", text: "시계를 그대로 서랍에 다시 넣어 두었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 수리점 주인이 진단한 고장 원인으로 알맞은 것은?",
      choices: [
        { id: "A", text: "태엽이 녹슬어 작동이 안 되지만 구조는 멀쩡하다." },
        { id: "B", text: "시계의 유리가 깨져서 수리가 불가능하다." },
        { id: "C", text: "시계 내부 부품이 모두 마모되어 교체해야 한다." },
        { id: "D", text: "시계의 배터리가 다 되어 새것으로 교체해야 한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 부품을 교체한 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "녹슨 부품을 교체하자 시곗바늘이 움직이기 시작했다." },
        { id: "B", text: "부품을 교체했으나 여전히 작동하지 않았다." },
        { id: "C", text: "부품 교체 후 시계가 너무 빨리 돌아갔다." },
        { id: "D", text: "수리를 포기하고 새 시계를 추천받았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 은서의 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "뛰는 가슴을 억누르며 초침 소리에 귀를 기울였다." },
        { id: "B", text: "수리비가 비싸서 실망하며 한숨을 쉬었다." },
        { id: "C", text: "시계가 움직이자 별로 감흥 없이 가방에 넣었다." },
        { id: "D", text: "수리점에서 나와 친구에게 전화를 걸었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 은서가 느낀 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할아버지의 추억이 다시 깨어나는 것 같은 느낌이 들었다." },
        { id: "B", text: "시계가 너무 낡아 새 시계를 사고 싶다는 생각이 들었다." },
        { id: "C", text: "할아버지에 대한 기억이 점점 흐려진다고 느꼈다." },
        { id: "D", text: "시계 수리비를 후회하며 아깝다는 생각이 들었다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "은서가 시계를 수리하여 다시 작동시키며 할아버지의 추억을 되살렸다." },
        { id: "B", text: "시계가 고장 나서 결국 버리게 되었다." },
        { id: "C", text: "수리점 주인이 시계의 역사를 자세히 설명해 주었다." },
        { id: "D", text: "은서가 시계 대신 새로운 기념품을 구입했다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    {
      prompt: "첫 문장에서 은서의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "되살아난 시계를 책상 위에 올려놓고 한참을 바라보았다." },
        { id: "B", text: "시계를 원래 있던 서랍에 다시 넣어 두었다." },
        { id: "C", text: "시계를 어머니에게 돌려드렸다." },
        { id: "D", text: "시계를 친구에게 선물로 주었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 방 안을 채운 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "째깍째깍 규칙적으로 흘러가는 시계 소리가 방을 채웠다." },
        { id: "B", text: "라디오에서 나오는 음악이 방 안에 울려 퍼졌다." },
        { id: "C", text: "창밖에서 들려오는 빗소리가 방 안을 채웠다." },
        { id: "D", text: "에어컨 바람 소리가 방 안 가득 울렸다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 은서가 떠올린 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할아버지가 생전에 종종 하시던 말씀을 떠올렸다." },
        { id: "B", text: "학교에서 배운 시간의 과학적 정의를 떠올렸다." },
        { id: "C", text: "어머니가 해 주신 할아버지의 어린 시절 이야기를 떠올렸다." },
        { id: "D", text: "종민 할아버지의 장례식 장면을 떠올렸다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 할아버지가 하시던 말씀으로 알맞은 것은?",
      choices: [
        { id: "A", text: "시간은 지나가는 것이 아니라 쌓이는 것이라고 하셨다." },
        { id: "B", text: "시간을 아껴야 성공할 수 있다고 하셨다." },
        { id: "C", text: "과거는 돌아보지 말고 미래만 생각하라고 하셨다." },
        { id: "D", text: "시계는 항상 정확하게 맞춰 놓아야 한다고 하셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 은서의 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "이제야 할아버지 말씀의 의미를 온전히 이해하게 되었다." },
        { id: "B", text: "할아버지의 말씀이 여전히 이해되지 않았다." },
        { id: "C", text: "할아버지의 말씀에 반발하는 마음이 생겼다." },
        { id: "D", text: "할아버지의 말씀을 친구에게 설명해 주었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 은서가 믿는 바로 알맞은 것은?",
      choices: [
        { id: "A", text: "할아버지와 함께한 시간이 영원히 마음속에 살아 있을 것이다." },
        { id: "B", text: "시계를 팔면 할아버지의 빚을 갚을 수 있을 것이다." },
        { id: "C", text: "시간이 지나면 할아버지에 대한 기억은 사라질 것이다." },
        { id: "D", text: "시계를 박물관에 기증하는 것이 올바른 선택이다." }
      ],
      answerId: "A"
    },
    // 중심내용
    {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "은서가 할아버지의 말씀을 이해하며 함께한 시간의 소중함을 깨달았다." },
        { id: "B", text: "은서가 시계를 팔기로 결심하고 골동품점을 찾았다." },
        { id: "C", text: "은서가 할아버지의 일기를 발견하여 읽기 시작했다." },
        { id: "D", text: "어머니가 할아버지의 유품을 모두 정리하여 기부했다." }
      ],
      answerId: "A"
    }
  ]
};

for (const para of paragraphs) {
  const sentences = paragraphSentences[para.id];
  const questions = questionData[para.id];

  for (let i = 0; i < sentences.length; i++) {
    stepCount++;
    timeline.push({
      stepId: `s${stepCount}`,
      highlight: {
        ranges: [{ paragraphId: para.id, start: sentences[i].start, end: sentences[i].end }]
      },
      question: {
        ...questions[i],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  stepCount++;
  const paraEnd = sentences[sentences.length - 1].end;
  timeline.push({
    stepId: `s${stepCount}`,
    highlight: {
      ranges: [{ paragraphId: para.id, start: 0, end: paraEnd }]
    },
    question: {
      ...questions[questions.length - 1],
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

const recallCards = [
  { id: "c1", text: "은서는 할아버지 유품 서랍에서 낡은 회중시계를 발견했다." },
  { id: "c2", text: "시계 뒷면에는 '세상 끝까지 함께, 영원한 나의 벗에게'라는 문구가 있었다." },
  { id: "c3", text: "시계는 할아버지의 절친 종민 할아버지가 선물한 것이었다." },
  { id: "c4", text: "종민 할아버지가 돌아가신 뒤 할아버지는 시계를 품에서 놓지 않으셨다." },
  { id: "c5", text: "은서는 시계를 수리점에 가져가 녹슨 태엽을 교체하여 되살렸다." },
  { id: "c6", text: "시계 소리에 할아버지의 추억이 다시 깨어나는 느낌을 받았다." },
  { id: "c7", text: "할아버지는 시간은 지나가는 것이 아니라 쌓이는 것이라 말씀하셨다." },
  { id: "c8", text: "은서는 할아버지와 함께한 시간이 영원히 마음속에 남을 것이라 믿었다." }
];

const confirmQuestions = [
  {
    id: "q1",
    prompt: "은서가 할아버지의 서랍에서 발견한 물건은 무엇인가?",
    answerText: "낡은 회중시계",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", "낡은 회중시계 하나를 발견했다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q2",
    prompt: "시계 뒷면에 새겨진 문구는 무엇인가?",
    answerText: "세상 끝까지 함께, 영원한 나의 벗에게",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", "세상 끝까지 함께, 영원한 나의 벗에게")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q3",
    prompt: "그 시계를 할아버지에게 선물한 사람은 누구인가?",
    answerText: "종민 할아버지",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "종민 할아버지가 선물한 것")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q4",
    prompt: "시계 수리점 주인이 진단한 고장 원인은 무엇인가?",
    answerText: "태엽이 녹슬어 작동이 안 되는 것",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "태엽이 녹슬어 작동이 안 되는 것")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q5",
    prompt: "할아버지가 시간에 대해 하시던 말씀은 무엇인가?",
    answerText: "시간은 지나가는 것이 아니라 쌓이는 것",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "시간은 지나가는 것이 아니라 쌓이는 것이라고")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q6",
    prompt: "은서가 시계 수리 후 느낀 감정은 무엇에 비유되었는가?",
    answerText: "할아버지의 추억이 다시 깨어나는 것",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "오랫동안 깊이 잠들어 있던 할아버지의 추억이 다시 깨어나는 것 같은 느낌")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q7",
    prompt: "은서가 마지막에 믿게 된 것은 무엇인가?",
    answerText: "할아버지와 함께한 시간이 영원히 마음속에 살아 있을 것",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "할아버지가 함께한 시간도 영원히 자신의 마음속에 살아 있을 것이라 믿었다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }
];

const content = {
  contentId: "dr-r3-006",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 6 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_3",
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
      correctOrder: recallCards.map(c => c.id),
      seedPenalty: 1
    },
    confirm: { questions: confirmQuestions }
  }
};

// 검증
console.log(`\n=== 검증 ===`);
console.log(`intensive steps: ${timeline.length}`);
console.log(`recall cards: ${recallCards.length}`);
console.log(`confirm questions: ${confirmQuestions.length}`);

let errors = 0;
for (const step of timeline) {
  for (const range of step.highlight.ranges) {
    const para = paragraphs.find(p => p.id === range.paragraphId);
    if (range.start < 0 || range.end > para.text.length || range.start >= range.end) {
      console.error(`오류: ${step.stepId} - 범위 초과 (${range.start}-${range.end}, 문단 길이: ${para.text.length})`);
      errors++;
    }
  }
}

for (const q of confirmQuestions) {
  for (const range of q.answerRanges) {
    const para = paragraphs.find(p => p.id === range.paragraphId);
    if (range.start < 0 || range.end > para.text.length) {
      console.error(`오류: ${q.id} - answerRange 범위 초과`);
      errors++;
    }
    console.log(`  ${q.id}: "${para.text.substring(range.start, range.end)}"`);
  }
}

if (errors === 0) console.log(`\n모든 검증 통과!`);
else { console.error(`\n${errors}개 오류 발견!`); process.exit(1); }

const fs = require('fs');
const outputPath = process.argv[2] || 'day6-output.json';
fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outputPath}`);
