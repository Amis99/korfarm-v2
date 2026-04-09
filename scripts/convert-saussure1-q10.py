#!/usr/bin/env python3
"""
소쉬르1 일일 퀴즈 365개의 Q10(CHOICE_OX 옛 양식)을
새 CHOICE_ANALYSIS 양식으로 변환해 DB 업데이트.

옛 양식:
  type: CHOICE_OX
  passage: { paragraphs: [{ id, text }], tokens: [{ tokenId, paragraphId, text }] }
  choices: [{
    choiceId, text,
    propositions: [{ propId, text, evidenceTokens: [], oxAnswer: "O"|"X", matchMode: "ALL"|"ANY" }],
    finalIsCorrectChoice: bool
  }]

신 양식:
  type: CHOICE_ANALYSIS
  passage: { paragraphs: [{ id, sentences: [{ id, text }] }] }
  choices: [{
    choiceId, text,
    evidenceSentenceIds: [],
    matchMode: "ALL"|"ANY",
    expectedOX: "O"|"X"
  }]

변환 규칙:
  1. paragraph.text → 문장 단위 분리 (마침표/물음표/느낌표 + 공백/끝)
  2. 각 문장에 ID 부여: {paragraphId}_s{n}
  3. 토큰의 paragraph 내 위치를 누적으로 추적해 어느 문장에 속하는지 매핑
  4. 선택지마다:
     - propositions 모두의 evidenceTokens → 문장 ID 집합으로 dedupe
     - matchMode: 매핑된 문장이 2개 이상이면 ALL, 1개이면 ANY
     - expectedOX: stem이 "일치하지 않는"이면 finalIsCorrectChoice 가 true → "X", false → "O"
                   stem이 "일치하는" 이면 그 반대로 매핑

dryRun: 변환 결과만 출력하고 PUT 안 함 (--apply 옵션으로 실제 적용)
"""
import argparse
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
LEVEL_ID = "SAUSSURE_1"
CONTENT_TYPE = "DAILY_QUIZ"


def post(path, body, token=None):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API + path, data=data, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} on {path}: {body[:500]}")


def put(path, body, token):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API + path, data=data, method="PUT",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
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


# 한국어 문장 분리: . ? ! 다음에 공백/줄바꿈/끝
SENT_SPLIT = re.compile(r'(?<=[.?!])\s+')


def split_sentences(text):
    """한국어 문장을 분리. 빈 문자열 제외, 양끝 공백 제거."""
    if not text or not text.strip():
        return []
    parts = SENT_SPLIT.split(text.strip())
    return [p.strip() for p in parts if p.strip()]


def map_token_to_sentence(paragraph_text, sentences, tokens):
    """
    paragraph_text 내에서 각 sentence의 [start,end) 위치를 찾고,
    각 token의 위치도 찾아서 token_id → sentence_id 매핑을 만든다.
    """
    # sentence 위치 추적
    sent_ranges = []
    cursor = 0
    for sent_text in sentences:
        idx = paragraph_text.find(sent_text, cursor)
        if idx < 0:
            # fallback: 처음부터 찾기
            idx = paragraph_text.find(sent_text)
            if idx < 0:
                # 못 찾으면 cursor부터 길이만큼 사용
                idx = cursor
        end = idx + len(sent_text)
        sent_ranges.append((idx, end))
        cursor = end

    # token 위치 추적 (cumulative)
    token_to_sent = {}
    cursor = 0
    for tok in tokens:
        ttext = tok.get("text") or ""
        if not ttext:
            continue
        idx = paragraph_text.find(ttext, cursor)
        if idx < 0:
            idx = paragraph_text.find(ttext)
            if idx < 0:
                idx = cursor
        end = idx + len(ttext)
        # token의 중간점이 어느 sentence range에 들어가는지
        mid = (idx + end) // 2
        for si, (s_start, s_end) in enumerate(sent_ranges):
            if s_start <= mid < s_end:
                token_to_sent[tok.get("tokenId")] = si
                break
        else:
            # 마지막 sentence에 매핑
            if sent_ranges:
                token_to_sent[tok.get("tokenId")] = len(sent_ranges) - 1
        cursor = end
    return token_to_sent


def is_negation_stem(stem):
    """발문이 '일치하지 않는' / '적절하지 않은' 등 부정형인지 확인."""
    if not stem:
        return True  # 기본은 부정형 가정
    s = stem.replace(" ", "")
    return ("않는" in s) or ("않은" in s) or ("아닌" in s) or ("틀린" in s)


def convert_q10(q):
    """
    옛 양식 Q10 → 신 양식 변환.
    이미 신 양식이면 None 반환.
    """
    if not q or q.get("type") != "CHOICE_OX":
        # 이미 신 양식이거나 다른 타입이면 변환 안 함
        if q.get("type") == "CHOICE_ANALYSIS":
            return None  # 이미 신 양식
        return None  # 다른 타입, 변환 대상 아님

    passage = q.get("passage") or {}
    paragraphs = passage.get("paragraphs") or []
    tokens = passage.get("tokens") or []
    if not paragraphs:
        return None  # 변환 불가

    stem = q.get("stem") or ""
    negation = is_negation_stem(stem)

    # 1. 새 paragraphs[].sentences[] 구성 + 토큰→문장 매핑
    new_paragraphs = []
    token_id_to_sentence_id = {}  # 전체 토큰 → "p1_s2" 형식
    for p in paragraphs:
        pid = p.get("id") or "p1"
        ptext = p.get("text") or ""
        sentences_text = split_sentences(ptext)
        new_sentences = []
        for i, st in enumerate(sentences_text, start=1):
            new_sentences.append({
                "id": f"{pid}_s{i}",
                "text": st,
            })
        new_paragraphs.append({
            "id": pid,
            "sentences": new_sentences,
        })
        # 이 paragraph에 속한 토큰만 추출
        p_tokens = [t for t in tokens if (t.get("paragraphId") == pid)]
        if not p_tokens and len(paragraphs) == 1:
            # paragraphId가 없는 경우 모든 토큰을 이 단일 paragraph에 매핑
            p_tokens = tokens
        # 토큰 → 문장 인덱스 매핑
        tok_to_sent_idx = map_token_to_sentence(ptext, sentences_text, p_tokens)
        for tid, sidx in tok_to_sent_idx.items():
            if sidx < len(new_sentences):
                token_id_to_sentence_id[tid] = new_sentences[sidx]["id"]

    # 2. 새 choices[] 구성
    new_choices = []
    old_choices = q.get("choices") or []
    for ch in old_choices:
        cid = ch.get("choiceId") or ch.get("id")
        ctext = ch.get("text") or ""
        propositions = ch.get("propositions") or []

        # 모든 prop의 evidenceTokens 모음 → 문장 ID 집합
        sentence_ids_ordered = []
        seen = set()
        for prop in propositions:
            ev_tokens = prop.get("evidenceTokens") or []
            for tid in ev_tokens:
                sid = token_id_to_sentence_id.get(tid)
                if sid and sid not in seen:
                    seen.add(sid)
                    sentence_ids_ordered.append(sid)

        # 근거 문장이 없으면 첫 문장을 fallback (변환 실패 방지)
        if not sentence_ids_ordered:
            if new_paragraphs and new_paragraphs[0].get("sentences"):
                sentence_ids_ordered = [new_paragraphs[0]["sentences"][0]["id"]]

        # matchMode: 문장이 2개 이상이면 ALL, 1개이면 ANY
        match_mode = "ALL" if len(sentence_ids_ordered) >= 2 else "ANY"

        # expectedOX 결정:
        # 부정형 발문 ("일치하지 않는") + finalIsCorrectChoice=true → 그 선택지가 답 → 일치 안 함 → "X"
        # 부정형 발문 + finalIsCorrectChoice=false → 답 아님 → 일치 → "O"
        # 긍정형 발문 ("일치하는") + finalIsCorrectChoice=true → 답 → 일치 → "O"
        # 긍정형 발문 + finalIsCorrectChoice=false → 답 아님 → 일치 안 함 → "X"
        is_answer = bool(ch.get("finalIsCorrectChoice"))
        if negation:
            expected_ox = "X" if is_answer else "O"
        else:
            expected_ox = "O" if is_answer else "X"

        new_choices.append({
            "choiceId": cid,
            "text": ctext,
            "evidenceSentenceIds": sentence_ids_ordered,
            "matchMode": match_mode,
            "expectedOX": expected_ox,
        })

    # 3. 새 question 구성
    new_q = {
        "id": q.get("id"),
        "type": "CHOICE_ANALYSIS",
        "questionKind": "CHOICE_ANALYSIS",
        "competency": q.get("competency") or "선택지 분석 및 전략 수립 능력",
        "stem": stem,
        "passage": {"paragraphs": new_paragraphs},
        "choices": new_choices,
        "explanation": q.get("explanation") or "",
        "scoring": q.get("scoring") or {"correctDeltaSec": 20, "wrongDeltaSec": -40},
    }
    return new_q


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="실제 PUT 적용 (없으면 dry-run)")
    parser.add_argument("--limit", type=int, default=0,
                        help="처리할 최대 콘텐츠 수 (0=전체)")
    parser.add_argument("--start", type=int, default=0,
                        help="시작 day_index (0=처음부터)")
    parser.add_argument("--verbose", action="store_true",
                        help="첫 번째 변환 결과를 stdout에 출력")
    args = parser.parse_args()

    print(f"[mode] {'APPLY' if args.apply else 'DRY-RUN'}", flush=True)

    # 1. 로그인
    print("[1] login...", flush=True)
    login = post("/v1/auth/login", {"login_id": ADMIN_ID, "password": ADMIN_PW})
    token = login["data"]["access_token"]
    print(f"  ok: {login['data']['user']['login_id']}", flush=True)

    # 2. 카탈로그 조회
    print(f"[2] catalog SAUSSURE_1 DAILY_QUIZ...", flush=True)
    catalog = get(
        f"/v1/learning/catalog/GENERAL?contentType={CONTENT_TYPE}&levelId={LEVEL_ID}",
        token=token,
    )
    items = catalog.get("data") or []
    # 정렬: dayIndex 기준
    def day_of(it):
        return it.get("day_index") or it.get("dayIndex") or 0
    items.sort(key=day_of)
    print(f"  total: {len(items)}", flush=True)

    if args.start > 0:
        items = [it for it in items if day_of(it) >= args.start]
        print(f"  filtered start>={args.start}: {len(items)}", flush=True)
    if args.limit > 0:
        items = items[:args.limit]
        print(f"  limited: {len(items)}", flush=True)

    # 3. 각 콘텐츠 처리
    print(f"[3] process {len(items)} contents...", flush=True)
    converted = 0
    skipped = 0
    failed = 0
    failures = []
    for i, it in enumerate(items):
        cid = it.get("content_id") or it.get("contentId")
        di = day_of(it)
        if not cid:
            continue
        try:
            preview = get(f"/v1/admin/content/{cid}/preview", token=token)
            data = preview.get("data") or {}
            content = data.get("content") or {}
            payload = content.get("payload") or {}
            questions = payload.get("questions") or []
            if len(questions) < 10:
                skipped += 1
                if (i + 1) % 50 == 0:
                    print(f"  progress {i+1}/{len(items)} ok={converted} skip={skipped} fail={failed}", flush=True)
                continue
            q10 = questions[9]
            q10_type = q10.get("type")
            if q10_type == "CHOICE_ANALYSIS":
                # 이미 신 양식
                skipped += 1
                if (i + 1) % 50 == 0:
                    print(f"  progress {i+1}/{len(items)} ok={converted} skip={skipped} fail={failed}", flush=True)
                continue
            if q10_type != "CHOICE_OX":
                skipped += 1
                if (i + 1) % 50 == 0:
                    print(f"  progress {i+1}/{len(items)} ok={converted} skip={skipped} fail={failed}", flush=True)
                continue

            # 변환
            new_q10 = convert_q10(q10)
            if not new_q10:
                failed += 1
                failures.append((cid, "변환 결과 None"))
                continue

            if args.verbose and converted == 0:
                print("--- BEFORE (Q10) ---", flush=True)
                print(json.dumps(q10, ensure_ascii=False, indent=2), flush=True)
                print("--- AFTER (Q10) ---", flush=True)
                print(json.dumps(new_q10, ensure_ascii=False, indent=2), flush=True)
                print("--- END ---", flush=True)

            # 새 questions 배열
            new_questions = list(questions)
            new_questions[9] = new_q10
            new_payload = dict(payload)
            new_payload["questions"] = new_questions
            new_content = dict(content)
            new_content["payload"] = new_payload

            if args.apply:
                # PUT (snake_case 키)
                put_body = {
                    "content_type": data.get("content_type") or data.get("contentType") or content.get("contentType") or "DAILY_QUIZ",
                    "level_id": data.get("level_id") or data.get("levelId") or LEVEL_ID,
                    "area": content.get("area") or "GENERAL",
                    "sub_area": content.get("subArea") or content.get("sub_area") or "DAILY",
                    "day_index": di,
                    "module_key": data.get("module_key") or data.get("moduleKey") or "daily_quiz",
                    "schema_version": data.get("schema_version") or data.get("schemaVersion") or "1.0",
                    "content": new_content,
                }
                put(f"/v1/admin/content/{cid}", put_body, token=token)
            converted += 1
        except Exception as e:
            failed += 1
            failures.append((cid, str(e)[:200]))
            print(f"  ! {cid} day={di}: {str(e)[:200]}", flush=True)

        if (i + 1) % 50 == 0:
            print(f"  progress {i+1}/{len(items)} ok={converted} skip={skipped} fail={failed}", flush=True)
            time.sleep(0.5)

    print(flush=True)
    print("=" * 60, flush=True)
    print(f"final: converted={converted} skipped={skipped} failed={failed}", flush=True)
    print(f"mode: {'APPLY' if args.apply else 'DRY-RUN'}", flush=True)
    print("=" * 60, flush=True)
    if failures:
        print("failures (first 20):", flush=True)
        for cid, err in failures[:20]:
            print(f"  {cid}: {err}", flush=True)


if __name__ == "__main__":
    main()
