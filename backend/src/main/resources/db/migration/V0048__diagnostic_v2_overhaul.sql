-- 진단 테스트 v2 전면 정비
--   1) diag_sessions에 시간 측정 컬럼 추가
--   2) test_papers에 진단 시험지 4종 등록 (series='diagnostic')
--   3) diag_questions의 객관식 문항을 test_questions로 복사

-- ─────────────────────────────────────────────────────────────
-- 1) diag_sessions 시간 측정 컬럼
-- ─────────────────────────────────────────────────────────────
ALTER TABLE diag_sessions
    ADD COLUMN last_response_at    DATETIME NULL COMMENT '마지막 답안 마킹 시각',
    ADD COLUMN time_spent_sec      INT      NULL COMMENT '시작~마지막 마킹 경과 시간(초)',
    ADD COLUMN effective_speed_sec INT      NULL COMMENT '풀이속도 = time_spent_sec + (오답수 * 180)';

-- ─────────────────────────────────────────────────────────────
-- 2) 진단 시험지 4종 (test_papers, series='diagnostic')
--    org_id는 본사(org_hq)로 통일. pdf_file_id는 PDF 생성 후 별도 갱신.
-- ─────────────────────────────────────────────────────────────
INSERT INTO test_papers
    (id, org_id, title, description, pdf_file_id, level_id, total_questions, total_points,
     time_limit_minutes, exam_date, series, status, created_at, updated_at)
VALUES
    ('diag_paper_sohssure',
     'org_hq',
     '[진단] 소쉬르 단계 역량 진단',
     '소쉬르 단계 진단 시험지 (객관식 48문항 · 60분). 시작 후 끝까지 한 번에 풀고 즉시 제출하세요. 찍고 넘어간 문제는 풀이 속도 측정 시 1문항당 3분이 가산됩니다.',
     NULL, 'sohssure', 48, 480, 60, NULL, 'diagnostic', 'open', NOW(), NOW()),

    ('diag_paper_frege',
     'org_hq',
     '[진단] 프레게 단계 역량 진단',
     '프레게 단계 진단 시험지 (객관식 48문항 · 60분). 시작 후 끝까지 한 번에 풀고 즉시 제출하세요. 찍고 넘어간 문제는 풀이 속도 측정 시 1문항당 3분이 가산됩니다.',
     NULL, 'frege', 48, 480, 60, NULL, 'diagnostic', 'open', NOW(), NOW()),

    ('diag_paper_russell',
     'org_hq',
     '[진단] 러셀 단계 역량 진단',
     '러셀 단계 진단 시험지 (객관식 48문항 · 60분). 시작 후 끝까지 한 번에 풀고 즉시 제출하세요. 찍고 넘어간 문제는 풀이 속도 측정 시 1문항당 3분이 가산됩니다.',
     NULL, 'russell', 48, 480, 60, NULL, 'diagnostic', 'open', NOW(), NOW()),

    ('diag_paper_wittgenstein',
     'org_hq',
     '[진단] 비트겐슈타인 단계 역량 진단',
     '비트겐슈타인 단계 진단 시험지 (객관식 48문항 · 60분). 시작 후 끝까지 한 번에 풀고 즉시 제출하세요. 찍고 넘어간 문제는 풀이 속도 측정 시 1문항당 3분이 가산됩니다.',
     NULL, 'wittgenstein', 48, 480, 60, NULL, 'diagnostic', 'open', NOW(), NOW());

-- ─────────────────────────────────────────────────────────────
-- 3) test_questions 시드 (diag_questions의 객관식 192문항 복사)
--    number는 (지문 level → 지문 id → order_in_passage) 순서로 1부터 부여
--    points는 모든 문항 10점 (총 480점)
-- ─────────────────────────────────────────────────────────────
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
    -- box_content이 있으면 PDF 생성기(parse_markers)가 인식하도록
    -- stem 뒤에 "<보기>\n{box}" 블록을 append (태그가 줄에 단독일 때만 인식됨)
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
