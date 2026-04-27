#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
깨진 콘텐츠 복원 — 4-28 사용자 저장에서 wrapper 가 누락된 row 들을
옛 v1 wrapper 로 다시 감싸서 새 content_versions row INSERT.

대상:
  dr-r3-118 (DAILY_READING)
  dq-RUSSELL_3-118 (DAILY_QUIZ)

전략:
  1) 가장 오래된 wrapper 있는 version 을 찾아 그 wrapper 구조 사용
  2) 가장 최근(깨진) version 의 payload 를 wrapper.payload 로 옮김
  3) 새 content_versions row INSERT (uploaded_by='restore-script')
  4) 다른 콘텐츠도 같은 패턴으로 깨졌는지 스캔 → 보고
"""
import sys, json, uuid, datetime
sys.stdout.reconfigure(encoding='utf-8')
from sshtunnel import SSHTunnelForwarder
import mysql.connector
import os

SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")

# wrapper 가 있다고 판단할 핵심 키 (이 중 하나라도 있으면 wrapper)
WRAPPER_KEYS = {"contentId", "contentType", "targetLevel", "payload"}


def is_wrapper(d):
    return isinstance(d, dict) and bool(WRAPPER_KEYS & set(d.keys()))


def restore_broken(cur, content_id):
    print(f"\n━━━ {content_id} 복원 시도")
    cur.execute(
        "SELECT id, content_json, created_at FROM content_versions "
        "WHERE content_id = %s ORDER BY created_at",
        (content_id,),
    )
    versions = cur.fetchall()
    if len(versions) < 2:
        print(f"  ⚠️ 버전이 {len(versions)} 개. 복원 불가")
        return False

    # wrapper 가 있는 옛 버전 찾기 (가장 오래된 것 우선)
    old_wrapper = None
    for v in versions:
        try:
            data = json.loads(v["content_json"])
            if is_wrapper(data):
                old_wrapper = data
                old_id = v["id"]
                print(f"  ✓ wrapper 보유 옛 버전: {v['id']} ({v['created_at']})")
                break
        except Exception:
            continue
    if not old_wrapper:
        print(f"  ❌ wrapper 보유 버전 없음")
        return False

    # 가장 최근 (깨진) 버전 — wrapper 없음 가정
    latest = versions[-1]
    try:
        latest_data = json.loads(latest["content_json"])
    except Exception as e:
        print(f"  ❌ 최신 버전 JSON 파싱 실패: {e}")
        return False
    if is_wrapper(latest_data):
        print(f"  ✓ 최신 버전이 이미 wrapper 보유 — 복원 불필요")
        return False

    # 복원: old_wrapper 의 payload 를 latest_data 로 교체 + title 동기화
    restored = {**old_wrapper}
    restored["payload"] = latest_data
    if "title" in latest_data:
        restored["title"] = latest_data["title"]

    new_json = json.dumps(restored, ensure_ascii=False)
    now = datetime.datetime.now()

    # unique (content_id, schema_version) 제약으로 INSERT 불가 → 깨진 최신 row 의 content_json 만 UPDATE
    cur.execute(
        """UPDATE content_versions
           SET content_json = %s, updated_at = %s
           WHERE id = %s""",
        (new_json, now, latest["id"]),
    )
    cur.execute(
        "UPDATE contents SET updated_at = %s WHERE id = %s",
        (now, content_id),
    )
    print(f"  ✅ 복원 완료 — version {latest['id']} UPDATE ({len(new_json)}B)")
    return True


def scan_broken_contents(cur, limit=50):
    """4-28 이후 저장된 모든 content_versions 중 wrapper 누락된 것 스캔."""
    print("\n━━━ 4-28 이후 저장된 깨진 콘텐츠 스캔")
    cur.execute(
        """SELECT cv.id, cv.content_id, cv.created_at, c.content_type
           FROM content_versions cv
           JOIN contents c ON c.id = cv.content_id
           WHERE cv.created_at >= '2026-04-27 00:00:00'
             AND cv.uploaded_by != 'restore-script'
           ORDER BY cv.created_at DESC LIMIT %s""",
        (limit,),
    )
    candidates = cur.fetchall()
    broken = []
    for v in candidates:
        cur.execute("SELECT content_json FROM content_versions WHERE id = %s", (v["id"],))
        row = cur.fetchone()
        try:
            d = json.loads(row["content_json"])
            if not is_wrapper(d):
                broken.append(v["content_id"])
        except Exception:
            pass
    print(f"  스캔 {len(candidates)}건 / 깨진 콘텐츠 {len(broken)}건")
    for cid in broken:
        print(f"    - {cid}")
    return broken


def main():
    with SSHTunnelForwarder(
        "43.200.104.102", ssh_username="ec2-user", ssh_pkey=SSH_KEY,
        remote_bind_address=("korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com", 3306),
        local_bind_address=("127.0.0.1", 13317),
    ) as t:
        c = mysql.connector.connect(
            host="127.0.0.1", port=t.local_bind_port,
            user="admin", password="xXoM4Ld7VAIYl9W874md5kic", database="korfarm", charset="utf8mb4",
        )
        cur = c.cursor(dictionary=True)

        # 1) 깨진 콘텐츠 스캔 (보고용)
        broken_ids = scan_broken_contents(cur)

        # 2) 알려진 두 건 복원 + 스캔에서 발견된 추가 건도 복원
        targets = set(["dr-r3-118", "dq-RUSSELL_3-118"]) | set(broken_ids)
        print(f"\n복원 대상: {sorted(targets)}")

        restored = 0
        for cid in targets:
            if restore_broken(cur, cid):
                restored += 1

        c.commit()
        c.close()
        print(f"\n━━━ 완료: {restored} / {len(targets)} 복원")


if __name__ == "__main__":
    main()
