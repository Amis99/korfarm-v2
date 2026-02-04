-- ============================================================
-- 시험용 시드 데이터 생성 스크립트
-- 본사관리자(u_hq_admin, org_hq) 제외 전체 초기화 후 재생성
-- 모든 계정 비밀번호: admin1234
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 기존 데이터 정리 (본사 제외)
DELETE FROM parent_student_links WHERE parent_user_id != 'u_hq_admin' AND student_user_id != 'u_hq_admin';
DELETE FROM class_memberships WHERE user_id != 'u_hq_admin';
DELETE FROM subscriptions WHERE user_id != 'u_hq_admin';
DELETE FROM economy_ledger WHERE user_id != 'u_hq_admin';
DELETE FROM learning_attempts WHERE user_id != 'u_hq_admin';
DELETE FROM user_seeds WHERE user_id != 'u_hq_admin';
DELETE FROM user_crops WHERE user_id != 'u_hq_admin';
DELETE FROM user_fertilizer WHERE user_id != 'u_hq_admin';
DELETE FROM farm_learning_logs WHERE user_id != 'u_hq_admin';
DELETE FROM refresh_tokens WHERE user_id != 'u_hq_admin';
DELETE FROM org_memberships WHERE id != 'om_hq_admin';
DELETE FROM orgs WHERE id != 'org_hq';
DELETE FROM users WHERE id != 'u_hq_admin';

SET FOREIGN_KEY_CHECKS = 1;

-- 본사 기관 정보 업데이트
UPDATE orgs SET org_type = NULL, address_region = '서울', address_detail = '강남구 테헤란로 123' WHERE id = 'org_hq';

-- ============================================================
-- 2. 기관 4개 생성 (종류별 1개)
-- ============================================================
INSERT INTO orgs (id, name, status, plan, seat_limit, org_type, address_region, address_detail, created_at, updated_at) VALUES
  ('org_academy',  '한빛국어학원',       'active', 'Pro',        100, '학원',   '경기', '성남시 분당구 정자로 45',         NOW(), NOW()),
  ('org_school',   '서울중앙고등학교',    'active', 'Basic',      200, '학교',   '서울', '서초구 반포대로 58',              NOW(), NOW()),
  ('org_public',   '강남구교육지원센터',  'active', 'Enterprise',  50, '공공기관', '서울', '강남구 학동로 171',              NOW(), NOW()),
  ('org_etc',      '독서모임 책마을',     'active', 'Basic',       30, '기타',   '부산', '해운대구 센텀중앙로 97',          NOW(), NOW());

-- ============================================================
-- 3. 기관 관리자 8명 (기관당 2명)
-- 비밀번호: admin1234
-- BCrypt: $2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, student_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_acad_adm1', 'academy_admin1', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '김학원',   '경기', '한빛국어학원',       '01012340001', false, 'active', NOW(), NOW()),
  ('u_acad_adm2', 'academy_admin2', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '이학원',   '경기', '한빛국어학원',       '01012340002', false, 'active', NOW(), NOW()),
  ('u_schl_adm1', 'school_admin1',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '박학교',   '서울', '서울중앙고등학교',    '01012340003', false, 'active', NOW(), NOW()),
  ('u_schl_adm2', 'school_admin2',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '최학교',   '서울', '서울중앙고등학교',    '01012340004', false, 'active', NOW(), NOW()),
  ('u_publ_adm1', 'public_admin1',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '정교육',   '서울', '강남구교육지원센터',  '01012340005', false, 'active', NOW(), NOW()),
  ('u_publ_adm2', 'public_admin2',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '강교육',   '서울', '강남구교육지원센터',  '01012340006', false, 'active', NOW(), NOW()),
  ('u_etc_adm1',  'etc_admin1',     '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '윤독서',   '부산', '독서모임 책마을',     '01012340007', false, 'active', NOW(), NOW()),
  ('u_etc_adm2',  'etc_admin2',     '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '한독서',   '부산', '독서모임 책마을',     '01012340008', false, 'active', NOW(), NOW());

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_acad_adm1', 'org_academy', 'u_acad_adm1', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_acad_adm2', 'org_academy', 'u_acad_adm2', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_schl_adm1', 'org_school',  'u_schl_adm1', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_schl_adm2', 'org_school',  'u_schl_adm2', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_publ_adm1', 'org_public',  'u_publ_adm1', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_publ_adm2', 'org_public',  'u_publ_adm2', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_etc_adm1',  'org_etc',     'u_etc_adm1',  'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_etc_adm2',  'org_etc',     'u_etc_adm2',  'ORG_ADMIN', 'active', NOW(), NOW());

-- ============================================================
-- 4. 유료 학생 12명 (레벨별 1명)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, student_phone, parent_phone, status, created_at, updated_at) VALUES
  ('u_paid01', 'paid_stu01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르일', '경기',   '분당초등학교',     '초3', 'saussure1',     '01091010001', '01092010001', false, 'active', NOW(), NOW()),
  ('u_paid02', 'paid_stu02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르이', '서울',   '서초초등학교',     '초4', 'saussure2',     '01091010002', '01092010002', 'active', NOW(), NOW()),
  ('u_paid03', 'paid_stu03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르삼', '인천',   '송도초등학교',     '초5', 'saussure3',     '01091010003', '01092010003', 'active', NOW(), NOW()),
  ('u_paid04', 'paid_stu04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게일', '대전',   '둔산초등학교',     '초6', 'frege1',        '01091010004', '01092010004', 'active', NOW(), NOW()),
  ('u_paid05', 'paid_stu05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게이', '광주',   '광주중학교',       '중1', 'frege2',        '01091010005', '01092010005', 'active', NOW(), NOW()),
  ('u_paid06', 'paid_stu06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게삼', '대구',   '대구중학교',       '중2', 'frege3',        '01091010006', '01092010006', 'active', NOW(), NOW()),
  ('u_paid07', 'paid_stu07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀일',   '울산',   '울산중학교',       '중3', 'russell1',      '01091010007', '01092010007', 'active', NOW(), NOW()),
  ('u_paid08', 'paid_stu08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀이',   '부산',   '해운대고등학교',   '고1', 'russell2',      '01091010008', '01092010008', 'active', NOW(), NOW()),
  ('u_paid09', 'paid_stu09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀삼',   '강원',   '춘천고등학교',     '고2', 'russell3',      '01091010009', '01092010009', 'active', NOW(), NOW()),
  ('u_paid10', 'paid_stu10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트일',   '충남',   '천안고등학교',     '고3', 'wittgenstein1', '01091010010', '01092010010', 'active', NOW(), NOW()),
  ('u_paid11', 'paid_stu11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트이',   '전북',   '전주고등학교',     'N수', 'wittgenstein2', '01091010011', '01092010011', 'active', NOW(), NOW()),
  ('u_paid12', 'paid_stu12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트삼',   '제주',   '제주고등학교',     '대학', 'wittgenstein3', '01091010012', '01092010012', 'active', NOW(), NOW());

-- 유료 학생 기관 멤버십 (3명씩 4기관에 배분)
INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_paid01', 'org_academy', 'u_paid01', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid02', 'org_academy', 'u_paid02', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid03', 'org_academy', 'u_paid03', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid04', 'org_school',  'u_paid04', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid05', 'org_school',  'u_paid05', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid06', 'org_school',  'u_paid06', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid07', 'org_public',  'u_paid07', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid08', 'org_public',  'u_paid08', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid09', 'org_public',  'u_paid09', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid10', 'org_etc',     'u_paid10', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid11', 'org_etc',     'u_paid11', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid12', 'org_etc',     'u_paid12', 'STUDENT', 'active', NOW(), NOW());

-- 유료 학생 구독 (1년)
INSERT INTO subscriptions (id, user_id, status, start_at, end_at, created_at, updated_at) VALUES
  ('sub_paid01', 'u_paid01', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid02', 'u_paid02', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid03', 'u_paid03', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid04', 'u_paid04', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid05', 'u_paid05', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid06', 'u_paid06', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid07', 'u_paid07', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid08', 'u_paid08', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid09', 'u_paid09', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid10', 'u_paid10', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid11', 'u_paid11', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW()),
  ('sub_paid12', 'u_paid12', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW());

-- ============================================================
-- 5. 무료 학생 12명 (레벨별 1명)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, student_phone, parent_phone, status, created_at, updated_at) VALUES
  ('u_free01', 'free_stu01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르일', '서울',   '강남초등학교',     '초3', 'saussure1',     '01093010001', '01094010001', 'active', NOW(), NOW()),
  ('u_free02', 'free_stu02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르이', '경기',   '수원초등학교',     '초4', 'saussure2',     '01093010002', '01094010002', 'active', NOW(), NOW()),
  ('u_free03', 'free_stu03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르삼', '부산',   '부산초등학교',     '초5', 'saussure3',     '01093010003', '01094010003', 'active', NOW(), NOW()),
  ('u_free04', 'free_stu04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게일', '대구',   '대구초등학교',     '초6', 'frege1',        '01093010004', '01094010004', 'active', NOW(), NOW()),
  ('u_free05', 'free_stu05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게이', '인천',   '인천중학교',       '중1', 'frege2',        '01093010005', '01094010005', 'active', NOW(), NOW()),
  ('u_free06', 'free_stu06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게삼', '광주',   '광주중학교',       '중2', 'frege3',        '01093010006', '01094010006', 'active', NOW(), NOW()),
  ('u_free07', 'free_stu07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀일',   '대전',   '대전중학교',       '중3', 'russell1',      '01093010007', '01094010007', 'active', NOW(), NOW()),
  ('u_free08', 'free_stu08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀이',   '울산',   '울산고등학교',     '고1', 'russell2',      '01093010008', '01094010008', 'active', NOW(), NOW()),
  ('u_free09', 'free_stu09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀삼',   '세종',   '세종고등학교',     '고2', 'russell3',      '01093010009', '01094010009', 'active', NOW(), NOW()),
  ('u_free10', 'free_stu10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트일',   '충북',   '청주고등학교',     '고3', 'wittgenstein1', '01093010010', '01094010010', 'active', NOW(), NOW()),
  ('u_free11', 'free_stu11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트이',   '전남',   '목포고등학교',     'N수', 'wittgenstein2', '01093010011', '01094010011', 'active', NOW(), NOW()),
  ('u_free12', 'free_stu12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트삼',   '경남',   '창원고등학교',     '대학', 'wittgenstein3', '01093010012', '01094010012', 'active', NOW(), NOW());

-- 무료 학생 기관 멤버십 (3명씩 4기관에 배분)
INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_free01', 'org_academy', 'u_free01', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free02', 'org_academy', 'u_free02', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free03', 'org_academy', 'u_free03', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free04', 'org_school',  'u_free04', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free05', 'org_school',  'u_free05', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free06', 'org_school',  'u_free06', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free07', 'org_public',  'u_free07', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free08', 'org_public',  'u_free08', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free09', 'org_public',  'u_free09', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free10', 'org_etc',     'u_free10', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free11', 'org_etc',     'u_free11', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free12', 'org_etc',     'u_free12', 'STUDENT', 'active', NOW(), NOW());

-- ============================================================
-- 6. 부모 계정 24명 (학생 1명당 1명)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, student_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_par_p01', 'parent_paid01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모일',   '경기', '01092010001', false, 'active', NOW(), NOW()),
  ('u_par_p02', 'parent_paid02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모이',   '서울', '01092010002', 'active', NOW(), NOW()),
  ('u_par_p03', 'parent_paid03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모삼',   '인천', '01092010003', 'active', NOW(), NOW()),
  ('u_par_p04', 'parent_paid04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모사',   '대전', '01092010004', 'active', NOW(), NOW()),
  ('u_par_p05', 'parent_paid05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모오',   '광주', '01092010005', 'active', NOW(), NOW()),
  ('u_par_p06', 'parent_paid06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모육',   '대구', '01092010006', 'active', NOW(), NOW()),
  ('u_par_p07', 'parent_paid07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모칠',   '울산', '01092010007', 'active', NOW(), NOW()),
  ('u_par_p08', 'parent_paid08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모팔',   '부산', '01092010008', 'active', NOW(), NOW()),
  ('u_par_p09', 'parent_paid09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모구',   '강원', '01092010009', 'active', NOW(), NOW()),
  ('u_par_p10', 'parent_paid10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십',   '충남', '01092010010', 'active', NOW(), NOW()),
  ('u_par_p11', 'parent_paid11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십일', '전북', '01092010011', 'active', NOW(), NOW()),
  ('u_par_p12', 'parent_paid12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십이', '제주', '01092010012', 'active', NOW(), NOW()),
  ('u_par_f01', 'parent_free01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모일',   '서울', '01094010001', 'active', NOW(), NOW()),
  ('u_par_f02', 'parent_free02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모이',   '경기', '01094010002', 'active', NOW(), NOW()),
  ('u_par_f03', 'parent_free03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모삼',   '부산', '01094010003', 'active', NOW(), NOW()),
  ('u_par_f04', 'parent_free04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모사',   '대구', '01094010004', 'active', NOW(), NOW()),
  ('u_par_f05', 'parent_free05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모오',   '인천', '01094010005', 'active', NOW(), NOW()),
  ('u_par_f06', 'parent_free06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모육',   '광주', '01094010006', 'active', NOW(), NOW()),
  ('u_par_f07', 'parent_free07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모칠',   '대전', '01094010007', 'active', NOW(), NOW()),
  ('u_par_f08', 'parent_free08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모팔',   '울산', '01094010008', 'active', NOW(), NOW()),
  ('u_par_f09', 'parent_free09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모구',   '세종', '01094010009', 'active', NOW(), NOW()),
  ('u_par_f10', 'parent_free10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십',   '충북', '01094010010', 'active', NOW(), NOW()),
  ('u_par_f11', 'parent_free11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십일', '전남', '01094010011', 'active', NOW(), NOW()),
  ('u_par_f12', 'parent_free12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십이', '경남', '01094010012', 'active', NOW(), NOW());

-- 부모-학생 연결
INSERT INTO parent_student_links (id, parent_user_id, student_user_id, status, created_at, updated_at) VALUES
  ('psl_p01', 'u_par_p01', 'u_paid01', 'active', NOW(), NOW()),
  ('psl_p02', 'u_par_p02', 'u_paid02', 'active', NOW(), NOW()),
  ('psl_p03', 'u_par_p03', 'u_paid03', 'active', NOW(), NOW()),
  ('psl_p04', 'u_par_p04', 'u_paid04', 'active', NOW(), NOW()),
  ('psl_p05', 'u_par_p05', 'u_paid05', 'active', NOW(), NOW()),
  ('psl_p06', 'u_par_p06', 'u_paid06', 'active', NOW(), NOW()),
  ('psl_p07', 'u_par_p07', 'u_paid07', 'active', NOW(), NOW()),
  ('psl_p08', 'u_par_p08', 'u_paid08', 'active', NOW(), NOW()),
  ('psl_p09', 'u_par_p09', 'u_paid09', 'active', NOW(), NOW()),
  ('psl_p10', 'u_par_p10', 'u_paid10', 'active', NOW(), NOW()),
  ('psl_p11', 'u_par_p11', 'u_paid11', 'active', NOW(), NOW()),
  ('psl_p12', 'u_par_p12', 'u_paid12', 'active', NOW(), NOW()),
  ('psl_f01', 'u_par_f01', 'u_free01', 'active', NOW(), NOW()),
  ('psl_f02', 'u_par_f02', 'u_free02', 'active', NOW(), NOW()),
  ('psl_f03', 'u_par_f03', 'u_free03', 'active', NOW(), NOW()),
  ('psl_f04', 'u_par_f04', 'u_free04', 'active', NOW(), NOW()),
  ('psl_f05', 'u_par_f05', 'u_free05', 'active', NOW(), NOW()),
  ('psl_f06', 'u_par_f06', 'u_free06', 'active', NOW(), NOW()),
  ('psl_f07', 'u_par_f07', 'u_free07', 'active', NOW(), NOW()),
  ('psl_f08', 'u_par_f08', 'u_free08', 'active', NOW(), NOW()),
  ('psl_f09', 'u_par_f09', 'u_free09', 'active', NOW(), NOW()),
  ('psl_f10', 'u_par_f10', 'u_free10', 'active', NOW(), NOW()),
  ('psl_f11', 'u_par_f11', 'u_free11', 'active', NOW(), NOW()),
  ('psl_f12', 'u_par_f12', 'u_free12', 'active', NOW(), NOW());
