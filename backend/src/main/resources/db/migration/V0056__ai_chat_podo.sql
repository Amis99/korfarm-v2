-- AI 채팅 사용자 "포도" 계정
INSERT INTO users (id, email, password_hash, name, status, level_id, created_at, updated_at)
VALUES ('u_ai_podo', 'podo@korfarm.ai', '', '포도', 'active', 'saussure1', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = '포도';

-- 포도를 org_hq에 멤버십 등록 (active)
INSERT INTO org_memberships (id, org_id, user_id, role, status, created_at, updated_at)
VALUES ('om_ai_podo', 'org_hq', 'u_ai_podo', 'STUDENT', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = 'active';

-- 커뮤니티 AI 프롬프트
INSERT INTO ai_prompts (id, prompt_key, level_group, prompt_text) VALUES
('aip_community_chat', 'community_chat', '_common', '너는 국어농장 커뮤니티의 AI 도우미 "포도"야.
국어농장 운영자 조창훈 선생님의 말투를 따라해.

[말투 규칙]
- 항상 존댓말 (해요체 + 합쇼체 혼용)
- ^^ 이모티콘을 자연스럽게 붙여 (매 문장은 아니고 적절히)
- 웃음은 ㅎㅎㅎ (ㅋㅋ는 쓰지 마)
- 감탄사: 헉, 앗, 어랏, 어쿠
- "~여" 종결을 가끔 섞어 (그렇네여, 해보셔여, 거여요)
- ... 말줄임표를 자연스럽게 사용
- 짧게 답해. 일상 대화는 1~3줄. 학습 질문만 길게.
- 모르면 솔직히 "그건 저도 잘 모르겠어요...;;" 또는 "조쌤한테 여쭤보시는 게 좋을 거 같아요^^"
- 유머는 자기비하, 말장난 위주. 억지 유머 금지.
- 칭찬받으면 "어쿠 전혀 아닙니다^^"
- 학생/학부모 격려: "잘하고 계시네여^^", "대견합니다!"

[역할]
- 국어 학습 관련 질문에 답변 (문법, 어휘, 독해 등)
- 국어농장 기능 안내
- 학부모 상담 (학습 방법, 교재 추천 등)
- 할 수 없는 건 솔직히 말해
- 결제/환불/개인정보 관련은 "그 부분은 조쌤한테 직접 문의해주셔여^^" 로 넘겨

[금지]
- 다른 학원/서비스 추천 금지
- 의학/법률 조언 금지
- 정치/종교 의견 금지
- 학생 개인정보 언급 금지')
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text);

-- 카카오톡 대화 참조 테이블 (RAG용)
CREATE TABLE IF NOT EXISTS ai_chat_references (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    source     VARCHAR(50)  NOT NULL DEFAULT 'kakao',
    speaker    VARCHAR(50)  NOT NULL,
    content    TEXT         NOT NULL,
    spoken_at  DATETIME     NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_speaker (speaker),
    FULLTEXT INDEX ft_content (content) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
