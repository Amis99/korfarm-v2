-- 학생용 AI 튜터 캐릭터 페르소나 선택
-- 학생이 가입 후 첫 진입 시 부엉이샘 / 아미스샘 / 누룽지샘 중 1명 선택
-- 마이페이지에서 언제든 변경 가능
-- NULL = 미선택 (강제 선택 화면으로 라우팅)

ALTER TABLE users
  ADD COLUMN preferred_tutor_persona VARCHAR(16) NULL
  COMMENT '학생 AI 튜터 캐릭터: owl(부엉이샘) / amis(아미스샘) / nurungji(누룽지샘). NULL = 미선택';
