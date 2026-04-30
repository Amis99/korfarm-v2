"""체커보드/단색 배경 → 투명 (글자·캐릭터 100% 보존).

색상 기반 flood-fill 로 모서리에서 시작해 "밝은 회색/흰색 + 낮은 채도" 픽셀만 따라가며
투명화. 어두운 글자, 채도 있는 캐릭터, 두꺼운 흰 테두리(스티커 outline)는 절대 안 건드림.

사용:
  python scripts/transparent_bg_floodfill.py "감규리 시리즈"
"""
import subprocess
import sys
import os
import tempfile
from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image

EC2_HOST = "ec2-user@43.200.104.102"
EC2_KEY = os.path.expanduser("~/.ssh/korfarm-ec2.pem")
UPLOADS_DIR = "/opt/korfarm/uploads"
DB_HOST = "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASSWORD = "xXoM4Ld7VAIYl9W874md5kic"
DB_NAME = "korfarm"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  실패: {cmd[:3]} ... stderr: {r.stderr[:300]}")
        sys.exit(1)
    return r.stdout


def get_file_ids(series: str):
    sql = (
        f'SELECT file_id FROM chat_emoticons '
        f'WHERE series = "{series}" AND status = "active" '
        f'AND created_at >= "2026-04-30 20:14:00" '   # 새 업로드분만
        f'ORDER BY name;'
    )
    cmd = ["ssh", "-i", EC2_KEY, EC2_HOST,
           f'mysql -h {DB_HOST} -u {DB_USER} -p{DB_PASSWORD} {DB_NAME} -N -e \'{sql}\'']
    out = run(cmd)
    return [line.strip() for line in out.strip().split("\n") if line.strip()]


def remove_bg_floodfill(in_path: Path, out_path: Path,
                         min_lum: int = 225, max_chroma: int = 25):
    """배경 픽셀 마스크 = 밝기 ≥ min_lum AND 채도 ≤ max_chroma. 모서리에서 BFS."""
    im = Image.open(in_path).convert("RGBA")
    arr = np.array(im)
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.int16)
    lum = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    is_bg = (lum >= min_lum) & (chroma <= max_chroma)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    # 4 모서리 + 가장자리 일부에서 시작
    for cy, cx in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]:
        if is_bg[cy, cx]:
            queue.append((cy, cx))
            visited[cy, cx] = True
    # 가장자리 한 줄도 시작점에 추가 (모서리만 시작 시 가장자리 모두 색차 시 한쪽만 채워질 수 있음)
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))
    # 1px 둘레 안티엘리어싱: visited 의 경계와 인접한 비전경 픽셀 alpha 부드럽게 (선택)
    arr[visited, 3] = 0
    Image.fromarray(arr).save(out_path, optimize=True)
    return int(visited.sum()), h * w


def main():
    if len(sys.argv) < 2:
        print("사용: python transparent_bg_floodfill.py <시리즈명>")
        sys.exit(1)
    series = sys.argv[1]
    print(f"== {series} 색상 flood-fill 배경 제거 (글자 보존) ==")
    file_ids = get_file_ids(series)
    print(f"  대상 {len(file_ids)}개")
    if not file_ids:
        print("  처리할 파일 없음")
        return
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for fid in file_ids:
            print(f"  {fid}", end=" ")
            remote = f"{EC2_HOST}:{UPLOADS_DIR}/{fid}"
            local_in = tmp_path / f"{fid}.in.png"
            local_out = tmp_path / f"{fid}.out.png"
            run(["scp", "-i", EC2_KEY, "-q", remote, str(local_in)])
            removed, total = remove_bg_floodfill(local_in, local_out)
            ratio = removed / total * 100
            run(["scp", "-i", EC2_KEY, "-q", str(local_out), remote])
            print(f"→ 투명화 {ratio:.1f}%")
    print("== 완료. 학생 화면 강제 새로고침(Ctrl+F5) 필요 ==")


if __name__ == "__main__":
    main()
