#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""단어 위치 검증 도우미. 인자: 파일경로 단어1 단어2 ..."""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = sys.argv[1]
words = sys.argv[2:]
with open(path, encoding='utf-8') as f:
    d = json.load(f)
paragraphs = d['payload']['passage']['paragraphs']
for w in words:
    print(f'\n=== "{w}" ===')
    total = 0
    for p in paragraphs:
        text = p['text']
        idx = 0
        positions = []
        while True:
            j = text.find(w, idx)
            if j < 0:
                break
            positions.append((j, j + len(w)))
            idx = j + 1
        if positions:
            total += len(positions)
            for s, e in positions:
                snippet = text[max(0, s-5):min(len(text), e+5)]
                print(f'  {p["id"]} start={s} end={e}  ...{snippet}...')
    print(f'  total={total}')
