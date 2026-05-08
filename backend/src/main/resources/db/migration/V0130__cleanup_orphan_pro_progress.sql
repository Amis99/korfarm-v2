-- V0130: 잔존(고아) pro_progress 정리
--
-- 배경:
--   프로 모드 챕터의 학습 아이템이 삭제·교체된 후에도 pro_progress 의 옛
--   item_id 에 대한 completed=true row 가 남아있어 진행률이 100% 를 초과해
--   표시되는 사고가 발생 (학생명 아미스 — pch_saussure_1_01 챕터 137.5%).
--
-- 처리:
--   pro_chapter_items 에 더 이상 존재하지 않는 item_id 의 progress row 를 삭제.
--   2026-05-09 점검 결과 14건 발견.
--
-- 안전성:
--   - 외래키 제약 없음 (직접 LEFT JOIN 으로 안전 식별)
--   - 다른 테이블에서 pro_progress.id 를 참조하지 않음
--   - 동일 (user_id, item_id) UNIQUE 제약은 유지됨
DELETE pp FROM pro_progress pp
LEFT JOIN pro_chapter_items pci ON pp.item_id = pci.id
WHERE pci.id IS NULL;
