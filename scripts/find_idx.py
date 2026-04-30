"""특정 단어의 모든 위치 (start,end) 반환."""
import sys, json
fp = sys.argv[1]
pid = sys.argv[2]
needle = sys.argv[3]
d = json.load(open(fp, encoding='utf-8'))
for p in d['payload']['passage']['paragraphs']:
    if p['id'] == pid:
        text = p['text']
        positions = []
        i = 0
        while True:
            idx = text.find(needle, i)
            if idx < 0: break
            positions.append((idx, idx+len(needle)))
            i = idx + 1
        for s,e in positions:
            print(f"  start={s}, end={e}, slice='{text[s:e]}'")
        if not positions:
            print('  NOT FOUND')
        break
