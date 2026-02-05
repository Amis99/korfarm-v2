-- 회원가입 승인 시스템용 컬럼 추가
ALTER TABLE org_memberships
  ADD COLUMN requested_at DATETIME,
  ADD COLUMN approved_at DATETIME,
  ADD COLUMN approved_by VARCHAR(64),
  ADD COLUMN rejection_reason VARCHAR(255),
  ADD COLUMN linked_student_name VARCHAR(120),
  ADD COLUMN linked_student_phone VARCHAR(32),
  ADD COLUMN linked_parent_phone VARCHAR(32);

-- 기존 active 멤버십에 requested_at을 created_at으로 설정
UPDATE org_memberships SET requested_at = created_at WHERE status = 'active' AND requested_at IS NULL;
