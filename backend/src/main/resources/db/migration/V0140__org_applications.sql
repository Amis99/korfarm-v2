-- 학원·학교 셀프 서비스 도입 신청 — 공개 폼 → 본사 검토·승인 큐.
-- 승인 시 orgs + ORG_ADMIN 자동 생성 흐름.

CREATE TABLE org_applications (
    id                          VARCHAR(64)  NOT NULL PRIMARY KEY,
    org_name                    VARCHAR(200) NOT NULL,
    org_type                    VARCHAR(32)  NULL COMMENT '학원/학교/공공기관/기타',
    address_region              VARCHAR(64)  NULL,
    address_detail              VARCHAR(255) NULL,
    business_number             VARCHAR(20)  NULL,
    representative_name         VARCHAR(64)  NULL,
    contact_phone               VARCHAR(20)  NOT NULL,
    contact_email               VARCHAR(128) NOT NULL,
    tax_email                   VARCHAR(128) NULL,
    estimated_students          INT          NULL,
    applicant_login_id          VARCHAR(64)  NULL COMMENT '희망 ORG_ADMIN 아이디',
    applicant_name              VARCHAR(64)  NULL,
    message                     TEXT         NULL,
    business_license_file_id    VARCHAR(64)  NULL,
    status                      VARCHAR(32)  NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected',
    org_id                      VARCHAR(64)  NULL COMMENT '승인 시 생성된 orgs.id',
    admin_user_id               VARCHAR(64)  NULL COMMENT '승인 시 생성된 ORG_ADMIN user.id',
    admin_temporary_password    VARCHAR(64)  NULL COMMENT '승인 직후 한 번만 본사 화면에 표시',
    reviewed_by                 VARCHAR(64)  NULL,
    reviewed_at                 DATETIME     NULL,
    rejection_reason            TEXT         NULL,
    created_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_org_apps_status (status),
    KEY idx_org_apps_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
