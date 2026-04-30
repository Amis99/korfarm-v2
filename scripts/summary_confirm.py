import json
for n in range(291, 301):
    fn = f'frontend/public/daily-reading/russell1/{n}.json'
    d = json.load(open(fn, encoding='utf-8'))
    qs = d['payload']['confirm']['questions']
    print(f'{n}: {len(qs)}문제')
    for q in qs:
        print(f"  {q['id']} ({q['answerMatchMode']}): {q['answerText']} | ranges={len(q['answerRanges'])}")
