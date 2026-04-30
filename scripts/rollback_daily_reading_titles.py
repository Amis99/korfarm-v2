"""DAILY_READING 제목을 content_versions.content_json.title 에서 복원.

이전에 잘못된 정규화로 [칼럼]/[논설문]/[수필] 등 사용자 의도 prefix 가
[매체]/[작문]/[독서] 로 덮어씌워진 것을 원본으로 복구.
"""
import subprocess
import os
import sys
import tempfile

EC2_HOST = "ec2-user@43.200.104.102"
EC2_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASSWORD = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"


def run_mysql(sql: str) -> str:
    cmd = ["ssh", "-i", EC2_KEY, EC2_HOST,
           f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} -N --batch -e \'{sql}\'']
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(f"MySQL 실패: {r.stderr[:500]}")
        sys.exit(1)
    return r.stdout


def main():
    print("== 제목 복원 시작 ==")
    # 가장 오래된(원본) 버전의 title 로 복원
    sql = """
UPDATE contents c
JOIN (
  SELECT cv.content_id, JSON_UNQUOTE(JSON_EXTRACT(cv.content_json, '$.title')) AS orig_title
  FROM content_versions cv
  JOIN (
    SELECT content_id, MIN(created_at) AS first_at
    FROM content_versions GROUP BY content_id
  ) firstv ON firstv.content_id = cv.content_id AND firstv.first_at = cv.created_at
) src ON src.content_id = c.id
SET c.title = src.orig_title
WHERE c.content_type = 'DAILY_READING'
  AND src.orig_title IS NOT NULL
  AND src.orig_title <> ''
  AND src.orig_title <> 'null';
"""
    # SSH 로 SQL 파일 전송 후 실행 (ESCAPE 회피)
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as f:
        f.write("SET NAMES utf8mb4;\n" + sql)
        local = f.name
    remote = "/tmp/rollback_titles.sql"
    subprocess.run(["scp", "-i", EC2_KEY, "-q", local, f"{EC2_HOST}:{remote}"], check=True)
    cmd = ["ssh", "-i", EC2_KEY, EC2_HOST,
           f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} < {remote} && rm {remote}']
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"실행 실패: {r.stderr[:500]}")
        sys.exit(1)
    os.unlink(local)
    # 통계 확인
    out = run_mysql('SELECT COUNT(*) FROM contents WHERE content_type = "DAILY_READING";')
    print(f"  DAILY_READING 총 {out.strip()} 건 복원 시도 완료")


if __name__ == "__main__":
    main()
