-- V0067: 진단 SKIP 문항 마크업 보강 (2026-04-27)
--   V0065 에서 stem/선지 텍스트가 명시되지 않아 _skip 처리됐던 8개 문항의
--   별표→밑줄 변환, 괄호 부연/정답 노출 삭제, 부정어/핵심 어휘 밑줄 적용.
--   정답은 모두 V0022 그대로 유지 → vector 도 V0066 와 동일 패턴으로 재생성.

UPDATE diag_questions SET stem = '이 글에서 ''수증기''에 대한 설명으로 알맞지 <u>않은</u> 것은?', choices_json = '[{"choice_id":"A","text":"눈에 잘 보이고 매우 무겁다","vector":{"문장 독해력":10,"어휘력":3,"구조 독해력":2,"비문학 배경지식":3,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"B","text":"물이 햇볕을 받아 변한 것이다","vector":{"문장 독해력":-5},"error_path":""},{"choice_id":"C","text":"하늘 높이 올라간다","vector":{"문장 독해력":-5},"error_path":""},{"choice_id":"D","text":"아주 작고 가볍다","vector":{"문장 독해력":-5},"error_path":""},{"choice_id":"E","text":"찬 공기를 만나면 물방울로 변한다","vector":{"문장 독해력":-5},"error_path":""}]', correct_choice = 'A' WHERE id = 'S1_NON_P3_Q02';
UPDATE diag_questions SET stem = '다음 <보기>의 문장에서 밑줄 친 ''백성''의 품사는 무엇입니까?

<보기>
세종 대왕은 <u>백성</u>을 사랑했다.', choices_json = '[{"choice_id":"A","text":"조사","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"명사","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"비문학 배경지식":3,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"C","text":"형용사","vector":{"어휘력":-5},"error_path":""},{"choice_id":"D","text":"동사","vector":{"어휘력":-5},"error_path":""},{"choice_id":"E","text":"감탄사","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'B' WHERE id = 'F1_NON_P5_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 단어 중 품사가 형용사인 것은?

<보기>
① 나 <u>보기</u>가 역겨워
② 말없이 <u>고이</u> 보내 드리우리다
③ 응오가 <u>아닌가</u>
④ <u>바로</u> 이때였다
⑤ <u>참</u> 이상한 일이었다', choices_json = '[{"choice_id":"A","text":"보기","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"바로","vector":{"어휘력":-5},"error_path":""},{"choice_id":"C","text":"아닌가","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"국어 관련 배경지식":2,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"D","text":"참","vector":{"어휘력":-5},"error_path":""},{"choice_id":"E","text":"고이","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'C' WHERE id = 'R1_LIT_Q04';
UPDATE diag_questions SET stem = '다음 <보기>의 설명을 바탕으로 할 때, 시어 ''풀섶''의 표준 발음과 관련된 음운 현상으로 적절한 것은?

<보기>
음운의 변동에는 교체, 탈락, 첨가, 축약이 있다. 그중 ''풀섶''은 [풀섭]으로 발음된다.', choices_json = '[{"choice_id":"A","text":"음절의 끝소리 규칙","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"국어 관련 배경지식":2,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"B","text":"ㄴ첨가","vector":{"어휘력":-5},"error_path":""},{"choice_id":"C","text":"거센소리되기","vector":{"어휘력":-5},"error_path":""},{"choice_id":"D","text":"두음 법칙","vector":{"어휘력":-5},"error_path":""},{"choice_id":"E","text":"자음군 단순화","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'A' WHERE id = 'R1_LIT_P3_Q04';
UPDATE diag_questions SET stem = '다음 <보기>의 설명을 참고할 때, ''가획의 원리''에 의해 만들어진 글자가 아닌 것은?

<보기>
훈민정음 자음의 기본자(ㄱ, ㄴ, ㅁ, ㅅ, ㅇ)에 획을 더하여 소리의 세기를 나타낸 글자를 가획자라고 한다.', choices_json = '[{"choice_id":"A","text":"ㄷ","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"ㅊ","vector":{"어휘력":-5},"error_path":""},{"choice_id":"C","text":"ㅋ","vector":{"어휘력":-5},"error_path":""},{"choice_id":"D","text":"ㄹ","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"비문학 배경지식":3,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"E","text":"ㅍ","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'D' WHERE id = 'R1_NON_P3_Q05';
UPDATE diag_questions SET stem = '(다)의 밑줄 친 ''미련하다''와 문맥적 의미가 가장 유사한 것은?

<보기>
네가 이리 <u>미련하단</u> 말이냐?', choices_json = '[{"choice_id":"A","text":"지난 일에 <u>미련</u> 갖지 마라.","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"그는 옛사랑에 <u>미련</u>이 남았다.","vector":{"어휘력":-5},"error_path":""},{"choice_id":"C","text":"그 사람은 곰처럼 <u>미련해서</u> 눈치라곤 없다.","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"국어 관련 배경지식":2,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"D","text":"아직도 <u>미련</u>을 버리지 못했니?","vector":{"어휘력":-5},"error_path":""},{"choice_id":"E","text":"떠나는 마당에 무슨 <u>미련</u>을 두느냐","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'C' WHERE id = 'R1_LIT_P5_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 문장의 짜임에 대한 설명으로 적절한 것은?

<보기>
이것은 <u>우리가 먹을</u> 사과다.', choices_json = '[{"choice_id":"A","text":"서술절을 안은문장","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"부사절을 안은문장","vector":{"어휘력":-5},"error_path":""},{"choice_id":"C","text":"인용절을 안은문장","vector":{"어휘력":-5},"error_path":""},{"choice_id":"D","text":"관형절을 안은문장","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"국어 관련 배경지식":2,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"E","text":"명사절을 안은문장","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'D' WHERE id = 'R1_LIT_P5_Q05';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 단어에서 일어나는 음운 변동에 대한 설명으로 옳은 것은?

<보기>
연역법의 <u>법칙</u>[법칙]은 중요하다.
이 <u>백조</u>[백쪼]는 하얗다.', choices_json = '[{"choice_id":"A","text":"''백조''는 모음 사이에서 된소리가 되므로 사잇소리 현상에 해당한다.","vector":{"어휘력":-5},"error_path":""},{"choice_id":"B","text":"''백조''의 ''ㄱ'' 받침 뒤에서 ''ㅈ''이 된소리 [ㅉ]으로 발음되므로 된소리되기(교체)이다.","vector":{"어휘력":10,"어법·문법 능력":3,"국어 개념 적용 능력":2,"비문학 배경지식":3,"문제 분석 및 전략 수립 능력":1,"선택지 분석 및 전략 수립 능력":1},"error_path":"정답"},{"choice_id":"C","text":"''법칙''과 ''백조'' 모두 음절의 끝소리 규칙이 적용되었다.","vector":{"어휘력":-5},"error_path":""},{"choice_id":"D","text":"''법칙''은 원래 된소리로 발음되므로 음운 변동이 아니다.","vector":{"어휘력":-5},"error_path":""},{"choice_id":"E","text":"''법칙''의 ''ㅂ'' 받침 뒤에서 ''ㅊ''이 거센소리 [ㅊ]으로 발음되므로 축약이다.","vector":{"어휘력":-5},"error_path":""}]', correct_choice = 'B' WHERE id = 'R1_NON_P5_Q04';

-- test_questions 재시드 (stem/choices_json 변경분 반영)
DELETE FROM test_questions WHERE test_id LIKE 'diag_paper_%';

INSERT INTO test_questions
    (id, test_id, number, type, domain, sub_domain, passage, stem, points,
     correct_answer, choices_json, choice_explanations_json, intent,
     essay_keywords_json, essay_rubric_json, model_answer, created_at)
SELECT
    CONCAT('diag_tq_', q.id)                                                      AS id,
    CONCAT('diag_paper_', q.tier)                                                 AS test_id,
    ROW_NUMBER() OVER (PARTITION BY q.tier ORDER BY p.level, p.id, q.order_in_passage) AS number,
    '객관식'                                                                       AS type,
    q.question_type                                                               AS domain,
    p.genre                                                                       AS sub_domain,
    p.text_md                                                                     AS passage,
    CASE
        WHEN q.box_content IS NULL OR q.box_content = '' THEN q.stem
        ELSE CONCAT(q.stem, '\n<보기>\n', q.box_content)
    END                                                                           AS stem,
    10                                                                            AS points,
    q.correct_choice                                                              AS correct_answer,
    CAST(q.choices_json AS CHAR)                                                  AS choices_json,
    NULL                                                                          AS choice_explanations_json,
    NULL                                                                          AS intent,
    NULL                                                                          AS essay_keywords_json,
    NULL                                                                          AS essay_rubric_json,
    NULL                                                                          AS model_answer,
    NOW(6)                                                                        AS created_at
FROM diag_questions q
JOIN diag_passages  p ON p.id = q.passage_id
WHERE q.question_type <> '서술형';

-- stem 에 <보기> 가 이미 포함된 V0067 문항은 box_content 비움 (이중 표시 방지)
UPDATE diag_questions SET box_content = NULL WHERE id = 'F1_NON_P5_Q03';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_LIT_Q04';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_LIT_P3_Q04';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_NON_P3_Q05';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_LIT_P5_Q03';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_LIT_P5_Q05';
UPDATE diag_questions SET box_content = NULL WHERE id = 'R1_NON_P5_Q04';