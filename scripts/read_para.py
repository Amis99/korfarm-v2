import sys, json
fp = sys.argv[1]
d = json.load(open(fp, encoding='utf-8'))
print('TITLE:', d.get('title'))
print('AREA:', d.get('area'), '/', d.get('subArea'))
for p in d['payload']['passage']['paragraphs']:
    print(f"{p['id']} (len={len(p['text'])}):")
    print(p['text'])
    print()
