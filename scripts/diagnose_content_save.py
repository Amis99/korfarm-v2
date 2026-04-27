#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
콘텐츠 저장 버그 진단 — dr-r3-118 (러셀3 118일차 일일독해/일일퀴즈) 의 DB 상태 점검.
"""
import os, sys
# Windows cp949 콘솔에서 유니코드 출력 강제
sys.stdout.reconfigure(encoding="utf-8")
from sshtunnel import SSHTunnelForwarder
import mysql.connector

SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")

with SSHTunnelForwarder(
    "43.200.104.102", ssh_username="ec2-user", ssh_pkey=SSH_KEY,
    remote_bind_address=("korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com", 3306),
    local_bind_address=("127.0.0.1", 13312),
) as t:
    c = mysql.connector.connect(
        host="127.0.0.1", port=t.local_bind_port,
        user="admin", password="xXoM4Ld7VAIYl9W874md5kic", database="korfarm", charset="utf8mb4",
    )
    cur = c.cursor(dictionary=True)

    print("=" * 60)
    print("1) russell3 + dayIndex=118 콘텐츠 (contents 테이블)")
    print("=" * 60)
    cur.execute("""
        SELECT id, content_type, level_id, day_index, area, sub_area, module_key,
               title, status, created_at, updated_at
        FROM contents
        WHERE level_id = 'russell3' AND day_index = 118
        ORDER BY content_type, id
    """)
    rows = cur.fetchall()
    if not rows:
        print("  ❌ 매칭되는 row 없음")
    for r in rows:
        print(f"  id={r['id']}  type={r['content_type']}  module={r['module_key']}  status={r['status']}  updated={r['updated_at']}")
        print(f"    title: {r['title']}")

    print()
    print("=" * 60)
    print("2) 그 콘텐츠들의 content_versions 최신 버전")
    print("=" * 60)
    if rows:
        ids = [r["id"] for r in rows]
        placeholders = ",".join(["%s"] * len(ids))
        cur.execute(f"""
            SELECT content_id, id AS version_id, schema_version,
                   LENGTH(content_json) AS payload_len,
                   LEFT(content_json, 200) AS payload_preview,
                   uploaded_by, approved_by, created_at
            FROM content_versions
            WHERE content_id IN ({placeholders})
            ORDER BY content_id, created_at DESC
        """, ids)
        versions = cur.fetchall()
        for v in versions:
            print(f"  content={v['content_id']}  ver={v['version_id']}  len={v['payload_len']}B  created={v['created_at']}")
            print(f"    preview: {v['payload_preview'][:150]}...")

    print()
    print("=" * 60)
    print("3) 정적 파일 (frontend/public/daily-reading|daily-quiz/러셀3/118.json) 존재")
    print("=" * 60)
    import pathlib
    proj = pathlib.Path(__file__).resolve().parent.parent
    for sub in ["daily-reading/russell3", "daily-quiz/러셀3"]:
        p = proj / "frontend" / "public" / sub / "118.json"
        exists = p.exists()
        size = p.stat().st_size if exists else 0
        print(f"  {sub}/118.json: {'✅' if exists else '❌'} ({size}B)")

    print()
    print("=" * 60)
    print("4) catalog API 매칭 시뮬레이션 (level_id='russell3' + day_index=118)")
    print("=" * 60)
    cur.execute("""
        SELECT id, content_type, day_index, level_id, area
        FROM contents
        WHERE level_id = 'russell3' AND day_index = 118
            AND status = 'active'
            AND content_type IN ('DAILY_READING', 'DAILY_QUIZ')
    """)
    catalog_matches = cur.fetchall()
    print(f"  catalog 매칭: {len(catalog_matches)}건")
    for m in catalog_matches:
        print(f"    {m['id']}  type={m['content_type']}  area={m['area']}")

    c.close()
