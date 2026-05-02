-- 시험지 시각 레이아웃 (디자인 에디터 산출물)
-- layout_json: 시험지 / answer_layout_json: 정답·해설
-- 둘 다 nullable. 비어 있으면 어드민이 [디자인] 버튼 클릭해 자동 채우기 후 편집.

ALTER TABLE test_papers
  ADD COLUMN layout_json LONGTEXT NULL AFTER payload_json,
  ADD COLUMN answer_layout_json LONGTEXT NULL AFTER layout_json;
