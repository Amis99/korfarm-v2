// 러셀1 Day 2 문학 - "할머니의 텃밭" 전체 JSON 생성
const fs = require('fs');
const path = require('path');

const p1 = "여름 방학이 시작되던 날, 나는 커다란 배낭 하나를 메고 시골 할머니 댁에 도착했다. 할머니는 언제나처럼 대문 앞에서 환한 미소로 나를 반갑게 맞아 주셨다. 집 뒤편에는 할머니가 오랫동안 정성껏 가꾸어 온 넓은 텃밭이 펼쳐져 있었다. 텃밭에는 고추, 상추, 토마토, 오이 같은 여러 가지 채소가 가지런히 줄을 맞추어 자라고 있었다. 나는 도시에서 화분에 꽃 한 송이 키워 본 것이 전부였기에, 이렇게 넓은 밭을 보니 신기하면서도 한편으로는 막막한 기분이 들었다. 할머니는 걱정스러운 내 표정을 살피시더니 조용히 말씀하셨다. \"천천히 하면 돼. 식물도 사람처럼 서두르면 잘 자라지 못한단다.\"";

const p2 = "다음 날 이른 아침, 할머니는 나를 텃밭으로 데려가셨다. 가장 먼저 해야 할 일은 긴 호스를 들고 채소에 물을 주는 것이었다. 할머니는 물줄기를 세게 틀지 말고 약하게 뿌려야 한다고 알려 주셨다. 물을 세게 뿌리면 연약한 어린 싹이 꺾이거나 흙이 파여서 뿌리가 드러날 수 있기 때문이었다. 물을 다 준 뒤에는 잡초를 뽑는 일이 이어졌다. 잡초는 채소가 흡수해야 할 영양분과 수분을 빼앗아 가기 때문에 부지런히 뽑아 주어야 한다고 하셨다. 처음에는 어떤 것이 잡초이고 어떤 것이 채소인지 구분하기가 쉽지 않아 헤맸지만, 할머니의 친절한 설명을 들으며 하나하나 눈을 키워 나갔다.";

const p3 = "일주일쯤 지나자 내가 매일 물을 준 토마토에 작고 노란 꽃이 피기 시작했다. 그 꽃을 처음 보았을 때 나는 말로 표현하기 어려운 뿌듯함을 느꼈다. 매일 아침 일찍 일어나 물을 주고 잡초를 뽑던 수고가 눈에 보이는 결과로 나타난 것이다. 할머니는 꽃이 진 자리에 곧 열매가 맺힐 거라고 말씀하셨다. 그 말을 듣고 나는 토마토가 빨갛게 익어 갈 날이 기다려져서 매일 텃밭을 찾았다. 방학이 끝나고 도시로 돌아올 때, 할머니는 내가 직접 기른 토마토 몇 개를 작은 봉지에 담아 주셨다. 집으로 돌아와 그 토마토를 한 입 베어 물었을 때, 마트에서 산 것과는 비교할 수 없이 달콤한 맛이 입안 가득 퍼졌다. 그때 나는 깨달았다. 정성을 들여 무언가를 돌보는 일은 그 결과뿐 아니라 과정 자체가 소중한 경험이 된다는 것을.";

const scoring = { correctDeltaSec: 20, wrongDeltaSec: -40, eliminateWrongChoice: true };

// 문장 경계 (위 스크립트에서 계산한 결과 사용)
// p1: 7문장, p2: 7문장, p3: 9문장 = 총 23문장 + 3 문단중심 = 26 steps

const content = {
  contentId: "dr-r1-002",
  contentType: "DAILY_READING",
  version: 1,
  status: "PUBLISHED",
  title: "일일 독해(러셀 1) Day 2 문학",
  description: "일일 독해 - 정독·복기·확인",
  targetLevel: "RUSSELL_1",
  schoolGradeRange: { min: 7, max: 8 },
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
      paragraphs: [
        { id: "p1", text: p1 },
        { id: "p2", text: p2 },
        { id: "p3", text: p3 }
      ]
    },
    intensive: {
      timeline: [
        // === p1 ===
        // s1: [0,47]
        {
          stepId: "s1",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 47 }] },
          question: {
            prompt: "첫 문장에서 '나'가 한 일로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "여름 방학에 배낭을 메고 시골 할머니 댁에 갔다." },
              { id: "B", text: "여름 방학에 친구와 함께 바다로 여행을 떠났다." },
              { id: "C", text: "겨울 방학에 시골 할아버지 댁을 방문했다." },
              { id: "D", text: "여름 방학에 도시에서 캠프에 참가했다." }
            ],
            answerId: "A", scoring
          }
        },
        // s2: [48,87]
        {
          stepId: "s2",
          highlight: { ranges: [{ paragraphId: "p1", start: 48, end: 87 }] },
          question: {
            prompt: "할머니가 '나'를 맞이한 모습으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "대문 앞에서 환한 미소로 반갑게 맞아 주셨다." },
              { id: "B", text: "집 안에서 전화로 오라고 말씀하셨다." },
              { id: "C", text: "텃밭에서 일을 하면서 인사만 하셨다." },
              { id: "D", text: "마을 입구까지 차를 타고 마중 나오셨다." }
            ],
            answerId: "A", scoring
          }
        },
        // s3: [88,130]
        {
          stepId: "s3",
          highlight: { ranges: [{ paragraphId: "p1", start: 88, end: 130 }] },
          question: {
            prompt: "집 뒤편에 있었던 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "할머니가 오랫동안 정성껏 가꾸어 온 넓은 텃밭이다." },
              { id: "B", text: "오래된 나무로 둘러싸인 작은 연못이다." },
              { id: "C", text: "할머니가 새로 지은 창고 건물이다." },
              { id: "D", text: "마을 사람들이 함께 쓰는 놀이터이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s4: [131,185]
        {
          stepId: "s4",
          highlight: { ranges: [{ paragraphId: "p1", start: 131, end: 185 }] },
          question: {
            prompt: "텃밭에서 자라고 있는 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "고추, 상추, 토마토, 오이 같은 여러 가지 채소이다." },
              { id: "B", text: "장미, 백합, 튤립 같은 여러 가지 꽃이다." },
              { id: "C", text: "사과, 배, 포도 같은 과일나무이다." },
              { id: "D", text: "소나무, 참나무 같은 큰 나무이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s5: [186,258]
        {
          stepId: "s5",
          highlight: { ranges: [{ paragraphId: "p1", start: 186, end: 258 }] },
          question: {
            prompt: "'나'가 넓은 밭을 보고 느낀 감정으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "신기하면서도 한편으로는 막막한 기분을 느꼈다." },
              { id: "B", text: "무서워서 집 안으로 도망가고 싶은 기분을 느꼈다." },
              { id: "C", text: "밭이 너무 작아서 실망하는 기분을 느꼈다." },
              { id: "D", text: "이미 잘 알고 있어서 자신감이 넘치는 기분을 느꼈다." }
            ],
            answerId: "A", scoring
          }
        },
        // s6: [259,292]
        {
          stepId: "s6",
          highlight: { ranges: [{ paragraphId: "p1", start: 259, end: 292 }] },
          question: {
            prompt: "할머니가 '나'의 표정을 보고 한 행동으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "걱정스러운 표정을 살피시더니 조용히 말씀하셨다." },
              { id: "B", text: "표정을 무시하고 텃밭 일을 계속하셨다." },
              { id: "C", text: "화를 내시며 빨리 일하라고 재촉하셨다." },
              { id: "D", text: "웃으시며 오늘은 쉬라고 말씀하셨다." }
            ],
            answerId: "A", scoring
          }
        },
        // s7: [293,330]
        {
          stepId: "s7",
          highlight: { ranges: [{ paragraphId: "p1", start: 293, end: 330 }] },
          question: {
            prompt: "할머니 말씀의 핵심 뜻으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "서두르지 말고 천천히 하면 된다는 뜻이다." },
              { id: "B", text: "식물은 절대 기를 수 없다는 뜻이다." },
              { id: "C", text: "사람보다 식물이 더 빨리 자란다는 뜻이다." },
              { id: "D", text: "텃밭 일을 하지 않아도 된다는 뜻이다." }
            ],
            answerId: "A", scoring
          }
        },
        // p1 문단 중심내용
        {
          stepId: "s8",
          highlight: { ranges: [{ paragraphId: "p1", start: 0, end: 330 }] },
          question: {
            prompt: "첫째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "시골 할머니 댁에 도착한 '나'가 넓은 텃밭을 보고 막막해하자 할머니가 격려해 주었다." },
              { id: "B", text: "'나'는 시골에 가기 싫었지만 할머니가 억지로 데려오셨다." },
              { id: "C", text: "할머니 댁의 텃밭은 오래전에 망해서 채소가 자라지 않았다." },
              { id: "D", text: "'나'는 도시에서 이미 농사를 많이 해 본 경험이 있었다." }
            ],
            answerId: "A", scoring
          }
        },
        // === p2 ===
        // s9: [0,31]
        {
          stepId: "s9",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 31 }] },
          question: {
            prompt: "다음 날 아침 할머니가 '나'를 데려간 곳은 어디인가요?",
            choices: [
              { id: "A", text: "집 뒤편의 텃밭으로 데려가셨다." },
              { id: "B", text: "마을 시장으로 데려가셨다." },
              { id: "C", text: "이웃집 마당으로 데려가셨다." },
              { id: "D", text: "강가의 낚시터로 데려가셨다." }
            ],
            answerId: "A", scoring
          }
        },
        // s10: [32,69]
        {
          stepId: "s10",
          highlight: { ranges: [{ paragraphId: "p2", start: 32, end: 69 }] },
          question: {
            prompt: "텃밭에서 가장 먼저 해야 할 일로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "긴 호스를 들고 채소에 물을 주는 것이다." },
              { id: "B", text: "잡초를 먼저 모두 뽑아내는 것이다." },
              { id: "C", text: "열매를 따서 바구니에 담는 것이다." },
              { id: "D", text: "새 씨앗을 심기 위해 구멍을 파는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s11: [70,108]
        {
          stepId: "s11",
          highlight: { ranges: [{ paragraphId: "p2", start: 70, end: 108 }] },
          question: {
            prompt: "할머니가 물 주는 방법에 대해 알려 준 내용으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "물줄기를 세게 틀지 말고 약하게 뿌려야 한다." },
              { id: "B", text: "물줄기를 최대한 세게 틀어야 빨리 끝난다." },
              { id: "C", text: "물은 저녁에만 주어야 효과가 있다." },
              { id: "D", text: "호스 대신 양동이로 한꺼번에 부어야 한다." }
            ],
            answerId: "A", scoring
          }
        },
        // s12: [109,160]
        {
          stepId: "s12",
          highlight: { ranges: [{ paragraphId: "p2", start: 109, end: 160 }] },
          question: {
            prompt: "물을 세게 뿌리면 안 되는 까닭으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "어린 싹이 꺾이거나 흙이 파여 뿌리가 드러날 수 있기 때문이다." },
              { id: "B", text: "물이 너무 빨리 없어져서 호스가 고장 나기 때문이다." },
              { id: "C", text: "채소가 물을 싫어해서 시들어 버리기 때문이다." },
              { id: "D", text: "흙이 너무 질어져서 걸어 다닐 수 없기 때문이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s13: [161,187]
        {
          stepId: "s13",
          highlight: { ranges: [{ paragraphId: "p2", start: 161, end: 187 }] },
          question: {
            prompt: "물을 다 준 뒤에 이어진 일로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "잡초를 뽑는 일이 이어졌다." },
              { id: "B", text: "열매를 수확하는 일이 이어졌다." },
              { id: "C", text: "울타리를 고치는 일이 이어졌다." },
              { id: "D", text: "비료를 뿌리는 일이 이어졌다." }
            ],
            answerId: "A", scoring
          }
        },
        // s14: [188,243]
        {
          stepId: "s14",
          highlight: { ranges: [{ paragraphId: "p2", start: 188, end: 243 }] },
          question: {
            prompt: "잡초를 부지런히 뽑아야 하는 까닭으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "잡초가 채소의 영양분과 수분을 빼앗아 가기 때문이다." },
              { id: "B", text: "잡초가 텃밭의 울타리를 부수기 때문이다." },
              { id: "C", text: "잡초가 예쁘지 않아서 보기 싫기 때문이다." },
              { id: "D", text: "잡초가 벌레를 텃밭으로 불러오기 때문이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s15: [244,321]
        {
          stepId: "s15",
          highlight: { ranges: [{ paragraphId: "p2", start: 244, end: 321 }] },
          question: {
            prompt: "'나'가 처음에 겪은 어려움과 이를 극복한 방법으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "잡초와 채소를 구분하기 어려웠지만 할머니 설명을 들으며 배워 나갔다." },
              { id: "B", text: "물 주기가 어려워서 포기하고 집으로 돌아갔다." },
              { id: "C", text: "채소 이름을 몰랐지만 책을 읽으며 혼자 공부했다." },
              { id: "D", text: "잡초가 너무 많아서 제초제를 뿌렸다." }
            ],
            answerId: "A", scoring
          }
        },
        // p2 문단 중심내용
        {
          stepId: "s16",
          highlight: { ranges: [{ paragraphId: "p2", start: 0, end: 321 }] },
          question: {
            prompt: "둘째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "'나'는 할머니에게 물 주기와 잡초 뽑기 같은 텃밭 가꾸기의 기본을 배웠다." },
              { id: "B", text: "'나'는 텃밭 일이 너무 힘들어서 포기하고 싶었다." },
              { id: "C", text: "할머니는 텃밭 일을 혼자 다 하시고 '나'는 구경만 했다." },
              { id: "D", text: "텃밭에는 잡초만 가득해서 채소가 자랄 수 없었다." }
            ],
            answerId: "A", scoring
          }
        },
        // === p3 ===
        // s17: [0,42]
        {
          stepId: "s17",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 42 }] },
          question: {
            prompt: "일주일쯤 지나서 토마토에 생긴 변화로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "작고 노란 꽃이 피기 시작했다." },
              { id: "B", text: "빨간 열매가 주렁주렁 열렸다." },
              { id: "C", text: "잎이 모두 시들어 떨어졌다." },
              { id: "D", text: "줄기가 땅으로 쓰러졌다." }
            ],
            answerId: "A", scoring
          }
        },
        // s18: [43,81]
        {
          stepId: "s18",
          highlight: { ranges: [{ paragraphId: "p3", start: 43, end: 81 }] },
          question: {
            prompt: "'나'가 꽃을 보고 느낀 감정으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "말로 표현하기 어려운 뿌듯함을 느꼈다." },
              { id: "B", text: "꽃이 예쁘지 않아서 실망감을 느꼈다." },
              { id: "C", text: "더 많은 물을 주어야 한다는 걱정을 느꼈다." },
              { id: "D", text: "꽃이 너무 빨리 피어서 당황함을 느꼈다." }
            ],
            answerId: "A", scoring
          }
        },
        // s19: [82,131]
        {
          stepId: "s19",
          highlight: { ranges: [{ paragraphId: "p3", start: 82, end: 131 }] },
          question: {
            prompt: "꽃이 핀 것이 '나'에게 의미 있었던 까닭으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "매일 물을 주고 잡초를 뽑던 수고가 눈에 보이는 결과로 나타났기 때문이다." },
              { id: "B", text: "처음 본 노란 꽃이 좋아하는 색깔이었기 때문이다." },
              { id: "C", text: "할머니가 꽃을 보고 상을 주겠다고 하셨기 때문이다." },
              { id: "D", text: "친구들에게 꽃 사진을 보여주고 싶었기 때문이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s20: [132,165]
        {
          stepId: "s20",
          highlight: { ranges: [{ paragraphId: "p3", start: 132, end: 165 }] },
          question: {
            prompt: "할머니가 꽃이 진 뒤에 일어날 일로 말씀하신 것은 무엇인가요?",
            choices: [
              { id: "A", text: "꽃이 진 자리에 곧 열매가 맺힐 것이라고 하셨다." },
              { id: "B", text: "꽃이 지면 그 자리에 새 꽃이 다시 필 것이라고 하셨다." },
              { id: "C", text: "꽃이 지면 줄기가 마르므로 뽑아야 한다고 하셨다." },
              { id: "D", text: "꽃이 지면 다른 채소를 새로 심어야 한다고 하셨다." }
            ],
            answerId: "A", scoring
          }
        },
        // s21: [166,211]
        {
          stepId: "s21",
          highlight: { ranges: [{ paragraphId: "p3", start: 166, end: 211 }] },
          question: {
            prompt: "'나'가 매일 텃밭을 찾은 까닭으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "토마토가 빨갛게 익어 갈 날이 기다려졌기 때문이다." },
              { id: "B", text: "할머니가 매일 오라고 강제로 시키셨기 때문이다." },
              { id: "C", text: "텃밭에 새로운 씨앗을 심어야 했기 때문이다." },
              { id: "D", text: "잡초가 하루 만에 다시 가득 자라났기 때문이다." }
            ],
            answerId: "A", scoring
          }
        },
        // s22: [212,268]
        {
          stepId: "s22",
          highlight: { ranges: [{ paragraphId: "p3", start: 212, end: 268 }] },
          question: {
            prompt: "방학이 끝날 때 할머니가 해 주신 일로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "'나'가 직접 기른 토마토를 봉지에 담아 주셨다." },
              { id: "B", text: "새 씨앗을 선물로 포장하여 주셨다." },
              { id: "C", text: "텃밭 사진을 찍어서 앨범으로 만들어 주셨다." },
              { id: "D", text: "다음 방학에도 꼭 오라는 편지를 써 주셨다." }
            ],
            answerId: "A", scoring
          }
        },
        // s23: [269,335]
        {
          stepId: "s23",
          highlight: { ranges: [{ paragraphId: "p3", start: 269, end: 335 }] },
          question: {
            prompt: "직접 기른 토마토를 먹었을 때의 느낌으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "마트에서 산 것과 비교할 수 없이 달콤한 맛이 퍼졌다." },
              { id: "B", text: "너무 시큼해서 먹기 힘들었다." },
              { id: "C", text: "마트에서 산 것과 맛이 똑같았다." },
              { id: "D", text: "아직 덜 익어서 딱딱하고 맛이 없었다." }
            ],
            answerId: "A", scoring
          }
        },
        // s24: [336,347] + [348,399] → 마지막 깨달음 (두 문장을 하나로)
        {
          stepId: "s24",
          highlight: { ranges: [{ paragraphId: "p3", start: 336, end: 399 }] },
          question: {
            prompt: "'나'가 깨달은 것으로 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "정성을 들여 돌보는 일은 결과뿐 아니라 과정 자체가 소중한 경험이라는 것이다." },
              { id: "B", text: "토마토는 직접 기르는 것보다 사 먹는 것이 더 편하다는 것이다." },
              { id: "C", text: "시골보다 도시에서 사는 것이 더 좋다는 것이다." },
              { id: "D", text: "할머니의 텃밭은 전문 농부만 가꿀 수 있다는 것이다." }
            ],
            answerId: "A", scoring
          }
        },
        // p3 문단 중심내용
        {
          stepId: "s25",
          highlight: { ranges: [{ paragraphId: "p3", start: 0, end: 399 }] },
          question: {
            prompt: "셋째 문단의 중심 내용으로 가장 알맞은 것은 무엇인가요?",
            choices: [
              { id: "A", text: "토마토에 꽃이 피고 열매를 맛보며 '나'는 정성을 들이는 과정의 소중함을 깨달았다." },
              { id: "B", text: "토마토가 잘 자라지 않아서 '나'는 크게 실망했다." },
              { id: "C", text: "할머니는 토마토를 모두 시장에 팔고 '나'에게는 주지 않았다." },
              { id: "D", text: "'나'는 도시로 돌아온 뒤 텃밭 경험을 모두 잊어버렸다." }
            ],
            answerId: "A", scoring
          }
        }
      ]
    },
    recall: {
      cards: [
        { id: "c1", text: "여름 방학에 시골 할머니 댁에 도착하여 넓은 텃밭을 보고 막막함을 느꼈다." },
        { id: "c2", text: "할머니는 서두르지 말고 천천히 하면 된다고 격려해 주셨다." },
        { id: "c3", text: "다음 날부터 텃밭에서 물주기와 잡초 뽑기를 배우기 시작했다." },
        { id: "c4", text: "물은 약하게 뿌려야 하고 잡초는 영양분을 빼앗으므로 부지런히 뽑아야 했다." },
        { id: "c5", text: "일주일쯤 지나 토마토에 노란 꽃이 피어 수고의 결과를 눈으로 확인했다." },
        { id: "c6", text: "꽃이 진 자리에 열매가 맺힌다는 말에 매일 텃밭을 찾으며 기다렸다." },
        { id: "c7", text: "방학이 끝나고 할머니가 담아 주신 토마토를 먹으니 달콤한 맛이 퍼졌다." },
        { id: "c8", text: "정성을 들여 돌보는 일은 결과뿐 아니라 과정 자체가 소중한 경험임을 깨달았다." }
      ],
      correctOrder: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"],
      seedPenalty: 1
    },
    confirm: {
      questions: [
        {
          id: "q1",
          prompt: "토마토에 노란 꽃이 핀 것을 보고 '나'가 느낀 감정은 무엇인가요?",
          answerText: "뿌듯함",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 72, end: 75 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q2",
          prompt: "채소의 영양분을 빼앗아 가기 때문에 뽑아야 하는 것은 무엇인가요?",
          answerText: "잡초",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 173, end: 175 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q3",
          prompt: "할머니가 오랫동안 정성껏 가꾸어 온 것은 무엇인가요?",
          answerText: "텃밭",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 118, end: 120 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q4",
          prompt: "할머니가 꽃이 진 자리에 곧 맺힐 거라고 말씀하신 것은 무엇인가요?",
          answerText: "열매",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 148, end: 150 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q5",
          prompt: "잡초가 채소에게서 빼앗아 가는 것 중 하나로 나온 것은 무엇인가요?",
          answerText: "영양분",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p2", start: 204, end: 207 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q6",
          prompt: "'나'가 도시에서 꽃을 키웠던 그릇의 이름은 무엇인가요?",
          answerText: "화분",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p1", start: 194, end: 196 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        },
        {
          id: "q7",
          prompt: "'나'가 마지막에 깨달은 것에서, 무언가를 돌보는 데 필요하다고 한 것은 무엇인가요?",
          answerText: "정성",
          answerMatchMode: "ANY",
          answerRanges: [{ paragraphId: "p3", start: 348, end: 350 }],
          scoring: { correctDeltaSec: 30, wrongDeltaSec: -45 },
          revealOnWrong: true
        }
      ]
    }
  }
};

// 검증
const charCount = content.payload.passage.paragraphs.reduce((s, p) => s + p.text.length, 0);
const intensiveCount = content.payload.intensive.timeline.length;
const recallCount = content.payload.recall.cards.length;
const confirmCount = content.payload.confirm.questions.length;

console.log("=== 검증 ===");
console.log(`지문 총 길이: ${charCount}자 (목표: 1050~1150)`);
console.log(`정독 steps: ${intensiveCount}`);
console.log(`복기 cards: ${recallCount} (목표: 8)`);
console.log(`확인 questions: ${confirmCount} (목표: 5~10)`);

let rangeErrors = 0;
content.payload.intensive.timeline.forEach(step => {
  step.highlight.ranges.forEach(r => {
    const para = content.payload.passage.paragraphs.find(p => p.id === r.paragraphId);
    if (!para) { console.log(`ERROR: ${step.stepId} - paragraph ${r.paragraphId} not found`); rangeErrors++; return; }
    if (r.start < 0 || r.end > para.text.length || r.start >= r.end) {
      console.log(`ERROR: ${step.stepId} - invalid range [${r.start}, ${r.end}] for ${r.paragraphId} (len=${para.text.length})`);
      rangeErrors++;
    }
  });
});

content.payload.confirm.questions.forEach(q => {
  q.answerRanges.forEach(r => {
    const para = content.payload.passage.paragraphs.find(p => p.id === r.paragraphId);
    if (!para) { console.log(`ERROR: ${q.id} - paragraph ${r.paragraphId} not found`); rangeErrors++; return; }
    const actual = para.text.substring(r.start, r.end);
    if (actual !== q.answerText) {
      console.log(`ERROR: ${q.id} - expected "${q.answerText}" but got "${actual}" at [${r.start}, ${r.end}]`);
      rangeErrors++;
    }
  });
});

console.log(`Range 오류: ${rangeErrors}건`);

if (charCount >= 1050 && charCount <= 1150 && recallCount === 8 && confirmCount >= 5 && rangeErrors === 0) {
  console.log("검증 통과!");

  const staticPath = path.join(__dirname, '..', 'frontend', 'public', 'daily-reading', 'russell1', '002.json');
  fs.writeFileSync(staticPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`저장: ${staticPath}`);

  const batchPath = path.join(__dirname, '..', 'generated', 'daily-batch-reading-russell1.json');
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  batch.items[1] = {
    content_type: "DAILY_READING",
    level_id: "RUSSELL_1",
    area: "READING",
    sub_area: "LITERATURE",
    day_index: 2,
    module_key: "reading_training",
    schema_version: "1.0",
    content: content
  };
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');
  console.log(`배치 업데이트: ${batchPath}`);
} else {
  console.log("검증 실패! 파일을 저장하지 않습니다.");
  if (charCount < 1050 || charCount > 1150) console.log(`  → 글자수 ${charCount}은 범위 밖`);
}
