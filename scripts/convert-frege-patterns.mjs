#!/usr/bin/env node
/**
 * 프레게 분석 JSON 의 wrongPattern 을 옛 P1~P18 → 신 18패턴(D1~D10/L1~L8) 으로 일괄 변환.
 * 도메인별로 분기 매핑.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

// 18패턴 가이드(2026-05-13) 기반 매핑
const LIT_MAP = {
  P1: 'L2', P2: 'L1', P3: 'L3', P4: 'L4',
  P5: 'L6', P6: 'L5', P7: 'L1', P8: 'L7',
  P9: 'L7', P10: 'L7',
  P11: 'L1', P12: 'L8', P13: 'L7', P14: 'L7',
  P15: 'L3', P16: 'L7', P17: 'L1', P18: 'L8',
};
const READ_MAP = {
  P1: 'D1', P2: 'D2', P3: 'D3', P4: 'D4',
  P5: 'D5', P6: 'D6', P7: 'D7', P8: 'D8',
  P9: 'D9', P10: 'D10',
  P11: 'D2', P12: 'D9', P13: 'D9', P14: 'D5',
  P15: 'D3', P16: 'D9', P17: 'D2', P18: 'D9',
};

function mapPattern(oldCode, domain) {
  if (!oldCode || typeof oldCode !== 'string') return oldCode;
  if (!oldCode.startsWith('P')) return oldCode;  // 이미 새 코드면 그대로
  const map = domain === 'LIT' ? LIT_MAP : READ_MAP;
  return map[oldCode] || oldCode;
}

function main() {
  const filePath = path.join(ROOT, 'generated', 'frege_analysis_filled.json');
  const a = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let total = 0, changed = 0;
  for (const q of Object.values(a.questions)) {
    const domain = q.domain;
    // wrongPattern 변환
    if (q.wrongPattern && typeof q.wrongPattern === 'object') {
      for (const [cid, p] of Object.entries(q.wrongPattern)) {
        total++;
        const newP = mapPattern(p, domain);
        if (newP !== p) { q.wrongPattern[cid] = newP; changed++; }
      }
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(a, null, 2), 'utf8');
  console.log(`총 wrongPattern 항목 ${total}건, 변환 ${changed}건`);
  // 결과 분포 출력
  const dist = {};
  for (const q of Object.values(a.questions)) {
    for (const p of Object.values(q.wrongPattern || {})) {
      if (p) dist[p] = (dist[p] || 0) + 1;
    }
  }
  console.log('변환 후 분포:', dist);
}
main();
