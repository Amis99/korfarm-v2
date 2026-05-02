#!/bin/bash
# EC2 에 typst CLI 설치 (시험지 PDF 자동 생성용).
# idempotent — 이미 설치돼 있으면 스킵.
set -euo pipefail

EC2_HOST="${EC2_HOST:-43.200.104.102}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-$HOME/.ssh/korfarm-ec2.pem}"

TYPST_VERSION="v0.13.1"
TYPST_TARBALL="typst-x86_64-unknown-linux-musl.tar.xz"
TYPST_URL="https://github.com/typst/typst/releases/download/${TYPST_VERSION}/${TYPST_TARBALL}"

echo "=== EC2 (${EC2_HOST}) typst 설치 확인 ==="

ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" bash <<EOF
set -e
if command -v typst >/dev/null 2>&1; then
  INSTALLED_VER=\$(typst --version 2>&1 | head -1)
  echo "이미 설치됨: \$INSTALLED_VER — 스킵"
  exit 0
fi

echo "typst 미설치 — ${TYPST_VERSION} 다운로드 시작"
TMPDIR=\$(mktemp -d)
cd "\$TMPDIR"
curl -fL --retry 3 -o typst.tar.xz "${TYPST_URL}"
tar -xJf typst.tar.xz
sudo mv typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst
sudo chmod +x /usr/local/bin/typst
cd /tmp
rm -rf "\$TMPDIR"
echo "설치 완료: \$(typst --version)"
EOF

echo "=== EC2 시스템 한국어 폰트 설치 확인 ==="
ssh -i "$EC2_KEY" "${EC2_USER}@${EC2_HOST}" bash <<'EOF'
set -e
if fc-list | grep -qi "Noto Sans CJK KR"; then
  echo "Noto Sans CJK 이미 설치됨 — 스킵"
else
  echo "Noto Sans CJK 미설치 — yum 설치"
  sudo yum install -y google-noto-sans-cjk-fonts google-noto-serif-cjk-fonts || \
    sudo amazon-linux-extras install -y epel || true
  sudo fc-cache -fv
fi
EOF

echo "=== 완료 ==="
