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
aws s3 sync dist/assets/ "s3://${BUCKET}/assets/" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

# 나머지 파일 (index.html 등)은 짧은 캐시
aws s3 sync dist/ "s3://${BUCKET}/" \
  --exclude "assets/*" \
  --cache-control "public, max-age=60" \
  --delete

echo "=== CloudFront 캐시 무효화 ==="
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/index.html" "/"

echo "=== 프론트엔드 배포 완료 ==="
