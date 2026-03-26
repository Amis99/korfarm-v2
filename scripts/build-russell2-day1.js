/**
 * 러셀2 Day 1 비문학 (광합성 주제) 콘텐츠 생성 스크립트
 * 중2~중3 수준, 1200자 ±50자
 */

// ── 지문 정의 ──
const paragraphs = [
  {
    id: "p1",
    text: "식물은 빛에너지를 이용하여 스스로 양분을 만들어 내는데, 이 과정을 광합성이라고 한다. 광합성은 주로 잎의 엽록체에서 일어나며, 빛에너지·물·이산화 탄소를 재료로 사용한다. 엽록체 안에는 엽록소라는 초록색 색소가 들어 있어, 빛을 흡수하는 역할을 맡는다. 흡수된 빛에너지는 물 분자를 분해하는 데 쓰이고, 이때 산소가 부산물로 발생한다. 잎 뒤쪽에 분포하는 기공이 열리면 산소는 바깥으로 나가고, 대기 중의 이산화 탄소가 잎 안으로 들어온다. 이렇게 들어온 이산화 탄소는 엽록체 안에서 화학 반응을 거쳐 포도당으로 바뀐다. 포도당은 식물이 살아가는 데 필요한 에너지원이자, 줄기와 뿌리를 키우는 기본 재료가 된다."
  },
  {
    id: "p2",
    text: "광합성의 속도는 빛의 세기, 온도, 이산화 탄소 농도라는 세 가지 조건에 크게 좌우된다. 빛이 강해질수록 광합성 속도는 빨라지지만, 일정 수준을 넘으면 더 이상 빨라지지 않는 포화 상태에 이른다. 온도 역시 적정 범위 안에서 광합성을 활발하게 해 주지만, 지나치게 높아지면 엽록체 속 효소가 제 기능을 잃어 오히려 속도가 떨어진다. 이산화 탄소 농도도 마찬가지여서, 농도가 높을수록 포도당 생산이 늘어나다가 어느 지점 이후에는 증가 폭이 줄어든다. 이처럼 세 조건은 각각 일정한 한계를 가지며, 광합성을 최대로 끌어올리려면 세 조건이 고루 갖추어져야 한다."
  },
  {
    id: "p3",
    text: "식물이 광합성을 통해 만들어 낸 포도당은 곧바로 전분의 형태로 바뀌어 잎에 저장된다. 낮 동안 쌓인 전분은 밤이 되면 다시 포도당으로 분해되어 체관을 통해 뿌리·줄기·열매 등으로 이동한다. 이 과정에서 식물은 호흡을 하며 포도당의 일부를 분해해 에너지를 얻는다. 호흡은 광합성과 반대 방향의 반응으로, 포도당과 산소를 소비하고 이산화 탄소와 물을 내보낸다. 낮에는 광합성량이 호흡량보다 많으므로 산소가 순방출되고, 밤에는 호흡만 일어나 이산화 탄소가 순방출된다. 이 균형 덕분에 식물은 낮에 에너지를 저축하고 밤에 그것을 소비하며 생장을 이어 간다."
  },
  {
    id: "p4",
    text: "광합성은 지구 생태계 전체에도 큰 영향을 미친다. 식물이 내뿜는 산소는 동물과 사람이 호흡하는 데 반드시 필요하며, 식물이 만든 유기물은 먹이 사슬의 출발점이 된다. 또한 식물이 이산화 탄소를 흡수함으로써 대기 중 온실 가스의 양을 조절하는 역할도 한다. 최근 지구 온난화가 심해지면서 숲을 보전하고 녹지를 확대하자는 움직임이 활발해지는 까닭도 여기에 있다. 결국 광합성은 식물 한 개체의 생존을 넘어 지구 전체의 환경과 생명을 유지하는 핵심 과정이라 할 수 있다."
  }
];

// ── 글자 수 확인 ──
const totalLen = paragraphs.reduce((s, p) => s + p.text.length, 0);
console.log("총 글자 수:", totalLen);
if (totalLen < 1150 || totalLen > 1250) {
  console.error("⚠ 글자 수 범위 벗어남! 1150~1250이어야 합니다.");
}

// ── 문장 경계 (수동 지정) ──
// p1 문장들
const p1Text = paragraphs[0].text;
const p1Sentences = [];
{
  const boundaries = [
    [0, p1Text.indexOf("광합성은 주로")],
    [p1Text.indexOf("광합성은 주로"), p1Text.indexOf("엽록체 안에는")],
    [p1Text.indexOf("엽록체 안에는"), p1Text.indexOf("흡수된 빛에너지는")],
    [p1Text.indexOf("흡수된 빛에너지는"), p1Text.indexOf("잎 뒤쪽에")],
    [p1Text.indexOf("잎 뒤쪽에"), p1Text.indexOf("이렇게 들어온")],
    [p1Text.indexOf("이렇게 들어온"), p1Text.indexOf("포도당은 식물이")],
    [p1Text.indexOf("포도당은 식물이"), p1Text.length]
  ];
  for (const [s, e] of boundaries) {
    p1Sentences.push({ start: s, end: e });
  }
}

const p2Text = paragraphs[1].text;
const p2Sentences = [];
{
  const boundaries = [
    [0, p2Text.indexOf("빛이 강해질수록")],
    [p2Text.indexOf("빛이 강해질수록"), p2Text.indexOf("온도 역시")],
    [p2Text.indexOf("온도 역시"), p2Text.indexOf("이산화 탄소 농도도")],
    [p2Text.indexOf("이산화 탄소 농도도"), p2Text.indexOf("이처럼 세 조건은")],
    [p2Text.indexOf("이처럼 세 조건은"), p2Text.length]
  ];
  for (const [s, e] of boundaries) {
    p2Sentences.push({ start: s, end: e });
  }
}

const p3Text = paragraphs[2].text;
const p3Sentences = [];
{
  const boundaries = [
    [0, p3Text.indexOf("낮 동안 쌓인")],
    [p3Text.indexOf("낮 동안 쌓인"), p3Text.indexOf("이 과정에서")],
    [p3Text.indexOf("이 과정에서"), p3Text.indexOf("호흡은 광합성과")],
    [p3Text.indexOf("호흡은 광합성과"), p3Text.indexOf("낮에는 광합성량이")],
    [p3Text.indexOf("낮에는 광합성량이"), p3Text.indexOf("이 균형 덕분에")],
    [p3Text.indexOf("이 균형 덕분에"), p3Text.length]
  ];
  for (const [s, e] of boundaries) {
    p3Sentences.push({ start: s, end: e });
  }
}

const p4Text = paragraphs[3].text;
const p4Sentences = [];
{
  const boundaries = [
    [0, p4Text.indexOf("식물이 내뿜는")],
    [p4Text.indexOf("식물이 내뿜는"), p4Text.indexOf("또한 식물이")],
    [p4Text.indexOf("또한 식물이"), p4Text.indexOf("최근 지구 온난화가")],
    [p4Text.indexOf("최근 지구 온난화가"), p4Text.indexOf("결국 광합성은")],
    [p4Text.indexOf("결국 광합성은"), p4Text.length]
  ];
  for (const [s, e] of boundaries) {
    p4Sentences.push({ start: s, end: e });
  }
}

// ── ranges 유효성 검증 ──
function validateRanges(pid, text, sentences) {
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (s.start < 0 || s.end < 0) {
      console.error(`✗ ${pid} 문장${i+1}: indexOf 실패 (start=${s.start}, end=${s.end})`);
    }
    if (s.start >= s.end) {
      console.error(`✗ ${pid} 문장${i+1}: start(${s.start}) >= end(${s.end})`);
    }
    const excerpt = text.substring(s.start, Math.min(s.start + 20, s.end));
    console.log(`  ${pid} 문장${i+1}: [${s.start},${s.end}] "${excerpt}..."`);
  }
}
console.log("\n=== ranges 검증 ===");
validateRanges("p1", p1Text, p1Sentences);
validateRanges("p2", p2Text, p2Sentences);
validateRanges("p3", p3Text, p3Sentences);
validateRanges("p4", p4Text, p4Sentences);

// ── 정독(intensive) timeline 생성 ──
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
    prompt: "첫 문장에서 식물이 빛에너지로 하는 일을 바르게 이해한 것은?",
    choices: [
      { id: "A", text: "식물은 빛에너지를 이용해 스스로 양분을 만들며, 이를 광합성이라 한다." },
      { id: "B", text: "식물은 빛에너지를 이용해 물만 만들며, 이를 증산이라 한다." },
      { id: "C", text: "식물은 빛에너지 없이도 양분을 만들 수 있으며, 이를 발효라 한다." },
      { id: "D", text: "식물은 빛에너지를 저장만 하고 양분은 토양에서 흡수한다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 알려 주는 광합성의 장소와 재료로 알맞은 것은?",
    choices: [
      { id: "A", text: "광합성은 잎의 엽록체에서 일어나며, 빛에너지·물·이산화 탄소를 재료로 쓴다." },
      { id: "B", text: "광합성은 뿌리의 세포에서 일어나며, 질소·인·칼륨을 재료로 쓴다." },
      { id: "C", text: "광합성은 줄기의 체관에서 일어나며, 빛에너지·산소·질소를 재료로 쓴다." },
      { id: "D", text: "광합성은 잎의 기공에서 일어나며, 포도당·물·산소를 재료로 쓴다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 설명하는 엽록소의 역할로 알맞은 것은?",
    choices: [
      { id: "A", text: "엽록체 안의 초록색 색소인 엽록소가 빛을 흡수하는 역할을 맡는다." },
      { id: "B", text: "엽록소는 붉은색 색소로 이산화 탄소를 분해하는 역할을 한다." },
      { id: "C", text: "엽록소는 뿌리에 있는 색소로 물을 흡수하는 역할을 한다." },
      { id: "D", text: "엽록소는 색이 없는 물질로 산소를 저장하는 역할을 한다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장에서 빛에너지가 쓰이는 곳과 그때 생기는 것으로 알맞은 것은?",
    choices: [
      { id: "A", text: "빛에너지는 물 분자를 분해하는 데 쓰이고, 산소가 부산물로 발생한다." },
      { id: "B", text: "빛에너지는 이산화 탄소를 분해하는 데 쓰이고, 질소가 부산물로 발생한다." },
      { id: "C", text: "빛에너지는 포도당을 분해하는 데 쓰이고, 물이 부산물로 발생한다." },
      { id: "D", text: "빛에너지는 전분을 분해하는 데 쓰이고, 엽록소가 부산물로 발생한다." }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장에서 기공이 열렸을 때 일어나는 일로 알맞은 것은?",
    choices: [
      { id: "A", text: "산소는 밖으로 나가고 이산화 탄소가 잎 안으로 들어온다." },
      { id: "B", text: "이산화 탄소가 밖으로 나가고 산소가 잎 안으로 들어온다." },
      { id: "C", text: "포도당이 밖으로 나가고 물이 잎 안으로 들어온다." },
      { id: "D", text: "질소가 밖으로 나가고 전분이 잎 안으로 들어온다." }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장에서 이산화 탄소가 거치는 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "이산화 탄소가 엽록체 안에서 화학 반응을 거쳐 포도당으로 바뀐다." },
      { id: "B", text: "이산화 탄소가 기공을 거쳐 바로 전분으로 바뀐다." },
      { id: "C", text: "이산화 탄소가 뿌리에서 화학 반응을 거쳐 물로 바뀐다." },
      { id: "D", text: "이산화 탄소가 줄기의 체관을 거쳐 산소로 바뀐다." }
    ],
    answerId: "A"
  },
  {
    prompt: "일곱째 문장이 말하는 포도당의 쓰임으로 알맞은 것은?",
    choices: [
      { id: "A", text: "에너지원이자 줄기와 뿌리를 키우는 기본 재료가 된다." },
      { id: "B", text: "산소를 만드는 유일한 재료이자 기공을 여는 힘이 된다." },
      { id: "C", text: "엽록소를 합성하는 재료이자 빛을 흡수하는 에너지가 된다." },
      { id: "D", text: "이산화 탄소를 분해하는 촉매이자 물을 분해하는 힘이 된다." }
    ],
    answerId: "A"
  }
]);

// p1 문단 중심내용
addParagraphStep("p1", p1Text, {
  prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "광합성은 잎의 엽록체에서 빛·물·이산화 탄소를 이용해 포도당을 만드는 과정이다." },
    { id: "B", text: "광합성은 뿌리에서 흡수한 양분을 잎으로 보내 저장하는 과정이다." },
    { id: "C", text: "광합성은 밤에만 일어나며 산소를 흡수하여 이산화 탄소를 내보내는 과정이다." },
    { id: "D", text: "광합성은 기공을 닫아 수분을 보존하는 것이 핵심인 과정이다." }
  ],
  answerId: "A"
});

// p2 문장별 질문
addSentenceSteps("p2", p2Sentences, [
  {
    prompt: "첫 문장이 제시하는 광합성 속도에 영향을 주는 세 조건으로 알맞은 것은?",
    choices: [
      { id: "A", text: "빛의 세기, 온도, 이산화 탄소 농도이다." },
      { id: "B", text: "물의 양, 토양의 산도, 바람의 세기이다." },
      { id: "C", text: "산소 농도, 습도, 기공의 수이다." },
      { id: "D", text: "엽록소의 양, 뿌리의 길이, 줄기의 굵기이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 설명하는 빛의 세기와 광합성 속도의 관계로 알맞은 것은?",
    choices: [
      { id: "A", text: "빛이 강해지면 속도가 빨라지다가, 일정 수준을 넘으면 포화 상태에 이른다." },
      { id: "B", text: "빛이 강해지면 속도가 느려지다가, 일정 수준을 넘으면 다시 빨라진다." },
      { id: "C", text: "빛의 세기와 관계없이 광합성 속도는 항상 일정하다." },
      { id: "D", text: "빛이 약해질수록 광합성 속도가 빨라진다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 설명하는 온도의 영향으로 알맞은 것은?",
    choices: [
      { id: "A", text: "적정 범위에서는 활발하지만, 지나치게 높으면 효소가 기능을 잃어 속도가 떨어진다." },
      { id: "B", text: "온도가 높을수록 항상 광합성이 활발해지며 한계가 없다." },
      { id: "C", text: "온도가 낮을수록 효소의 기능이 강해져 광합성 속도가 빨라진다." },
      { id: "D", text: "온도는 광합성에 전혀 영향을 주지 않는다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 설명하는 이산화 탄소 농도의 영향으로 알맞은 것은?",
    choices: [
      { id: "A", text: "농도가 높을수록 포도당 생산이 늘다가 어느 지점 이후 증가 폭이 줄어든다." },
      { id: "B", text: "농도가 높을수록 포도당 생산이 줄어들기 시작한다." },
      { id: "C", text: "이산화 탄소 농도와 포도당 생산은 아무 관련이 없다." },
      { id: "D", text: "농도가 낮을수록 포도당이 더 많이 생산된다." }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장이 정리하는 내용으로 알맞은 것은?",
    choices: [
      { id: "A", text: "세 조건은 각각 한계가 있어, 광합성을 최대로 하려면 세 조건이 고루 갖추어져야 한다." },
      { id: "B", text: "세 조건 중 하나만 충족되면 나머지 둘은 필요하지 않다." },
      { id: "C", text: "세 조건은 한계가 없어 늘릴수록 광합성이 무한히 증가한다." },
      { id: "D", text: "세 조건 가운데 빛의 세기만이 광합성 속도를 결정한다." }
    ],
    answerId: "A"
  }
]);

// p2 문단 중심내용
addParagraphStep("p2", p2Text, {
  prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "빛·온도·이산화 탄소 농도는 각각 한계가 있어 세 조건이 고루 맞아야 광합성이 최대가 된다." },
    { id: "B", text: "광합성 속도는 빛의 세기만으로 결정되며 다른 조건은 영향이 없다." },
    { id: "C", text: "광합성은 조건에 상관없이 항상 같은 속도로 진행된다." },
    { id: "D", text: "이산화 탄소 농도가 낮을수록 광합성이 가장 활발하다." }
  ],
  answerId: "A"
});

// p3 문장별 질문
addSentenceSteps("p3", p3Sentences, [
  {
    prompt: "첫 문장이 알려 주는 포도당의 변화로 알맞은 것은?",
    choices: [
      { id: "A", text: "광합성으로 만든 포도당은 곧바로 전분 형태로 바뀌어 잎에 저장된다." },
      { id: "B", text: "광합성으로 만든 포도당은 곧바로 기공 밖으로 배출된다." },
      { id: "C", text: "광합성으로 만든 포도당은 바로 뿌리에서 분해된다." },
      { id: "D", text: "광합성으로 만든 포도당은 엽록소로 바뀌어 잎을 초록색으로 만든다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 설명하는 밤의 과정으로 알맞은 것은?",
    choices: [
      { id: "A", text: "밤에 전분이 포도당으로 분해되어 체관을 통해 뿌리·줄기·열매로 이동한다." },
      { id: "B", text: "밤에 전분이 산소로 분해되어 기공을 통해 대기로 나간다." },
      { id: "C", text: "밤에 전분이 그대로 유지되며 어디로도 이동하지 않는다." },
      { id: "D", text: "밤에 전분이 이산화 탄소로 바뀌어 뿌리에 저장된다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 말하는 호흡의 역할로 알맞은 것은?",
    choices: [
      { id: "A", text: "포도당의 일부를 분해하여 에너지를 얻는다." },
      { id: "B", text: "포도당을 합성하여 전분을 늘린다." },
      { id: "C", text: "이산화 탄소를 분해하여 산소를 만든다." },
      { id: "D", text: "물을 분해하여 빛에너지를 생산한다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 설명하는 호흡과 광합성의 관계로 알맞은 것은?",
    choices: [
      { id: "A", text: "호흡은 광합성과 반대 방향으로, 포도당과 산소를 소비하고 이산화 탄소와 물을 내보낸다." },
      { id: "B", text: "호흡은 광합성과 같은 방향으로, 이산화 탄소와 물을 소비하고 포도당과 산소를 만든다." },
      { id: "C", text: "호흡과 광합성은 서로 관련이 없는 별개의 반응이다." },
      { id: "D", text: "호흡은 광합성보다 항상 많이 일어나서 산소가 줄어든다." }
    ],
    answerId: "A"
  },
  {
    prompt: "다섯째 문장이 설명하는 낮과 밤의 차이로 알맞은 것은?",
    choices: [
      { id: "A", text: "낮에는 광합성량이 더 많아 산소가 순방출되고, 밤에는 호흡만 일어나 이산화 탄소가 순방출된다." },
      { id: "B", text: "낮에는 호흡만 일어나 이산화 탄소가 나오고, 밤에는 광합성이 일어나 산소가 나온다." },
      { id: "C", text: "낮과 밤 모두 광합성과 호흡이 같은 양으로 일어난다." },
      { id: "D", text: "낮에는 이산화 탄소만 나오고 밤에는 산소만 나온다." }
    ],
    answerId: "A"
  },
  {
    prompt: "여섯째 문장이 정리하는 내용으로 알맞은 것은?",
    choices: [
      { id: "A", text: "낮에 에너지를 저축하고 밤에 소비하며 생장을 이어 간다." },
      { id: "B", text: "밤에 에너지를 저축하고 낮에는 전부 배출한다." },
      { id: "C", text: "낮과 밤 모두 에너지를 소비만 하고 저축은 하지 않는다." },
      { id: "D", text: "에너지 저축은 뿌리에서만 일어나고 잎에서는 일어나지 않는다." }
    ],
    answerId: "A"
  }
]);

// p3 문단 중심내용
addParagraphStep("p3", p3Text, {
  prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "식물은 낮에 전분을 쌓고 밤에 분해하여 호흡과 생장에 이용하며 에너지 균형을 유지한다." },
    { id: "B", text: "식물은 밤에만 전분을 만들고 낮에는 모두 기공으로 배출한다." },
    { id: "C", text: "호흡은 광합성과 동시에 일어나지 않으며 잎에서만 진행된다." },
    { id: "D", text: "포도당은 잎에서만 사용되며 뿌리와 줄기로는 이동하지 않는다." }
  ],
  answerId: "A"
});

// p4 문장별 질문
addSentenceSteps("p4", p4Sentences, [
  {
    prompt: "첫 문장이 말하는 광합성의 영향 범위로 알맞은 것은?",
    choices: [
      { id: "A", text: "광합성은 지구 생태계 전체에 큰 영향을 미친다." },
      { id: "B", text: "광합성은 식물 한 개체에만 영향을 미친다." },
      { id: "C", text: "광합성은 바다 생태계에는 전혀 영향을 미치지 않는다." },
      { id: "D", text: "광합성은 동물에게만 영향을 미치고 사람에게는 영향이 없다." }
    ],
    answerId: "A"
  },
  {
    prompt: "둘째 문장이 설명하는 식물 산소와 유기물의 의미로 알맞은 것은?",
    choices: [
      { id: "A", text: "산소는 동물과 사람의 호흡에 필요하고, 유기물은 먹이 사슬의 출발점이 된다." },
      { id: "B", text: "산소는 식물만 사용하고, 유기물은 먹이 사슬과 관련이 없다." },
      { id: "C", text: "산소는 이산화 탄소로 바뀌어야 쓸모가 있고, 유기물은 분해되면 사라진다." },
      { id: "D", text: "산소는 토양에만 저장되고, 유기물은 동물이 직접 만든다." }
    ],
    answerId: "A"
  },
  {
    prompt: "셋째 문장이 말하는 식물의 추가 역할로 알맞은 것은?",
    choices: [
      { id: "A", text: "이산화 탄소를 흡수하여 대기 중 온실 가스의 양을 조절한다." },
      { id: "B", text: "산소를 흡수하여 대기 중 질소의 양을 조절한다." },
      { id: "C", text: "수증기를 흡수하여 바람의 방향을 조절한다." },
      { id: "D", text: "이산화 탄소를 배출하여 온실 효과를 강화한다." }
    ],
    answerId: "A"
  },
  {
    prompt: "넷째 문장이 말하는 최근 움직임의 까닭으로 알맞은 것은?",
    choices: [
      { id: "A", text: "지구 온난화가 심해지면서 숲 보전과 녹지 확대의 중요성이 커졌기 때문이다." },
      { id: "B", text: "식물의 광합성이 줄어들어 산소가 넘치기 때문이다." },
      { id: "C", text: "숲이 너무 많아져 동물 서식지가 부족해졌기 때문이다." },
      { id: "D", text: "이산화 탄소가 줄어들어 식물이 광합성을 못 하기 때문이다." }
    ],
    answerId: "A"
  },
  {
    prompt: "마지막 문장이 정리하는 광합성의 의미로 알맞은 것은?",
    choices: [
      { id: "A", text: "광합성은 식물 개체의 생존을 넘어 지구 전체의 환경과 생명을 유지하는 핵심 과정이다." },
      { id: "B", text: "광합성은 식물 개체에만 의미가 있고 지구 환경과는 관련이 없다." },
      { id: "C", text: "광합성은 지구 환경보다 동물의 호흡에만 영향을 준다." },
      { id: "D", text: "광합성은 점차 사라지고 있어 지구에 미치는 영향이 줄고 있다." }
    ],
    answerId: "A"
  }
]);

// p4 문단 중심내용
addParagraphStep("p4", p4Text, {
  prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?",
  choices: [
    { id: "A", text: "광합성은 산소 공급, 먹이 사슬, 온실 가스 조절 등 지구 생태계 전체를 지탱하는 핵심 과정이다." },
    { id: "B", text: "광합성은 동물의 호흡에만 관련되며 지구 환경과는 무관하다." },
    { id: "C", text: "광합성은 최근에 발견된 현상으로 아직 연구가 부족하다." },
    { id: "D", text: "광합성은 온실 가스를 늘리는 주요 원인이다." }
  ],
  answerId: "A"
});

// ── 복기(recall) 8카드 ──
const recall = {
  cards: [
    { id: "c1", text: "식물은 빛에너지를 이용한 광합성으로 잎의 엽록체에서 양분을 만든다." },
    { id: "c2", text: "엽록소가 빛을 흡수하면 물이 분해되고 부산물로 산소가 발생한다." },
    { id: "c3", text: "기공을 통해 이산화 탄소가 들어오고 엽록체에서 포도당으로 바뀐다." },
    { id: "c4", text: "빛·온도·이산화 탄소 농도는 각각 한계가 있어 세 조건이 고루 맞아야 한다." },
    { id: "c5", text: "낮에 만든 포도당은 전분으로 저장되었다가 밤에 체관으로 이동한다." },
    { id: "c6", text: "호흡은 광합성의 역반응으로, 포도당과 산소를 소비해 에너지를 얻는다." },
    { id: "c7", text: "식물이 내뿜는 산소와 유기물은 먹이 사슬의 출발점이 된다." },
    { id: "c8", text: "광합성은 온실 가스를 조절하며 지구 환경과 생명을 유지하는 핵심 과정이다." }
  ],
  correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
  seedPenalty: 1
};

// ── 확인학습(confirm) ──
function findRange(pid, text, answer) {
  const pText = paragraphs.find(p => p.id === pid).text;
  const idx = pText.indexOf(answer);
  if (idx === -1) {
    console.error(`✗ confirm: "${answer}" not found in ${pid}`);
    return { paragraphId: pid, start: 0, end: 0 };
  }
  return { paragraphId: pid, start: idx, end: idx + answer.length };
}

const confirm = {
  questions: [
    {
      id: "q1",
      prompt: "광합성이 주로 일어나는 장소인, 잎 속 세포 소기관의 이름은 무엇인가요?",
      answerText: "엽록체",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", p1Text, "엽록체")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q2",
      prompt: "엽록체 안에서 빛을 흡수하는 초록색 색소의 이름은 무엇인가요?",
      answerText: "엽록소",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", p1Text, "엽록소")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q3",
      prompt: "빛에너지가 물 분자를 분해할 때 부산물로 발생하는 기체는 무엇인가요?",
      answerText: "산소",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p1", p1Text, "산소가 부산물로")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q4",
      prompt: "빛이 강해져도 광합성 속도가 더 이상 빨라지지 않는 상태를 무엇이라 하나요?",
      answerText: "포화 상태",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", p2Text, "포화 상태")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q5",
      prompt: "온도가 지나치게 높아지면 기능을 잃는, 엽록체 속 물질은 무엇인가요?",
      answerText: "효소",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p2", p2Text, "효소")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q6",
      prompt: "낮 동안 포도당이 바뀌어 잎에 저장되는 물질의 이름은 무엇인가요?",
      answerText: "전분",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", p3Text, "전분")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q7",
      prompt: "밤에 포도당이 뿌리·줄기·열매로 이동할 때 지나는 통로의 이름은 무엇인가요?",
      answerText: "체관",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p3", p3Text, "체관")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    },
    {
      id: "q8",
      prompt: "식물이 만든 유기물이 생태계에서 차지하는 역할, 즉 먹이 사슬에서의 위치를 무엇이라 했나요?",
      answerText: "출발점",
      answerMatchMode: "ANY",
      answerRanges: [findRange("p4", p4Text, "출발점")],
      scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
      revealOnWrong: true
    }
  ]
};

// ── 최종 JSON 조립 ──
const content = {
  contentId: "dr-r2-001",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 1 비문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_2",
  schoolGradeRange: { min: 8, max: 9 },
  area: "READING",
  subArea: "NONFICTION",
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

const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell2', '001.json');
fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf8');
console.log("✓ 정적 파일 저장:", staticPath);

// 배치 파일 업데이트 (items[0] 교체)
const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell2.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
batch.items[0] = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 1,
  module_key: "reading_training",
  schema_version: "1.0",
  content: content
};
fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log("✓ 배치 파일 items[0] 교체:", batchPath);

console.log("\n=== Day 1 완료 ===");
