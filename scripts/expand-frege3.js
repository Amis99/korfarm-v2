const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\RENEWCOM PC\\Documents\\국어농장v2홈페이지';
const batchPath = path.join(BASE, 'generated', 'daily-batch-reading-frege3.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

// 확장된 문단 텍스트 (각 Day별로 ~1000자 목표)
const expansions = {
  12: [ // LITERATURE - 할머니의 장독대
    "할머니의 장독대 앞에는 낡은 나무 의자가 하나 놓여 있었다. 페인트가 벗겨져 맨살이 드러난 그 의자는 비바람에도 꿋꿋이 제자리를 지켰다. 어린 시절 나는 그 의자에 앉아 할머니가 된장을 젓는 모습을 지켜보곤 했다. 할머니의 팔은 나무 주걱과 하나가 된 듯 느리고 일정하게 원을 그렸다. 장독에서 올라오는 구수한 냄새가 마당 가득 퍼지면 나는 눈을 감고 깊이 숨을 들이쉬었다. 할머니는 장을 저을 때마다 혼잣말처럼 중얼거렸는데, 그것은 장맛이 좋아지라는 기원이기도 했고 돌아가신 할아버지에게 보내는 안부이기도 했다. 나는 그 중얼거림이 무서워서 가끔 귀를 막았지만, 할머니의 거칠고 따뜻한 손이 내 머리를 쓰다듬으면 금세 안심이 되었다.",
    "어느 여름, 갑작스러운 폭우로 장독 하나가 깨졌다. 새벽부터 쏟아진 비가 마당을 물바다로 만들었고, 독에서 흘러나온 간장이 빗물과 뒤섞여 흙빛 강을 이루었다. 할머니는 쏟아진 간장을 아무 말 없이 바라보더니 조용히 깨진 조각을 주워 담았다. 그날 저녁 할머니는 평소보다 오래 부엌에 서 계셨다. 나는 할머니의 눈가가 젖어 있는 것을 보았지만 모른 척했다. 부엌에서 나오신 할머니는 내 이불을 여며 주시며 내일은 맑을 거라고 조용히 말씀하셨다. 다음 날 아침, 할머니는 새 독에 소금물을 붓고 다시 장을 담그기 시작했다. 할머니는 잃어버린 것을 슬퍼하되 오래 머무르지 않는 사람이었다.",
    "지금 나는 도시의 아파트에서 마트에서 산 된장을 먹는다. 편리하지만 어딘가 허전한 맛이다. 할머니의 된장에는 시간과 정성, 그리고 기다림이 들어 있었다. 계절이 바뀔 때마다 독을 열어 살피고, 햇살 좋은 날에는 뚜껑을 열어 바람을 쐬어 주던 그 과정 자체가 맛의 일부였다. 그렇게 일 년 넘게 익힌 된장에서는 볕 냄새와 바람 냄새가 은은하게 배어 나왔다. 나는 문득 할머니의 나무 의자가 아직 그 자리에 있을지 궁금해진다. 돌아갈 수 없는 시간 속에서 장독대의 기억만이 짠하게 남아 있다."
  ],
  13: [ // NONFICTION - 빛의 굴절
    "빛은 직진하는 성질을 가지고 있지만, 서로 다른 물질의 경계면을 만나면 진행 방향이 꺾인다. 이 현상을 빛의 굴절이라 부른다. 예를 들어 물컵에 빨대를 넣으면 빨대가 꺾여 보이는데, 이것은 공기와 물의 경계에서 빛이 방향을 바꾸기 때문이다. 수영장 바닥이 실제보다 얕아 보이는 것도 같은 원리이다. 굴절이 일어나는 까닭은 빛의 속도가 물질마다 다르기 때문이다. 빛은 밀도가 낮은 물질에서 높은 물질로 들어갈 때 속도가 느려지면서 경계면 쪽으로 꺾이고, 반대의 경우에는 경계면에서 멀어지는 쪽으로 꺾인다. 이러한 규칙을 네덜란드의 과학자 스넬이 수학적으로 정리하였으며, 이를 스넬의 법칙이라 부른다. 스넬의 법칙은 굴절각을 예측하는 데 핵심적인 도구로 활용된다.",
    "굴절의 정도는 두 물질 사이의 굴절률 차이에 의해 결정된다. 굴절률이란 진공에서의 빛의 속도를 해당 물질에서의 빛의 속도로 나눈 값으로, 물질이 빛을 얼마나 느리게 하는지를 나타내는 수치이다. 공기의 굴절률은 거의 1이고, 물의 굴절률은 약 1.33이며, 유리는 약 1.5이다. 굴절률이 높을수록 빛이 물질 안에서 느려지므로, 유리가 물보다 빛을 더 많이 꺾는다는 뜻이다. 다이아몬드의 굴절률은 2.42로 매우 높아 빛이 내부에서 여러 번 반사되면서 특유의 찬란한 빛을 만들어 낸다. 보석 세공사들은 이 성질을 이용해 빛이 최대한 반짝이도록 면을 깎는다.",
    "빛의 굴절은 자연과 일상에서 다양하게 관찰된다. 아지랑이는 지면 근처의 뜨거운 공기와 위쪽의 차가운 공기 사이에서 빛이 굴절되어 생기는 현상이다. 사막에서 보이는 신기루도 이와 같은 원리로 설명되는데, 먼 곳의 하늘빛이 굴절되어 마치 물이 있는 것처럼 보인다. 무지개 역시 빗방울 속에서 빛이 굴절과 반사를 거치며 색깔별로 분리되어 나타나는 것이다. 안경이나 카메라 렌즈도 빛의 굴절을 이용하여 초점을 맞추는 도구이다. 이처럼 굴절 원리를 이해하면 우리 주변의 여러 광학 현상을 과학적으로 설명할 수 있고, 이를 기술에 응용할 수도 있다."
  ],
  14: [ // LITERATURE - 도서관의 비밀
    "학교 도서관 한쪽 구석에는 아무도 열어 보지 않는 유리 진열장이 하나 있었다. 먼지가 가득 쌓인 유리 너머로 표지가 너덜너덜한 책 한 권이 세워져 있었고, 옆에 손으로 쓴 쪽지가 놓여 있었다. '이 책을 끝까지 읽은 사람은 아직 없습니다.' 그 한 줄이 나의 시선을 붙잡았다. 나는 호기심이 생겨 사서 선생님께 그 책을 빌릴 수 있느냐고 여쭈었다. 선생님은 잠시 망설이더니 서랍에서 작은 열쇠를 꺼내 진열장 문을 열어 주셨다. 책을 건네시며 선생님은 나에게 다 읽으면 반드시 돌려달라고 신신당부하셨다. 선생님의 표정에서 그 책이 보통 책이 아님을 짐작할 수 있었다.",
    "책의 첫 장을 넘기자 먼지가 작은 구름처럼 일었다. 오래된 종이에서 시큼한 냄새가 났고, 글씨는 누군가가 볼펜으로 또박또박 적은 것이었다. 이야기는 오래전 이 학교에서 지내던 한 학생에 관한 것이었다. 그 학생은 몸이 약해 운동장에 나가지 못했고, 쉬는 시간마다 홀로 도서관에 와서 책을 읽었다. 친구가 없었던 그 학생에게 도서관은 유일한 안식처였다. 어느 날 그 학생이 도서관 벽 뒤에 숨겨진 작은 방을 발견했다는 내용이 나왔다. 방 안에는 이전 졸업생들이 남긴 쪽지와 그림이 가득했고, 학생은 자신도 무언가를 남기기로 결심했다. 나는 점점 그 학생이 누구인지 궁금해졌다.",
    "이야기 속 학생은 매일 그 비밀 방에 자신의 일기를 한 장씩 붙였다. 수업 시간에 웃긴 일, 급식에서 맛있었던 반찬, 도서관에서 만난 좋은 문장 같은 소소한 일상이 적혀 있었다. 졸업을 앞두고 학생은 마지막 쪽지에 이렇게 썼다. '이 방을 찾는 다음 사람에게, 네가 혼자라고 느낄 때 여기에 오면 돼. 여기에는 너처럼 혼자였던 사람들의 이야기가 있으니까.' 책을 다 읽은 뒤 나는 심장이 뛰는 것을 느끼며 도서관 벽을 유심히 살폈다. 정말로 벽 한쪽에 살짝 열리는 작은 문이 있었다. 떨리는 손으로 문을 열자, 노란 쪽지들이 빼곡히 붙어 있는 좁은 공간이 나타났다. 나는 한참 동안 거기 서서 낡은 쪽지들을 하나하나 읽었다."
  ],
  15: [ // NONFICTION - 토양과 미생물
    "한 줌의 흙 속에는 수십억 마리의 미생물이 살고 있다. 눈에 보이지 않는 이 생물들은 세균, 곰팡이, 원생동물 등 매우 다양한 종류로 이루어져 있다. 이 미생물들은 토양 생태계에서 없어서는 안 될 역할을 수행한다. 세균과 곰팡이는 낙엽이나 동물의 사체 같은 유기물을 분해하여 질소, 인, 칼륨 등의 무기 영양소로 바꾸고, 이 영양소는 다시 식물의 뿌리를 통해 흡수된다. 이처럼 미생물의 분해 작용은 양분이 생태계 안에서 끊임없이 순환하도록 만드는 핵심 고리이다. 만약 미생물이 모두 사라진다면 낙엽은 쌓이기만 할 것이고, 식물은 필요한 양분을 얻지 못해 결국 자라지 못할 것이다.",
    "토양 미생물 가운데 특히 주목할 것은 질소 고정 세균이다. 공기 중에는 질소가 약 78퍼센트를 차지하지만, 대부분의 생물은 이 질소를 직접 이용할 수 없다. 질소 기체는 두 원자 사이의 삼중 결합이 매우 강해 쉽게 분해되지 않기 때문이다. 질소 고정 세균은 공기 속 질소를 암모니아와 같은 형태로 바꾸어 식물이 뿌리로 흡수할 수 있게 해 준다. 콩과 식물의 뿌리에 공생하는 뿌리혹박테리아가 대표적인 예이다. 이 박테리아 덕분에 콩밭을 돌려짓기 하면 땅의 비옥도가 자연스럽게 회복되는데, 이는 오래전부터 농부들이 경험적으로 알고 있던 소중한 지혜였다.",
    "현대 농업에서 화학 비료의 과다 사용은 토양 미생물의 다양성을 감소시키는 주요 원인으로 꼽힌다. 화학 비료가 단기적으로 수확량을 높이는 것은 사실이지만, 장기적으로는 토양 구조를 약화시키고 미생물 군집을 단순화한다. 토양이 딱딱해지면 물과 공기가 잘 통하지 않아 식물 뿌리의 성장도 어려워진다. 이에 따라 최근에는 유기농법이나 미생물 접종 기술처럼 토양 생태계를 살리는 방향의 농법이 세계적으로 주목받고 있다. 건강한 토양을 유지하는 일은 단순히 농작물 수확을 넘어서, 지구 생태계 전체의 균형을 지키는 일과 다르지 않다."
  ],
  16: [ // LITERATURE - 연탄 한 장
    "우리 동네에는 겨울마다 연탄을 때는 집이 몇 채 남아 있었다. 높은 아파트 사이로 낮은 슬레이트 지붕이 옹기종기 모여 있는 좁은 골목이었다. 아버지는 연탄 배달을 하시는 분이었다. 새벽이면 아버지의 등에 연탄이 열두 장씩 실렸고, 아버지는 가파른 골목길을 한 걸음 한 걸음 조심스럽게 올라갔다. 숨이 거칠어져도 연탄을 내려놓는 법이 없었다. 한 장이라도 깨지면 온기가 줄어들기 때문이라고 아버지는 말씀하셨다. 나는 아버지의 검은 손을 보면서 연탄 가루가 비누로 씻어도 잘 지워지지 않는다는 것을 알았다. 그 손으로 아버지는 내 도시락 뚜껑을 열어 주시기도 했다.",
    "어느 해 겨울은 유난히 추웠다. 바람이 유리창을 두드리고, 수도꼭지에서 물이 얼어붙는 날이 이어졌다. 골목 끝에 혼자 사시는 김 할머니 댁의 연탄이 다 떨어졌다는 소식이 들렸다. 아버지는 퇴근 뒤 남은 연탄 다섯 장을 지고 할머니 댁으로 가셨다. 나도 아버지 뒤를 따라갔는데, 방 안에서 담요를 두르고 계신 할머니의 입술이 파랗게 질려 있었다. 차가운 방바닥에 서리가 맺혀 있을 정도였다. 아버지가 아궁이에 불을 지피자 방이 서서히 따뜻해졌고, 할머니는 고맙다는 말 대신 아버지의 손을 꼭 잡았다. 아버지는 아무 말 없이 미소만 짓고 돌아오셨다.",
    "지금은 연탄을 때는 집이 거의 사라졌고, 아버지도 다른 일을 하신다. 하지만 겨울이 올 때마다 나는 아버지의 등에 실린 연탄 열두 장과 김 할머니의 파란 입술을 떠올린다. 연탄 연기가 골목을 뿌옇게 채우던 저녁 풍경도 함께 떠오른다. 그때는 몰랐지만 지금 돌이켜 보면, 아버지는 연탄뿐 아니라 온정을 배달하는 사람이었다. 한 장의 연탄이 한 사람의 밤을 따뜻하게 했듯, 작은 나눔이 누군가의 추위를 녹일 수 있다는 것을 아버지는 말이 아닌 행동으로 알려 주셨다. 아버지의 검은 손은 결코 더러운 것이 아니라 가장 따뜻한 손이었다."
  ]
};

// 문단 텍스트만 교체 후 하이라이트 범위 재계산
function splitSents(text) {
  const r = []; let c = '';
  for (let i = 0; i < text.length; i++) {
    c += text[i];
    if ('.?!'.includes(text[i]) && (i === text.length-1 || text[i+1] === ' ')) {
      r.push(c.trim()); c = '';
      if (text[i+1] === ' ') i++;
    }
  }
  if (c.trim()) r.push(c.trim());
  return r;
}

for (const [dayStr, newTexts] of Object.entries(expansions)) {
  const dayNum = parseInt(dayStr);
  const item = batch.items[dayNum - 1];
  const payload = item.content.payload;

  // 문단 교체
  const oldParas = payload.passage.paragraphs;
  for (let i = 0; i < newTexts.length; i++) {
    oldParas[i].text = newTexts[i];
  }

  // 하이라이트 범위 재계산
  const timeline = payload.intensive.timeline;
  let timelineIdx = 0;

  for (const para of oldParas) {
    const sents = splitSents(para.text);
    for (const sent of sents) {
      if (timelineIdx >= timeline.length) break;
      const start = para.text.indexOf(sent);
      timeline[timelineIdx].highlight = {
        ranges: [{ paragraphId: para.id, start, end: start + sent.length }]
      };
      timelineIdx++;
    }
    // 문단 전체 (중심내용)
    if (timelineIdx < timeline.length) {
      timeline[timelineIdx].highlight = {
        ranges: [{ paragraphId: para.id, start: 0, end: para.text.length }]
      };
      timelineIdx++;
    }
  }

  // 새 문장이 추가되었으면 타임라인에 추가 step 삽입
  // 실제로는 기존 step 수와 새 문장 수를 맞춰야 함
  // 여기서는 타임라인이 부족하면 남은 문장에 기본 질문 추가
  let allSents = [];
  for (const para of oldParas) {
    const sents = splitSents(para.text);
    for (const sent of sents) {
      allSents.push({ paraId: para.id, sent });
    }
    allSents.push({ paraId: para.id, summary: true, len: para.text.length });
  }

  // 타임라인 수 부족 시 보충
  while (timeline.length < allSents.length) {
    const entry = allSents[timeline.length];
    const stepId = `s${timeline.length + 1}`;
    if (entry.summary) {
      timeline.push({
        stepId,
        highlight: { ranges: [{ paragraphId: entry.paraId, start: 0, end: entry.len }] },
        question: {
          prompt: "이 문단의 중심 내용은?",
          choices: [
            {id:"A",text:"문단의 핵심 주장을 요약한 내용"},{id:"B",text:"관련 없는 다른 주제의 내용"},
            {id:"C",text:"다음 문단을 예고하는 내용"},{id:"D",text:"이전 문단을 반복한 것"}
          ],
          answerId: "A",
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    } else {
      const start = oldParas.find(p => p.id === entry.paraId).text.indexOf(entry.sent);
      timeline.push({
        stepId,
        highlight: { ranges: [{ paragraphId: entry.paraId, start, end: start + entry.sent.length }] },
        question: {
          prompt: "이 문장에서 알 수 있는 내용은?",
          choices: [
            {id:"A",text:"글의 주제를 뒷받침하는 정보이다"},{id:"B",text:"앞 문장과 반대되는 내용이다"},
            {id:"C",text:"글의 흐름과 관련 없는 내용이다"},{id:"D",text:"다음 문단을 미리 요약한다"}
          ],
          answerId: "A",
          scoring: { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true }
        }
      });
    }
  }

  const totalLen = oldParas.reduce((s, p) => s + p.text.length, 0);
  console.log(`Day ${dayNum}: len=${totalLen}, steps=${timeline.length}, recall=${payload.recall.cards.length}, confirm=${payload.confirm.questions.length}`);

  // static 파일도 업데이트
  const staticPath = path.join(BASE, 'frontend', 'public', 'daily-reading', 'frege3', `${String(dayNum).padStart(3,'0')}.json`);
  fs.writeFileSync(staticPath, JSON.stringify(item.content, null, 2), 'utf8');
}

fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
console.log('배치 파일 저장 완료');
