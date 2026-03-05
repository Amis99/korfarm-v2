#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""진단 테스트 v2 JSON 데이터 → Flyway 시드 SQL 생성 스크립트.

사용법:
    python generate_diagnostic_seed_sql.py

출력:
    backend/src/main/resources/db/migration/V0022__seed_diagnostic_v2_data.sql
"""

import json
import os
import re
import sys

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
DATA_DIR = os.path.join(PROJECT_ROOT, '진단 테스트 v2', 'data')
CONFIG_PATH = os.path.join(PROJECT_ROOT, '진단 테스트 v2', 'config.json')
OUTPUT_PATH = os.path.join(
    SCRIPT_DIR, '..', 'src', 'main', 'resources', 'db', 'migration',
    'V0022__seed_diagnostic_v2_data.sql'
)

# tier → 폴더명 매핑
TIER_DIRS = ['sohssure', 'frege', 'russell', 'wittgenstein']


def sql_escape(s):
    """SQL 문자열 이스케이프"""
    if s is None:
        return 'NULL'
    s = str(s)
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '')
    return f"'{s}'"


def json_sql(obj):
    """JSON 객체를 SQL 문자열로 변환"""
    if obj is None:
        return 'NULL'
    return sql_escape(json.dumps(obj, ensure_ascii=False))


def load_passage_dirs():
    """모든 지문 디렉토리를 tier별로 수집"""
    passages = []
    for tier in TIER_DIRS:
        tier_dir = os.path.join(DATA_DIR, tier)
        if not os.path.isdir(tier_dir):
            continue
        for pdir in sorted(os.listdir(tier_dir)):
            ppath = os.path.join(tier_dir, pdir)
            if os.path.isdir(ppath) and os.path.exists(os.path.join(ppath, 'metadata.json')):
                passages.append((tier, pdir, ppath))
    return passages


def main():
    lines = []
    lines.append('-- 진단 테스트 v2 시드 데이터: 26개 지문 + 260개 문항')
    lines.append('-- 자동 생성됨 (generate_diagnostic_seed_sql.py)')
    lines.append('')
    lines.append('-- 지문 INSERT')

    passage_dirs = load_passage_dirs()
    passage_count = 0
    question_count = 0

    for tier, pdir, ppath in passage_dirs:
        # metadata.json 읽기
        with open(os.path.join(ppath, 'metadata.json'), 'r', encoding='utf-8') as f:
            meta = json.load(f)

        passage_id = meta['passage_id']
        level = meta['level']
        genre = meta['genre']

        # passage.md 읽기
        with open(os.path.join(ppath, 'passage.md'), 'r', encoding='utf-8') as f:
            text_md = f.read().strip()

        lines.append(
            f"INSERT INTO diag_passages (id, tier, level, genre, text_md) VALUES "
            f"({sql_escape(passage_id)}, {sql_escape(tier)}, {level}, {sql_escape(genre)}, {sql_escape(text_md)});"
        )
        passage_count += 1

    lines.append('')
    lines.append('-- 문항 INSERT')

    for tier, pdir, ppath in passage_dirs:
        with open(os.path.join(ppath, 'metadata.json'), 'r', encoding='utf-8') as f:
            meta = json.load(f)
        passage_id = meta['passage_id']

        questions_dir = os.path.join(ppath, 'questions')
        if not os.path.isdir(questions_dir):
            continue

        q_files = sorted([f for f in os.listdir(questions_dir) if f.endswith('.json')])
        for idx, qfile in enumerate(q_files, 1):
            with open(os.path.join(questions_dir, qfile), 'r', encoding='utf-8') as f:
                q = json.load(f)

            qid = q['question_id']
            qtype = q['question']['type']
            stem = q['question']['stem']
            box = q['question'].get('box')
            correct = q.get('correct_choice')
            choices = q.get('choices', [])
            model_answer = q.get('model_answer')
            grading = q.get('grading_criteria')
            pair_id = q.get('pair_id')

            lines.append(
                f"INSERT INTO diag_questions "
                f"(id, passage_id, tier, question_type, stem, box_content, correct_choice, "
                f"choices_json, model_answer, grading_criteria_json, pair_id, order_in_passage) VALUES "
                f"({sql_escape(qid)}, {sql_escape(passage_id)}, {sql_escape(tier)}, "
                f"{sql_escape(qtype)}, {sql_escape(stem)}, {sql_escape(box) if box else 'NULL'}, "
                f"{sql_escape(correct) if correct else 'NULL'}, "
                f"{json_sql(choices)}, "
                f"{sql_escape(model_answer) if model_answer else 'NULL'}, "
                f"{json_sql(grading) if grading else 'NULL'}, "
                f"{sql_escape(pair_id) if pair_id else 'NULL'}, "
                f"{idx});"
            )
            question_count += 1

    # 파일 쓰기
    output_path = os.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
        f.write('\n')

    print(f"생성 완료: {output_path}")
    print(f"  지문: {passage_count}개")
    print(f"  문항: {question_count}개")


if __name__ == '__main__':
    main()
