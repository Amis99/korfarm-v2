-- 기관(orgs) 사업자 정보 컬럼 — 결제·세금계산서 발행에 필요한 기본 정보.
-- 모두 nullable: 기존 row 호환. 신규 등록 시에는 본사 어드민 UI 에서 함께 입력.

ALTER TABLE orgs
    ADD COLUMN business_number      VARCHAR(20)  NULL COMMENT '사업자등록번호 (000-00-00000)',
    ADD COLUMN representative_name  VARCHAR(64)  NULL COMMENT '대표자명',
    ADD COLUMN contact_phone        VARCHAR(20)  NULL COMMENT '기관 연락처',
    ADD COLUMN contact_email        VARCHAR(128) NULL COMMENT '대표 이메일',
    ADD COLUMN tax_email            VARCHAR(128) NULL COMMENT '세금계산서 수신 이메일';
