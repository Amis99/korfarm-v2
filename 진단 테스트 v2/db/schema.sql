CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    test_key TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    mode TEXT DEFAULT 'full',
    raw_tci REAL,
    confidence REAL,
    adjusted_tci REAL,
    recommended_level TEXT,
    next_step_code TEXT
);

CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES test_sessions(id),
    question_id TEXT NOT NULL,
    choice_id TEXT,
    criteria_ids TEXT,
    is_correct INTEGER,
    response_time_sec REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competency_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES test_sessions(id),
    competency TEXT NOT NULL,
    score REAL NOT NULL,
    confidence REAL DEFAULT 1.0
);
