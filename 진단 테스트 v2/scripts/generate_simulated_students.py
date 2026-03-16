#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate 200 simulated students across 5 reader archetypes.

Used by both clustering analysis (Idea 6) and IRT calibration (Idea 7).
Outputs: output/simulated_students.json + SQLite DB insertion.
"""

import json
import os
import random
import sqlite3
import sys
from glob import glob
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from core import (
    COMPETENCIES, load_config, get_test_dirs, get_level_multiplier,
    normalize_key, apply_vector, clamp_scores,
    calculate_confidence, apply_confidence_to_tci, calculate_recommendation,
    get_test_label, PROJECT_ROOT,
)

DB_PATH = os.path.join(PROJECT_ROOT, 'db', 'diagnostic.db')
SCHEMA_PATH = os.path.join(PROJECT_ROOT, 'db', 'schema.sql')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'output', 'simulated_students.json')

# --- Reader archetypes ---

ARCHETYPES = [
    {
        "name": "감각적 독자",
        "accuracy_range": (0.40, 0.55),
        "error_bias": {
            "과도한 일반화": 3.0,
            "핵심 정보 혼동": 2.5,
            "범위 확장 오류": 2.0,
            "세부 정보 오독": 1.5,
        },
        "weak_competencies": ["구조 독해력", "논리 사고력"],
    },
    {
        "name": "성급한 독자",
        "accuracy_range": (0.45, 0.60),
        "error_bias": {
            "논리 비약": 3.0,
            "인과 관계 왜곡": 2.5,
            "세부 정보 오독": 2.0,
            "전제 누락": 1.5,
        },
        "weak_competencies": ["문장 독해력", "논리 사고력"],
    },
    {
        "name": "어휘 부족 독자",
        "accuracy_range": (0.35, 0.50),
        "error_bias": {
            "어휘 의미 혼동": 3.0,
            "문맥 부적합": 2.5,
            "유의어 오해": 2.0,
            "어휘 범주 혼동": 1.5,
        },
        "weak_competencies": ["어휘력", "어법·문법 능력"],
    },
    {
        "name": "전략 부족 독자",
        "accuracy_range": (0.50, 0.65),
        "error_bias": {},  # Random errors, no pattern
        "weak_competencies": ["문제 분석 및 전략 수립 능력", "선택지 분석 및 전략 수립 능력"],
    },
    {
        "name": "우수 독자",
        "accuracy_range": (0.75, 0.95),
        "error_bias": {},  # Rare errors
        "weak_competencies": [],
    },
]


def load_all_questions(config, test_key):
    """Load all MC questions for a test key."""
    questions = []
    for d in get_test_dirs(config, test_key):
        q_dir = os.path.join(d, 'questions')
        if not os.path.isdir(q_dir):
            continue
        for qf in sorted(glob(os.path.join(q_dir, '*.json'))):
            with open(qf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('question', {}).get('type') != '서술형':
                    questions.append(data)
    return questions


def select_wrong_choice(question, archetype):
    """Select an incorrect choice biased by archetype's error preferences."""
    correct_id = question.get('correct_choice')
    incorrect = [c for c in question.get('choices', []) if c['choice_id'] != correct_id]
    if not incorrect:
        return None

    bias = archetype['error_bias']
    if not bias:
        return random.choice(incorrect)

    # Weight choices by how well their error_path matches archetype bias
    weights = []
    for c in incorrect:
        ep = c.get('error_path', '')
        w = 1.0  # base weight
        for pattern, multiplier in bias.items():
            if pattern in ep:
                w *= multiplier
                break
        weights.append(w)

    total = sum(weights)
    if total == 0:
        return random.choice(incorrect)
    probs = [w / total for w in weights]

    return random.choices(incorrect, weights=probs, k=1)[0]


def simulate_student(student_idx, archetype, config, test_key, questions):
    """Simulate one student's test responses."""
    accuracy = random.uniform(*archetype['accuracy_range'])
    grade_map = {"sohssure": (1, 3), "frege": (4, 6), "russell": (7, 9), "wittgenstein": (10, 12)}
    grade_range = grade_map.get(test_key, (1, 12))
    grade = random.randint(*grade_range)

    name = f"{archetype['name']}_{student_idx:03d}"

    responses = []
    for q in questions:
        is_correct = random.random() < accuracy
        correct_id = q.get('correct_choice')

        if is_correct:
            choice_id = correct_id
            error_path = "정답"
        else:
            wrong = select_wrong_choice(q, archetype)
            if wrong:
                choice_id = wrong['choice_id']
                error_path = wrong.get('error_path', 'unknown')
            else:
                choice_id = correct_id
                error_path = "정답"
                is_correct = True

        responses.append({
            "question_id": q['question_id'],
            "choice_id": choice_id,
            "is_correct": is_correct,
            "error_path": error_path,
        })

    return {
        "name": name,
        "grade": grade,
        "archetype": archetype['name'],
        "accuracy": round(accuracy, 3),
        "test_key": test_key,
        "responses": responses,
    }


def score_student(student_data, config):
    """Score a simulated student and return report."""
    test_key = student_data['test_key']
    base_score = float(config.get('scoring', {}).get('base_score', 50.0))
    correct_weight = float(config.get('scoring', {}).get('correct_weight', 0.5))
    incorrect_weight = float(config.get('scoring', {}).get('incorrect_weight', 0.8))

    scores = {c: base_score for c in COMPETENCIES}
    error_paths_used = []

    # Build question lookup
    q_lookup = {}
    for d in get_test_dirs(config, test_key):
        q_dir = os.path.join(d, 'questions')
        if not os.path.isdir(q_dir):
            continue
        for qf in glob(os.path.join(q_dir, '*.json')):
            with open(qf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                q_lookup[data['question_id']] = data

    for resp in student_data['responses']:
        qid = resp['question_id']
        q = q_lookup.get(qid)
        if not q:
            continue

        selected = next((c for c in q.get('choices', [])
                         if c['choice_id'] == resp['choice_id']), None)
        if not selected:
            continue

        vector = selected.get('vector', {})
        level = q.get('passage', {}).get('level')
        multiplier = get_level_multiplier(config, test_key, level)

        if resp['is_correct']:
            apply_vector(scores, vector, correct_weight, multiplier=1.0)
        else:
            apply_vector(scores, vector, incorrect_weight, multiplier=multiplier)
            error_paths_used.append(resp['error_path'])

    clamp_scores(scores)
    tci = sum(scores.values()) / len(scores)
    answered = len(student_data['responses'])
    confidence = calculate_confidence(answered, config)
    adj_tci = apply_confidence_to_tci(tci, confidence, base=base_score)

    return {
        "scores": {k: round(v, 1) for k, v in scores.items()},
        "raw_tci": round(tci, 2),
        "confidence": round(confidence, 2),
        "adjusted_tci": round(adj_tci, 2),
        "error_paths": error_paths_used,
    }


def save_to_db(students):
    """Save simulated students to SQLite."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())

    for s in students:
        cur = conn.execute(
            "INSERT INTO students (name, grade) VALUES (?, ?)",
            (s['name'], s['grade'])
        )
        student_id = cur.lastrowid

        cur = conn.execute(
            "INSERT INTO test_sessions (student_id, test_key, mode, raw_tci, confidence, "
            "adjusted_tci, recommended_level, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (student_id, s['test_key'], 'simulated',
             s['report']['raw_tci'], s['report']['confidence'],
             s['report']['adjusted_tci'], s.get('archetype', ''),
             datetime.now().isoformat())
        )
        session_id = cur.lastrowid

        for resp in s['responses']:
            conn.execute(
                "INSERT INTO responses (session_id, question_id, choice_id, is_correct) "
                "VALUES (?, ?, ?, ?)",
                (session_id, resp['question_id'], resp['choice_id'],
                 1 if resp['is_correct'] else 0)
            )

        for comp, score in s['report']['scores'].items():
            conn.execute(
                "INSERT INTO competency_scores (session_id, competency, score, confidence) "
                "VALUES (?, ?, ?, ?)",
                (session_id, comp, score, s['report']['confidence'])
            )

    conn.commit()
    conn.close()


def main():
    config = load_config()
    test_order = config.get('test_order', [])

    all_students = []
    students_per_type = 40  # 5 types x 40 = 200

    for archetype in ARCHETYPES:
        for i in range(students_per_type):
            # Assign test based on position (distribute evenly)
            test_key = test_order[i % len(test_order)]
            questions = load_all_questions(config, test_key)

            if not questions:
                continue

            student = simulate_student(
                len(all_students) + 1, archetype, config, test_key, questions
            )
            report = score_student(student, config)
            student['report'] = report
            all_students.append(student)

        print(f"Generated {students_per_type} students for archetype: {archetype['name']}")

    print(f"\nTotal: {len(all_students)} simulated students")

    # Save JSON
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_students, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_PATH}")

    # Save to DB
    save_to_db(all_students)
    print(f"Saved to {DB_PATH}")


if __name__ == '__main__':
    main()
