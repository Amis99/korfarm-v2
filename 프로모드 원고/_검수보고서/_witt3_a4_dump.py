"""
A4 케이스를 UTF-8 파일로 출력 (콘솔 인코딩 우회)
"""
import json, os

items = []
with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_all_mc.jsonl','r',encoding='utf-8') as f:
    for line in f:
        items.append(json.loads(line))

strong = ['전혀','절대','완전히','결코','오로지','반드시','오직']
neg = ['적절하지 않','일치하지 않','옳지 않','어긋나는','부합하지 않','없는 것은','아닌 것은']

out = []
for it in items:
    if any(n in it['stem'] for n in neg):
        ans_text = next((c.get('text','') for c in it['choices'] if c.get('id') == it['answer']), '')
        for w in strong:
            if w in ans_text:
                out.append({
                    'chapter':it['chapter'],'file':it['file'],'number':it['number'],
                    'answer':it['answer'],'word':w,
                    'stem':it['stem'],
                    'ans_text':ans_text,
                    'all_choices':[(c.get('id'),c.get('text','')) for c in it['choices']],
                })
                break

with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_a4_dump.txt','w',encoding='utf-8') as f:
    f.write(f'A4 후보 총 {len(out)}건\n\n')
    for h in out:
        f.write(f'=== {h["chapter"]} {h["file"]} Q{h["number"]} 정답={h["answer"]} 단정어={h["word"]} ===\n')
        f.write(f'STEM: {h["stem"]}\n')
        f.write(f'정답텍스트({h["answer"]}): {h["ans_text"]}\n')
        f.write(f'5선지 전체:\n')
        for cid, ct in h["all_choices"]:
            f.write(f'  {cid} {ct}\n')
        f.write('\n')

print(f'Saved {len(out)} cases to _witt3_a4_dump.txt')
