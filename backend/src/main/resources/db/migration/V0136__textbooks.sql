-- 교재 생성기 (Textbook Builder) — 골격 테이블
-- 시험지(test_papers) 와 같은 org_id 가시성 정책을 따른다.
--   org_id = 'org_hq' → 본사 교재 (HQ_ADMIN 전용, 기관 관리자 리스트에 미표시)
--   그 외 orgId       → 기관 교재 (해당 기관 멤버만)

CREATE TABLE textbooks (
    id                   VARCHAR(64)  NOT NULL PRIMARY KEY,
    org_id               VARCHAR(64)  NOT NULL DEFAULT 'org_hq',
    title                VARCHAR(255) NOT NULL,
    series               VARCHAR(32)  NULL,
    level                INT          NULL,
    volume               INT          NULL,
    payload_json         LONGTEXT     NOT NULL,
    source_json          LONGTEXT     NULL,
    student_pdf_file_id  VARCHAR(64)  NULL,
    answer_pdf_file_id   VARCHAR(64)  NULL,
    status               VARCHAR(32)  NOT NULL DEFAULT 'draft',
    created_by           VARCHAR(64)  NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_textbooks_org (org_id),
    KEY idx_textbooks_status (status),
    KEY idx_textbooks_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
