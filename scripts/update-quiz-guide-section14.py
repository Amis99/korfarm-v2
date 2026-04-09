#!/usr/bin/env python3
"""
일일 퀴즈 4개 레벨별 지침서의 §14 (Q10 CHOICE_ANALYSIS) 부분을 신 양식으로 일괄 교체.
"""
import os
import re

BASE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "frontend", "public", "daily-quiz"
)

FILES = [
    "일일_퀴즈_생성_지침서_소쉬르.md",
    "일일_퀴즈_생성_지침서_프레게.md",
    "일일_퀴즈_생성_지침서_러셀.md",
    "일일_퀴즈_생성_지침서_비트겐슈타인.md",
]

# 새 §14 본문 (v_1.md과 동일, 레벨별 유의사항은 추가 가능)
NEW_SECTION_14 = """## §14 Q10 선택지 분석·전략 수립 상세 (CHOICE_ANALYSIS 타입)

### 학습 목적

수능 객관식을 "답 번호 고르기"가 아니라 **5개 선택지 모두의 진위를 지문 근거와 대조해 판별**하는 학습. 학생이 패턴 매칭이 아닌 진짜 사고로 풀게 만든다.

### 인터랙션

1. 좌측: 지문(문장 단위로 클릭 가능) / 우측: 선택지 5개
2. 학습자가 선택지를 클릭 → 해당 선택지가 활성화됨
3. 학습자가 지문에서 그 선택지의 근거 문장을 클릭
4. **모달이 떠서 "이 진술은 지문과 일치하나요? O / X"를 묻는다**
5. 학생이 O 또는 X 직접 선택
6. 정답이면 그 선택지 통과 (✓). 오답이면 무한 재시도
7. **5개 선택지를 모두 통과해야** 문제 정답

### 근거 매칭 규칙 (선택지 단위 ALL/ANY)

- **ANY**: 선택지가 단순 명제 (한 문장만 봐도 OX 판별 가능). 학생은 근거 문장 **하나만** 클릭하고 OX 답하면 통과
- **ALL**: 선택지가 복합 명제 (두 문장 이상을 모두 봐야 OX 판별 가능). 학생은 **모든 근거 문장을 다** 클릭하고 각각 OX 답해야 통과

### 잘못된 문장 클릭 처리

- 근거가 아닌 문장 클릭 → 흔들림 애니메이션 + 시간 -10초 페널티
- 무한 재시도 가능

### 데이터 작성 규칙

1. **지문**: 문단을 **문장 단위로 분리**해 `sentences[]` 배열에 저장
2. **문장 ID**: `{paragraphId}_s{순번}` 형식
3. **선택지**: 정확히 5개
4. 각 선택지마다:
   - `evidenceSentenceIds`: 근거 문장 ID 배열
   - `matchMode`: `"ANY"` 또는 `"ALL"`
   - `expectedOX`: 정답 OX (`"O"` = 일치, `"X"` = 불일치)

### JSON 구조

```json
{
  "id": "dq-10",
  "type": "CHOICE_ANALYSIS",
  "questionKind": "CHOICE_ANALYSIS",
  "competency": "선택지 분석 및 전략 수립 능력",
  "stem": "다음 글의 내용과 일치하지 않는 것을 고르시오.",
  "passage": {
    "paragraphs": [
      {
        "id": "p1",
        "sentences": [
          { "id": "p1_s1", "text": "대부분의 사막은 중위도와 저위도 사이에 분포한다." },
          { "id": "p1_s2", "text": "사막의 연 강수량은 250mm 미만이다." },
          { "id": "p1_s3", "text": "사막의 기온은 낮과 밤의 차이가 매우 크다." },
          { "id": "p1_s4", "text": "이는 수증기가 적어 열의 차단 효과가 약하기 때문이다." }
        ]
      }
    ]
  },
  "choices": [
    {
      "choiceId": "A",
      "text": "사막은 주로 중위도와 저위도 사이에 위치한다.",
      "evidenceSentenceIds": ["p1_s1"],
      "matchMode": "ANY",
      "expectedOX": "O"
    },
    {
      "choiceId": "B",
      "text": "사막의 연 강수량은 250mm를 넘지 않는다.",
      "evidenceSentenceIds": ["p1_s2"],
      "matchMode": "ANY",
      "expectedOX": "O"
    },
    {
      "choiceId": "C",
      "text": "사막은 수증기가 많아 일교차가 크다.",
      "evidenceSentenceIds": ["p1_s4"],
      "matchMode": "ANY",
      "expectedOX": "X"
    },
    {
      "choiceId": "D",
      "text": "사막의 낮과 밤 기온차는 크다.",
      "evidenceSentenceIds": ["p1_s3"],
      "matchMode": "ANY",
      "expectedOX": "O"
    },
    {
      "choiceId": "E",
      "text": "사막은 수증기가 적고 일교차가 크다.",
      "evidenceSentenceIds": ["p1_s3", "p1_s4"],
      "matchMode": "ALL",
      "expectedOX": "O"
    }
  ],
  "explanation": "C는 지문이 '수증기가 적어'라 한 것과 반대로 진술해 X. E는 두 문장을 모두 검토해야 O 판별이 가능하므로 ALL 모드.",
  "scoring": { "correctDeltaSec": 20, "wrongDeltaSec": -40 }
}
```

### 출제 시 주의사항

- 선택지는 정확히 5개
- O/X가 섞여 있어야 함
- ALL 모드는 5개 중 1~2개만
- evidenceSentenceIds는 출제자가 의도한 정답 근거 문장만 (잘못된 클릭에 페널티 있음)

"""

# §14 시작부터 §15 시작 직전까지 매칭
PATTERN = re.compile(
    r"## §14 Q10 선택지 분석·전략 수립 상세 .*?(?=## §15 )",
    re.DOTALL,
)


def main():
    for fname in FILES:
        path = os.path.join(BASE, fname)
        if not os.path.exists(path):
            print(f"  ! not found: {fname}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        new_text, n = PATTERN.subn(NEW_SECTION_14, text)
        if n == 0:
            print(f"  ! no §14 match in {fname}")
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_text)
        print(f"  updated: {fname} (replaced {n} occurrence)")


if __name__ == "__main__":
    main()
