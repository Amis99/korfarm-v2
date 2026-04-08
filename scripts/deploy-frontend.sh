#!/bin/bash
# 프론트엔드 S3 배포 스크립트
set -euo pipefail

BUCKET="korfarm-frontend"
DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:?CloudFront Distribution ID를 설정하세요}"
FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"

echo "=== 프론트엔드 빌드 ==="
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "=== S3 업로드 ==="
# assets 폴더는 장기 캐시 (해시된 파일명)
# --delete 사용 금지: 옛 청크를 즉시 지우면, 이전 index.html을 띄워둔 사용자가
# 동적 import 시 ChunkLoadError(403)를 만남. 청크 파일명은 해시라 충돌 없음.
# 누적 비용은 미미 (1배포당 수 MB).
aws s3 sync dist/assets/ "s3://${BUCKET}/assets/" \
  --cache-control "public, max-age=31536000, immutable"

# 나머지 파일 (index.html 등)은 짧은 캐시
# test-pdfs/와 assets/는 별도 관리 — 삭제 대상에서 제외
aws s3 sync dist/ "s3://${BUCKET}/" \
  --exclude "assets/*" \
  --exclude "test-pdfs/*" \
  --cache-control "public, max-age=60" \
  --delete

echo "=== CloudFront 캐시 무효화 ==="
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "=== 프론트엔드 배포 완료 ==="
