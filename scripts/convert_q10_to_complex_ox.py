#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
일일퀴즈 10번을 새 CHOICE_COMPLEX_OX 스키마로 변환.
대상: 모든 레벨의 118일차 (12건).

변환 규칙:
  - type: CHOICE_OX → CHOICE_COMPLEX_OX
  - passage.tokens[] 폐기
  - propositions[].evidenceTokens → evidenceRanges (paragraph text 안에서 token text 의 실제 char offset)
  - propositions[].matchMode 그대로 (없으면 "ALL")
  - propositions[].oxAnswer 그대로
  - choices[].finalIsCorrectChoice 폐기 (모든 선택지 통과 = 정답으로 변경)
  - 선택지 1개만 finalIsCorrectChoice=true 인 옛 데이터에서 다른 선택지의 propositions/oxAnswer 가
    "이 선택지의 진술이 지문과 일치하지 않는다"로 일관되게 작성되어 있다고 가정
    → 모든 선택지를 그대로 통과시키면 정답
"""
from __future__ import annotations
import sys, json, datetime
sys.stdout.reconfigure(encoding="utf-8")
from sshtunnel import SSHTunnelForwarder
import mysql.connector
import os

SSH_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TARGET_LEVELS = [
    ("SAUSSURE_1", "소쉬르1"), ("SAUSSURE_2", "소쉬르2"), ("SAUSSURE_3", "소쉬르3"),
    ("FREGE_1", "프레게1"), ("FREGE_2", "프레게2"), ("FREGE_3", "프레게3"),
    ("RUSSELL_1", "러셀1"), ("RUSSELL_2", "러셀2"), ("RUSSELL_3", "러셀3"),
    ("WITTGENSTEIN_1", "비트겐슈타인1"), ("WITTGENSTEIN_2", "비트겐슈타인2"), ("WITTGENSTEIN_3", "비트겐슈타인3"),
]
DAY = 118


def load_static_q10(folder_name):
    """정적 파일에서 10번 문항 로드 (옛 형식 보존)."""
    path = os.path.join(PROJECT_DIR, "frontend", "public", "daily-quiz", folder_name, f"{DAY:03d}.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    payload = data.get("payload", data)
    qs = payload.get("questions", [])
    if len(qs) < 10:
        return None
    return qs[9]


def find_token_range(paragraph_text, token_text):
    """paragraph_text 안에서 token_text 의 (start, end) 반환. 없으면 None."""
    if not paragraph_text or not token_text:
        return None
    # 기본: 정확 일치
    s = paragraph_text.find(token_text)
    if s >= 0:
        return (s, s + len(token_text))
    # 끝의 공백/마침표 차이 고려해 trim 후 재시도
    stripped = token_text.strip()
    if stripped != token_text:
        s = paragraph_text.find(stripped)
        if s >= 0:
            return (s, s + len(stripped))
    return None


def convert_q10(q10):
    """문항 1개를 새 스키마로 변환. 반환: (new_q, warnings).

    - paragraph 안에 직접 매칭되는 token: 그 위치를 evidenceRange 로
    - 매칭 안 되는 token (별도 재구성 문장): paragraph 끝에 새 단락으로 추가
      → 학생이 그 단락의 0..len 글자 어느 곳을 클릭해도 정답
    """
    warns = []
    new_q = dict(q10)
    new_q["type"] = "CHOICE_COMPLEX_OX"

    psg = q10.get("passage", {})
    paragraphs = list(psg.get("paragraphs", []))
    tokens = psg.get("tokens", [])

    # 새 paragraphs 빌드 — 기존 단락 + 매칭 못 한 token 단락 추가
    new_paragraphs = [{"id": p.get("id"), "text": p.get("text", "")} for p in paragraphs]
    new_para_by_id = {p["id"]: p for p in new_paragraphs}

    # tokenId → (paragraphId, start, end) 매핑
    token_pos = {}
    extra_para_idx = 0
    for tk in tokens:
        tid = tk.get("tokenId")
        pid = tk.get("paragraphId")
        ttext = (tk.get("text") or "").strip()
        if not ttext:
            warns.append(f"token {tid} 빈 텍스트")
            continue
        para = new_para_by_id.get(pid)
        if para:
            rng = find_token_range(para["text"], ttext)
            if rng is not None:
                token_pos[tid] = (pid, rng[0], rng[1])
                continue
        # 매칭 실패 → 별도 단락으로 추가
        extra_id = f"{pid or 'p'}_token_{tid}"
        new_paragraphs.append({"id": extra_id, "text": ttext})
        new_para_by_id[extra_id] = new_paragraphs[-1]
        token_pos[tid] = (extra_id, 0, len(ttext))
        extra_para_idx += 1
        warns.append(f"token {tid} → 별도 단락 추가 ({extra_id})")

    new_q["passage"] = {"paragraphs": new_paragraphs}

    # choices 변환
    new_choices = []
    for c in q10.get("choices", []):
        new_c = dict(c)
        new_c.pop("finalIsCorrectChoice", None)
        new_props = []
        for prop in c.get("propositions", []):
            new_p = dict(prop)
            ev_tokens = new_p.pop("evidenceTokens", []) or []
            ev_ranges = []
            for tid in ev_tokens:
                if tid in token_pos:
                    pid, s, e = token_pos[tid]
                    ev_ranges.append({"paragraphId": pid, "start": s, "end": e})
                else:
                    warns.append(f"choice {c.get('choiceId')} prop {new_p.get('propId')} evidenceToken {tid} → 위치 못 찾음")
            new_p["evidenceRanges"] = ev_ranges
            if "matchMode" not in new_p:
                new_p["matchMode"] = "ALL"
            new_props.append(new_p)
        new_c["propositions"] = new_props
        new_choices.append(new_c)
    new_q["choices"] = new_choices
    return new_q, warns


def main():
    with SSHTunnelForwarder(
        "43.200.104.102", ssh_username="ec2-user", ssh_pkey=SSH_KEY,
        remote_bind_address=("korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com", 3306),
        local_bind_address=("127.0.0.1", 13322),
    ) as t:
        c = mysql.connector.connect(
            host="127.0.0.1", port=t.local_bind_port,
            user="admin", password="xXoM4Ld7VAIYl9W874md5kic", database="korfarm", charset="utf8mb4",
        )
        cur = c.cursor(dictionary=True)
        for lvl, folder in TARGET_LEVELS:
            cur.execute(
                "SELECT id FROM contents WHERE level_id = %s AND day_index = %s AND content_type = 'DAILY_QUIZ'",
                (lvl, DAY),
            )
            row = cur.fetchone()
            if not row:
                print(f"[{lvl} day{DAY}] ❌ 콘텐츠 없음")
                continue
            content_id = row["id"]
            cur.execute(
                "SELECT id, content_json FROM content_versions WHERE content_id = %s ORDER BY created_at DESC LIMIT 1",
                (content_id,),
            )
            v = cur.fetchone()
            if not v:
                print(f"[{content_id}] ❌ version 없음")
                continue
            try:
                data = json.loads(v["content_json"])
            except Exception as e:
                print(f"[{content_id}] ❌ JSON 파싱 실패: {e}")
                continue
            payload = data.get("payload", data)
            qs = payload.get("questions", [])
            if len(qs) < 10:
                print(f"[{content_id}] ⚠️ 문항 {len(qs)}개")
                continue
            # DB 의 10번 type 이 이미 새 type 이면 정적 파일에서 옛 데이터 재로드
            db_q10 = qs[9]
            if db_q10.get("type") == "CHOICE_COMPLEX_OX":
                static_q10 = load_static_q10(folder)
                if static_q10 and static_q10.get("type") in ("CHOICE_OX", "CHOICE_ANALYSIS"):
                    print(f"[{content_id}] ↺ 정적 파일에서 옛 데이터 재로드")
                    q10 = static_q10
                else:
                    print(f"[{content_id}] ⚠️ 이미 새 type / 정적 파일 없음 — 건너뜀")
                    continue
            elif db_q10.get("type") in ("CHOICE_OX", "CHOICE_ANALYSIS"):
                q10 = db_q10
            else:
                print(f"[{content_id}] ⚠️ 10번 type={db_q10.get('type')} — 건너뜀")
                continue
            new_q10, warns = convert_q10(q10)
            qs[9] = new_q10
            payload["questions"] = qs
            if "payload" in data:
                data["payload"] = payload
            else:
                data = payload
            new_json = json.dumps(data, ensure_ascii=False)
            now = datetime.datetime.now()
            cur.execute(
                "UPDATE content_versions SET content_json = %s, updated_at = %s WHERE id = %s",
                (new_json, now, v["id"]),
            )
            cur.execute("UPDATE contents SET updated_at = %s WHERE id = %s", (now, content_id))
            print(f"[{content_id}] ✅ 변환 완료 ({len(new_json)}B)" + (
                f" — 경고 {len(warns)}건" if warns else ""))
            for w in warns[:5]:
                print(f"    ⚠️ {w}")
        c.commit()
        c.close()
        print("\n전체 완료")


if __name__ == "__main__":
    main()
