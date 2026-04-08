#!/usr/bin/env python3
"""
일일 독해 정적 JSON → DB 마이그레이션 (소쉬르1, 소쉬르2)

순서:
  1. hqadmin 로그인 → 토큰
  2. 기존 levelId 매칭 항목 조회 (대문자 + 소문자) → 모두 DELETE
  3. 001.json ~ 365.json만 batch-import (s2_xxx, combined.json 등 비정형 파일 무시)
  4. 결과 리포트
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

API = "https://gf2.hak1ad.kr"
ADMIN_ID = "hqadmin"
ADMIN_PW = "admin1234"
CONTENT_TYPE = "DAILY_READING"
MODULE_KEY = "reading_training"
CHUNK = 20  # 일일독해는 파일이 커서 청크 작게

# 마이그레이션 대상: (folder_name, backend_level_id)
TARGETS = [
    ("saussure1", "SAUSSURE_1"),
    ("saussure2", "SAUSSURE_2"),
]

BASE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "frontend", "public", "daily-reading"
)

# 001.json, 002.json, ... 365.json만 매칭 (s2_xxx, combined 등 제외)
DAY_FILE_RE = re.compile(r"^(\d{3})\.json$")


def post(path, body, token=None):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        API + path, data=data, method="POST",
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} on {path}: {body[:500]}")


def get(path, token=None):
    req = urllib.request.Request(API + path, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} on {path}: {body[:500]}")


def delete(path, token):
    req = urllib.request.Request(API + path, method="DELETE")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} on {path}: {body[:300]}")


def delete_existing(token, level_id_variants):
    total_deleted = 0
    for level_id in level_id_variants:
        try:
            cat = get(f"/v1/learning/catalog/GENERAL?contentType={CONTENT_TYPE}&levelId={level_id}", token=token)
            items = cat.get("data", [])
            ids = [it.get("content_id") or it.get("contentId") for it in items]
            ids = [i for i in ids if i]
            print(f"  level_id={level_id}: {len(ids)} found", flush=True)
            for i, cid in enumerate(ids):
                try:
                    delete(f"/v1/admin/content/{cid}", token=token)
                    total_deleted += 1
                except Exception as e:
                    print(f"    ! delete failed {cid}: {e}", flush=True)
                if (i + 1) % 50 == 0:
                    print(f"    deleted {i + 1}/{len(ids)}", flush=True)
        except Exception as e:
            print(f"  ! catalog query failed for {level_id}: {e}", flush=True)
    return total_deleted


def upload_target(token, folder_name, backend_level_id):
    src_dir = os.path.join(BASE_DIR, folder_name)
    if not os.path.isdir(src_dir):
        print(f"  ! source dir not found: {src_dir}", flush=True)
        return 0, 0

    # 001.json ~ 365.json만 선택
    files = []
    for fname in sorted(os.listdir(src_dir)):
        m = DAY_FILE_RE.match(fname)
        if m:
            files.append((fname, int(m.group(1))))
    print(f"  files matched: {len(files)}", flush=True)

    items = []
    for fname, day_index in files:
        path = os.path.join(src_dir, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                doc = json.load(f)
        except Exception as e:
            print(f"  ! load failed {fname}: {e}", flush=True)
            continue
        items.append({
            "content_type": doc.get("contentType", CONTENT_TYPE),
            "level_id": backend_level_id,
            "area": doc.get("area", "GENERAL"),
            "sub_area": doc.get("subArea", "DAILY"),
            "day_index": day_index,
            "module_key": MODULE_KEY,
            "schema_version": "1.0",
            "content": doc,
        })

    print(f"  batch-import {len(items)} items, chunk={CHUNK}", flush=True)
    total_imported = 0
    total_failed = 0
    chunks = [items[i:i + CHUNK] for i in range(0, len(items), CHUNK)]
    for i, chunk in enumerate(chunks):
        try:
            res = post("/v1/admin/content/batch-import", {"items": chunk}, token=token)
            data = res.get("data", {})
            imported = data.get("imported", 0)
            failed = data.get("failed", 0)
            total_imported += imported
            total_failed += failed
            if failed > 0:
                for r in data.get("results", []):
                    if not r.get("success"):
                        idx = i * CHUNK + r.get('index', 0)
                        fname = files[idx][0] if idx < len(files) else "?"
                        print(f"    ! {fname}: {r.get('error', '')[:200]}", flush=True)
        except Exception as e:
            total_failed += len(chunk)
            print(f"    ! chunk {i + 1} failed: {str(e)[:300]}", flush=True)

        if (i + 1) % 5 == 0 or i == len(chunks) - 1:
            print(f"    progress {i + 1}/{len(chunks)} ok={total_imported} fail={total_failed}", flush=True)

    return total_imported, total_failed


def main():
    print("[1] login...", flush=True)
    login = post("/v1/auth/login", {"login_id": ADMIN_ID, "password": ADMIN_PW})
    token = login["data"]["access_token"]
    print(f"  ok: {login['data']['user']['login_id']}", flush=True)

    grand_total = 0
    grand_failed = 0

    for folder_name, backend_level_id in TARGETS:
        print(f"\n=== {folder_name} → {backend_level_id} ===", flush=True)
        # 대소문자 두 형태 모두 삭제 (옛 데이터 잔재 청소)
        variants = [backend_level_id, folder_name]
        deleted = delete_existing(token, variants)
        print(f"  deleted total: {deleted}", flush=True)

        ok, fail = upload_target(token, folder_name, backend_level_id)
        print(f"  uploaded: ok={ok} fail={fail}", flush=True)
        grand_total += ok
        grand_failed += fail

    print()
    print("=" * 50, flush=True)
    print(f"final: ok={grand_total} fail={grand_failed}", flush=True)
    print("=" * 50, flush=True)


if __name__ == "__main__":
    main()
