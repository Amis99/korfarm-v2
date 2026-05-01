-- 폐기: board_community 게시판 행 제거.
-- "커뮤니티" 메뉴는 게시판이 아니라 채팅방(CommunityChatPage)으로 라우팅되며,
-- DB 의 board_community 는 사용되지 않는 잔재였음. V0002 seed 가 만들었던 행도 같이 정리.
-- 게시글이 있다면 보존을 위해 NOT EXISTS 조건으로 안전 가드.

DELETE FROM boards
WHERE id = 'board_community'
  AND NOT EXISTS (
    SELECT 1 FROM posts WHERE board_id = 'board_community' AND status != 'deleted'
  );

-- 같은 type 의 다른 잔재도 정리 (board_id 가 board_community 가 아닌 경우 대비).
DELETE FROM boards
WHERE board_type = 'community'
  AND NOT EXISTS (
    SELECT 1 FROM posts WHERE posts.board_id = boards.id AND status != 'deleted'
  );
