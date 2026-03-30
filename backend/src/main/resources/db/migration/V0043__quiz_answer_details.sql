CREATE TABLE quiz_answer_details (
    id            VARCHAR(64) NOT NULL PRIMARY KEY,
    log_id        VARCHAR(64) NOT NULL,
    user_id       VARCHAR(64) NOT NULL,
    question_id   VARCHAR(128) NOT NULL,
    question_kind VARCHAR(48) NULL,
    correct       TINYINT(1) NOT NULL DEFAULT 0,
    answered_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_qad_user_kind (user_id, question_kind, correct),
    INDEX idx_qad_log (log_id),
    INDEX idx_qad_user_date (user_id, answered_at),
    CONSTRAINT fk_qad_log FOREIGN KEY (log_id) REFERENCES farm_learning_logs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
