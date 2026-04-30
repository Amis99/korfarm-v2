const fs = require('fs');
const filePath = 'frontend/public/daily-quiz/프레게3/227.json';
const raw = fs.readFileSync(filePath, 'utf8');

// q10 시작 { 위치
const q10idPos = raw.indexOf('"id": "dq-FREGE_3-227-10"');
let q10start = q10idPos;
while (raw[q10start] !== '{') q10start--;

// q10 이전 내용 보존
const before = raw.substring(0, q10start);

// 깨끗한 q10 JSON
const cleanQ10 = `{
        "id": "dq-FREGE_3-227-10",
        "type": "CHOICE_OX",
        "questionKind": "CHOICE_ANALYSIS",
        "competency": "선택지 분석 및 전략 수립 능력",
        "stem": "다음 선택지가 지문의 내용과 일치하면 O, 일치하지 않으면 X를 고르시오.",
        "choices": [
          {
            "choiceId": "A",
            "text": "벤담은 쾌락의 질적 차이를 구분하여 고급 쾌락과 저급 쾌락을 나누었다.",
            "propositions": [
              {
                "propId": "A1",
                "text": "쾌락의 질적 차이를 구분한 것은 밀이지 벤담이 아니다.",
                "evidenceTokens": ["p1_t4"],
                "oxAnswer": "X",
                "matchMode": "ALL"
              }
            ],
            "finalIsCorrectChoice": false
          },
          {
            "choiceId": "D",
            "text": "19세기 영국 공리주의는 벤담의 양적 공리주의와 밀의 질적 공리주의를 거치며 발전하였으며, 두 입장 모두 행동의 결과를 도덕 판단의 기준으로 삼는다는 공통점이 있다.",
            "propositions": [
              {
                "propId": "D1",
                "text": "벤담과 밀은 모두 결과를 도덕 판단의 기준으로 삼는 공리주의자이다.",
                "evidenceTokens": ["p1_t1"],
                "oxAnswer": "O",
                "matchMode": "ALL"
              }
            ],
            "finalIsCorrectChoice": true
          }
        ],
        "explanation": "이 윤리학 단락 철학의 역사적 태동과 그 두 거장 사조 파벌에 관한 통합 본문 요지는 명백합니다. 19세기 산업혁명기 빈부격차 혼란 속에서 '다수의 유용 행복도 증진(결과 효용)'을 측정해 정책 도덕 기준으로 삼자는 영국의 실용 철학 공리주의가 탄생했고, 그 창시자 벤담은 모든 쾌락을 저울로 수치 계산 가능하다는 평등한 '양적 공리주의'를 최초 창안 정립했으나, 그 똑똑 제자 존 스튜어트 밀은 쾌락에도 분명 동물적 육체 배부름과 철학적 진리 탐구라는 저급과 고급의 도무지 산수 계산 불가한 영혼 단계적 '고양된 정신 차이'가 분명 존재한다고 비판 보완하여 '질적 공리주의'를 내세워 발전시켰다는 아주 역사 연대기 철학 인과 흐름입니다. 이 두 벤담과 밀 입장의 차이점(쾌락의 질 양)과 공통점(결국 두 학파 모두 행동 동기가 아닌 '결과주의 유용성 효율 쾌락 행복 산출'을 최상위 선악 잣대로 삼음)의 거대 공통 관점 철학의 뼈대를 아주 정밀 모범 종합으로 거울처럼 훌륭히 담아 정리해낸 D 항목이 유일 최고 빛나는 완전 팩트 정답입니다.",
        "scoring": {
          "correctDeltaSec": 20,
          "wrongDeltaSec": -40
        }
      }
    ]
  }
}
`;

const result = before + cleanQ10;

try {
  JSON.parse(result);
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('OK: 파싱 성공, 저장 완료');
  console.log('파일 크기:', result.length, '자');
} catch (e) {
  console.log('ERR:', e.message.substring(0, 150));
  const m = e.message.match(/position (\d+)/);
  if (m) {
    const pos = parseInt(m[1]);
    console.log('오류 위치:', JSON.stringify(result.substring(pos - 30, pos + 50)));
  }
}
