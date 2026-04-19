"""
비트겐슈타인3 객관식 전수 추출/통계 스크립트
"""
import json, os, sys

base = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\비트겐슈타인3'
out = []
files_count = 0
total = 0
ans_dist = {'①':0,'②':0,'③':0,'④':0,'⑤':0,'기타':0}
by_chapter = {}
by_area = {'reading':0,'literature':0,'grammar':0}

for ch in sorted(os.listdir(base)):
    if not ch.startswith('ch'): continue
    chdir = os.path.join(base, ch)
    chcnt = 0
    for fn in sorted(os.listdir(chdir)):
        if not (fn.startswith('reading_') or fn.startswith('literature_') or fn == 'grammar.json'): continue
        if not fn.endswith('.json'): continue
        path = os.path.join(chdir, fn)
        try:
            with open(path,'r',encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print('ERR', path, e, file=sys.stderr); continue
        files_count += 1
        area = 'reading' if fn.startswith('reading_') else ('literature' if fn.startswith('literature_') else 'grammar')
        q = data.get('questions', {})
        if isinstance(q, dict):
            mc = q.get('multipleChoice', [])
        elif isinstance(q, list):
            # grammar.json: questions가 list, 객관식만 추리기
            mc = [it for it in q if isinstance(it, dict) and 'choices' in it and 'answer' in it]
        else:
            mc = []
        for item in mc:
            total += 1
            chcnt += 1
            by_area[area] += 1
            ans = item.get('answer','').strip()
            if ans in ans_dist: ans_dist[ans] += 1
            else: ans_dist['기타'] += 1
            out.append({
                'chapter': ch,
                'file': fn,
                'area': area,
                'number': item.get('number'),
                'stem': item.get('stem',''),
                'choices': item.get('choices',[]),
                'answer': ans,
                'explanation': item.get('explanation',''),
            })
    by_chapter[ch] = chcnt

# JSONL로 저장
with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_all_mc.jsonl','w',encoding='utf-8') as f:
    for r in out:
        f.write(json.dumps(r, ensure_ascii=False) + '\n')

print('총 파일:', files_count)
print('총 객관식:', total)
print('영역별:', by_area)
print('정답 분포:', ans_dist)
for k,v in sorted(by_chapter.items()):
    print(f'  {k}: {v}')
