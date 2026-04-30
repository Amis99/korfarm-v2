"""감규리 시리즈 (또는 임의 시리즈) 이모티콘 배경을 투명하게 변환.

사용:
  python scripts/transparent_bg_emoticons.py 감규리

흐름:
  1. EC2 의 /opt/korfarm/uploads/ 에서 시리즈 파일 ID 들 조회 (DB 접속)
  2. SCP 로 로컬 임시 폴더에 다운로드
  3. rembg 로 배경 제거 → PNG (alpha 채널)
  4. SCP 로 같은 파일명으로 EC2 에 덮어쓰기
  5. 클라이언트 캐시 무효화는 React 측에서 fileId 가 그대로라 강제 새로고침 필요.
"""
import subprocess
import sys
import os
import tempfile
from pathlib import Path

EC2_HOST = "ec2-user@43.200.104.102"
EC2_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
UPLOADS_DIR = "/opt/korfarm/uploads"

DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASSWORD = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"


def run(cmd, capture=True):
    r = subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=capture, text=True)
    if r.returncode != 0:
        print(f"  명령 실패 ({r.returncode}): {cmd}")
        print(f"  stderr: {r.stderr[:500]}")
        sys.exit(1)
    return r.stdout


def get_file_ids(series: str):
    """EC2 ssh 통해 mysql 쿼리, 시리즈 이모티콘의 file_id 목록 반환."""
    sql = (
        f'SELECT file_id FROM chat_emoticons '
        f'WHERE series = "{series}" '
        f'ORDER BY name;'
    )
    cmd = [
        "ssh", "-i", EC2_KEY, EC2_HOST,
        f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} -N -e \'{sql}\''
    ]
    out = run(cmd)
    return [line.strip() for line in out.strip().split("\n") if line.strip()]


def remove_background(in_path: Path, out_path: Path):
    """rembg 로 배경 제거 → PNG (alpha)"""
    from rembg import remove
    from PIL import Image
    with open(in_path, "rb") as f:
        data = f.read()
    result = remove(data)
    with open(out_path, "wb") as f:
        f.write(result)


def main():
    if len(sys.argv) < 2:
        print("사용: python transparent_bg_emoticons.py <시리즈명>")
        sys.exit(1)
    series = sys.argv[1]
    print(f"== {series} 시리즈 배경 투명화 ==")
    file_ids = get_file_ids(series)
    print(f"  대상 파일 {len(file_ids)}개")
    if not file_ids:
        print("  처리할 파일 없음")
        return

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for fid in file_ids:
            print(f"  처리 중: {fid}")
            remote = f"{EC2_HOST}:{UPLOADS_DIR}/{fid}"
            local_in = tmp_path / f"{fid}.png"
            local_out = tmp_path / f"{fid}_out.png"
            # 다운로드
            run(["scp", "-i", EC2_KEY, "-q", remote, str(local_in)])
            # 배경 제거
            remove_background(local_in, local_out)
            # 업로드 (덮어쓰기)
            run(["scp", "-i", EC2_KEY, "-q", str(local_out), remote])
            print(f"    완료 ({local_out.stat().st_size // 1024}KB)")
    print("== 완료. 학생들은 강제 새로고침(Ctrl+F5) 필요 ==")


if __name__ == "__main__":
    main()
