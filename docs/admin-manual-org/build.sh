#!/bin/bash
# 기관 관리자 매뉴얼 빌드 — 캡처 + xelatex
# 사용:
#   bash build.sh                  # 캡처 + 빌드
#   SKIP_CAPTURE=1 bash build.sh   # LaTeX 만 재빌드
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p output images

# 1) Playwright 자동 캡처
if [[ "${SKIP_CAPTURE:-0}" != "1" ]]; then
  echo "→ Playwright 캡처 (ORG_ADMIN)"
  node scripts/capture.mjs
fi

# 2) xelatex 2회 (목차·참조 안정화)
echo "→ xelatex 1차"
xelatex -interaction=nonstopmode -output-directory=output main.tex > output/build.log 2>&1 || {
  tail -40 output/build.log
  echo "❌ xelatex 1차 실패 — output/build.log 참조"
  exit 1
}
echo "→ xelatex 2차"
xelatex -interaction=nonstopmode -output-directory=output main.tex >> output/build.log 2>&1 || {
  tail -40 output/build.log
  echo "❌ xelatex 2차 실패 — output/build.log 참조"
  exit 1
}

# 3) PDF 이름 정리
mv output/main.pdf output/기관관리자_매뉴얼.pdf
echo "✅ output/기관관리자_매뉴얼.pdf 생성 완료"
ls -lh output/기관관리자_매뉴얼.pdf
