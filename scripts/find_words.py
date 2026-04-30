#!/usr/bin/env python3
"""단어 위치 검증 스크립트 - 일일독해 confirm 답안 검증용"""
import json
import sys

def find_all(text, word):
    """텍스트에서 단어의 모든 위치를 찾음 (start, end) 튜플 리스트"""
    results = []
    idx = 0
    while True:
        i = text.find(word, idx)
        if i < 0:
            break
        results.append((i, i + len(word)))
        idx = i + 1
    return results

def main():
    if len(sys.argv) < 3:
        print("Usage: find_words.py <json_path> <word1> [<word2> ...]")
        sys.exit(1)

    fn = sys.argv[1]
    words = sys.argv[2:]

    with open(fn, encoding='utf-8') as f:
        data = json.load(f)

    paras = {p['id']: p['text'] for p in data['payload']['passage']['paragraphs']}

    for w in words:
        print(f"=== '{w}' ===")
        for pid, text in paras.items():
            results = find_all(text, w)
            for s, e in results:
                ctx_start = max(0, s - 6)
                ctx_end = min(len(text), e + 6)
                ctx = text[ctx_start:ctx_end].replace('\n', ' ')
                print(f"  {pid}: start={s} end={e}  [..{ctx}..]")

if __name__ == '__main__':
    main()
