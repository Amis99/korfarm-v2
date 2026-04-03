-- 문제은행 코드표 확장: 독서/문학 문제 유형 + 오답 선택지 패턴

-- ═══ question_type 확장: 독서(비문학) 유형 ═══
INSERT IGNORE INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_qt_read_title',       'qbcg_question_type', 'READ_TITLE_TOPIC',       '독서: 표제/주제',         20, 1, NOW(), NOW()),
('qbcv_qt_read_develop',     'qbcg_question_type', 'READ_DEVELOPMENT',       '독서: 내용 전개 방식',    21, 1, NOW(), NOW()),
('qbcv_qt_read_not_mention', 'qbcg_question_type', 'READ_NOT_MENTIONED',     '독서: 언급되지 않은 내용', 22, 1, NOW(), NOW()),
('qbcv_qt_read_inference',   'qbcg_question_type', 'READ_CONTENT_INFERENCE', '독서: 내용 일치/추론',    23, 1, NOW(), NOW()),
('qbcv_qt_read_conditional', 'qbcg_question_type', 'READ_CONDITIONAL',       '독서: 조건형',            24, 1, NOW(), NOW()),
('qbcv_qt_read_perspective', 'qbcg_question_type', 'READ_PERSPECTIVE',       '독서: 관점 적용형',       25, 1, NOW(), NOW()),
('qbcv_qt_read_compare',     'qbcg_question_type', 'READ_COMPARISON',        '독서: 비교형',            26, 1, NOW(), NOW()),
('qbcv_qt_read_case',        'qbcg_question_type', 'READ_CASE_APPLICATION',  '독서: 사례 적용 보기형',  27, 1, NOW(), NOW()),
('qbcv_qt_read_supplement',  'qbcg_question_type', 'READ_SUPPLEMENTARY',     '독서: 보충 심화 보기형',  28, 1, NOW(), NOW()),
('qbcv_qt_read_vocab',       'qbcg_question_type', 'READ_VOCABULARY',        '독서: 어휘',              29, 1, NOW(), NOW());

-- ═══ question_type 확장: 문학 유형 ═══
INSERT IGNORE INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_qt_lit_conceptual',   'qbcg_question_type', 'LIT_CONCEPTUAL',         '문학: 개념형',            30, 1, NOW(), NOW()),
('qbcv_qt_lit_content',      'qbcg_question_type', 'LIT_CONTENT',            '문학: 내용형',            31, 1, NOW(), NOW()),
('qbcv_qt_lit_interpret',    'qbcg_question_type', 'LIT_INTERPRETATION',     '문학: 내용/해석형',       32, 1, NOW(), NOW()),
('qbcv_qt_lit_bogi',         'qbcg_question_type', 'LIT_BOGI',               '문학: 내용/해석/보기형',  33, 1, NOW(), NOW()),
('qbcv_qt_lit_compare',      'qbcg_question_type', 'LIT_COMPARATIVE',        '문학: 비교형',            34, 1, NOW(), NOW()),
('qbcv_qt_lit_conditional',  'qbcg_question_type', 'LIT_CONDITIONAL',        '문학: 조건형',            35, 1, NOW(), NOW());

-- ═══ 신규 코드그룹: 오답 선택지 패턴 (독서) ═══
INSERT IGNORE INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_wrong_pattern_read', 'wrong_pattern_read', '오답 패턴 (독서)', 12, NOW(), NOW());

INSERT IGNORE INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_wpr_mixing',         'qbcg_wrong_pattern_read', 'MIXING',              '섞어치기',                 1, 1, NOW(), NOW()),
('qbcv_wpr_negation',       'qbcg_wrong_pattern_read', 'NEGATION',            '부정 표현/상대어',         2, 1, NOW(), NOW()),
('qbcv_wpr_who',            'qbcg_wrong_pattern_read', 'WHO_WHOSE_WHOM',      '주체/객체 바꾸기',         3, 1, NOW(), NOW()),
('qbcv_wpr_order',          'qbcg_wrong_pattern_read', 'ORDER_DIRECTION',     '순서/방향',                4, 1, NOW(), NOW()),
('qbcv_wpr_causality',      'qbcg_wrong_pattern_read', 'CAUSALITY',           '인과 왜곡',                5, 1, NOW(), NOW()),
('qbcv_wpr_intent',         'qbcg_wrong_pattern_read', 'INTENT',              '의도/목적 왜곡',           6, 1, NOW(), NOW()),
('qbcv_wpr_correlation',    'qbcg_wrong_pattern_read', 'CORRELATION',         '상관관계 반전',            7, 1, NOW(), NOW()),
('qbcv_wpr_necessary',      'qbcg_wrong_pattern_read', 'NECESSARY_CONDITION', '필요조건 부정',            8, 1, NOW(), NOW()),
('qbcv_wpr_combine',        'qbcg_wrong_pattern_read', 'COMBINE_SEPARATE',    '결합/분리',                9, 1, NOW(), NOW()),
('qbcv_wpr_condition',      'qbcg_wrong_pattern_read', 'CONDITION_DISTORT',   '조건 왜곡',               10, 1, NOW(), NOW());

-- ═══ 신규 코드그룹: 오답 선택지 패턴 (문학) ═══
INSERT IGNORE INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_wrong_pattern_lit', 'wrong_pattern_lit', '오답 패턴 (문학)', 13, NOW(), NOW());

INSERT IGNORE INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_wpl_good_bad',       'qbcg_wrong_pattern_lit', 'GOOD_BAD',         '긍정/부정 왜곡',    1, 1, NOW(), NOW()),
('qbcv_wpl_ab_swap',        'qbcg_wrong_pattern_lit', 'AB_SWAP',          '비교 대상 혼동',    2, 1, NOW(), NOW()),
('qbcv_wpl_who',            'qbcg_wrong_pattern_lit', 'WHO_WHOSE_WHOM',   '주체/객체 왜곡',    3, 1, NOW(), NOW()),
('qbcv_wpl_order',          'qbcg_wrong_pattern_lit', 'ORDER_DIRECTION',  '순서/방향 왜곡',    4, 1, NOW(), NOW()),
('qbcv_wpl_intent',         'qbcg_wrong_pattern_lit', 'INTENT_PURPOSE',   '의도/목적 왜곡',    5, 1, NOW(), NOW());
