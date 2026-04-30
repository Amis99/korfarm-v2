#!/usr/bin/env python3
"""confirm.questions의 answerRanges가 답안 텍스트와 일치하는지 검증"""
import json
import sys
from pathlib import Path

def verify(fn):
    with open(fn, encoding='utf-8') as f:
        data = json.load(f)

    paras = {p['id']: p['text'] for p in data['payload']['passage']['paragraphs']}
    questions = data['payload']['confirm']['questions']

    errors = []
    snippets = []
    for q in questions:
        qid = q['id']
        ans_text = q.get('answerText', '')
        candidates = [w.strip() for w in ans_text.split('/')]
        snippets.append(f"=== {qid} | mode={q.get('answerMatchMode')} | ans={ans_text}")
        for r in q['answerRanges']:
            pid = r['paragraphId']
            s, e = r['start'], r['end']
            if pid not in paras:
                errors.append(f"  {qid}: paragraphId {pid} not found")
                continue
            text = paras[pid]
            if e > len(text):
                errors.append(f"  {qid}: range {pid}[{s}:{e}] exceeds text length {len(text)}")
                continue
            actual = text[s:e]
            snippets.append(f"  {pid}[{s}:{e}] = {actual!r}")
            if actual not in candidates:
                errors.append(f"  {qid}: range {pid}[{s}:{e}]={actual!r} not in {candidates}")

    return errors, snippets

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    for arg in sys.argv[1:]:
        errors, snippets = verify(arg)
        print(f"### {arg}")
        for s in snippets:
            print(s)
        if errors:
            print(f"FAIL: {len(errors)} errors")
            for e in errors:
                print(e)
        else:
            print("OK")

if __name__ == '__main__':
    main()
