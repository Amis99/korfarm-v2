// Day 3: 비문학 - 혈압 조절 (중2~3 수준 1200자 재작성)
// 기출 참조: 과학_혈압 조절

const passage = {
  p1: "우리 몸에서 혈액은 심장의 펌프 작용에 의해 혈관 속을 끊임없이 순환한다. 이때 혈액이 혈관 벽에 가하는 압력을 혈압이라 한다. 혈압은 심장이 한 번 수축할 때 혈관으로 밀어내는 혈액의 양, 즉 심장 박출량과 혈액이 말초 혈관을 지나면서 받는 저항인 말초 혈관 저항에 의해 결정된다. 심장 박출량이 늘어나거나 말초 혈관 저항이 커지면 혈압은 올라가고, 반대의 경우에는 내려간다. 인체는 이 혈압을 일정한 범위 안에서 유지하려는 성질, 곧 항상성을 가지고 있어서 혈압이 정상 범위를 벗어나면 즉시 되돌리려는 반응을 시작한다.",
  p2: "혈압 조절에서 핵심적인 역할을 하는 기관 가운데 하나가 허리 양쪽에 자리한 콩팥이다. 콩팥 안에 있는 사구체라는 작은 혈관 덩어리는 혈액을 걸러 노폐물이 포함된 여과액을 만들어 낸다. 여과액 속의 물과 나트륨 가운데 몸에 필요한 양은 세뇨관에서 다시 혈액으로 되돌아가는데, 이를 재흡수라 한다. 혈압이 떨어지면 콩팥에서 레닌이라는 물질이 분비되고, 레닌은 여러 단계를 거쳐 알도스테론이라는 호르몬의 합성을 촉진한다. 알도스테론은 나트륨의 재흡수를 늘리고, 나트륨 농도가 올라가면 몸은 수분까지 함께 재흡수하여 체액량을 늘린다. 체액량이 늘어나면 심장이 밀어내는 혈액의 양이 많아지므로 혈압이 다시 올라간다.",
  p3: "콩팥 외에 자율 신경계도 혈압 조절에 참여한다. 대동맥과 목동맥에는 혈압의 변화를 감지하는 압력 수용기가 있다. 혈압이 떨어지면 압력 수용기가 이를 뇌에 알리고, 뇌는 교감 신경을 활성화한다. 교감 신경이 활성화되면 신경 말단에서 노르에피네프린이라는 신경 전달 물질이 분비되어 혈관을 수축시키고 심장 박동을 빠르게 한다. 그 결과 말초 혈관 저항과 심장 박출량이 동시에 증가하여 혈압이 올라간다. 반대로 혈압이 지나치게 높아지면 부교감 신경이 활성화되어 심장 박동을 느리게 하고 혈관을 이완시켜 혈압을 낮춘다. 이처럼 교감 신경과 부교감 신경은 서로 반대 방향으로 작용하면서 혈압의 균형을 잡아 준다.",
  p4: "이처럼 인체는 콩팥의 호르몬 조절과 자율 신경계의 신경 반사를 동시에 활용하여 혈압을 안정적으로 유지한다. 두 기전은 서로 독립적으로 작용하기도 하지만, 실제로는 긴밀하게 연결되어 있다. 예를 들어 교감 신경이 콩팥에 작용하면 레닌 분비가 촉진되고, 레닌에 의해 만들어진 물질이 다시 교감 신경의 활동을 강화하는 되먹임이 일어난다. 이러한 정교한 조절 덕분에 우리 몸은 운동, 수면, 긴장 등 다양한 상황에서도 혈압을 적절한 범위 안에서 유지할 수 있다."
};

// 글자 수 확인
const totalLen = Object.values(passage).reduce((sum, t) => sum + t.length, 0);
console.log("총 글자 수:", totalLen);

// 문장 경계를 수동으로 지정
function sentenceBounds(text) {
  const bounds = [];
  let pos = 0;
  // 마침표+공백 또는 마침표+끝 기준으로 분리
  const regex = /[^.]+\./g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const start = m.index;
    let end = m.index + m[0].length;
    // 뒤에 공백이 있으면 포함
    if (end < text.length && text[end] === ' ') end++;
    bounds.push({ start: m.index, end });
  }
  // 정리: start부터 end까지, 공백 트리밍
  const result = [];
  for (let i = 0; i < bounds.length; i++) {
    let s = bounds[i].start;
    let e = (i < bounds.length - 1) ? bounds[i + 1].start : text.length;
    result.push({ start: s, end: e });
  }
  return result;
}

// 각 문단의 문장 분리
const paragraphs = ["p1","p2","p3","p4"];
const allSentences = {};
for (const pid of paragraphs) {
  allSentences[pid] = sentenceBounds(passage[pid]);
  console.log(`${pid}: ${allSentences[pid].length}문장`);
  for (const s of allSentences[pid]) {
    console.log(`  [${s.start},${s.end}] "${passage[pid].substring(s.start, s.end).substring(0,30)}..."`);
  }
}

// intensive timeline 생성
const timeline = [];
let stepNum = 1;

// 정독 질문 데이터
const intensiveData = {
  p1: [
    {
      prompt: "첫 문장에서 혈액의 순환 원리를 바르게 이해한 것은?",
      choices: [
        { id: "A", text: "혈액은 심장의 펌프 작용으로 혈관 속을 쉬지 않고 돈다." },
        { id: "B", text: "혈액은 폐의 펌프 작용으로 혈관 밖을 순환한다." },
        { id: "C", text: "혈액은 콩팥의 여과 작용으로 혈관 속을 이동한다." },
        { id: "D", text: "혈액은 뇌의 신호 없이는 혈관 안에서 움직이지 않는다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 혈압의 정의로 알맞은 것은?",
      choices: [
        { id: "A", text: "혈액이 혈관 벽에 가하는 압력을 혈압이라 한다." },
        { id: "B", text: "심장이 뇌에 보내는 전기 신호를 혈압이라 한다." },
        { id: "C", text: "혈관 벽이 혈액을 밀어내는 힘을 혈압이라 한다." },
        { id: "D", text: "혈관의 길이에 따라 달라지는 압력을 혈압이라 한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장이 설명하는 혈압 결정 요인으로 알맞은 것은?",
      choices: [
        { id: "A", text: "심장 박출량과 말초 혈관 저항이 혈압을 결정한다." },
        { id: "B", text: "체온과 호흡 횟수가 혈압을 결정한다." },
        { id: "C", text: "혈액의 색깔과 점도가 혈압을 결정한다." },
        { id: "D", text: "혈관의 길이와 혈액형이 혈압을 결정한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장이 설명하는 혈압 변화의 원리로 알맞은 것은?",
      choices: [
        { id: "A", text: "심장 박출량이 늘거나 말초 혈관 저항이 커지면 혈압이 올라간다." },
        { id: "B", text: "심장 박출량이 늘면 혈압이 내려가고 저항이 커지면 올라간다." },
        { id: "C", text: "심장 박출량과 말초 혈관 저항은 혈압에 영향을 주지 않는다." },
        { id: "D", text: "혈압은 항상 일정하여 어떤 요인에도 변하지 않는다." }
      ],
      answerId: "A"
    },
    {
      prompt: "마지막 문장에서 말하는 항상성과 그에 따른 반응으로 알맞은 것은?",
      choices: [
        { id: "A", text: "혈압을 일정하게 유지하려는 성질로, 범위를 벗어나면 되돌리려는 반응을 시작한다." },
        { id: "B", text: "체온을 올리기만 하는 성질로, 혈압과는 관련이 없다." },
        { id: "C", text: "혈압을 계속 높이려는 성질로, 범위를 벗어나도 반응하지 않는다." },
        { id: "D", text: "외부 환경에 맞춰 혈압을 없애려는 성질이다." }
      ],
      answerId: "A"
    },
    // 문단 중심내용
    {
      prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은?",
      type: "paragraph_summary"
    }
  ],
  p2: [
    {
      prompt: "첫 문장에서 혈압 조절에 중요한 기관으로 제시된 것은?",
      choices: [
        { id: "A", text: "허리 양쪽에 자리한 콩팥이 혈압 조절에서 핵심적인 역할을 한다." },
        { id: "B", text: "간이 혈압 조절에서 가장 중요한 역할을 한다." },
        { id: "C", text: "폐가 혈압 조절의 핵심 기관이다." },
        { id: "D", text: "위장이 혈압 조절에서 중요한 역할을 한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 사구체가 하는 일로 알맞은 것은?",
      choices: [
        { id: "A", text: "혈액을 걸러 노폐물이 포함된 여과액을 만든다." },
        { id: "B", text: "혈액에 산소를 공급하여 순환을 돕는다." },
        { id: "C", text: "혈관을 수축시켜 혈압을 높인다." },
        { id: "D", text: "호르몬을 직접 분비하여 체온을 조절한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장에서 설명하는 재흡수란 무엇인가?",
      choices: [
        { id: "A", text: "여과액 속 물과 나트륨이 세뇨관에서 혈액으로 되돌아가는 것이다." },
        { id: "B", text: "혈액 속 산소가 폐에서 밖으로 배출되는 것이다." },
        { id: "C", text: "노폐물이 콩팥에서 간으로 이동하는 것이다." },
        { id: "D", text: "여과액 전체가 소변으로 배출되는 것이다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장이 설명하는 혈압 하강 시 일어나는 일로 알맞은 것은?",
      choices: [
        { id: "A", text: "콩팥에서 레닌이 분비되어 알도스테론 합성을 촉진한다." },
        { id: "B", text: "콩팥에서 아드레날린이 분비되어 혈관을 넓힌다." },
        { id: "C", text: "간에서 인슐린이 분비되어 혈당을 낮춘다." },
        { id: "D", text: "폐에서 산소가 분비되어 혈액을 정화한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장에서 알도스테론의 작용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "나트륨 재흡수를 늘려 체액량을 증가시킨다." },
        { id: "B", text: "나트륨 배출을 늘려 체액량을 줄인다." },
        { id: "C", text: "수분 배출을 촉진하여 혈압을 낮춘다." },
        { id: "D", text: "혈관을 직접 수축시켜 혈압을 올린다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장이 정리하는 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "체액량이 늘면 심장이 밀어내는 혈액이 많아져 혈압이 올라간다." },
        { id: "B", text: "체액량이 늘면 혈관이 넓어져 혈압이 내려간다." },
        { id: "C", text: "체액량이 줄면 심장 박출량이 늘어 혈압이 올라간다." },
        { id: "D", text: "체액량은 혈압에 영향을 미치지 않는다." }
      ],
      answerId: "A"
    },
    { prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은?", type: "paragraph_summary" }
  ],
  p3: [
    {
      prompt: "첫 문장에서 혈압 조절에 참여하는 또 다른 체계는?",
      choices: [
        { id: "A", text: "콩팥 외에 자율 신경계도 혈압 조절에 참여한다." },
        { id: "B", text: "소화계가 콩팥 대신 혈압을 조절한다." },
        { id: "C", text: "면역계가 혈압 조절의 주된 역할을 맡는다." },
        { id: "D", text: "근골격계가 혈압을 직접 조절한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장에서 압력 수용기의 위치로 알맞은 것은?",
      choices: [
        { id: "A", text: "대동맥과 목동맥에 압력 수용기가 있다." },
        { id: "B", text: "콩팥과 간에 압력 수용기가 있다." },
        { id: "C", text: "폐동맥과 정맥에만 압력 수용기가 있다." },
        { id: "D", text: "모세 혈관에만 압력 수용기가 분포한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장이 설명하는 혈압 하강 시의 과정으로 알맞은 것은?",
      choices: [
        { id: "A", text: "압력 수용기가 뇌에 알리고 뇌가 교감 신경을 활성화한다." },
        { id: "B", text: "압력 수용기가 콩팥에 알리고 콩팥이 부교감 신경을 활성화한다." },
        { id: "C", text: "압력 수용기 없이 뇌가 스스로 교감 신경을 활성화한다." },
        { id: "D", text: "압력 수용기가 뇌에 알리고 뇌가 부교감 신경을 활성화한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "넷째 문장에서 노르에피네프린의 작용으로 알맞은 것은?",
      choices: [
        { id: "A", text: "혈관을 수축시키고 심장 박동을 빠르게 한다." },
        { id: "B", text: "혈관을 이완시키고 심장 박동을 느리게 한다." },
        { id: "C", text: "혈관과 심장에 아무 영향을 주지 않는다." },
        { id: "D", text: "혈관을 수축시키되 심장 박동은 느리게 한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "다섯째 문장이 정리하는 결과로 알맞은 것은?",
      choices: [
        { id: "A", text: "말초 혈관 저항과 심장 박출량이 동시에 증가하여 혈압이 올라간다." },
        { id: "B", text: "말초 혈관 저항만 증가하고 심장 박출량은 줄어 혈압이 유지된다." },
        { id: "C", text: "말초 혈관 저항과 심장 박출량이 동시에 감소하여 혈압이 내려간다." },
        { id: "D", text: "교감 신경 활성화는 혈압 변화에 영향을 주지 않는다." }
      ],
      answerId: "A"
    },
    {
      prompt: "여섯째 문장에서 혈압이 높아질 때 일어나는 일로 알맞은 것은?",
      choices: [
        { id: "A", text: "부교감 신경이 활성화되어 심장 박동을 느리게 하고 혈관을 이완시켜 혈압을 낮춘다." },
        { id: "B", text: "교감 신경이 더 활성화되어 혈압을 더 높인다." },
        { id: "C", text: "자율 신경계가 아무 반응도 하지 않는다." },
        { id: "D", text: "부교감 신경이 활성화되어 혈관을 수축시킨다." }
      ],
      answerId: "A"
    },
    {
      prompt: "마지막 문장이 정리하는 교감·부교감 신경의 관계로 알맞은 것은?",
      choices: [
        { id: "A", text: "서로 반대 방향으로 작용하면서 혈압의 균형을 잡아 준다." },
        { id: "B", text: "같은 방향으로 작용하여 혈압을 계속 올린다." },
        { id: "C", text: "하나만 작용하고 다른 하나는 항상 쉰다." },
        { id: "D", text: "둘 다 혈압에 영향을 미치지 않는다." }
      ],
      answerId: "A"
    },
    { prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은?", type: "paragraph_summary" }
  ],
  p4: [
    {
      prompt: "첫 문장이 정리하는 인체의 혈압 유지 방법으로 알맞은 것은?",
      choices: [
        { id: "A", text: "콩팥의 호르몬 조절과 자율 신경계의 신경 반사를 동시에 활용한다." },
        { id: "B", text: "콩팥만으로 혈압을 완전히 조절한다." },
        { id: "C", text: "자율 신경계만으로 혈압을 유지한다." },
        { id: "D", text: "혈압은 인체가 조절하지 않고 자연히 유지된다." }
      ],
      answerId: "A"
    },
    {
      prompt: "둘째 문장이 말하는 두 기전의 관계로 알맞은 것은?",
      choices: [
        { id: "A", text: "독립적으로 작용하기도 하지만 긴밀하게 연결되어 있다." },
        { id: "B", text: "항상 동시에 작용하며 따로 작용하는 일은 없다." },
        { id: "C", text: "서로 완전히 독립적이어서 영향을 주고받지 않는다." },
        { id: "D", text: "하나가 작용하면 다른 하나는 반드시 멈춘다." }
      ],
      answerId: "A"
    },
    {
      prompt: "셋째 문장이 설명하는 되먹임의 예로 알맞은 것은?",
      choices: [
        { id: "A", text: "교감 신경이 레닌 분비를 촉진하고, 레닌 산물이 교감 신경을 강화한다." },
        { id: "B", text: "부교감 신경이 레닌 분비를 억제하고, 레닌이 부교감 신경을 강화한다." },
        { id: "C", text: "교감 신경이 알도스테론을 직접 분비하고, 알도스테론이 교감 신경을 억제한다." },
        { id: "D", text: "콩팥이 교감 신경을 억제하고, 교감 신경이 콩팥을 비활성화한다." }
      ],
      answerId: "A"
    },
    {
      prompt: "마지막 문장이 말하는 조절의 의의로 알맞은 것은?",
      choices: [
        { id: "A", text: "다양한 상황에서도 혈압을 적절한 범위 안에서 유지할 수 있다." },
        { id: "B", text: "운동할 때만 혈압을 유지하고 수면 중에는 조절이 멈춘다." },
        { id: "C", text: "긴장할 때만 혈압이 조절되고 평소에는 조절되지 않는다." },
        { id: "D", text: "혈압 조절은 건강한 사람에게만 일어나는 현상이다." }
      ],
      answerId: "A"
    },
    { prompt: "넷째 문단의 중심 내용으로 가장 알맞은 것은?", type: "paragraph_summary" }
  ]
};

// 문단 중심내용 질문 데이터
const paragraphSummaries = {
  p1: {
    choices: [
      { id: "A", text: "혈압은 심장 박출량과 말초 혈관 저항에 의해 결정되며, 인체는 항상성을 통해 이를 유지한다." },
      { id: "B", text: "혈압은 체온에 의해서만 결정되며 인체는 이를 조절하지 못한다." },
      { id: "C", text: "혈액은 혈관 밖을 순환하며 혈압은 뇌에 의해서만 결정된다." },
      { id: "D", text: "심장은 혈액을 만드는 기관이며 혈압과는 관련이 없다." }
    ],
    answerId: "A"
  },
  p2: {
    choices: [
      { id: "A", text: "콩팥은 레닌-알도스테론 경로를 통해 나트륨과 수분을 재흡수하여 혈압을 올린다." },
      { id: "B", text: "콩팥은 혈액을 만들어 혈압을 유지하는 기관이다." },
      { id: "C", text: "사구체는 혈압과 무관하게 노폐물만 걸러 내는 역할을 한다." },
      { id: "D", text: "알도스테론은 나트륨을 배출시켜 혈압을 낮추는 호르몬이다." }
    ],
    answerId: "A"
  },
  p3: {
    choices: [
      { id: "A", text: "자율 신경계는 교감·부교감 신경을 통해 혈관과 심장을 조절하여 혈압을 유지한다." },
      { id: "B", text: "자율 신경계는 혈압이 올라갈 때만 작용하고 내려갈 때는 작용하지 않는다." },
      { id: "C", text: "교감 신경만이 혈압 조절에 관여하며 부교감 신경은 무관하다." },
      { id: "D", text: "압력 수용기는 콩팥에만 있으며 뇌에 신호를 보내지 않는다." }
    ],
    answerId: "A"
  },
  p4: {
    choices: [
      { id: "A", text: "콩팥과 자율 신경계는 되먹임으로 연결되어 다양한 상황에서 혈압을 안정적으로 유지한다." },
      { id: "B", text: "콩팥과 자율 신경계는 서로 전혀 관련 없이 독립적으로만 작용한다." },
      { id: "C", text: "혈압 조절은 한 가지 기전만으로 충분하여 되먹임은 불필요하다." },
      { id: "D", text: "운동 중에는 혈압 조절 기전이 완전히 정지된다." }
    ],
    answerId: "A"
  }
};

// timeline 생성
for (const pid of paragraphs) {
  const sentences = allSentences[pid];
  const questions = intensiveData[pid];

  let qIdx = 0;
  for (let i = 0; i < sentences.length; i++) {
    const q = questions[qIdx];
    if (!q) break;
    if (q.type === "paragraph_summary") continue; // 나중에 추가

    timeline.push({
      stepId: `s${stepNum}`,
      highlight: {
        ranges: [{ paragraphId: pid, start: sentences[i].start, end: sentences[i].end }]
      },
      question: {
        prompt: q.prompt,
        choices: q.choices,
        answerId: q.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
    qIdx++;
  }

  // 문단 끝 중심내용 step
  const summaryQ = questions.find(q => q.type === "paragraph_summary");
  if (summaryQ) {
    const ps = paragraphSummaries[pid];
    timeline.push({
      stepId: `s${stepNum}`,
      highlight: {
        ranges: [{ paragraphId: pid, start: 0, end: passage[pid].length }]
      },
      question: {
        prompt: summaryQ.prompt,
        choices: ps.choices,
        answerId: ps.answerId,
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
      }
    });
    stepNum++;
  }
}

console.log("총 intensive steps:", timeline.length);

// recall 8카드
const recall = {
  cards: [
    { id: "c1", text: "혈압은 혈액이 혈관 벽에 가하는 압력으로, 심장 박출량과 말초 혈관 저항에 의해 결정된다." },
    { id: "c2", text: "인체는 항상성을 통해 혈압을 일정한 범위 안에서 유지하려 한다." },
    { id: "c3", text: "콩팥의 사구체는 혈액을 걸러 여과액을 만들고, 세뇨관에서 재흡수가 일어난다." },
    { id: "c4", text: "혈압이 떨어지면 레닌이 분비되어 알도스테론을 만들고 나트륨 재흡수를 늘린다." },
    { id: "c5", text: "체액량이 늘면 심장 박출량이 증가하여 혈압이 다시 올라간다." },
    { id: "c6", text: "교감 신경이 활성화되면 혈관을 수축시키고 심장 박동을 빠르게 하여 혈압을 올린다." },
    { id: "c7", text: "혈압이 높아지면 부교감 신경이 심장 박동을 느리게 하고 혈관을 이완시킨다." },
    { id: "c8", text: "콩팥과 자율 신경계는 되먹임으로 연결되어 혈압을 안정적으로 유지한다." }
  ],
  correctOrder: ["c1","c2","c3","c4","c5","c6","c7","c8"],
  seedPenalty: 1
};

// confirm 질문 (5~10문항, 질문형, 직접찾기 금지)
const confirmQuestions = [
  {
    id: "q1",
    prompt: "혈액이 혈관 벽에 가하는 압력을 무엇이라 하나요?",
    answerText: "혈압",
    pid: "p1",
    searchText: "혈압"
  },
  {
    id: "q2",
    prompt: "심장이 한 번 수축할 때 혈관으로 밀어내는 혈액의 양을 가리키는 용어는 무엇인가요?",
    answerText: "심장 박출량",
    pid: "p1",
    searchText: "심장 박출량"
  },
  {
    id: "q3",
    prompt: "인체가 혈압을 일정하게 유지하려는 성질을 무엇이라 하나요?",
    answerText: "항상성",
    pid: "p1",
    searchText: "항상성"
  },
  {
    id: "q4",
    prompt: "콩팥 안에서 혈액을 걸러 여과액을 만드는 작은 혈관 덩어리의 이름은 무엇인가요?",
    answerText: "사구체",
    pid: "p2",
    searchText: "사구체"
  },
  {
    id: "q5",
    prompt: "여과액 속의 물과 나트륨이 세뇨관에서 혈액으로 되돌아가는 현상을 무엇이라 하나요?",
    answerText: "재흡수",
    pid: "p2",
    searchText: "재흡수"
  },
  {
    id: "q6",
    prompt: "혈압이 떨어질 때 콩팥에서 분비되어 알도스테론 생성을 유도하는 물질은 무엇인가요?",
    answerText: "레닌",
    pid: "p2",
    searchText: "레닌"
  },
  {
    id: "q7",
    prompt: "교감 신경 말단에서 분비되어 혈관을 수축시키는 신경 전달 물질의 이름은 무엇인가요?",
    answerText: "노르에피네프린",
    pid: "p3",
    searchText: "노르에피네프린"
  },
  {
    id: "q8",
    prompt: "혈압이 지나치게 높아질 때 활성화되어 심장 박동을 느리게 하는 신경은 무엇인가요?",
    answerText: "부교감 신경",
    pid: "p3",
    searchText: "부교감 신경"
  }
];

// answerRanges 계산
const confirmWithRanges = confirmQuestions.map(q => {
  const text = passage[q.pid];
  const idx = text.indexOf(q.searchText);
  if (idx === -1) {
    console.error(`ERROR: "${q.searchText}" not found in ${q.pid}`);
    process.exit(1);
  }
  return {
    id: q.id,
    prompt: q.prompt,
    answerText: q.answerText,
    answerMatchMode: "ANY",
    answerRanges: [{
      paragraphId: q.pid,
      start: idx,
      end: idx + q.searchText.length
    }],
    scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
    revealOnWrong: true
  };
});

// 최종 JSON
const content = {
  contentId: "dr-r2-003",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 2) Day 3 비문학",
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
      paragraphs: paragraphs.map(pid => ({ id: pid, text: passage[pid] }))
    },
    intensive: { timeline },
    recall,
    confirm: { questions: confirmWithRanges }
  }
};

// 검증
console.log("\n=== 검증 ===");
console.log("지문 글자 수:", totalLen, totalLen >= 1150 && totalLen <= 1250 ? "OK" : "FAIL");
console.log("recall 카드:", recall.cards.length, recall.cards.length === 8 ? "OK" : "FAIL");
console.log("confirm 문항:", confirmWithRanges.length, confirmWithRanges.length >= 5 ? "OK" : "FAIL");
console.log("intensive steps:", timeline.length);

// ranges 유효성 검사
let rangeOk = true;
for (const step of timeline) {
  for (const r of step.highlight.ranges) {
    const pText = passage[r.paragraphId];
    if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
      console.error(`INVALID range in ${step.stepId}: [${r.start},${r.end}] for ${r.paragraphId} (len=${pText.length})`);
      rangeOk = false;
    }
  }
}
for (const q of confirmWithRanges) {
  for (const r of q.answerRanges) {
    const pText = passage[r.paragraphId];
    if (r.start < 0 || r.end > pText.length || r.start >= r.end) {
      console.error(`INVALID confirm range in ${q.id}: [${r.start},${r.end}] for ${r.paragraphId} (len=${pText.length})`);
      rangeOk = false;
    }
    const found = pText.substring(r.start, r.end);
    if (found !== q.answerText) {
      console.error(`MISMATCH in ${q.id}: expected "${q.answerText}", got "${found}" at [${r.start},${r.end}]`);
      rangeOk = false;
    }
  }
}
console.log("ranges 유효:", rangeOk ? "OK" : "FAIL");

// 파일 출력
const fs = require('fs');
const outPath = './frontend/public/daily-reading/russell2/003.json';
fs.writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf8');
console.log("파일 저장:", outPath);

// 배치 아이템 출력
const batchItem = {
  content_type: "DAILY_READING",
  level_id: "RUSSELL_2",
  area: "READING",
  sub_area: "NONFICTION",
  day_index: 3,
  module_key: "reading_training",
  schema_version: "1.0",
  content
};
fs.writeFileSync('./scripts/day3-batch-item.json', JSON.stringify(batchItem, null, 2), 'utf8');
console.log("배치 아이템 저장: ./scripts/day3-batch-item.json");
