-- 문제은행 코드표 시드 데이터 (11개 그룹)

-- 1. 소스_분류
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_source_type', 'source_type', '소스 분류', 1, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_src_textbook',      'qbcg_source_type', 'TEXTBOOK',       '교과서',      1, 1, NOW(), NOW()),
('qbcv_src_self_study',    'qbcg_source_type', 'SELF_STUDY',     '자습서',      2, 1, NOW(), NOW()),
('qbcv_src_eval_workbook', 'qbcg_source_type', 'EVAL_WORKBOOK',  '평가문제집',  3, 1, NOW(), NOW()),
('qbcv_src_past_exam',     'qbcg_source_type', 'PAST_EXAM',      '기출',        4, 1, NOW(), NOW()),
('qbcv_src_school_exam',   'qbcg_source_type', 'SCHOOL_EXAM',    '학교 내신',   5, 1, NOW(), NOW()),
('qbcv_src_etc',           'qbcg_source_type', 'ETC',            '기타',        6, 1, NOW(), NOW());

-- 2. 기출_기관
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_exam_org', 'exam_org', '기출 기관', 2, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_org_csat',    'qbcg_exam_org', 'CSAT',    '수능',    1, 1, NOW(), NOW()),
('qbcv_org_moe',     'qbcg_exam_org', 'MOE',     '교육청',  2, 1, NOW(), NOW()),
('qbcv_org_school',  'qbcg_exam_org', 'SCHOOL',  '학교',    3, 1, NOW(), NOW()),
('qbcv_org_private', 'qbcg_exam_org', 'PRIVATE', '사설',    4, 1, NOW(), NOW()),
('qbcv_org_etc',     'qbcg_exam_org', 'ETC',     '기타',    5, 1, NOW(), NOW());

-- 3. 영역
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_area', 'area', '영역', 3, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_area_lit',        'qbcg_area', 'LIT',        '문학',  1, 1, NOW(), NOW()),
('qbcv_area_read',       'qbcg_area', 'READ',       '독서',  2, 1, NOW(), NOW()),
('qbcv_area_gram',       'qbcg_area', 'GRAM',       '문법',  3, 1, NOW(), NOW()),
('qbcv_area_speak',      'qbcg_area', 'SPEAK',      '화법',  4, 1, NOW(), NOW()),
('qbcv_area_write',      'qbcg_area', 'WRITE',      '작문',  5, 1, NOW(), NOW()),
('qbcv_area_media',      'qbcg_area', 'MEDIA',      '매체',  6, 1, NOW(), NOW()),
('qbcv_area_integrated', 'qbcg_area', 'INTEGRATED', '복합',  7, 1, NOW(), NOW());

-- 4. 세부영역
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_sub_area', 'sub_area', '세부영역', 4, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_sa_lit_modern_poetry',  'qbcg_sub_area', 'LIT_MODERN_POETRY',  '현대시',      1, 1, NOW(), NOW()),
('qbcv_sa_lit_classic_poetry', 'qbcg_sub_area', 'LIT_CLASSIC_POETRY', '고전시가',    2, 1, NOW(), NOW()),
('qbcv_sa_lit_modern_novel',   'qbcg_sub_area', 'LIT_MODERN_NOVEL',   '현대소설',    3, 1, NOW(), NOW()),
('qbcv_sa_lit_classic_prose',  'qbcg_sub_area', 'LIT_CLASSIC_PROSE',  '고전산문',    4, 1, NOW(), NOW()),
('qbcv_sa_lit_essay',          'qbcg_sub_area', 'LIT_ESSAY',          '수필',        5, 1, NOW(), NOW()),
('qbcv_sa_lit_drama',          'qbcg_sub_area', 'LIT_DRAMA',          '극',          6, 1, NOW(), NOW()),
('qbcv_sa_read_humanities',    'qbcg_sub_area', 'READ_HUMANITIES',    '인문',        7, 1, NOW(), NOW()),
('qbcv_sa_read_society',       'qbcg_sub_area', 'READ_SOCIETY',       '사회',        8, 1, NOW(), NOW()),
('qbcv_sa_read_sci_tech',      'qbcg_sub_area', 'READ_SCI_TECH',      '과학기술',    9, 1, NOW(), NOW()),
('qbcv_sa_read_art',           'qbcg_sub_area', 'READ_ART',           '예술',       10, 1, NOW(), NOW()),
('qbcv_sa_read_cross',         'qbcg_sub_area', 'READ_CROSS',         '통합',       11, 1, NOW(), NOW()),
('qbcv_sa_gram_phonology',     'qbcg_sub_area', 'GRAM_PHONOLOGY',     '음운',       12, 1, NOW(), NOW()),
('qbcv_sa_gram_word',          'qbcg_sub_area', 'GRAM_WORD',          '단어',       13, 1, NOW(), NOW()),
('qbcv_sa_gram_sentence',      'qbcg_sub_area', 'GRAM_SENTENCE',      '문장',       14, 1, NOW(), NOW()),
('qbcv_sa_gram_discourse',     'qbcg_sub_area', 'GRAM_DISCOURSE',     '담화',       15, 1, NOW(), NOW()),
('qbcv_sa_gram_history',       'qbcg_sub_area', 'GRAM_HISTORY',       '국어사',     16, 1, NOW(), NOW()),
('qbcv_sa_speak_general',      'qbcg_sub_area', 'SPEAK_GENERAL',      '화법 일반',  17, 1, NOW(), NOW()),
('qbcv_sa_write_general',      'qbcg_sub_area', 'WRITE_GENERAL',      '작문 일반',  18, 1, NOW(), NOW()),
('qbcv_sa_media_language',     'qbcg_sub_area', 'MEDIA_LANGUAGE',     '매체 언어',  19, 1, NOW(), NOW()),
('qbcv_sa_integrated_multi',   'qbcg_sub_area', 'INTEGRATED_MULTI',   '복합 지문',  20, 1, NOW(), NOW());

-- 5. 대상_학년
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_target_grade', 'target_grade', '대상 학년', 5, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_grade_ms1', 'qbcg_target_grade', 'MS1', '중1',      1, 1, NOW(), NOW()),
('qbcv_grade_ms2', 'qbcg_target_grade', 'MS2', '중2',      2, 1, NOW(), NOW()),
('qbcv_grade_ms3', 'qbcg_target_grade', 'MS3', '중3',      3, 1, NOW(), NOW()),
('qbcv_grade_hs1', 'qbcg_target_grade', 'HS1', '고1',      4, 1, NOW(), NOW()),
('qbcv_grade_hs2', 'qbcg_target_grade', 'HS2', '고2',      5, 1, NOW(), NOW()),
('qbcv_grade_hs3', 'qbcg_target_grade', 'HS3', '고3',      6, 1, NOW(), NOW()),
('qbcv_grade_nq',  'qbcg_target_grade', 'NQ',  '수능/N수', 7, 1, NOW(), NOW());

-- 6. 지문_참조_유형
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_ref_type', 'ref_type', '지문 참조 유형', 6, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_ref_full', 'qbcg_ref_type', 'FULL', '전체 지문 기준', 1, 1, NOW(), NOW()),
('qbcv_ref_part', 'qbcg_ref_type', 'PART', '부분 지문 기준', 2, 1, NOW(), NOW()),
('qbcv_ref_none', 'qbcg_ref_type', 'NONE', '지문 없음',      3, 1, NOW(), NOW());

-- 7. 문항_형식
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_question_format', 'question_format', '문항 형식', 7, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_fmt_mcq',   'qbcg_question_format', 'MCQ',   '객관식',  1, 1, NOW(), NOW()),
('qbcv_fmt_sa',    'qbcg_question_format', 'SA',    '단답형',  2, 1, NOW(), NOW()),
('qbcv_fmt_essay', 'qbcg_question_format', 'ESSAY', '서술형',  3, 1, NOW(), NOW());

-- 8. 정답_유형
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_answer_type', 'answer_type', '정답 유형', 8, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_ans_choice',       'qbcg_answer_type', 'CHOICE',       '선택지 기호',  1, 1, NOW(), NOW()),
('qbcv_ans_text',         'qbcg_answer_type', 'TEXT',          '텍스트 정답',  2, 1, NOW(), NOW()),
('qbcv_ans_keyword_set',  'qbcg_answer_type', 'KEYWORD_SET',  '키워드 집합',  3, 1, NOW(), NOW()),
('qbcv_ans_model_answer', 'qbcg_answer_type', 'MODEL_ANSWER', '모범 답안',    4, 1, NOW(), NOW()),
('qbcv_ans_numeric',      'qbcg_answer_type', 'NUMERIC',      '숫자 정답',    5, 1, NOW(), NOW());

-- 9. 문제_유형
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_question_type', 'question_type', '문제 유형', 9, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_qt_content',      'qbcg_question_type', 'CONTENT',      '내용 이해',       1, 1, NOW(), NOW()),
('qbcv_qt_inference',    'qbcg_question_type', 'INFERENCE',    '추론',            2, 1, NOW(), NOW()),
('qbcv_qt_theme',        'qbcg_question_type', 'THEME',        '주제/제목',       3, 1, NOW(), NOW()),
('qbcv_qt_structure',    'qbcg_question_type', 'STRUCTURE',    '구조/전개',       4, 1, NOW(), NOW()),
('qbcv_qt_expression',   'qbcg_question_type', 'EXPRESSION',   '표현상 특징',     5, 1, NOW(), NOW()),
('qbcv_qt_tone',         'qbcg_question_type', 'TONE_ATTITUDE','태도/정서',       6, 1, NOW(), NOW()),
('qbcv_qt_vocab',        'qbcg_question_type', 'VOCAB',        '어휘',            7, 1, NOW(), NOW()),
('qbcv_qt_grammar',      'qbcg_question_type', 'GRAMMAR',      '문법/어법',       8, 1, NOW(), NOW()),
('qbcv_qt_correctness',  'qbcg_question_type', 'CORRECTNESS',  '적절/부적절 판단', 9, 1, NOW(), NOW()),
('qbcv_qt_order',        'qbcg_question_type', 'ORDER',        '순서 배열',      10, 1, NOW(), NOW()),
('qbcv_qt_insert',       'qbcg_question_type', 'INSERT',       '문장 삽입',      11, 1, NOW(), NOW()),
('qbcv_qt_summary',      'qbcg_question_type', 'SUMMARY',      '요약',           12, 1, NOW(), NOW()),
('qbcv_qt_application',  'qbcg_question_type', 'APPLICATION',  '적용',           13, 1, NOW(), NOW()),
('qbcv_qt_comparison',   'qbcg_question_type', 'COMPARISON',   '비교/대조',      14, 1, NOW(), NOW()),
('qbcv_qt_critique',     'qbcg_question_type', 'CRITIQUE',     '비판/평가',      15, 1, NOW(), NOW()),
('qbcv_qt_writing',      'qbcg_question_type', 'WRITING',      '쓰기',           16, 1, NOW(), NOW()),
('qbcv_qt_speaking',     'qbcg_question_type', 'SPEAKING',     '화법',           17, 1, NOW(), NOW()),
('qbcv_qt_media',        'qbcg_question_type', 'MEDIA',        '매체',           18, 1, NOW(), NOW());

-- 10. 선택지_패턴
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_choice_pattern', 'choice_pattern', '선택지 패턴', 10, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_cp_mcq5_single', 'qbcg_choice_pattern', 'MCQ_5_SINGLE', '5지선다/단일정답',  1, 1, NOW(), NOW()),
('qbcv_cp_mcq5_multi',  'qbcg_choice_pattern', 'MCQ_5_MULTI',  '5지선다/복수정답',  2, 1, NOW(), NOW()),
('qbcv_cp_mcq_tf',      'qbcg_choice_pattern', 'MCQ_TF',       '진위형',           3, 1, NOW(), NOW()),
('qbcv_cp_mcq_match',   'qbcg_choice_pattern', 'MCQ_MATCH',    '짝짓기형',         4, 1, NOW(), NOW()),
('qbcv_cp_sa_text',     'qbcg_choice_pattern', 'SA_TEXT',       '단답형/텍스트',    5, 1, NOW(), NOW()),
('qbcv_cp_sa_num',      'qbcg_choice_pattern', 'SA_NUM',        '단답형/숫자',      6, 1, NOW(), NOW()),
('qbcv_cp_essay_text',  'qbcg_choice_pattern', 'ESSAY_TEXT',    '서술형/텍스트',    7, 1, NOW(), NOW()),
('qbcv_cp_essay_rubric','qbcg_choice_pattern', 'ESSAY_RUBRIC',  '서술형/채점기준형', 8, 1, NOW(), NOW());

-- 11. 적용_개념
INSERT INTO qb_code_groups (id, group_key, label, sort_order, created_at, updated_at)
VALUES ('qbcg_applied_concept', 'applied_concept', '적용 개념', 11, NOW(), NOW());

INSERT INTO qb_code_values (id, group_id, value, label, sort_order, is_active, created_at, updated_at) VALUES
('qbcv_ac_speaker_attitude',     'qbcg_applied_concept', 'SPEAKER_ATTITUDE',     '화자 태도',    1, 1, NOW(), NOW()),
('qbcv_ac_narrator_view',        'qbcg_applied_concept', 'NARRATOR_VIEW',        '서술자 관점',  2, 1, NOW(), NOW()),
('qbcv_ac_imagery',              'qbcg_applied_concept', 'IMAGERY',              '심상',         3, 1, NOW(), NOW()),
('qbcv_ac_rhetoric',             'qbcg_applied_concept', 'RHETORIC',             '수사법',       4, 1, NOW(), NOW()),
('qbcv_ac_tone',                 'qbcg_applied_concept', 'TONE',                 '어조',         5, 1, NOW(), NOW()),
('qbcv_ac_plot',                 'qbcg_applied_concept', 'PLOT',                 '구성',         6, 1, NOW(), NOW()),
('qbcv_ac_character',            'qbcg_applied_concept', 'CHARACTER',            '인물',         7, 1, NOW(), NOW()),
('qbcv_ac_setting',              'qbcg_applied_concept', 'SETTING',              '배경',         8, 1, NOW(), NOW()),
('qbcv_ac_conflict',             'qbcg_applied_concept', 'CONFLICT',             '갈등',         9, 1, NOW(), NOW()),
('qbcv_ac_theme_concept',        'qbcg_applied_concept', 'THEME_CONCEPT',        '주제',        10, 1, NOW(), NOW()),
('qbcv_ac_keyword',              'qbcg_applied_concept', 'KEYWORD',              '핵심어',      11, 1, NOW(), NOW()),
('qbcv_ac_detail_info',          'qbcg_applied_concept', 'DETAIL_INFO',          '세부 정보',   12, 1, NOW(), NOW()),
('qbcv_ac_inferential_reading',  'qbcg_applied_concept', 'INFERENTIAL_READING',  '추론적 읽기', 13, 1, NOW(), NOW()),
('qbcv_ac_logic',                'qbcg_applied_concept', 'LOGIC',                '논리 전개',   14, 1, NOW(), NOW()),
('qbcv_ac_cohesion',             'qbcg_applied_concept', 'COHESION',             '응집성',      15, 1, NOW(), NOW()),
('qbcv_ac_grammar_element',      'qbcg_applied_concept', 'GRAMMAR_ELEMENT',      '문법 요소',   16, 1, NOW(), NOW()),
('qbcv_ac_phonology',            'qbcg_applied_concept', 'PHONOLOGY',            '음운',        17, 1, NOW(), NOW()),
('qbcv_ac_word_formation',       'qbcg_applied_concept', 'WORD_FORMATION',       '단어 형성',   18, 1, NOW(), NOW()),
('qbcv_ac_sentence_structure',   'qbcg_applied_concept', 'SENTENCE_STRUCTURE',   '문장 구조',   19, 1, NOW(), NOW()),
('qbcv_ac_context',              'qbcg_applied_concept', 'CONTEXT',              '문맥 판단',   20, 1, NOW(), NOW()),
('qbcv_ac_media_literacy',       'qbcg_applied_concept', 'MEDIA_LITERACY',       '매체 문식성', 21, 1, NOW(), NOW());
