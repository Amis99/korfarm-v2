-- 쇼핑몰 상품 — 이미지/카테고리/설명 등 확장 컬럼
-- 학생 ShopPage 가 정적 카탈로그(shopCatalog.js) 대신 DB 응답을 사용하도록
-- 모든 표시 필드를 DB 에 보존.

ALTER TABLE products
  ADD COLUMN category VARCHAR(64) NULL DEFAULT 'textbook' AFTER status,
  ADD COLUMN level_label VARCHAR(64) NULL AFTER category,
  ADD COLUMN summary VARCHAR(500) NULL AFTER level_label,
  ADD COLUMN image_url VARCHAR(1000) NULL AFTER summary,
  ADD COLUMN detail_images_json TEXT NULL AFTER image_url,
  ADD COLUMN tags_json TEXT NULL AFTER detail_images_json,
  ADD COLUMN details_json TEXT NULL AFTER tags_json,
  ADD COLUMN badge VARCHAR(32) NULL AFTER details_json,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER badge;

-- 기존 6개 상품에 카테고리·요약·이미지 backfill (V0127 시드 보강)
UPDATE products SET
  category = 'textbook',
  level_label = '초1~3',
  summary = '기초 어휘·문장 감각을 만드는 입문 세트',
  image_url = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('어휘','기초','세트'),
  details_json = JSON_ARRAY('워크북 3권 + 지도서 1권','주간 진도표 포함','학급 운영용 체크리스트 제공'),
  badge = '인기'
WHERE id = 'book_saussure_bundle';

UPDATE products SET
  category = 'textbook', level_label = '초4~6',
  summary = '문법 개념과 적용 문제를 단계별로 학습',
  image_url = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('문법','초등','단계'),
  details_json = JSON_ARRAY('개념 요약 + 대표 유형 150문항','수업용 PPT 템플릿 제공','학습 체크 스티커 포함'),
  badge = '신규'
WHERE id = 'book_frege_grammar';

UPDATE products SET
  category = 'textbook', level_label = '중1~3',
  summary = '지문 구조 분석과 추론 학습 강화',
  image_url = 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('독해','추론','중등'),
  details_json = JSON_ARRAY('전략 카드 12종 포함','주간 테스트지 제공','교사용 해설서 제공'),
  badge = '추천'
WHERE id = 'book_russell_reading';

UPDATE products SET
  category = 'textbook', level_label = '고1~3',
  summary = '수능형 문항으로 실전 감각을 강화',
  image_url = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('모의고사','수능','고등'),
  details_json = JSON_ARRAY('모의고사 5회분','OMR 샘플 포함','오답 노트 템플릿 제공'),
  badge = '실전'
WHERE id = 'book_wittgenstein_mock';

UPDATE products SET
  category = 'tool', level_label = '초3~중1',
  summary = '지문 분석을 놀이형 활동으로 확장',
  image_url = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('게임','활동','수업'),
  details_json = JSON_ARRAY('전략 카드 48장 구성','소그룹 활동 가이드 포함','교실 보관 박스 제공'),
  badge = '교구'
WHERE id = 'tool_reading_board';

UPDATE products SET
  category = 'tool', level_label = '전 학년',
  summary = '종이 시험 후 답안 입력을 간편하게',
  image_url = 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?q=80&w=1200&auto=format&fit=crop',
  tags_json = JSON_ARRAY('OMR','평가','관리'),
  details_json = JSON_ARRAY('답안지 샘플 30매 포함','학급별 관리 스티커','채점용 체크 시트 제공'),
  badge = '필수'
WHERE id = 'tool_omr_kit';
