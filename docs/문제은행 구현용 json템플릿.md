좋아요. 답해준 기준으로 실사용 가능한 통합 JSON 템플릿으로 정리해봤어요.

핵심 방향은 이겁니다.

* 레코드 1개 \= 작품/전체 지문 1개  
* 그 안에 부분 지문들(`지문들`) 과 문제들(`문제들`) 이 들어감  
* 코드표 기반으로 관리해서 입력값 흔들림을 줄임  
* 객관식 / 단답형 / 서술형을 같은 문항 구조 안에서 처리함

아래 JSON은 바로 시작 가능한 템플릿입니다.

{  
  "schema\_version": "1.2.0",  
  "코드표": {  
    "소스\_분류": \[  
      { "code": "TEXTBOOK", "label": "교과서" },  
      { "code": "SELF\_STUDY", "label": "자습서" },  
      { "code": "EVAL\_WORKBOOK", "label": "평가문제집" },  
      { "code": "PAST\_EXAM", "label": "기출" },  
      { "code": "SCHOOL\_EXAM", "label": "학교 내신" },  
      { "code": "ETC", "label": "기타" }  
    \],  
    "기출\_기관": \[  
      { "code": "CSAT", "label": "수능" },  
      { "code": "MOE", "label": "교육청" },  
      { "code": "SCHOOL", "label": "학교" },  
      { "code": "PRIVATE", "label": "사설" },  
      { "code": "ETC", "label": "기타" }  
    \],  
    "영역": \[  
      { "code": "LIT", "label": "문학" },  
      { "code": "READ", "label": "독서" },  
      { "code": "GRAM", "label": "문법" },  
      { "code": "SPEAK", "label": "화법" },  
      { "code": "WRITE", "label": "작문" },  
      { "code": "MEDIA", "label": "매체" },  
      { "code": "INTEGRATED", "label": "복합" }  
    \],  
    "세부영역": \[  
      { "code": "LIT\_MODERN\_POETRY", "label": "현대시", "영역\_코드": "LIT" },  
      { "code": "LIT\_CLASSIC\_POETRY", "label": "고전시가", "영역\_코드": "LIT" },  
      { "code": "LIT\_MODERN\_NOVEL", "label": "현대소설", "영역\_코드": "LIT" },  
      { "code": "LIT\_CLASSIC\_PROSE", "label": "고전산문", "영역\_코드": "LIT" },  
      { "code": "LIT\_ESSAY", "label": "수필", "영역\_코드": "LIT" },  
      { "code": "LIT\_DRAMA", "label": "극", "영역\_코드": "LIT" },

      { "code": "READ\_HUMANITIES", "label": "인문", "영역\_코드": "READ" },  
      { "code": "READ\_SOCIETY", "label": "사회", "영역\_코드": "READ" },  
      { "code": "READ\_SCI\_TECH", "label": "과학기술", "영역\_코드": "READ" },  
      { "code": "READ\_ART", "label": "예술", "영역\_코드": "READ" },  
      { "code": "READ\_CROSS", "label": "통합", "영역\_코드": "READ" },

      { "code": "GRAM\_PHONOLOGY", "label": "음운", "영역\_코드": "GRAM" },  
      { "code": "GRAM\_WORD", "label": "단어", "영역\_코드": "GRAM" },  
      { "code": "GRAM\_SENTENCE", "label": "문장", "영역\_코드": "GRAM" },  
      { "code": "GRAM\_DISCOURSE", "label": "담화", "영역\_코드": "GRAM" },  
      { "code": "GRAM\_HISTORY", "label": "국어사", "영역\_코드": "GRAM" },

      { "code": "SPEAK\_GENERAL", "label": "화법 일반", "영역\_코드": "SPEAK" },  
      { "code": "WRITE\_GENERAL", "label": "작문 일반", "영역\_코드": "WRITE" },  
      { "code": "MEDIA\_LANGUAGE", "label": "매체 언어", "영역\_코드": "MEDIA" },  
      { "code": "INTEGRATED\_MULTI", "label": "복합 지문", "영역\_코드": "INTEGRATED" }  
    \],  
    "대상\_학년": \[  
      { "code": "MS1", "label": "중1" },  
      { "code": "MS2", "label": "중2" },  
      { "code": "MS3", "label": "중3" },  
      { "code": "HS1", "label": "고1" },  
      { "code": "HS2", "label": "고2" },  
      { "code": "HS3", "label": "고3" },  
      { "code": "NQ", "label": "수능/N수" }  
    \],  
    "지문\_참조\_유형": \[  
      { "code": "FULL", "label": "전체 지문 기준" },  
      { "code": "PART", "label": "부분 지문 기준" },  
      { "code": "NONE", "label": "지문 없음" }  
    \],  
    "문항\_형식": \[  
      { "code": "MCQ", "label": "객관식" },  
      { "code": "SA", "label": "단답형" },  
      { "code": "ESSAY", "label": "서술형" }  
    \],  
    "정답\_유형": \[  
      { "code": "CHOICE", "label": "선택지 기호" },  
      { "code": "TEXT", "label": "텍스트 정답" },  
      { "code": "KEYWORD\_SET", "label": "키워드 집합" },  
      { "code": "MODEL\_ANSWER", "label": "모범 답안" },  
      { "code": "NUMERIC", "label": "숫자 정답" }  
    \],  
    "문제\_유형": \[  
      { "code": "CONTENT", "label": "내용 이해" },  
      { "code": "INFERENCE", "label": "추론" },  
      { "code": "THEME", "label": "주제/제목" },  
      { "code": "STRUCTURE", "label": "구조/전개" },  
      { "code": "EXPRESSION", "label": "표현상 특징" },  
      { "code": "TONE\_ATTITUDE", "label": "태도/정서" },  
      { "code": "VOCAB", "label": "어휘" },  
      { "code": "GRAMMAR", "label": "문법/어법" },  
      { "code": "CORRECTNESS", "label": "적절/부적절 판단" },  
      { "code": "ORDER", "label": "순서 배열" },  
      { "code": "INSERT", "label": "문장 삽입" },  
      { "code": "SUMMARY", "label": "요약" },  
      { "code": "APPLICATION", "label": "적용" },  
      { "code": "COMPARISON", "label": "비교/대조" },  
      { "code": "CRITIQUE", "label": "비판/평가" },  
      { "code": "WRITING", "label": "쓰기" },  
      { "code": "SPEAKING", "label": "화법" },  
      { "code": "MEDIA", "label": "매체" }  
    \],  
    "선택지\_패턴": \[  
      { "code": "MCQ\_5\_SINGLE", "label": "5지선다/단일정답", "문항\_형식\_코드": "MCQ" },  
      { "code": "MCQ\_5\_MULTI", "label": "5지선다/복수정답", "문항\_형식\_코드": "MCQ" },  
      { "code": "MCQ\_TF", "label": "진위형", "문항\_형식\_코드": "MCQ" },  
      { "code": "MCQ\_MATCH", "label": "짝짓기형", "문항\_형식\_코드": "MCQ" },  
      { "code": "SA\_TEXT", "label": "단답형/텍스트", "문항\_형식\_코드": "SA" },  
      { "code": "SA\_NUM", "label": "단답형/숫자", "문항\_형식\_코드": "SA" },  
      { "code": "ESSAY\_TEXT", "label": "서술형/텍스트", "문항\_형식\_코드": "ESSAY" },  
      { "code": "ESSAY\_RUBRIC", "label": "서술형/채점기준형", "문항\_형식\_코드": "ESSAY" }  
    \],  
    "적용\_개념": \[  
      { "code": "SPEAKER\_ATTITUDE", "label": "화자 태도" },  
      { "code": "NARRATOR\_VIEW", "label": "서술자 관점" },  
      { "code": "IMAGERY", "label": "심상" },  
      { "code": "RHETORIC", "label": "수사법" },  
      { "code": "TONE", "label": "어조" },  
      { "code": "PLOT", "label": "구성" },  
      { "code": "CHARACTER", "label": "인물" },  
      { "code": "SETTING", "label": "배경" },  
      { "code": "CONFLICT", "label": "갈등" },  
      { "code": "THEME\_CONCEPT", "label": "주제" },  
      { "code": "KEYWORD", "label": "핵심어" },  
      { "code": "DETAIL\_INFO", "label": "세부 정보" },  
      { "code": "INFERENTIAL\_READING", "label": "추론적 읽기" },  
      { "code": "LOGIC", "label": "논리 전개" },  
      { "code": "COHESION", "label": "응집성" },  
      { "code": "GRAMMAR\_ELEMENT", "label": "문법 요소" },  
      { "code": "PHONOLOGY", "label": "음운" },  
      { "code": "WORD\_FORMATION", "label": "단어 형성" },  
      { "code": "SENTENCE\_STRUCTURE", "label": "문장 구조" },  
      { "code": "CONTEXT", "label": "문맥 판단" },  
      { "code": "MEDIA\_LITERACY", "label": "매체 문식성" }  
    \]  
  },  
  "레코드들": \[  
    {  
      "레코드\_id": "REC-000001",  
      "소스": {  
        "소스\_id": "SRC-000001",  
        "분류\_코드": null,  
        "교재명": null,  
        "출판사": null,  
        "시리즈": null,  
        "학년도": null,  
        "학기": null,  
        "시험명": null,  
        "학교명": null,  
        "학년": null,  
        "쪽수": null,  
        "비고": null  
      },  
      "제목": null,  
      "작가": \[\],  
      "영역\_코드": null,  
      "세부영역\_코드": null,  
      "대상\_학년\_코드": \[\],  
      "기출": {  
        "여부": false,  
        "기관\_코드": null,  
        "시험명": null,  
        "연도": null,  
        "월": null,  
        "학년도": null  
      },  
      "전체\_지문": {  
        "텍스트": null,  
        "문단수": null  
      },  
      "작품\_해설": null,  
      "지문들": \[  
        {  
          "지문\_id": "PAS-000001",  
          "지문": null,  
          "시작\_문자\_인덱스": null,  
          "끝\_문자\_인덱스": null,  
          "시작\_문단\_번호": null,  
          "끝\_문단\_번호": null,  
          "비고": null  
        }  
      \],  
      "문제들": \[  
        {  
          "문제\_id": "Q-000001",  
          "지문\_참조\_유형\_코드": null,  
          "연결\_지문\_id들": \[\],  
          "문항\_형식\_코드": null,  
          "문제": null,  
          "보기": \[  
            {  
              "기호": null,  
              "내용": null  
            }  
          \],  
          "선택지": \[  
            { "기호": "①", "선택지": null },  
            { "기호": "②", "선택지": null },  
            { "기호": "③", "선택지": null },  
            { "기호": "④", "선택지": null },  
            { "기호": "⑤", "선택지": null }  
          \],  
          "정답": {  
            "정답\_유형\_코드": null,  
            "값": \[\]  
          },  
          "문제\_해설": null,  
          "문제\_유형\_코드": \[\],  
          "선택지\_패턴\_코드": null,  
          "적용\_개념\_코드": \[\],  
          "채점\_기준": \[\],  
          "배점": null  
        }  
      \]  
    }  
  \]  
}

운용 규칙은 이렇게 잡으면 깔끔합니다.

* 문자열/숫자처럼 단일값이 비면 `null`  
* 배열값이 비면 `[]`  
* `지문들`은 전체 지문과 완전히 같으면 무조건 `[]`  
* 문제가 부분 지문 기반이면  
  `지문_참조_유형_코드: "PART"` \+ `연결_지문_id들: ["PAS-..."]`  
* 문제가 전체 지문 기준이면  
  `지문_참조_유형_코드: "FULL"` \+ `연결_지문_id들: []`  
* 문제가 아예 지문 없음이면  
  `지문_참조_유형_코드: "NONE"` \+ `연결_지문_id들: []`

이 설계에서 중요한 포인트는, 네가 말한 조건 2번 때문에 `연결_지문_id들`를 배열로 둔 거예요.  
보통은 1개만 들어가지만, 나중에 `(가)(나)` 비교 문제처럼 여러 부분 지문을 동시에 참조하는 경우도 버틸 수 있습니다.

아래는 문항별 입력 예시입니다.

객관식 예시:

{  
  "문제\_id": "Q-000101",  
  "지문\_참조\_유형\_코드": "PART",  
  "연결\_지문\_id들": \["PAS-000001"\],  
  "문항\_형식\_코드": "MCQ",  
  "문제": "윗글에 대한 이해로 가장 적절한 것은?",  
  "보기": \[\],  
  "선택지": \[  
    { "기호": "①", "선택지": "..." },  
    { "기호": "②", "선택지": "..." },  
    { "기호": "③", "선택지": "..." },  
    { "기호": "④", "선택지": "..." },  
    { "기호": "⑤", "선택지": "..." }  
  \],  
  "정답": {  
    "정답\_유형\_코드": "CHOICE",  
    "값": \["②"\]  
  },  
  "문제\_해설": "...",  
  "문제\_유형\_코드": \["CONTENT"\],  
  "선택지\_패턴\_코드": "MCQ\_5\_SINGLE",  
  "적용\_개념\_코드": \["DETAIL\_INFO"\],  
  "채점\_기준": \[\],  
  "배점": 3  
}

단답형 예시:

{  
  "문제\_id": "Q-000102",  
  "지문\_참조\_유형\_코드": "FULL",  
  "연결\_지문\_id들": \[\],  
  "문항\_형식\_코드": "SA",  
  "문제": "이 시의 중심 정서를 한 단어로 쓰시오.",  
  "보기": \[\],  
  "선택지": \[\],  
  "정답": {  
    "정답\_유형\_코드": "TEXT",  
    "값": \["그리움"\]  
  },  
  "문제\_해설": "...",  
  "문제\_유형\_코드": \["TONE\_ATTITUDE"\],  
  "선택지\_패턴\_코드": "SA\_TEXT",  
  "적용\_개념\_코드": \["SPEAKER\_ATTITUDE"\],  
  "채점\_기준": \[\],  
  "배점": 2  
}

서술형 예시:

{  
  "문제\_id": "Q-000103",  
  "지문\_참조\_유형\_코드": "PART",  
  "연결\_지문\_id들": \["PAS-000002"\],  
  "문항\_형식\_코드": "ESSAY",  
  "문제": "윗부분에 나타난 화자의 태도 변화를 2문장 이내로 서술하시오.",  
  "보기": \[\],  
  "선택지": \[\],  
  "정답": {  
    "정답\_유형\_코드": "MODEL\_ANSWER",  
    "값": \["초반에는 대상에 대한 거리감이 드러나지만, 후반에는 공감과 수용의 태도로 변화한다."\]  
  },  
  "문제\_해설": "...",  
  "문제\_유형\_코드": \["TONE\_ATTITUDE", "INFERENCE"\],  
  "선택지\_패턴\_코드": "ESSAY\_RUBRIC",  
  "적용\_개념\_코드": \["SPEAKER\_ATTITUDE"\],  
  "채점\_기준": \[  
    {  
      "항목": "태도 변화 파악",  
      "배점": 2,  
      "기준": "초반과 후반의 태도 차이를 정확히 서술함"  
    },  
    {  
      "항목": "표현의 적절성",  
      "배점": 1,  
      "기준": "문장을 자연스럽고 분명하게 작성함"  
    }  
  \],  
  "배점": 3  
}

추가로 추천하는 운영 방식은 하나입니다.  
실제로는 `codes.json`(코드표) 와 `records.json`(실데이터) 를 분리해서 관리하는 편이 훨씬 좋습니다.

다음 단계로는 이 템플릿을 기준으로 JSON Schema 검증 파일이나 파이썬/Pydantic 모델 형태로도 바로 바꿔드릴 수 있습니다.

