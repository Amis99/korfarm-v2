# 국어농장 v2 학습 콘텐츠 JSON 규격서

## 1. 목적
- 관리자 페이지에서 학습 메타 정보를 입력하고
- 학습 유형별로 규격화된 JSON을 업로드하여
- 즉시 학습을 등록, 미리보기, 게시할 수 있어야 합니다.

## 2. 콘텐츠 모델 개요

### 2.1 콘텐츠는 두 덩어리로 저장합니다
- 메타 정보
- 페이로드
- 자산
  - PDF, 이미지, 음성, 배경 파일 등은 S3에 저장하고 URL을 페이로드에서 참조합니다.

### 2.2 메타 정보 공통 필드
아래는 최소 필드입니다. 추가 필드는 서비스 확장에 맞게 허용합니다.

```json
{
  "contentId": "UUID",
  "contentType": "READING_NONFICTION_INTENSIVE",
  "version": 1,
  "status": "PUBLISHED",
  "title": "지문 정독 훈련 01",
  "description": "문장이 순차 하이라이트되며 질문 모달이 뜨는 정독 훈련",
  "targetLevel": "RUSSELL_2",
  "schoolGradeRange": {"min": 4, "max": 6},
  "area": "READING",
  "subArea": "NONFICTION_PHILOSOPHY",
  "competencies": ["VOCAB", "SENTENCE_READING", "STRUCTURE_READING"],
  "tags": ["정독", "치환", "접속어"],
  "access": {"mode": "FREE"},
  "seedReward": {"seedType": "WHEAT", "count": 1, "multiplier": 1},
  "timeLimitSec": 600,
  "assets": {
    "backgroundPdfS3Key": "content/uuid/background.pdf"
  }
}
```

## 3. SeedType 규칙
- 씨앗 종류는 세부 영역 단위로 고정합니다.
- 예시
  - 비문학 독해 철학: 밀
  - 비문학 독해 경제: 귀리
  - 문학 독해 현대시: 쌀
  - 배경지식 정보기술: 포도
- 실제 매핑표는 운영자가 별도로 관리하며, 콘텐츠 메타에는 seedType만 기록합니다.

## 4. 페이로드 공통 원칙

### 4.1 위치 기반 토큰
- 클릭 판정이 필요한 학습은 문자열이 아니라 위치 기반 토큰을 사용합니다.
- 토큰은 아래처럼 정의합니다.

```json
{
  "tokenId": "p1_s3_t5",
  "page": 1,
  "startChar": 120,
  "endChar": 128,
  "text": "사실에 대한 지배자"
}
```

## 5. 학습 유형별 페이로드 스키마

아래는 구현 우선순위가 높은 핵심 유형들입니다.

### 5.1 독해 정독형
```json
{
  "passage": {
    "format": "TEXT",
    "paragraphs": [{"id":"p1","text":"..."}]
  },
  "timeline": [
    {
      "stepId": "s1",
      "highlight": {"paragraphId":"p1","range":{"start":0,"end":25}},
      "question": {
        "prompt": "이 문장의 핵심 진술은 무엇입니까",
        "choices": [
          {"id":"A","text":"..."},
          {"id":"B","text":"..."},
          {"id":"C","text":"..."},
          {"id":"D","text":"..."}
        ],
        "answerId": "B",
        "scoring": {"correctDeltaSec": 20, "wrongDeltaSec": -20, "eliminateWrongChoice": true}
      }
    }
  ]
}
```

### 5.2 복기 학습 카드 배치형
```json
{
  "cards": [
    {"id":"c1","text":"요약 카드 1"},
    {"id":"c2","text":"요약 카드 2"}
  ],
  "correctOrder": ["c1","c2","c3","c4","c5"],
  "seedPool": {"initial": 3, "wrongPenaltySeed": 1}
}
```

### 5.3 확인 학습 클릭 판정형
```json
{
  "passage": {
    "format": "TEXT",
    "paragraphs": [{"id":"p1","text":"..."}]
  },
  "questions": [
    {
      "id":"q1",
      "prompt":"정답 표현을 지문에서 클릭하십시오",
      "answerTokenRefs": ["p1_s3_t5","p1_s3_t6"],
      "scoring": {"correctDeltaSec": 30, "wrongDeltaSec": -30},
      "revealOnWrong": true
    }
  ]
}
```

### 5.4 선택지 판별형
```json
{
  "passage": {
    "format": "TEXT",
    "paragraphs": [{"id":"p1","text":"..."}]
  },
  "items": [
    {
      "itemId":"i1",
      "stem":"다음 중 적절하지 않은 것을 고르시오",
      "choices":[
        {
          "choiceId":"A",
          "text":"...",
          "propositions":[
            {
              "propId":"A1",
              "text":"명제 1",
              "evidenceTokens":["p1_s2_t3"],
              "oxAnswer":"O"
            }
          ],
          "finalIsCorrectChoice": false
        }
      ],
      "rewardMultiplier": 3
    }
  ]
}
```

### 5.5 음운 변동 박스형
```json
{
  "words": [
    {
      "wordId":"w1",
      "surface":"국밥",
      "cells":[
        {"cellNo":1,"text":"국"},
        {"cellNo":2,"text":"밥"}
      ],
      "steps":[
        {
          "stepId":"st1",
          "envCellNos":[1],
          "targetCellNo":2,
          "questionType":"PHONEME_RESULT",
          "choices":[{"id":"A","text":"..."},{"id":"B","text":"..."}],
          "answerId":"B",
          "onCorrect":{"deltaSec":20,"applyCellText":{"cellNo":2,"newText":"..."}},
          "onWrong":{"deltaSec":-20,"retry":true}
        },
        {
          "stepId":"st2",
          "targetCellNo":2,
          "questionType":"RULE_EXPLANATION",
          "choices":[{"id":"A","text":"..."},{"id":"B","text":"..."}],
          "answerId":"A",
          "onCorrect":{"deltaSec":0,"next":true}
        }
      ]
    }
  ]
}
```

### 5.6 단어 형성 분석형
```json
{
  "items": [
    {
      "word":"거짓말쟁이",
      "morphemes":["거짓","말","-쟁이"],
      "steps": [
        {"type":"COUNT","choices":[1,2,3,4],"answer":3,"delta":{"correct":20,"wrong":-20}},
        {"type":"NAME","index":0,"choices":["명사","접사","어미"],"answer":"명사"},
        {"type":"ROLE","index":2,"choices":["어근","접사","어미"],"answer":"접사"}
      ],
      "formationGame": {
        "mergeQuestions": [
          {"ask":"다음으로 결합할 어근이나 접사는 어느 쪽입니까","answer":"LEFT"}
        ]
      }
    }
  ]
}
```

### 5.7 문장의 짜임 분석형
```json
{
  "sentences":[
    {
      "sentenceId":"s1",
      "tokens":[
        {"tokenId":"t1","text":"나는","role":"SUBJECT_1"},
        {"tokenId":"t2","text":"밥을","role":"OBJECT_1"},
        {"tokenId":"t3","text":"먹었다","role":"PREDICATE_1"}
      ],
      "predicateTokens":["t3"],
      "roleQueryOrder":[
        {"predicate":"t3","targetRoles":["SUBJECT_1","OBJECT_1"]}
      ],
      "embeddedOrLinked": [
        {"type":"EMBEDDED","tokenRefs":["t1","t2"],"clauseType":"NOUN_CLAUSE"}
      ]
    }
  ]
}
```

## 6. 스키마 검증 방식

- 프런트엔드: JSON Schema v2020-12, Ajv
- 백엔드: JSON Schema 검증 라이브러리 사용 후 저장
- 저장 시점에만 검증하지 말고, 미리보기 진입 시에도 검증합니다.

## 7. 샘플 콘텐츠 제작 규칙
- 각 학습 유형은 최소 1개 샘플 JSON을 저장소에 포함합니다.
- 샘플은 관리자 페이지에서 즉시 불러와 편집 후 게시할 수 있어야 합니다.
