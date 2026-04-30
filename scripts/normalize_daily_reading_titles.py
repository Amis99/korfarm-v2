"""DAILY_READING 제목 정규화 — 기존 [XXX] 보존, 없는 것만 [영역] 추가, 일차 표시 제거.

규칙:
  1. 일차 표시 (NN일차, [001], 001. 등) 는 어느 위치에 있든 제거
  2. 제목 맨 앞에 [XXX] 가 이미 있으면 → 그대로 보존 ([칼럼]/[논설문]/[비문학] 등 다 살림)
  3. [XXX] 가 없으면 → area/sub_area 로 [영역] 추가 (테스트 관리 표준)

영역 매핑:
  문학 / LIT          → [문학]
  비문학 / READ*      → [독서]
  문법 / GRAM*        → [문법]
  기타+화법           → [화법]
  기타+작문/건의문/생활문 → [작문]
  기타+매체           → [매체]
  그 외 / 기타+기타   → [복합]
"""
import subprocess
import re
import os
import sys
import tempfile

EC2_HOST = "ec2-user@43.200.104.102"
EC2_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASSWORD = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"


def derive_area_label(area: str, sub_area: str) -> str:
    a = (area or "").strip()
    s = (sub_area or "").strip()
    a_up, s_up = a.upper(), s.upper()
    if a == "문학" or a_up == "LIT" or s_up.startswith("LIT_"):
        return "문학"
    if a == "문법" or a_up in {"GRAM", "GRAMMAR"} or s_up.startswith("GRAM_"):
        return "문법"
    if a == "비문학" or a_up in {"READ", "READING"} or s_up.startswith("READ_"):
        return "독서"
    if a == "기타":
        if s == "화법" or s_up.startswith("SPEAK_"):
            return "화법"
        if s in {"작문", "건의문", "생활문"} or s_up.startswith("WRITE_"):
            return "작문"
        if s == "매체" or s_up.startswith("MEDIA_"):
            return "매체"
        return "복합"
    if a_up in {"BACKGROUND", "LOGIC", "SCIENCE", "SOCIETY", "LANGUAGE",
                "ART", "TECHNOLOGY", "HUMANITIES", "MIXED"}:
        return "독서"
    if a_up == "MEDIA":
        return "매체"
    if a_up == "WRITE":
        return "작문"
    if a_up == "SPEAK":
        return "화법"
    if a_up == "INTEGRATED":
        return "복합"
    return "독서"


# 일차 표시 패턴들 — 어느 위치에 있든 모두 제거
DAY_PATTERNS = [
    re.compile(r"\[\s*\d{1,3}\s*일\s*차?\s*\]"),   # [1일차], [001일차]
    re.compile(r"\[\s*\d{1,3}\s*\]"),               # [001]
    re.compile(r"\b\d{1,3}\s*일\s*차\b"),           # 1일차, 001일차
    re.compile(r"^\s*\d{1,3}\s*\.\s*"),              # 001. (앞)
    re.compile(r"^\s*\d{1,3}\s*-\s*"),               # 001 - (앞)
]
# 시작 [XXX] 추출/판별 (대괄호 안에 텍스트, 양쪽에 공백 허용)
PREFIX_BRACKET = re.compile(r"^\s*\[([^\]]+)\]\s*(.*)$", re.DOTALL)


def strip_day_indicators(text: str) -> str:
    out = text
    for pat in DAY_PATTERNS:
        out = pat.sub(" ", out)
    return re.sub(r"\s+", " ", out).strip()


def normalize_title(title: str, area: str, sub_area: str) -> str:
    raw = (title or "").strip()
    if not raw:
        return raw
    # 1) 일차 표시 제거
    cleaned = strip_day_indicators(raw)
    # 2) 일차 제거로 생긴 leading 구두점/공백 정리 (콤마·하이픈·콜론·점 등)
    cleaned = re.sub(r"^[\s,.\-:;_·]+", "", cleaned).strip()
    if not cleaned:
        return f"[{derive_area_label(area, sub_area)}]"
    # 3) 시작에 [XXX] 가 있으면 보존 ([칼럼]/[논설문]/[비문학] 등)
    m = PREFIX_BRACKET.match(cleaned)
    if m:
        bracket = m.group(1).strip()
        rest = m.group(2).strip()
        if not bracket or re.fullmatch(r"\d{1,3}\s*일\s*차?", bracket):
            return f"[{derive_area_label(area, sub_area)}] {rest}".strip()
        return f"[{bracket}] {rest}".strip()
    # 4) prefix 없음 → 영역 라벨 추가
    return f"[{derive_area_label(area, sub_area)}] {cleaned}"


def run_mysql(sql: str) -> str:
    cmd = ["ssh", "-i", EC2_KEY, EC2_HOST,
           f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} -N --batch -e \'{sql}\'']
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(f"MySQL 실패: {r.stderr[:500]}")
        sys.exit(1)
    return r.stdout


def fetch_rows():
    sql = ('SELECT id, IFNULL(area,""), IFNULL(sub_area,""), title '
           'FROM contents WHERE content_type = "DAILY_READING" AND status = "active";')
    out = run_mysql(sql)
    rows = []
    for line in out.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        rows.append((parts[0], parts[1], parts[2], parts[3]))
    return rows


def apply_updates(updates):
    if not updates:
        return
    sql_lines = ["SET NAMES utf8mb4;", "START TRANSACTION;"]
    for cid, new_title in updates:
        safe = new_title.replace("\\", "\\\\").replace('"', '\\"')
        sql_lines.append(f'UPDATE contents SET title = "{safe}" WHERE id = "{cid}";')
    sql_lines.append("COMMIT;")
    sql_text = "\n".join(sql_lines)
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as f:
        f.write(sql_text)
        local = f.name
    remote = "/tmp/update_titles.sql"
    subprocess.run(["scp", "-i", EC2_KEY, "-q", local, f"{EC2_HOST}:{remote}"], check=True)
    cmd = ["ssh", "-i", EC2_KEY, EC2_HOST,
           f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} < {remote} && rm {remote}']
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"UPDATE 실패: {r.stderr[:500]}")
        sys.exit(1)
    os.unlink(local)
    print(f"  UPDATE {len(updates)}건 적용")


def main():
    print("== DAILY_READING 제목 정규화 (기존 [XXX] 보존) ==")
    rows = fetch_rows()
    print(f"  총 {len(rows)}건")
    updates = []
    sample_keep = []      # [XXX] 보존 케이스
    sample_add = []       # 새 [영역] 추가 케이스
    sample_day = []       # 일차 제거 케이스
    for cid, area, sub_area, title in rows:
        new = normalize_title(title, area, sub_area)
        if new != title:
            updates.append((cid, new))
            # 분류
            had_bracket = bool(PREFIX_BRACKET.match(title))
            had_day = any(p.search(title) for p in DAY_PATTERNS)
            if had_day and len(sample_day) < 5:
                sample_day.append((title, new))
            elif had_bracket and len(sample_keep) < 5:
                sample_keep.append((title, new))
            elif len(sample_add) < 8:
                sample_add.append((title, new))
    print(f"\n  변경 대상 {len(updates)}건")
    if sample_day:
        print("\n  [일차 제거] 샘플:")
        for o, n in sample_day:
            print(f"    {o}\n    → {n}\n")
    if sample_keep:
        print("\n  [기존 [XXX] 보존] 샘플:")
        for o, n in sample_keep:
            print(f"    {o}\n    → {n}\n")
    if sample_add:
        print("\n  [영역 추가] 샘플:")
        for o, n in sample_add:
            print(f"    {o}\n    → {n}\n")
    if not updates:
        print("  변경 사항 없음")
        return
    BATCH = 1000
    for i in range(0, len(updates), BATCH):
        chunk = updates[i:i + BATCH]
        print(f"  배치 {i // BATCH + 1} ({len(chunk)} 건) 적용 중...")
        apply_updates(chunk)
    print("== 완료 ==")


if __name__ == "__main__":
    main()
