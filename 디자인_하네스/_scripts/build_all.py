# -*- coding: utf-8 -*-
"""
build_all.py
12 레벨 × 1 권(=ch1~4)을 일괄 빌드.
"""
from __future__ import annotations
import sys, json, io, traceback
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_one import build_one

LEVELS = [
    '소쉬르1', '소쉬르2', '소쉬르3',
    '프레게1', '프레게2', '프레게3',
    '러셀1', '러셀2', '러셀3',
    '비트겐슈타인1', '비트겐슈타인2', '비트겐슈타인3',
]

def main():
    results = []
    for lv in LEVELS:
        try:
            r = build_one(lv, 1)
        except Exception as e:
            traceback.print_exc()
            r = {'level': lv, 'vol': 1, 'success': False, 'pages': 0, 'pdf': None, 'excerpt': str(e)}
        results.append(r)

    print('\n\n========== 빌드 결과 요약 ==========')
    print(f'{"레벨":<14} {"성공":<6} {"페이지":<6}  PDF')
    print('-' * 70)
    for r in results:
        print(f'{r["level"]:<14} {"OK" if r["success"] else "FAIL":<6} {r["pages"]:<6}  {r.get("pdf") or "(없음)"}')
    print('-' * 70)
    fail = [r for r in results if not r['success']]
    if fail:
        print('\n실패 상세:')
        for r in fail:
            print(f'\n[{r["level"]}]')
            print(r.get('excerpt') or '(no log)')

    # JSON 저장
    out_json = HERE.parent / 'output' / 'build_all_results.json'
    out_json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\n결과 JSON: {out_json}')


if __name__ == '__main__':
    main()
