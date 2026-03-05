-- 진단 테스트 v2 스키마: 지문, 문항, 세션, 응답

-- 지문 테이블 (26개)
CREATE TABLE diag_passages (
    id          VARCHAR(64) NOT NULL PRIMARY KEY,
    tier        VARCHAR(32) NOT NULL COMMENT 'sohssure/frege/russell/wittgenstein',
    level       INT         NOT NULL COMMENT '난이도 1~12',
    genre       VARCHAR(16) NOT NULL COMMENT '문학/비문학',
    text_md     MEDIUMTEXT  NOT NULL COMMENT '마크다운 본문',
    created_at  DATETIME    NOT NULL DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문항 테이블 (260개)
CREATE TABLE diag_questions (
    id                      VARCHAR(64) NOT NULL PRIMARY KEY,
    passage_id              VARCHAR(64) NOT NULL,
    tier                    VARCHAR(32) NOT NULL COMMENT '필터링용',
    question_type           VARCHAR(32) NOT NULL COMMENT '지문근거형/외부지식형/논리추론형/어휘단독형/서술형',
    stem                    TEXT        NOT NULL COMMENT '발문',
    box_content             TEXT        NULL     COMMENT '보기(box)',
    correct_choice          VARCHAR(1)  NULL     COMMENT 'A~E (서술형은 NULL)',
    choices_json            JSON        NOT NULL COMMENT '[{choice_id, text, vector, error_path}]',
    model_answer            TEXT        NULL     COMMENT '서술형 모범답안',
    grading_criteria_json   JSON        NULL     COMMENT '서술형 채점기준',
    pair_id                 VARCHAR(64) NULL     COMMENT '문항 쌍 ID',
    order_in_passage        INT         NOT NULL COMMENT '지문 내 순서 (1~10)',
    created_at              DATETIME    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_diag_q_passage FOREIGN KEY (passage_id) REFERENCES diag_passages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_diag_questions_passage ON diag_questions(passage_id);
CREATE INDEX idx_diag_questions_tier    ON diag_questions(tier);

-- 진단 세션 테이블
CREATE TABLE diag_sessions (
    id                   VARCHAR(64)   NOT NULL PRIMARY KEY,
    user_id              VARCHAR(64)   NOT NULL,
    tier                 VARCHAR(32)   NOT NULL,
    mode                 VARCHAR(16)   NOT NULL COMMENT 'full/cat',
    status               VARCHAR(16)   NOT NULL DEFAULT 'active' COMMENT 'active/completed/abandoned',
    scores_json          JSON          NULL     COMMENT '{역량명: 점수} 실시간 갱신',
    touch_counts_json    JSON          NULL     COMMENT '{역량명: 측정횟수}',
    answered_count       INT           NOT NULL DEFAULT 0,
    correct_count        INT           NOT NULL DEFAULT 0,
    raw_tci              DECIMAL(5,2)  NULL,
    adjusted_tci         DECIMAL(5,2)  NULL,
    confidence           DECIMAL(3,2)  NULL,
    recommended_level    VARCHAR(64)   NULL     COMMENT '프레게 2 등',
    error_analysis_json  JSON          NULL     COMMENT '역량별 오류경로 기여도',
    started_at           DATETIME      NOT NULL DEFAULT NOW(),
    completed_at         DATETIME      NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_diag_sessions_user   ON diag_sessions(user_id);
CREATE INDEX idx_diag_sessions_status ON diag_sessions(status);

-- 개별 응답 테이블
CREATE TABLE diag_responses (
    id               VARCHAR(64) NOT NULL PRIMARY KEY,
    session_id       VARCHAR(64) NOT NULL,
    question_id      VARCHAR(64) NOT NULL,
    selected_choice  VARCHAR(1)  NULL     COMMENT 'A~E',
    is_correct       BOOLEAN     NOT NULL DEFAULT FALSE,
    response_order   INT         NOT NULL COMMENT '응답 순서',
    batch_number     INT         NULL     COMMENT 'CAT 배치 번호',
    responded_at     DATETIME    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_diag_resp_session  FOREIGN KEY (session_id)  REFERENCES diag_sessions(id),
    CONSTRAINT fk_diag_resp_question FOREIGN KEY (question_id) REFERENCES diag_questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_diag_responses_session ON diag_responses(session_id);
