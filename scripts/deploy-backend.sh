#!/bin/bash
# 백엔드 EC2 배포 스크립트
set -euo pipefail

EC2_HOST="${EC2_HOST:?EC2 호스트 주소를 설정하세요}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-~/.ssh/korfarm-ec2.pem}"
REMOTE_DIR="/opt/korfarm"
BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"

echo "=== 백엔드 빌드 ==="
cd "$BACKEND_DIR"
./gradlew clean bootJar -x test

JAR_FILE=$(ls -t build/libs/*.jar | grep -v plain | head -1)
JAR_NAME=$(basename "$JAR_FILE")
echo "빌드된 JAR: $JAR_NAME"

echo "=== 이전 JAR 백업 ==="
ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" \
  "if [ -f ${REMOTE_DIR}/app.jar ]; then cp ${REMOTE_DIR}/app.jar ${REMOTE_DIR}/app.jar.prev; fi"

echo "=== JAR 업로드 ==="
scp -i "$EC2_KEY" "$JAR_FILE" "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/app.jar"

echo "=== 서비스 재시작 ==="
ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" "sudo systemctl restart korfarm"

echo "=== 헬스체크 (최대 30초 대기) ==="
for i in $(seq 1 10); do
  sleep 3
  STATUS=$(ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/v1/health 2>/dev/null" || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "헬스체크 성공!"
    exit 0
  fi
  echo "대기 중... ($i/10)"
done

echo "경고: 헬스체크 실패. 로그를 확인하세요."
echo "  ssh -i $EC2_KEY ${EC2_USER}@${EC2_HOST} 'journalctl -u korfarm -n 50'"
exit 1
