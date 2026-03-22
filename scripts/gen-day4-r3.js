// Day 4 - LITERATURE (문학) - 러셀3
// 소설 지문: 현대소설 스타일 - 성장 서사
// 인용문 내부 마침표 문제를 피하기 위해 대화문은 간접 인용으로 처리

const paragraphs = [
  {
    id: "p1",
    text: "여름방학이 시작되던 날, 민수는 외할머니 댁이 있는 시골 마을로 내려갔다. 서울에서 태어나고 자란 민수에게 시골은 낯설고 불편한 곳이었다. 아파트 대신 낡은 기와집이 있었고, 편의점 대신 걸어서 이십 분은 가야 하는 구멍가게가 전부였다. 도착한 첫날 밤, 민수는 모기 소리와 개구리 울음소리에 한숨도 잠을 이루지 못했다. 할머니는 잠 못 드는 민수를 보며 빙그레 웃으시더니, 며칠만 지나면 그 소리가 자장가처럼 들릴 거라고 다독여 주셨다. 민수는 속으로 그럴 리가 없다고 생각했지만, 할머니의 주름진 얼굴에 서린 따뜻한 미소를 보며 억지로 고개를 끄덕였다."
  },
  {
    id: "p2",
    text: "다음 날 아침, 할머니는 민수를 텃밭으로 데려가셨다. 고추와 상추, 토마토와 오이가 가지런히 심어진 텃밭에서 할머니는 호미를 건네며 풀을 뽑아 보라고 하셨다. 민수는 마지못해 쪼그려 앉았지만, 흙이 손톱 밑으로 파고드는 감촉이 불쾌하여 서너 포기를 뽑고는 이내 일어서 버렸다. 할머니는 민수를 나무라지 않으시고 대신 직접 풀을 뽑으시며, 식물이 자라려면 곁에 있는 잡초를 치워 줘야 하듯이 사람도 마음속에 쓸데없는 걱정이 너무 많으면 정작 중요한 것이 자랄 수 없다고 말씀하셨다. 민수는 할머니의 말이 무슨 뜻인지 잘 이해하지 못한 채 고개만 갸웃거렸다."
  },
  {
    id: "p3",
    text: "일주일쯤 지나자 민수의 생활에 조금씩 변화가 찾아왔다. 아침마다 텃밭에 나가 물을 주는 것이 습관이 되었고, 자신이 심은 방울토마토가 조금씩 빨갛게 익어 가는 모습에 묘한 보람을 느꼈다. 동네 아이들과도 친해져서 개울에서 물고기를 잡거나 뒷산에 올라 매미 소리를 들으며 뛰어놀았다. 어느 날 저녁, 마당에 앉아 하늘을 올려다보니 서울에서는 본 적 없는 수많은 별이 쏟아질 듯 빛나고 있었다. 민수는 그 광경에 한동안 말을 잃었다가, 문득 할머니가 말씀하셨던 잡초 이야기를 떠올렸다. 서울에서 휴대전화와 게임에만 매달려 있던 자신의 모습이 마치 잡초에 둘러싸인 어린 모종 같았다는 생각이 비로소 가슴에 와닿았다."
  },
  {
    id: "p4",
    text: "방학이 끝나 서울로 돌아가는 날, 민수는 할머니의 손을 꼭 잡았다. 할머니는 텃밭에서 딴 방울토마토 한 봉지를 건네시며, 이것은 민수가 직접 키운 것이니 서울에 가서도 가끔 흙냄새를 떠올려 보라고 하셨다. 버스에 올라 창밖을 바라보며 민수는 한 달 전의 자신과 지금의 자신이 꽤 달라졌음을 느꼈다. 불편하기만 했던 시골의 고요함이 이제는 그리운 것이 되었고, 할머니의 투박한 손길이 세상에서 가장 따뜻한 온기로 기억에 남았다. 민수는 창밖으로 스쳐 지나가는 초록빛 들판을 바라보며 다음 방학에도 꼭 할머니 댁에 오겠다고 작은 소리로 다짐했다."
  }
];

// 글자수 검증
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

// 문장 분리: 한국어 문장 종결 패턴 (마침표+공백, 끝)
function splitSentences(text) {
  const sentences = [];
  let start = 0;
  // "다." 패턴으로 문장 경계 찾기
  const regex = /[.?!](?:\s|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const end = match.index + 1; // 마침표까지
    const sent = text.substring(start, end).trim();
    if (sent) {
      const actualStart = text.indexOf(sent, start);
      sentences.push({ start: actualStart, end: actualStart + sent.length, text: sent });
    }
    start = match.index + match[0].length;
  }
  // 남은 텍스트
  if (start < text.length) {
    const remaining = text.substring(start).trim();
    if (remaining) {
      const actualStart = text.indexOf(remaining, start);
      sentences.push({ start: actualStart, end: actualStart + remaining.length, text: remaining });
    }
  }
  return sentences;
}

// 각 문단의 문장별 범위 계산
const paragraphSentences = {};
for (const para of paragraphs) {
  const sentences = splitSentences(para.text);
  paragraphSentences[para.id] = sentences;
  console.log(`${para.id}: ${sentences.length}문장, 길이: ${para.text.length}자`);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    console.log(`  문장${i+1} [${s.start}-${s.end}]: "${s.text.substring(0, 40)}..."`);
  }
}

// intensive timeline 생성
const timeline = [];
let stepCount = 0;

// 질문 데이터
const questionData = {
  p1: [
    {
      prompt: "첫 문장에서 민수가 간 곳은 어디인가?",
      choices: [
        { id: "A", text: "외할머니가 사시는 시골 마을로 여름방학에 내려갔다." },
        { id: "B", text: "친구네 별장이 있는 바닷가 마을로 놀러 갔다." },
        { id: "C", text: "아버지의 고향인 산속 마을로 이사를 갔다." },
        { id: "D", text: "학교에서 단체로 떠나는 농촌 체험에 참여했다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장이 전달하는 민수의 감정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "시골이 낯설고 불편한 곳이라고 느끼고 있다." },
        { id: "B", text: "시골에 대한 기대감으로 가득 차 있다." },
        { id: "C", text: "서울을 떠나게 되어 매우 슬퍼하고 있다." },
        { id: "D", text: "시골 생활에 이미 익숙해져 편안하다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장이 대비하는 두 공간의 차이로 알맞은 것은?",
      choices: [
        { id: "A", text: "아파트와 편의점 대신 기와집과 먼 구멍가게가 있다." },
        { id: "B", text: "학교와 학원 대신 논밭과 목장이 펼쳐져 있다." },
        { id: "C", text: "고층 빌딩 대신 현대식 단독 주택이 늘어서 있다." },
        { id: "D", text: "지하철역 대신 기차역이 마을 중심에 자리 잡았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 민수가 잠을 이루지 못한 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "모기 소리와 개구리 울음소리 때문에 잠들지 못했다." },
        { id: "B", text: "할머니가 늦게까지 이야기를 들려주셨기 때문이다." },
        { id: "C", text: "더운 날씨에 에어컨이 없어서 잠들지 못했다." },
        { id: "D", text: "낯선 방의 어둠이 무서워서 잠이 오지 않았다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 할머니가 민수를 다독인 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "며칠만 지나면 소리가 자장가처럼 들릴 것이라 하셨다." },
        { id: "B", text: "모기 소리가 싫으면 귀마개를 사용하라고 하셨다." },
        { id: "C", text: "시골 소리에 적응 못 하면 서울로 돌아가라 하셨다." },
        { id: "D", text: "밤에는 일찍 자야 건강에 좋다고 충고하셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 드러나는 민수의 태도로 알맞은 것은?",
      choices: [
        { id: "A", text: "동의하지 않지만 할머니의 미소에 억지로 고개를 끄덕였다." },
        { id: "B", text: "할머니 말에 완전히 공감하며 진심으로 동의했다." },
        { id: "C", text: "할머니의 말을 무시하고 방으로 돌아가 버렸다." },
        { id: "D", text: "할머니에게 서울로 돌려보내 달라고 부탁했다." }
      ],
      answerId: "A"
    },
    // 문단 중심내용
    {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "서울 소년 민수가 시골에 도착하여 낯선 환경에 적응하지 못하고 있다." },
        { id: "B", text: "민수가 할머니의 시골집을 수리하기 위해 방학에 내려갔다." },
        { id: "C", text: "할머니가 민수에게 시골의 역사를 가르쳐 주셨다." },
        { id: "D", text: "민수가 시골에 도착하자마자 동네 아이들과 친해졌다." }
      ],
      answerId: "A"
    }
  ],
  p2: [
    {
      prompt: "첫 문장에서 할머니가 민수를 데려간 곳은 어디인가?",
      choices: [
        { id: "A", text: "다음 날 아침 텃밭으로 데려가셨다." },
        { id: "B", text: "동네 어귀에 있는 오래된 시장이다." },
        { id: "C", text: "뒷산 정상에 있는 전망대이다." },
        { id: "D", text: "마을 한가운데에 있는 공동 우물이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 할머니가 민수에게 시킨 일로 알맞은 것은?",
      choices: [
        { id: "A", text: "호미를 건네며 풀을 뽑아 보라고 하셨다." },
        { id: "B", text: "물뿌리개를 주며 물을 주라고 하셨다." },
        { id: "C", text: "삽을 건네며 새 밭을 파라고 하셨다." },
        { id: "D", text: "바구니를 주며 열매를 따라고 하셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 민수가 풀 뽑기를 그만둔 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "흙이 손톱 밑으로 파고드는 감촉이 불쾌했기 때문이다." },
        { id: "B", text: "무릎이 아파서 더 이상 앉아 있을 수 없었다." },
        { id: "C", text: "벌레가 손 위를 기어 다녀 무서웠기 때문이다." },
        { id: "D", text: "할머니가 그만하라고 말씀하셨기 때문이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 할머니가 잡초 비유로 전한 뜻으로 알맞은 것은?",
      choices: [
        { id: "A", text: "마음에 쓸데없는 걱정이 많으면 중요한 것이 자랄 수 없다." },
        { id: "B", text: "잡초를 뽑으면 건강이 좋아진다는 뜻이다." },
        { id: "C", text: "식물처럼 사람도 물과 햇빛이 필요하다는 뜻이다." },
        { id: "D", text: "농사일을 해야 인내심을 기를 수 있다는 의미이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 민수의 상태로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니의 말뜻을 이해하지 못한 채 고개를 갸웃거렸다." },
        { id: "B", text: "할머니의 비유에 감동하여 눈물을 흘렸다." },
        { id: "C", text: "할머니의 말씀을 듣고 바로 잡초를 다시 뽑기 시작했다." },
        { id: "D", text: "할머니의 말에 반발하여 서울로 가겠다고 했다." }
      ],
      answerId: "A"
    },
    // 문단 중심내용
    {
      prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니가 텃밭 일을 통해 삶의 지혜를 전했지만 민수는 아직 이해하지 못했다." },
        { id: "B", text: "민수가 텃밭에서 열심히 일하며 농사의 즐거움을 깨달았다." },
        { id: "C", text: "할머니가 민수에게 다양한 요리법을 가르쳐 주셨다." },
        { id: "D", text: "민수가 텃밭에서 수확한 채소를 시장에 내다 팔았다." }
      ],
      answerId: "A"
    }
  ],
  p3: [
    {
      prompt: "첫 문장에서 민수에게 일어난 변화로 알맞은 것은?",
      choices: [
        { id: "A", text: "일주일쯤 지나자 생활에 조금씩 변화가 찾아왔다." },
        { id: "B", text: "민수가 시골에 오자마자 바로 적응했다." },
        { id: "C", text: "민수가 시골 생활이 싫어져 서울로 돌아갔다." },
        { id: "D", text: "할머니와 크게 다투고 나서 마음을 바꿨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 민수가 보람을 느낀 이유로 알맞은 것은?",
      choices: [
        { id: "A", text: "자신이 심은 방울토마토가 빨갛게 익어 가는 모습 때문이다." },
        { id: "B", text: "동네 아이들과 함께 물고기를 많이 잡았기 때문이다." },
        { id: "C", text: "할머니가 용돈을 주셔서 기분이 좋았기 때문이다." },
        { id: "D", text: "텃밭의 모든 잡초를 혼자서 다 뽑았기 때문이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 민수가 동네 아이들과 한 활동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "개울에서 물고기를 잡거나 뒷산에서 뛰어놀았다." },
        { id: "B", text: "마을 회관에서 보드게임을 하며 시간을 보냈다." },
        { id: "C", text: "학교 운동장에서 축구 시합을 했다." },
        { id: "D", text: "집에서 텔레비전을 보며 함께 시간을 보냈다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 민수가 본 풍경으로 알맞은 것은?",
      choices: [
        { id: "A", text: "서울에서 본 적 없는 수많은 별이 빛나고 있었다." },
        { id: "B", text: "하늘에 구름 한 점 없이 맑은 달이 떠 있었다." },
        { id: "C", text: "비가 쏟아지며 무지개가 걸려 있었다." },
        { id: "D", text: "석양이 붉게 물들며 산 너머로 지고 있었다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 민수가 떠올린 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "할머니가 말씀하셨던 잡초 이야기를 떠올렸다." },
        { id: "B", text: "서울 친구들과 놀던 기억을 떠올렸다." },
        { id: "C", text: "학교에서 배운 별자리 수업이 떠올랐다." },
        { id: "D", text: "어머니가 해 주신 음식이 그리워졌다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 민수가 깨달은 바로 알맞은 것은?",
      choices: [
        { id: "A", text: "게임에 매달리던 자신이 잡초에 둘러싸인 모종 같았다고 느꼈다." },
        { id: "B", text: "시골보다 서울이 자신에게 더 맞는 곳이라고 느꼈다." },
        { id: "C", text: "앞으로 농부가 되어 시골에서 살겠다고 결심했다." },
        { id: "D", text: "할머니의 잡초 이야기가 틀렸다고 생각했다." }
      ],
      answerId: "A"
    },
    // 문단 중심내용
    {
      prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "시골 생활에 적응하며 민수가 할머니의 잡초 비유의 의미를 깨달았다." },
        { id: "B", text: "민수가 동네 아이들과 싸워서 외로운 시간을 보냈다." },
        { id: "C", text: "민수가 별을 보고 천문학자가 되겠다는 꿈을 갖게 되었다." },
        { id: "D", text: "민수가 텃밭 가꾸기를 거부하고 방에만 틀어박혀 있었다." }
      ],
      answerId: "A"
    }
  ],
  p4: [
    {
      prompt: "첫 문장에서 민수의 행동으로 알맞은 것은?",
      choices: [
        { id: "A", text: "서울로 돌아가는 날 할머니의 손을 꼭 잡았다." },
        { id: "B", text: "서울로 돌아가기 싫어 할머니 집에 더 머물렀다." },
        { id: "C", text: "할머니에게 인사도 하지 않고 급히 떠났다." },
        { id: "D", text: "할머니와 함께 서울로 올라갔다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 할머니가 민수에게 건넨 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "민수가 직접 키운 방울토마토 한 봉지를 건네셨다." },
        { id: "B", text: "새로 산 휴대전화를 선물로 주셨다." },
        { id: "C", text: "할머니가 직접 짠 목도리를 건네셨다." },
        { id: "D", text: "용돈이 든 봉투를 손에 쥐어 주셨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 민수가 느낀 것으로 알맞은 것은?",
      choices: [
        { id: "A", text: "한 달 전의 자신과 지금의 자신이 꽤 달라졌음을 느꼈다." },
        { id: "B", text: "시골에서의 시간이 지루했다는 것을 깨달았다." },
        { id: "C", text: "서울로 돌아가는 것이 기쁘기만 했다." },
        { id: "D", text: "할머니와의 시간이 아무런 의미가 없었다고 느꼈다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 민수의 달라진 인식으로 알맞은 것은?",
      choices: [
        { id: "A", text: "불편했던 시골의 고요함이 그리운 것이 되었다." },
        { id: "B", text: "시골의 불편함이 여전히 싫게 느껴졌다." },
        { id: "C", text: "할머니의 손길이 거칠게만 느껴졌다." },
        { id: "D", text: "서울의 소음이 더 편안하게 느껴졌다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 민수가 다짐한 내용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "다음 방학에도 꼭 할머니 댁에 오겠다고 다짐했다." },
        { id: "B", text: "다시는 시골에 오지 않겠다고 결심했다." },
        { id: "C", text: "할머니에게 서울로 올라오시라고 부탁했다." },
        { id: "D", text: "친구들에게 시골 이야기를 들려주겠다고 했다." }
      ],
      answerId: "A"
    },
    // 문단 중심내용
    {
      prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
      choices: [
        { id: "A", text: "민수가 시골 경험을 통해 성장하여 할머니와의 재회를 약속하며 떠났다." },
        { id: "B", text: "민수가 서울에 돌아가 시골 경험을 모두 잊어버렸다." },
        { id: "C", text: "할머니가 민수를 서울까지 직접 데려다주셨다." },
        { id: "D", text: "민수가 방학 동안 시골에서 아무것도 배우지 못했다." }
      ],
      answerId: "A"
    }
  ]
};

for (const para of paragraphs) {
  const sentences = paragraphSentences[para.id];
  const questions = questionData[para.id];

  // 문장별 step
  for (let i = 0; i < sentences.length; i++) {
    stepCount++;
    const sent = sentences[i];
    timeline.push({
      stepId: `s${stepCount}`,
      highlight: {
        ranges: [{ paragraphId: para.id, start: sent.start, end: sent.end }]
      },
      question: {
        ...questions[i],
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
  }

  // 문단 전체 중심내용 step
  stepCount++;
  const paraEnd = sentences[sentences.length - 1].end;
  timeline.push({
    stepId: `s${stepCount}`,
    highlight: {
      ranges: [{ paragraphId: para.id, start: 0, end: paraEnd }]
    },
    question: {
      ...questions[questions.length - 1], // 마지막이 중심내용 질문
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
    }
  });
}

// recall 카드 (정확히 8개)
const recallCards = [
  { id: "c1", text: "민수는 여름방학에 외할머니 댁이 있는 시골로 내려갔지만 낯설고 불편하게 느꼈다." },
  { id: "c2", text: "첫날 밤 모기와 개구리 소리에 잠 못 들었고, 할머니는 곧 익숙해질 거라 하셨다." },
  { id: "c3", text: "할머니는 민수를 텃밭에 데려가 풀을 뽑게 하셨지만, 민수는 금방 그만두었다." },
  { id: "c4", text: "할머니는 잡초를 치워야 식물이 자라듯 마음의 걱정도 비워야 한다고 말씀하셨다." },
  { id: "c5", text: "일주일 후 민수는 텃밭 물주기와 동네 아이들과의 놀이에 자연스럽게 빠져들었다." },
  { id: "c6", text: "밤하늘 별을 보며 민수는 할머니의 잡초 비유를 비로소 이해하기 시작했다." },
  { id: "c7", text: "돌아가는 날 할머니는 민수가 키운 방울토마토를 건네며 흙냄새를 기억하라 하셨다." },
  { id: "c8", text: "민수는 시골의 고요함이 그리워졌고, 다음 방학에도 꼭 오겠다고 다짐했다." }
];

// confirm 질문 (7문항, 질문형, answerRanges 정확 지정)
const confirmQuestions = [
  {
    id: "q1",
    prompt: "민수가 여름방학에 내려간 곳은 어디인가?",
    answerText: "외할머니 댁이 있는 시골 마을",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p1", "외할머니 댁이 있는 시골 마을")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q2",
    prompt: "할머니가 민수에게 텃밭에서 시킨 일은 무엇인가?",
    answerText: "풀을 뽑아 보라",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "풀을 뽑아 보라고 하셨다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q3",
    prompt: "할머니가 잡초 비유로 전달하고자 한 메시지는 무엇인가?",
    answerText: "마음속에 쓸데없는 걱정이 많으면 중요한 것이 자랄 수 없다",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p2", "마음속에 쓸데없는 걱정이 너무 많으면 정작 중요한 것이 자랄 수 없다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q4",
    prompt: "민수가 텃밭에서 직접 키워 보람을 느낀 작물은 무엇인가?",
    answerText: "방울토마토",
    answerMatchMode: "ANY",
    answerRanges: [
      findRange("p3", "방울토마토"),
      findRange("p4", "방울토마토")
    ],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q5",
    prompt: "별을 보며 민수가 깨달은 자신의 모습은 무엇에 비유되었는가?",
    answerText: "잡초에 둘러싸인 어린 모종",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p3", "잡초에 둘러싸인 어린 모종")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q6",
    prompt: "할머니가 돌아가는 민수에게 당부한 내용은 무엇인가?",
    answerText: "서울에 가서도 가끔 흙냄새를 떠올려 보라",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "서울에 가서도 가끔 흙냄새를 떠올려 보라고 하셨다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  },
  {
    id: "q7",
    prompt: "서울로 돌아가며 민수가 다짐한 것은 무엇인가?",
    answerText: "다음 방학에도 꼭 할머니 댁에 오겠다",
    answerMatchMode: "ANY",
    answerRanges: [findRange("p4", "다음 방학에도 꼭 할머니 댁에 오겠다고 작은 소리로 다짐했다")],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  }
];

const content = {
  contentId: "dr-r3-004",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 3) Day 4 문학",
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
    passage: {
      format: "TEXT",
      paragraphs
    },
    intensive: { timeline },
    recall: {
      cards: recallCards,
      correctOrder: recallCards.map(c => c.id),
      seedPenalty: 1
    },
    confirm: {
      questions: confirmQuestions
    }
  }
};

// 검증
console.log(`\n=== 검증 ===`);
console.log(`intensive steps: ${timeline.length}`);
console.log(`recall cards: ${recallCards.length}`);
console.log(`confirm questions: ${confirmQuestions.length}`);

// highlight range 검증
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

// answerRanges 검증
for (const q of confirmQuestions) {
  for (const range of q.answerRanges) {
    const para = paragraphs.find(p => p.id === range.paragraphId);
    if (range.start < 0 || range.end > para.text.length) {
      console.error(`오류: ${q.id} - answerRange 범위 초과`);
      errors++;
    }
    const extracted = para.text.substring(range.start, range.end);
    console.log(`  ${q.id}: "${extracted}"`);
  }
}

if (errors === 0) {
  console.log(`\n모든 검증 통과!`);
} else {
  console.error(`\n${errors}개 오류 발견!`);
  process.exit(1);
}

// JSON 출력
const fs = require('fs');
const outputPath = process.argv[2] || 'day4-output.json';
fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf8');
console.log(`\n파일 저장: ${outputPath}`);
