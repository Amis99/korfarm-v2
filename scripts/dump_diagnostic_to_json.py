#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
DB 의 진단 문항 데이터를 답안 PDF 용 JSON 으로 dump.
docs/test-analysis/raw/{tier}.json 갱신.

generate-diagnostic-answer-pdfs.py 가 읽는 형식과 동일하게 출력 (over-escaped \\\\ 형태).
"""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from sshtunnel import SSHTunnelForwarder
import mysql.connector

PROJECT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_DIR / "docs" / "test-analysis" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

SSH_HOST = "43.200.104.102"
SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"

TIERS = ["sohssure", "frege", "russell", "wittgenstein"]

def dump_tier(cur, tier: str) -> int:
    cur.execute("""
        SELECT tq.test_id, tq.number, tq.type, tq.points, tq.domain, tq.sub_domain,
               tq.passage, tq.stem, tq.correct_answer, tq.choices_json, tp.title
        FROM test_questions tq
        JOIN test_papers tp ON tp.id = tq.test_id
        WHERE tq.test_id = %s
        ORDER BY tq.number
    """, (f"diag_paper_{tier}",))
    rows = cur.fetchall()
    out = []
    for r in rows:
        # choices_json 은 DB 에서 텍스트로 옴 → JSON 문자열로 그대로 저장
        # generate-diagnostic-answer-pdfs.py 의 over-escaped 패턴과 호환되도록 \\ 한 단계 추가
        cj_raw = r["choices_json"] or "[]"
        # JSON 문자열로 다시 인코드 (over-escape: 내부 큰따옴표를 \\\" 로)
        # → JSON.dumps + replace 로 over-escape
        cj_str = cj_raw  # 이미 JSON string
        item = {
            "stem": r["stem"] or "",
            "type": r["type"] or "",
            "title": r["title"] or "",
            "domain": r["domain"] or "",
            "intent": "",
            "number": r["number"],
            "points": r["points"] or 10,
            "series": "diagnostic",
            "testId": r["test_id"],
            "levelId": tier,
            "passage": r["passage"] or "",
            "subDomain": r["sub_domain"] or "",
            # cj_str 은 DB 에서 가져온 raw JSON string (escape 없음).
            # json.dumps 가 dict 직렬화 시 \" 와 \\ 자동 escape 하므로 추가 처리 불필요.
            "choicesJson": cj_str,
            "correctAnswer": r["correct_answer"] or "",
        }
        out.append(item)
    out_path = RAW_DIR / f"{tier}.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    return len(out)

def main():
    print("SSH 터널 연결 중...")
    with SSHTunnelForwarder(
        SSH_HOST, ssh_username="ec2-user", ssh_pkey=SSH_KEY,
        remote_bind_address=(DB_HOST, 3306), local_bind_address=("127.0.0.1", 13309),
    ) as tunnel:
        conn = mysql.connector.connect(
            host="127.0.0.1", port=tunnel.local_bind_port,
            user=DB_USER, password=DB_PASS, database=DB_NAME, charset="utf8mb4",
        )
        cur = conn.cursor(dictionary=True)
        for tier in TIERS:
            n = dump_tier(cur, tier)
            print(f"  {tier}: {n} 문항 → docs/test-analysis/raw/{tier}.json")
        conn.close()
    print("dump 완료")

if __name__ == "__main__":
    main()
