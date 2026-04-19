"""
D2(선지 키워드 거의 동일) 후보 파일 덤프
"""
import json, re, os

items = []
with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_all_mc.jsonl','r',encoding='utf-8') as f:
    for line in f:
        items.append(json.loads(line))

out = []
for it in items:
    sigs = []
    for c in it['choices']:
        kw = tuple(sorted(set(re.findall(r'[가-힣]{3,}', c.get('text',''))))[:5])
        sigs.append((c.get('id'), kw, c.get('text','')))
    seen = {}
    dup_pair = None
    for cid, kw, txt in sigs:
        if kw in seen and len(kw) >= 3:
            dup_pair = (seen[kw], cid)
            break
        seen[kw] = cid
    if dup_pair:
        out.append({
            'chapter':it['chapter'],'file':it['file'],'number':it['number'],
            'answer':it['answer'],'dup_pair':dup_pair,
            'stem':it['stem'][:200],
            'all_choices':[(c.get('id'),c.get('text','')) for c in it['choices']],
        })

with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_d2_dump.txt','w',encoding='utf-8') as f:
    f.write(f'D2 후보 총 {len(out)}건\n\n')
    for h in out:
        f.write(f'=== {h["chapter"]} {h["file"]} Q{h["number"]} 정답={h["answer"]} 의심쌍={h["dup_pair"]} ===\n')
        f.write(f'STEM: {h["stem"]}\n')
        for cid, ct in h["all_choices"]:
            mark = '★' if cid == h['answer'] else ' '
            f.write(f' {mark} {cid} {ct}\n')
        f.write('\n')
print(f'Saved {len(out)} cases')
