#!/usr/bin/env python3
"""
소쉬르1 일일 퀴즈 365개를 DB에 재등록.

순서:
  1. hqadmin 로그인 → 토큰
  2. 기존 levelId=SAUSSURE_1, contentType=DAILY_QUIZ 항목 조회
  3. 기존 항목 전부 DELETE
  4. frontend/public/daily-quiz/saussure1/*.json 365개 batch-import (청크 30씩)
  5. 결과 리포트
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

API = "https://gf2.hak1ad.kr"
ADMIN_ID = "hqadmin"
ADMIN_PW = "admin1234"
LEVEL_ID = "SAUSSURE_1"
CONTENT_TYPE = "DAILY_QUIZ"
SOURCE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "frontend", "public", "daily-quiz", "saussure1"
)
CHUNK = 30


def post(path, body, token=None):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        API + path, data=data, method="POST",
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
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


def main():
    # 1. 로그인
    print("[1] login...", flush=True)
    login = post("/v1/auth/login", {"login_id": ADMIN_ID, "password": ADMIN_PW})
    token = login["data"]["access_token"]
    print(f"  ok: {login['data']['user']['login_id']}", flush=True)

    # 2. 기존 항목 조회 (skip — already deleted)
    print(f"[2] check existing...", flush=True)
    catalog = get(
        f"/v1/learning/catalog/GENERAL?contentType={CONTENT_TYPE}&levelId={LEVEL_ID}",
        token=token,
    )
    existing = catalog.get("data", [])
    existing_ids = [it.get("content_id") or it.get("contentId") for it in existing]
    existing_ids = [i for i in existing_ids if i]
    print(f"  existing: {len(existing_ids)}", flush=True)

    if existing_ids:
        print(f"[3] delete {len(existing_ids)}...", flush=True)
        deleted = 0
        failed = 0
        for i, cid in enumerate(existing_ids):
            try:
                delete(f"/v1/admin/content/{cid}", token=token)
                deleted += 1
            except Exception as e:
                failed += 1
            if (i + 1) % 50 == 0:
                print(f"  progress {i + 1}/{len(existing_ids)} ok={deleted} fail={failed}", flush=True)
        print(f"  done: ok={deleted} fail={failed}", flush=True)
    else:
        print("[3] no existing, skip", flush=True)

    # 4. JSON 파일 로드
    print(f"[4] load json files...", flush=True)
    files = sorted([f for f in os.listdir(SOURCE_DIR) if f.endswith(".json")])
    print(f"  count: {len(files)}", flush=True)
    items = []
    for fname in files:
        path = os.path.join(SOURCE_DIR, fname)
        with open(path, "r", encoding="utf-8") as f:
            doc = json.load(f)
        # day index from filename (001 → 1)
        day_str = fname.split(".")[0]
        try:
            day_index = int(day_str)
        except ValueError:
            day_index = doc.get("dayIndex")
        # 백엔드 Jackson이 snake_case 모드 → 키를 snake_case로 보내야 함
        items.append({
            "content_type": doc.get("contentType", CONTENT_TYPE),
            "level_id": LEVEL_ID,
            "area": doc.get("area", "GENERAL"),
            "sub_area": doc.get("subArea", "DAILY"),
            "day_index": day_index,
            "module_key": "daily_quiz",
            "schema_version": "1.0",
            "content": doc,
        })

    # 5. batch-import (청크)
    print(f"[5] batch-import {len(items)} items, chunk={CHUNK}", flush=True)
    total_imported = 0
    total_failed = 0
    failed_files = []
    chunks = [items[i:i + CHUNK] for i in range(0, len(items), CHUNK)]
    for i, chunk in enumerate(chunks):
        try:
            res = post(
                "/v1/admin/content/batch-import",
                {"items": chunk},
                token=token,
            )
            data = res.get("data", {})
            imported = data.get("imported", 0)
            failed = data.get("failed", 0)
            total_imported += imported
            total_failed += failed
            if failed > 0:
                for r in data.get("results", []):
                    if not r.get("success"):
                        idx = i * CHUNK + r.get('index', 0)
                        fname = files[idx] if idx < len(files) else "?"
                        failed_files.append((fname, r.get('error', '')))
                        print(f"  ! {fname}: {r.get('error', '')[:200]}", flush=True)
        except Exception as e:
            total_failed += len(chunk)
            fname = files[i * CHUNK] if i * CHUNK < len(files) else "?"
            failed_files.append((fname, str(e)))
            print(f"  ! {fname}: {str(e)[:200]}", flush=True)

        if (i + 1) % 20 == 0:
            print(f"  progress {i + 1}/{len(chunks)} ok={total_imported} fail={total_failed}", flush=True)

    print(flush=True)
    print("=" * 50, flush=True)
    print(f"final: ok={total_imported}/{len(items)} fail={total_failed}", flush=True)
    print("=" * 50, flush=True)
    if failed_files:
        print("failed files:", flush=True)
        for fname, err in failed_files[:20]:
            print(f"  {fname}: {err[:150]}", flush=True)


if __name__ == "__main__":
    main()
