-- ============================================================
-- 시험용 시드 데이터 생성 스크립트 (v2)
-- 모든 기존 데이터 삭제 후 전체 재생성
-- 모든 계정 비밀번호: admin1234
-- BCrypt: $2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 기존 데이터 전체 삭제
DELETE FROM parent_student_links;
DELETE FROM class_memberships;
DELETE FROM subscriptions;
DELETE FROM economy_ledger;
DELETE FROM learning_attempts;
DELETE FROM user_seeds;
DELETE FROM user_crops;
DELETE FROM user_fertilizer;
DELETE FROM farm_learning_logs;
DELETE FROM refresh_tokens;
DELETE FROM org_memberships;
DELETE FROM users;
DELETE FROM orgs;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 2. 기관 6개 생성 (본사 1 + 일반 5)
-- ============================================================
INSERT INTO orgs (id, name, status, plan, seat_limit, org_type, address_region, address_detail, created_at, updated_at) VALUES
  ('org_hq',      '국어농장',            'active', 'Enterprise', 9999, NULL,       '서울', '강남구 테헤란로 123',         NOW(), NOW()),
  ('org_academy', '한빛국어학원',        'active', 'Pro',        100,  '학원',     '경기', '성남시 분당구 정자로 45',      NOW(), NOW()),
  ('org_school',  '서울중앙고등학교',     'active', 'Basic',      200,  '학교',     '서울', '서초구 반포대로 58',           NOW(), NOW()),
  ('org_public',  '강남구교육지원센터',   'active', 'Enterprise', 50,   '공공기관', '서울', '강남구 학동로 171',            NOW(), NOW()),
  ('org_etc',     '독서모임 책마을',      'active', 'Basic',      30,   '기타',     '부산', '해운대구 센텀중앙로 97',       NOW(), NOW()),
  ('org_online',  '온라인교육센터',       'active', 'Pro',        100,  '온라인',   '세종', '한누리대로 2130',              NOW(), NOW());

-- ============================================================
-- 3. 본사 관리자 1명 (HQ_ADMIN)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, student_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_hq_admin', 'hqadmin', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '본사관리자', '서울', '국어농장', '01000000000', 0, 'active', NOW(), NOW());

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_hq_admin', 'org_hq', 'u_hq_admin', 'HQ_ADMIN', 'active', NOW(), NOW());

-- ============================================================
-- 4. 기관 관리자 10명 (5기관 x 2명)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, student_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_acad_adm1',   'academy_admin1', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '김학원',   '경기', '한빛국어학원',       '01012340001', 0, 'active', NOW(), NOW()),
  ('u_acad_adm2',   'academy_admin2', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '이학원',   '경기', '한빛국어학원',       '01012340002', 0, 'active', NOW(), NOW()),
  ('u_schl_adm1',   'school_admin1',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '박학교',   '서울', '서울중앙고등학교',    '01012340003', 0, 'active', NOW(), NOW()),
  ('u_schl_adm2',   'school_admin2',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '최학교',   '서울', '서울중앙고등학교',    '01012340004', 0, 'active', NOW(), NOW()),
  ('u_publ_adm1',   'public_admin1',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '정교육',   '서울', '강남구교육지원센터',  '01012340005', 0, 'active', NOW(), NOW()),
  ('u_publ_adm2',   'public_admin2',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '강교육',   '서울', '강남구교육지원센터',  '01012340006', 0, 'active', NOW(), NOW()),
  ('u_etc_adm1',    'etc_admin1',     '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '윤독서',   '부산', '독서모임 책마을',     '01012340007', 0, 'active', NOW(), NOW()),
  ('u_etc_adm2',    'etc_admin2',     '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '한독서',   '부산', '독서모임 책마을',     '01012340008', 0, 'active', NOW(), NOW()),
  ('u_online_adm1', 'online_admin1',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '송온라인', '세종', '온라인교육센터',      '01012340009', 0, 'active', NOW(), NOW()),
  ('u_online_adm2', 'online_admin2',  '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '임온라인', '세종', '온라인교육센터',      '01012340010', 0, 'active', NOW(), NOW());

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_acad_adm1',   'org_academy', 'u_acad_adm1',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_acad_adm2',   'org_academy', 'u_acad_adm2',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_schl_adm1',   'org_school',  'u_schl_adm1',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_schl_adm2',   'org_school',  'u_schl_adm2',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_publ_adm1',   'org_public',  'u_publ_adm1',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_publ_adm2',   'org_public',  'u_publ_adm2',   'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_etc_adm1',    'org_etc',     'u_etc_adm1',    'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_etc_adm2',    'org_etc',     'u_etc_adm2',    'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_online_adm1', 'org_online',  'u_online_adm1', 'ORG_ADMIN', 'active', NOW(), NOW()),
  ('om_online_adm2', 'org_online',  'u_online_adm2', 'ORG_ADMIN', 'active', NOW(), NOW());

-- ============================================================
-- 5. 유료 학생 12명 (레벨별 3명씩 4레벨)
-- 기관 배분: academy(01~02), school(03~05), public(06~08), etc(09~10), online(11~12)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, student_phone, parent_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_paid01', 'paid_stu01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르일', '경기', '분당초등학교',   '초3', 'saussure1',     '01091010001', '01092010001', 0, 'active', NOW(), NOW()),
  ('u_paid02', 'paid_stu02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르이', '경기', '서초초등학교',   '초4', 'saussure2',     '01091010002', '01092010002', 0, 'active', NOW(), NOW()),
  ('u_paid03', 'paid_stu03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유소쉬르삼', '서울', '송도초등학교',   '초5', 'saussure3',     '01091010003', '01092010003', 0, 'active', NOW(), NOW()),
  ('u_paid04', 'paid_stu04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게일', '서울', '둔산초등학교',   '초6', 'frege1',        '01091010004', '01092010004', 0, 'active', NOW(), NOW()),
  ('u_paid05', 'paid_stu05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게이', '서울', '광주중학교',     '중1', 'frege2',        '01091010005', '01092010005', 0, 'active', NOW(), NOW()),
  ('u_paid06', 'paid_stu06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유프레게삼', '서울', '대구중학교',     '중2', 'frege3',        '01091010006', '01092010006', 0, 'active', NOW(), NOW()),
  ('u_paid07', 'paid_stu07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀일',   '서울', '울산중학교',     '중3', 'russell1',      '01091010007', '01092010007', 0, 'active', NOW(), NOW()),
  ('u_paid08', 'paid_stu08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀이',   '서울', '해운대고등학교', '고1', 'russell2',      '01091010008', '01092010008', 0, 'active', NOW(), NOW()),
  ('u_paid09', 'paid_stu09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유러셀삼',   '부산', '춘천고등학교',   '고2', 'russell3',      '01091010009', '01092010009', 0, 'active', NOW(), NOW()),
  ('u_paid10', 'paid_stu10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트일',   '부산', '천안고등학교',   '고3', 'wittgenstein1', '01091010010', '01092010010', 0, 'active', NOW(), NOW()),
  ('u_paid11', 'paid_stu11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트이',   '세종', '전주고등학교',   'N수', 'wittgenstein2', '01091010011', '01092010011', 0, 'active', NOW(), NOW()),
  ('u_paid12', 'paid_stu12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유비트삼',   '세종', '제주고등학교',   '대학', 'wittgenstein3', '01091010012', '01092010012', 0, 'active', NOW(), NOW());

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_paid01', 'org_academy', 'u_paid01', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid02', 'org_academy', 'u_paid02', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid03', 'org_school',  'u_paid03', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid04', 'org_school',  'u_paid04', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid05', 'org_school',  'u_paid05', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid06', 'org_public',  'u_paid06', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid07', 'org_public',  'u_paid07', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid08', 'org_public',  'u_paid08', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid09', 'org_etc',     'u_paid09', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid10', 'org_etc',     'u_paid10', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid11', 'org_online',  'u_paid11', 'STUDENT', 'active', NOW(), NOW()),
  ('om_paid12', 'org_online',  'u_paid12', 'STUDENT', 'active', NOW(), NOW());

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
-- 6. 무료 학생 12명 (레벨별 3명씩 4레벨)
-- 기관 배분: academy(01~02), school(03~05), public(06~08), etc(09~10), online(11~12)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, school, grade_label, level_id, student_phone, parent_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_free01', 'free_stu01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르일', '경기', '강남초등학교',   '초3', 'saussure1',     '01093010001', '01094010001', 0, 'active', NOW(), NOW()),
  ('u_free02', 'free_stu02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르이', '경기', '수원초등학교',   '초4', 'saussure2',     '01093010002', '01094010002', 0, 'active', NOW(), NOW()),
  ('u_free03', 'free_stu03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무소쉬르삼', '서울', '부산초등학교',   '초5', 'saussure3',     '01093010003', '01094010003', 0, 'active', NOW(), NOW()),
  ('u_free04', 'free_stu04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게일', '서울', '대구초등학교',   '초6', 'frege1',        '01093010004', '01094010004', 0, 'active', NOW(), NOW()),
  ('u_free05', 'free_stu05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게이', '서울', '인천중학교',     '중1', 'frege2',        '01093010005', '01094010005', 0, 'active', NOW(), NOW()),
  ('u_free06', 'free_stu06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무프레게삼', '서울', '광주중학교',     '중2', 'frege3',        '01093010006', '01094010006', 0, 'active', NOW(), NOW()),
  ('u_free07', 'free_stu07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀일',   '서울', '대전중학교',     '중3', 'russell1',      '01093010007', '01094010007', 0, 'active', NOW(), NOW()),
  ('u_free08', 'free_stu08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀이',   '서울', '울산고등학교',   '고1', 'russell2',      '01093010008', '01094010008', 0, 'active', NOW(), NOW()),
  ('u_free09', 'free_stu09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무러셀삼',   '부산', '세종고등학교',   '고2', 'russell3',      '01093010009', '01094010009', 0, 'active', NOW(), NOW()),
  ('u_free10', 'free_stu10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트일',   '부산', '청주고등학교',   '고3', 'wittgenstein1', '01093010010', '01094010010', 0, 'active', NOW(), NOW()),
  ('u_free11', 'free_stu11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트이',   '세종', '목포고등학교',   'N수', 'wittgenstein2', '01093010011', '01094010011', 0, 'active', NOW(), NOW()),
  ('u_free12', 'free_stu12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무비트삼',   '세종', '창원고등학교',   '대학', 'wittgenstein3', '01093010012', '01094010012', 0, 'active', NOW(), NOW());

INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at) VALUES
  ('om_free01', 'org_academy', 'u_free01', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free02', 'org_academy', 'u_free02', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free03', 'org_school',  'u_free03', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free04', 'org_school',  'u_free04', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free05', 'org_school',  'u_free05', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free06', 'org_public',  'u_free06', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free07', 'org_public',  'u_free07', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free08', 'org_public',  'u_free08', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free09', 'org_etc',     'u_free09', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free10', 'org_etc',     'u_free10', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free11', 'org_online',  'u_free11', 'STUDENT', 'active', NOW(), NOW()),
  ('om_free12', 'org_online',  'u_free12', 'STUDENT', 'active', NOW(), NOW());

-- 무료 학생은 구독 없음

-- ============================================================
-- 7. 부모 계정 24명 (학생 1명당 1명)
-- ============================================================
INSERT INTO users (id, email, password_hash, name, region, student_phone, diagnostic_opt_in, status, created_at, updated_at) VALUES
  ('u_par_p01', 'parent_paid01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모일',   '경기', '01092010001', 0, 'active', NOW(), NOW()),
  ('u_par_p02', 'parent_paid02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모이',   '경기', '01092010002', 0, 'active', NOW(), NOW()),
  ('u_par_p03', 'parent_paid03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모삼',   '서울', '01092010003', 0, 'active', NOW(), NOW()),
  ('u_par_p04', 'parent_paid04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모사',   '서울', '01092010004', 0, 'active', NOW(), NOW()),
  ('u_par_p05', 'parent_paid05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모오',   '서울', '01092010005', 0, 'active', NOW(), NOW()),
  ('u_par_p06', 'parent_paid06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모육',   '서울', '01092010006', 0, 'active', NOW(), NOW()),
  ('u_par_p07', 'parent_paid07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모칠',   '서울', '01092010007', 0, 'active', NOW(), NOW()),
  ('u_par_p08', 'parent_paid08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모팔',   '서울', '01092010008', 0, 'active', NOW(), NOW()),
  ('u_par_p09', 'parent_paid09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모구',   '부산', '01092010009', 0, 'active', NOW(), NOW()),
  ('u_par_p10', 'parent_paid10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십',   '부산', '01092010010', 0, 'active', NOW(), NOW()),
  ('u_par_p11', 'parent_paid11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십일', '세종', '01092010011', 0, 'active', NOW(), NOW()),
  ('u_par_p12', 'parent_paid12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '유부모십이', '세종', '01092010012', 0, 'active', NOW(), NOW()),
  ('u_par_f01', 'parent_free01', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모일',   '경기', '01094010001', 0, 'active', NOW(), NOW()),
  ('u_par_f02', 'parent_free02', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모이',   '경기', '01094010002', 0, 'active', NOW(), NOW()),
  ('u_par_f03', 'parent_free03', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모삼',   '서울', '01094010003', 0, 'active', NOW(), NOW()),
  ('u_par_f04', 'parent_free04', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모사',   '서울', '01094010004', 0, 'active', NOW(), NOW()),
  ('u_par_f05', 'parent_free05', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모오',   '서울', '01094010005', 0, 'active', NOW(), NOW()),
  ('u_par_f06', 'parent_free06', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모육',   '서울', '01094010006', 0, 'active', NOW(), NOW()),
  ('u_par_f07', 'parent_free07', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모칠',   '서울', '01094010007', 0, 'active', NOW(), NOW()),
  ('u_par_f08', 'parent_free08', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모팔',   '서울', '01094010008', 0, 'active', NOW(), NOW()),
  ('u_par_f09', 'parent_free09', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모구',   '부산', '01094010009', 0, 'active', NOW(), NOW()),
  ('u_par_f10', 'parent_free10', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십',   '부산', '01094010010', 0, 'active', NOW(), NOW()),
  ('u_par_f11', 'parent_free11', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십일', '세종', '01094010011', 0, 'active', NOW(), NOW()),
  ('u_par_f12', 'parent_free12', '$2a$10$pqHcGJCTiyqqM4EifWvD2.cjynlZX9GjmIrl9fp4GBg6e6shEYkoO', '무부모십이', '세종', '01094010012', 0, 'active', NOW(), NOW());

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

-- ============================================================
-- 8. 학생 경제 시스템 초기 데이터 (24학생)
-- 씨앗 5종: seed_wheat, seed_rice, seed_corn, seed_grape, seed_apple (각 10개)
-- 작물 5종: crop_wheat, crop_rice, crop_corn, crop_grape, crop_apple (각 5개)
-- 비료: 20개
-- ============================================================

-- 유료 학생 씨앗 (5종 x 12명 = 60행)
INSERT INTO user_seeds (id, user_id, seed_type, count, created_at, updated_at) VALUES
  ('us_p01_wheat', 'u_paid01', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p01_rice',  'u_paid01', 'seed_rice',  10, NOW(), NOW()),
  ('us_p01_corn',  'u_paid01', 'seed_corn',  10, NOW(), NOW()),
  ('us_p01_grape', 'u_paid01', 'seed_grape', 10, NOW(), NOW()),
  ('us_p01_apple', 'u_paid01', 'seed_apple', 10, NOW(), NOW()),
  ('us_p02_wheat', 'u_paid02', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p02_rice',  'u_paid02', 'seed_rice',  10, NOW(), NOW()),
  ('us_p02_corn',  'u_paid02', 'seed_corn',  10, NOW(), NOW()),
  ('us_p02_grape', 'u_paid02', 'seed_grape', 10, NOW(), NOW()),
  ('us_p02_apple', 'u_paid02', 'seed_apple', 10, NOW(), NOW()),
  ('us_p03_wheat', 'u_paid03', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p03_rice',  'u_paid03', 'seed_rice',  10, NOW(), NOW()),
  ('us_p03_corn',  'u_paid03', 'seed_corn',  10, NOW(), NOW()),
  ('us_p03_grape', 'u_paid03', 'seed_grape', 10, NOW(), NOW()),
  ('us_p03_apple', 'u_paid03', 'seed_apple', 10, NOW(), NOW()),
  ('us_p04_wheat', 'u_paid04', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p04_rice',  'u_paid04', 'seed_rice',  10, NOW(), NOW()),
  ('us_p04_corn',  'u_paid04', 'seed_corn',  10, NOW(), NOW()),
  ('us_p04_grape', 'u_paid04', 'seed_grape', 10, NOW(), NOW()),
  ('us_p04_apple', 'u_paid04', 'seed_apple', 10, NOW(), NOW()),
  ('us_p05_wheat', 'u_paid05', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p05_rice',  'u_paid05', 'seed_rice',  10, NOW(), NOW()),
  ('us_p05_corn',  'u_paid05', 'seed_corn',  10, NOW(), NOW()),
  ('us_p05_grape', 'u_paid05', 'seed_grape', 10, NOW(), NOW()),
  ('us_p05_apple', 'u_paid05', 'seed_apple', 10, NOW(), NOW()),
  ('us_p06_wheat', 'u_paid06', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p06_rice',  'u_paid06', 'seed_rice',  10, NOW(), NOW()),
  ('us_p06_corn',  'u_paid06', 'seed_corn',  10, NOW(), NOW()),
  ('us_p06_grape', 'u_paid06', 'seed_grape', 10, NOW(), NOW()),
  ('us_p06_apple', 'u_paid06', 'seed_apple', 10, NOW(), NOW()),
  ('us_p07_wheat', 'u_paid07', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p07_rice',  'u_paid07', 'seed_rice',  10, NOW(), NOW()),
  ('us_p07_corn',  'u_paid07', 'seed_corn',  10, NOW(), NOW()),
  ('us_p07_grape', 'u_paid07', 'seed_grape', 10, NOW(), NOW()),
  ('us_p07_apple', 'u_paid07', 'seed_apple', 10, NOW(), NOW()),
  ('us_p08_wheat', 'u_paid08', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p08_rice',  'u_paid08', 'seed_rice',  10, NOW(), NOW()),
  ('us_p08_corn',  'u_paid08', 'seed_corn',  10, NOW(), NOW()),
  ('us_p08_grape', 'u_paid08', 'seed_grape', 10, NOW(), NOW()),
  ('us_p08_apple', 'u_paid08', 'seed_apple', 10, NOW(), NOW()),
  ('us_p09_wheat', 'u_paid09', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p09_rice',  'u_paid09', 'seed_rice',  10, NOW(), NOW()),
  ('us_p09_corn',  'u_paid09', 'seed_corn',  10, NOW(), NOW()),
  ('us_p09_grape', 'u_paid09', 'seed_grape', 10, NOW(), NOW()),
  ('us_p09_apple', 'u_paid09', 'seed_apple', 10, NOW(), NOW()),
  ('us_p10_wheat', 'u_paid10', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p10_rice',  'u_paid10', 'seed_rice',  10, NOW(), NOW()),
  ('us_p10_corn',  'u_paid10', 'seed_corn',  10, NOW(), NOW()),
  ('us_p10_grape', 'u_paid10', 'seed_grape', 10, NOW(), NOW()),
  ('us_p10_apple', 'u_paid10', 'seed_apple', 10, NOW(), NOW()),
  ('us_p11_wheat', 'u_paid11', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p11_rice',  'u_paid11', 'seed_rice',  10, NOW(), NOW()),
  ('us_p11_corn',  'u_paid11', 'seed_corn',  10, NOW(), NOW()),
  ('us_p11_grape', 'u_paid11', 'seed_grape', 10, NOW(), NOW()),
  ('us_p11_apple', 'u_paid11', 'seed_apple', 10, NOW(), NOW()),
  ('us_p12_wheat', 'u_paid12', 'seed_wheat', 10, NOW(), NOW()),
  ('us_p12_rice',  'u_paid12', 'seed_rice',  10, NOW(), NOW()),
  ('us_p12_corn',  'u_paid12', 'seed_corn',  10, NOW(), NOW()),
  ('us_p12_grape', 'u_paid12', 'seed_grape', 10, NOW(), NOW()),
  ('us_p12_apple', 'u_paid12', 'seed_apple', 10, NOW(), NOW());

-- 무료 학생 씨앗 (5종 x 12명 = 60행)
INSERT INTO user_seeds (id, user_id, seed_type, count, created_at, updated_at) VALUES
  ('us_f01_wheat', 'u_free01', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f01_rice',  'u_free01', 'seed_rice',  10, NOW(), NOW()),
  ('us_f01_corn',  'u_free01', 'seed_corn',  10, NOW(), NOW()),
  ('us_f01_grape', 'u_free01', 'seed_grape', 10, NOW(), NOW()),
  ('us_f01_apple', 'u_free01', 'seed_apple', 10, NOW(), NOW()),
  ('us_f02_wheat', 'u_free02', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f02_rice',  'u_free02', 'seed_rice',  10, NOW(), NOW()),
  ('us_f02_corn',  'u_free02', 'seed_corn',  10, NOW(), NOW()),
  ('us_f02_grape', 'u_free02', 'seed_grape', 10, NOW(), NOW()),
  ('us_f02_apple', 'u_free02', 'seed_apple', 10, NOW(), NOW()),
  ('us_f03_wheat', 'u_free03', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f03_rice',  'u_free03', 'seed_rice',  10, NOW(), NOW()),
  ('us_f03_corn',  'u_free03', 'seed_corn',  10, NOW(), NOW()),
  ('us_f03_grape', 'u_free03', 'seed_grape', 10, NOW(), NOW()),
  ('us_f03_apple', 'u_free03', 'seed_apple', 10, NOW(), NOW()),
  ('us_f04_wheat', 'u_free04', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f04_rice',  'u_free04', 'seed_rice',  10, NOW(), NOW()),
  ('us_f04_corn',  'u_free04', 'seed_corn',  10, NOW(), NOW()),
  ('us_f04_grape', 'u_free04', 'seed_grape', 10, NOW(), NOW()),
  ('us_f04_apple', 'u_free04', 'seed_apple', 10, NOW(), NOW()),
  ('us_f05_wheat', 'u_free05', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f05_rice',  'u_free05', 'seed_rice',  10, NOW(), NOW()),
  ('us_f05_corn',  'u_free05', 'seed_corn',  10, NOW(), NOW()),
  ('us_f05_grape', 'u_free05', 'seed_grape', 10, NOW(), NOW()),
  ('us_f05_apple', 'u_free05', 'seed_apple', 10, NOW(), NOW()),
  ('us_f06_wheat', 'u_free06', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f06_rice',  'u_free06', 'seed_rice',  10, NOW(), NOW()),
  ('us_f06_corn',  'u_free06', 'seed_corn',  10, NOW(), NOW()),
  ('us_f06_grape', 'u_free06', 'seed_grape', 10, NOW(), NOW()),
  ('us_f06_apple', 'u_free06', 'seed_apple', 10, NOW(), NOW()),
  ('us_f07_wheat', 'u_free07', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f07_rice',  'u_free07', 'seed_rice',  10, NOW(), NOW()),
  ('us_f07_corn',  'u_free07', 'seed_corn',  10, NOW(), NOW()),
  ('us_f07_grape', 'u_free07', 'seed_grape', 10, NOW(), NOW()),
  ('us_f07_apple', 'u_free07', 'seed_apple', 10, NOW(), NOW()),
  ('us_f08_wheat', 'u_free08', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f08_rice',  'u_free08', 'seed_rice',  10, NOW(), NOW()),
  ('us_f08_corn',  'u_free08', 'seed_corn',  10, NOW(), NOW()),
  ('us_f08_grape', 'u_free08', 'seed_grape', 10, NOW(), NOW()),
  ('us_f08_apple', 'u_free08', 'seed_apple', 10, NOW(), NOW()),
  ('us_f09_wheat', 'u_free09', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f09_rice',  'u_free09', 'seed_rice',  10, NOW(), NOW()),
  ('us_f09_corn',  'u_free09', 'seed_corn',  10, NOW(), NOW()),
  ('us_f09_grape', 'u_free09', 'seed_grape', 10, NOW(), NOW()),
  ('us_f09_apple', 'u_free09', 'seed_apple', 10, NOW(), NOW()),
  ('us_f10_wheat', 'u_free10', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f10_rice',  'u_free10', 'seed_rice',  10, NOW(), NOW()),
  ('us_f10_corn',  'u_free10', 'seed_corn',  10, NOW(), NOW()),
  ('us_f10_grape', 'u_free10', 'seed_grape', 10, NOW(), NOW()),
  ('us_f10_apple', 'u_free10', 'seed_apple', 10, NOW(), NOW()),
  ('us_f11_wheat', 'u_free11', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f11_rice',  'u_free11', 'seed_rice',  10, NOW(), NOW()),
  ('us_f11_corn',  'u_free11', 'seed_corn',  10, NOW(), NOW()),
  ('us_f11_grape', 'u_free11', 'seed_grape', 10, NOW(), NOW()),
  ('us_f11_apple', 'u_free11', 'seed_apple', 10, NOW(), NOW()),
  ('us_f12_wheat', 'u_free12', 'seed_wheat', 10, NOW(), NOW()),
  ('us_f12_rice',  'u_free12', 'seed_rice',  10, NOW(), NOW()),
  ('us_f12_corn',  'u_free12', 'seed_corn',  10, NOW(), NOW()),
  ('us_f12_grape', 'u_free12', 'seed_grape', 10, NOW(), NOW()),
  ('us_f12_apple', 'u_free12', 'seed_apple', 10, NOW(), NOW());

-- 유료 학생 작물 (5종 x 12명 = 60행)
INSERT INTO user_crops (id, user_id, crop_type, count, created_at, updated_at) VALUES
  ('uc_p01_wheat', 'u_paid01', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p01_rice',  'u_paid01', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p01_corn',  'u_paid01', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p01_grape', 'u_paid01', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p01_apple', 'u_paid01', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p02_wheat', 'u_paid02', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p02_rice',  'u_paid02', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p02_corn',  'u_paid02', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p02_grape', 'u_paid02', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p02_apple', 'u_paid02', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p03_wheat', 'u_paid03', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p03_rice',  'u_paid03', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p03_corn',  'u_paid03', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p03_grape', 'u_paid03', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p03_apple', 'u_paid03', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p04_wheat', 'u_paid04', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p04_rice',  'u_paid04', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p04_corn',  'u_paid04', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p04_grape', 'u_paid04', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p04_apple', 'u_paid04', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p05_wheat', 'u_paid05', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p05_rice',  'u_paid05', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p05_corn',  'u_paid05', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p05_grape', 'u_paid05', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p05_apple', 'u_paid05', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p06_wheat', 'u_paid06', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p06_rice',  'u_paid06', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p06_corn',  'u_paid06', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p06_grape', 'u_paid06', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p06_apple', 'u_paid06', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p07_wheat', 'u_paid07', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p07_rice',  'u_paid07', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p07_corn',  'u_paid07', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p07_grape', 'u_paid07', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p07_apple', 'u_paid07', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p08_wheat', 'u_paid08', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p08_rice',  'u_paid08', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p08_corn',  'u_paid08', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p08_grape', 'u_paid08', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p08_apple', 'u_paid08', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p09_wheat', 'u_paid09', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p09_rice',  'u_paid09', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p09_corn',  'u_paid09', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p09_grape', 'u_paid09', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p09_apple', 'u_paid09', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p10_wheat', 'u_paid10', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p10_rice',  'u_paid10', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p10_corn',  'u_paid10', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p10_grape', 'u_paid10', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p10_apple', 'u_paid10', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p11_wheat', 'u_paid11', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p11_rice',  'u_paid11', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p11_corn',  'u_paid11', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p11_grape', 'u_paid11', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p11_apple', 'u_paid11', 'crop_apple', 5, NOW(), NOW()),
  ('uc_p12_wheat', 'u_paid12', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_p12_rice',  'u_paid12', 'crop_rice',  5, NOW(), NOW()),
  ('uc_p12_corn',  'u_paid12', 'crop_corn',  5, NOW(), NOW()),
  ('uc_p12_grape', 'u_paid12', 'crop_grape', 5, NOW(), NOW()),
  ('uc_p12_apple', 'u_paid12', 'crop_apple', 5, NOW(), NOW());

-- 무료 학생 작물 (5종 x 12명 = 60행)
INSERT INTO user_crops (id, user_id, crop_type, count, created_at, updated_at) VALUES
  ('uc_f01_wheat', 'u_free01', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f01_rice',  'u_free01', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f01_corn',  'u_free01', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f01_grape', 'u_free01', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f01_apple', 'u_free01', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f02_wheat', 'u_free02', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f02_rice',  'u_free02', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f02_corn',  'u_free02', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f02_grape', 'u_free02', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f02_apple', 'u_free02', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f03_wheat', 'u_free03', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f03_rice',  'u_free03', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f03_corn',  'u_free03', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f03_grape', 'u_free03', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f03_apple', 'u_free03', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f04_wheat', 'u_free04', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f04_rice',  'u_free04', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f04_corn',  'u_free04', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f04_grape', 'u_free04', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f04_apple', 'u_free04', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f05_wheat', 'u_free05', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f05_rice',  'u_free05', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f05_corn',  'u_free05', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f05_grape', 'u_free05', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f05_apple', 'u_free05', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f06_wheat', 'u_free06', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f06_rice',  'u_free06', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f06_corn',  'u_free06', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f06_grape', 'u_free06', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f06_apple', 'u_free06', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f07_wheat', 'u_free07', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f07_rice',  'u_free07', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f07_corn',  'u_free07', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f07_grape', 'u_free07', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f07_apple', 'u_free07', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f08_wheat', 'u_free08', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f08_rice',  'u_free08', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f08_corn',  'u_free08', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f08_grape', 'u_free08', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f08_apple', 'u_free08', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f09_wheat', 'u_free09', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f09_rice',  'u_free09', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f09_corn',  'u_free09', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f09_grape', 'u_free09', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f09_apple', 'u_free09', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f10_wheat', 'u_free10', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f10_rice',  'u_free10', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f10_corn',  'u_free10', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f10_grape', 'u_free10', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f10_apple', 'u_free10', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f11_wheat', 'u_free11', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f11_rice',  'u_free11', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f11_corn',  'u_free11', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f11_grape', 'u_free11', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f11_apple', 'u_free11', 'crop_apple', 5, NOW(), NOW()),
  ('uc_f12_wheat', 'u_free12', 'crop_wheat', 5, NOW(), NOW()),
  ('uc_f12_rice',  'u_free12', 'crop_rice',  5, NOW(), NOW()),
  ('uc_f12_corn',  'u_free12', 'crop_corn',  5, NOW(), NOW()),
  ('uc_f12_grape', 'u_free12', 'crop_grape', 5, NOW(), NOW()),
  ('uc_f12_apple', 'u_free12', 'crop_apple', 5, NOW(), NOW());

-- 유료 학생 비료 (12명)
INSERT INTO user_fertilizer (id, user_id, count, created_at, updated_at) VALUES
  ('uf_paid01', 'u_paid01', 20, NOW(), NOW()),
  ('uf_paid02', 'u_paid02', 20, NOW(), NOW()),
  ('uf_paid03', 'u_paid03', 20, NOW(), NOW()),
  ('uf_paid04', 'u_paid04', 20, NOW(), NOW()),
  ('uf_paid05', 'u_paid05', 20, NOW(), NOW()),
  ('uf_paid06', 'u_paid06', 20, NOW(), NOW()),
  ('uf_paid07', 'u_paid07', 20, NOW(), NOW()),
  ('uf_paid08', 'u_paid08', 20, NOW(), NOW()),
  ('uf_paid09', 'u_paid09', 20, NOW(), NOW()),
  ('uf_paid10', 'u_paid10', 20, NOW(), NOW()),
  ('uf_paid11', 'u_paid11', 20, NOW(), NOW()),
  ('uf_paid12', 'u_paid12', 20, NOW(), NOW());

-- 무료 학생 비료 (12명)
INSERT INTO user_fertilizer (id, user_id, count, created_at, updated_at) VALUES
  ('uf_free01', 'u_free01', 20, NOW(), NOW()),
  ('uf_free02', 'u_free02', 20, NOW(), NOW()),
  ('uf_free03', 'u_free03', 20, NOW(), NOW()),
  ('uf_free04', 'u_free04', 20, NOW(), NOW()),
  ('uf_free05', 'u_free05', 20, NOW(), NOW()),
  ('uf_free06', 'u_free06', 20, NOW(), NOW()),
  ('uf_free07', 'u_free07', 20, NOW(), NOW()),
  ('uf_free08', 'u_free08', 20, NOW(), NOW()),
  ('uf_free09', 'u_free09', 20, NOW(), NOW()),
  ('uf_free10', 'u_free10', 20, NOW(), NOW()),
  ('uf_free11', 'u_free11', 20, NOW(), NOW()),
  ('uf_free12', 'u_free12', 20, NOW(), NOW());

-- ============================================================
-- 완료: 총 59명 계정 생성
-- 본사 관리자: 1명 (hqadmin)
-- 기관 관리자: 10명 (academy_admin1/2, school_admin1/2, public_admin1/2, etc_admin1/2, online_admin1/2)
-- 유료 학생: 12명 (paid_stu01~12)
-- 무료 학생: 12명 (free_stu01~12)
-- 부모: 24명 (parent_paid01~12, parent_free01~12)
-- ============================================================
