#!/usr/bin/env python3
"""JSON 배치 파일을 읽어서 duel_question_pool 테이블에 INSERT하는 SQL 생성"""
import json
import sys
import os
import glob

def escape_sql(s):
    """MySQL 문자열 이스케이프"""
    if s is None:
        return 'NULL'
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # API 응답 형식 ({success, data: [...]}) 지원
    if isinstance(data, dict) and 'data' in data:
        data = data['data']

    if not isinstance(data, list):
        print(f"-- SKIP {filepath}: not a JSON array", file=sys.stderr)
        return []

    statements = []
    for item in data:
        qid = item.get('id')
        server_id = item.get('serverId')
        question_type = item.get('questionType')
        category = item.get('category')

        if not all([qid, server_id, question_type, category]):
            continue

        # question_json: 전체 item을 JSON 문자열로
        question_json = json.dumps(item, ensure_ascii=False)

        sql = (
            f"INSERT IGNORE INTO duel_question_pool "
            f"(id, server_id, question_type, category, question_json, status, created_at, updated_at) "
            f"VALUES ({escape_sql(qid)}, {escape_sql(server_id)}, {escape_sql(question_type)}, "
            f"{escape_sql(category)}, {escape_sql(question_json)}, 'ACTIVE', NOW(), NOW());"
        )
        statements.append(sql)

    return statements

def main():
    input_dir = sys.argv[1] if len(sys.argv) > 1 else '/tmp/batch_questions'

    files = sorted(glob.glob(os.path.join(input_dir, '*batch*all.json')))
    if not files:
        # russell_questions.json 같은 단일 파일도 처리
        files = sorted(glob.glob(os.path.join(input_dir, '*.json')))

    total = 0
    print("SET NAMES utf8mb4;")
    print("START TRANSACTION;")

    for filepath in files:
        basename = os.path.basename(filepath)
        statements = process_file(filepath)
        if statements:
            print(f"\n-- {basename} ({len(statements)} questions)")
            for stmt in statements:
                print(stmt)
            total += len(statements)

    print("\nCOMMIT;")
    print(f"-- Total: {total} questions", file=sys.stderr)

if __name__ == '__main__':
    main()
