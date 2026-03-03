#!/bin/bash
# 백엔드 롤백 스크립트 — 이전 JAR로 복원
set -euo pipefail

EC2_HOST="${EC2_HOST:?EC2 호스트 주소를 설정하세요}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-~/.ssh/korfarm-ec2.pem}"
REMOTE_DIR="/opt/korfarm"

echo "=== 이전 JAR로 롤백 ==="
ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" bash <<'REMOTE'
set -euo pipefail
if [ ! -f /opt/korfarm/app.jar.prev ]; then
  echo "에러: 이전 JAR 파일이 없습니다."
  exit 1
fi
cp /opt/korfarm/app.jar.prev /opt/korfarm/app.jar
sudo systemctl restart korfarm
REMOTE

echo "=== 헬스체크 (최대 30초 대기) ==="
for i in $(seq 1 10); do
  sleep 3
  STATUS=$(ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/v1/health 2>/dev/null" || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "롤백 성공!"
    exit 0
  fi
  echo "대기 중... ($i/10)"
done

echo "경고: 롤백 후 헬스체크 실패. 로그를 확인하세요."
exit 1
