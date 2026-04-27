#!/usr/bin/env node
/**
 * 러셀3 118 일일퀴즈 10번 — 신 CHOICE_COMPLEX_OX 시범 출제
 *
 * 흐름:
 *  1) 지문 정독해서 핵심 정보 파악
 *  2) 선택지 5개 구성 (1개 부적절 - 정답)
 *  3) 각 선택지에 명제 2~4개
 *  4) 각 명제의 근거 텍스트를 본문에서 검색해 char offset 자동 산출
 *  5) 글자수 균형, 괄호, 한정 표현, 부정 함정 검증
 *  6) 결과 JSON 출력 → 사용자 검수
 */

const PASSAGE = "소크라테스는 상대방이 스스로 무지를 깨닫고 진리에 도달하게 하는 '문답법'을 사용했다. 이는 질문을 통해 상대방의 논리적 모순을 드러내는 '반어법'과, 적절한 유도를 통해 스스로 정답을 찾아가게 돕는 '산파술'로 나뉜다. 그는 지식을 일방적으로 전달하기보다 대화를 통해 내면의 지혜를 끌어내는 과정을 중시했다. 소크라테스에게 철학이란 고정된 정답을 외우는 것이 아니라, 끊임없이 질문하며 참된 앎을 찾아가는 여정이다.";

// 근거 텍스트 → (start, end) 자동 산출
function findRange(text, target) {
  const s = text.indexOf(target);
  if (s < 0) throw new Error(`근거 텍스트 못 찾음: ${target.slice(0, 40)}`);
  return { paragraphId: "p1", start: s, end: s + target.length };
}

// ── 명제별 근거 보강 원칙 ──
// 한 명제를 검증할 본문 근거가 여러 영역에 흩어져 있으면 모두 evidenceTexts 에 포함.
// matchMode "ALL" → 학생이 모든 근거 영역을 클릭해야 통과 (학습 효과 ↑).
// 정답이 X 인 명제는 지문이 그 진술을 부정하는 영역들을 모두 적시.
const choices = [
  // ① (적절) — 문답법의 두 갈래 정의
  {
    choiceId: "A",
    text: "소크라테스의 문답법은 반어법과 산파술이라는 두 방식으로 나뉘며, 각각 논리적 모순 드러내기와 정답 유도를 담당한다.",
    propositions: [
      {
        propId: "A1",
        text: "문답법은 반어법과 산파술이라는 두 방식으로 나뉜다.",
        oxAnswer: "O",
        matchMode: "ALL",
        evidenceTexts: [
          "이는 질문을 통해 상대방의 논리적 모순을 드러내는 '반어법'과, 적절한 유도를 통해 스스로 정답을 찾아가게 돕는 '산파술'로 나뉜다.",
        ],
      },
      {
        propId: "A2",
        text: "반어법은 질문을 통해 상대방의 논리적 모순을 드러내는 방식이다.",
        oxAnswer: "O",
        matchMode: "ALL",
        evidenceTexts: ["질문을 통해 상대방의 논리적 모순을 드러내는 '반어법'"],
      },
      {
        propId: "A3",
        text: "산파술은 적절한 유도로 스스로 정답을 찾아가게 돕는 방식이다.",
        oxAnswer: "O",
        matchMode: "ALL",
        evidenceTexts: ["적절한 유도를 통해 스스로 정답을 찾아가게 돕는 '산파술'"],
      },
    ],
  },
  // ② (적절) — 철학에 대한 소크라테스의 관점
  {
    choiceId: "B",
    text: "소크라테스에게 철학은 고정된 정답을 외우는 활동이 아니라 끊임없이 질문하며 참된 앎을 찾아가는 여정이었다.",
    propositions: [
      {
        // 두 근거 각각 단독으로 명제 검증 가능 (외우기 부정 / 일방 전달 부정 둘 다 같은 함의)
        propId: "B1",
        text: "소크라테스에게 철학은 고정된 정답을 외우는 활동이 아니다.",
        oxAnswer: "O",
        matchMode: "ANY",
        evidenceTexts: [
          "소크라테스에게 철학이란 고정된 정답을 외우는 것이 아니라",
          "지식을 일방적으로 전달하기보다",
        ],
      },
      {
        // 두 근거 각각 단독 검증 가능
        propId: "B2",
        text: "소크라테스에게 철학은 끊임없이 질문하며 참된 앎을 찾아가는 여정이다.",
        oxAnswer: "O",
        matchMode: "ANY",
        evidenceTexts: [
          "끊임없이 질문하며 참된 앎을 찾아가는 여정이다",
          "상대방이 스스로 무지를 깨닫고 진리에 도달하게 하는",
        ],
      },
    ],
  },
  // ③ (부적절 — 정답) — 패턴: 의도/목적 왜곡 + 부정→긍정 변형 (권장)
  {
    choiceId: "C",
    text: "소크라테스는 스승이 제자에게 정답을 직접 알려주어 빠르게 진리에 도달하도록 하는 것이 교육의 본질이라고 보았다.",
    propositions: [
      {
        // 두 근거 각각 단독으로 X 검증 가능 (일방 전달 부정 / 외우기 부정 둘 다 정답 직접 전달 부정 함의)
        propId: "C1",
        text: "소크라테스는 스승이 정답을 직접 알려주는 방식을 교육의 본질로 보았다.",
        oxAnswer: "X",
        matchMode: "ANY",
        evidenceTexts: [
          "지식을 일방적으로 전달하기보다 대화를 통해 내면의 지혜를 끌어내는 과정을 중시했다",
          "고정된 정답을 외우는 것이 아니라",
        ],
      },
      {
        // 두 근거 각각 단독 X 검증 가능 (끊임없는 여정 / 스스로 깨달음 둘 다 빠른 도달 부정)
        propId: "C2",
        text: "소크라테스 교육의 지향점은 빠른 진리 도달이다.",
        oxAnswer: "X",
        matchMode: "ANY",
        evidenceTexts: [
          "끊임없이 질문하며 참된 앎을 찾아가는 여정이다",
          "상대방이 스스로 무지를 깨닫고 진리에 도달하게 하는",
        ],
      },
    ],
  },
  // ④ (적절) — 문답법의 목적·작용
  {
    choiceId: "D",
    text: "문답법은 상대방이 자신의 무지를 자각하고 스스로 진리에 도달하도록 이끄는 교육 방식이다.",
    propositions: [
      {
        propId: "D1",
        text: "문답법은 상대방이 자신의 무지를 자각하게 한다.",
        oxAnswer: "O",
        matchMode: "ALL",
        evidenceTexts: [
          "상대방이 스스로 무지를 깨닫고",
        ],
      },
      {
        // 두 근거 각각 단독 검증 가능 (직접 명시 / 참된 앎=진리 함의)
        propId: "D2",
        text: "문답법은 상대방이 진리에 도달하도록 이끈다.",
        oxAnswer: "O",
        matchMode: "ANY",
        evidenceTexts: [
          "진리에 도달하게 하는 '문답법'을 사용했다",
          "끊임없이 질문하며 참된 앎을 찾아가는 여정이다",
        ],
      },
    ],
  },
  // ⑤ (적절) — 일방 전달 vs 대화 (부정→긍정 변형 권장 사례)
  {
    choiceId: "E",
    text: "소크라테스는 지식의 일방적 전달보다 대화를 통한 내면의 지혜 발현 과정을 더 중시했다.",
    propositions: [
      {
        // 두 근거 각각 단독 검증 가능 (직접 명시 / 외우기≈일방 수용 함의)
        propId: "E1",
        text: "소크라테스는 지식의 일방적 전달을 가장 중시하지는 않았다.",
        oxAnswer: "O",
        matchMode: "ANY",
        evidenceTexts: [
          "지식을 일방적으로 전달하기보다",
          "고정된 정답을 외우는 것이 아니라",
        ],
      },
      {
        propId: "E2",
        text: "소크라테스는 대화를 통한 내면의 지혜 발현을 중시했다.",
        oxAnswer: "O",
        matchMode: "ALL",
        evidenceTexts: [
          "대화를 통해 내면의 지혜를 끌어내는 과정을 중시했다",
        ],
      },
    ],
  },
];

// evidenceTexts → evidenceRanges 자동 변환
const finalChoices = choices.map((c) => ({
  choiceId: c.choiceId,
  text: c.text,
  propositions: c.propositions.map((p) => {
    const ranges = p.evidenceTexts.map((t) => findRange(PASSAGE, t));
    const { evidenceTexts, ...rest } = p;
    return { ...rest, evidenceRanges: ranges };
  }),
}));

const newQ10 = {
  id: "dq-RUSSELL_3-118-10",
  type: "CHOICE_COMPLEX_OX",
  questionKind: "CHOICE_ANALYSIS",
  competency: "철학적 문답법의 교육 원리 분석",
  stem: "윗글에 대한 설명으로 적절하지 <u>않은</u> 것은?",
  passage: { paragraphs: [{ id: "p1", text: PASSAGE }] },
  choices: finalChoices,
  explanation:
    "③은 지문이 부정한 '지식의 일방적 전달'을 오히려 교육의 본질로 단정하고, '참된 앎을 찾아가는 여정'을 '빠른 진리 도달'로 왜곡한 의도/목적 왜곡 패턴이다. 소크라테스는 끊임없는 대화와 질문으로 내면의 지혜를 끌어내는 과정을 중시했다.",
  scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
};

// ── 검증 ──
console.log("━━━ 검증 ━━━");
const lens = finalChoices.map((c) => ({ id: c.choiceId, len: c.text.length }));
lens.sort((a, b) => b.len - a.len);
console.log("선지 글자수 (긴 순):", lens);
const correct = lens.find((l) => l.id === "C");
const second = lens.filter((l) => l.id !== "C")[0];
const diff = correct.len - second.len;
console.log(`정답 선지(C) ${correct.len}자 vs 2위 ${second.id} ${second.len}자 → 차이 ${diff}자 ${diff <= 5 ? "✅" : "❌ 5자 초과"}`);

// 괄호·한정 표현 검사
for (const c of finalChoices) {
  if (/[()（）]/.test(c.text)) console.warn(`⚠️ ${c.choiceId}: 괄호 포함`);
  if (/모든|항상|절대|결코|오직|반드시/.test(c.text)) console.warn(`⚠️ ${c.choiceId}: 한정 표현`);
}
console.log("괄호·한정 표현 검사 통과 ✅");

console.log("\n━━━ 최종 JSON ━━━");
console.log(JSON.stringify(newQ10, null, 2));

// 출력 파일에도 저장
import fs from "node:fs";
fs.writeFileSync(
  "scripts/q10_russell3_118_new.json",
  JSON.stringify(newQ10, null, 2),
  "utf8",
);
console.log("\n→ scripts/q10_russell3_118_new.json 저장");
