"""특정 daily-reading 파일의 paragraph별 텍스트와 단어 위치를 출력한다.
사용법: py scripts/find_pos.py <file> <para_id> <word> [<word> ...]
"""
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

path = sys.argv[1]
para_id = sys.argv[2]
words = sys.argv[3:]

p = json.load(open(path, encoding="utf-8"))
text = None
for para in p["payload"]["passage"]["paragraphs"]:
    if para["id"] == para_id:
        text = para["text"]
        break
if text is None:
    print(f"NO PARA {para_id}")
    sys.exit(1)
print(f"--- {para_id} (len={len(text)}) ---")
print(text)
print("---")
for w in words:
    i = 0
    found = []
    while True:
        j = text.find(w, i)
        if j < 0:
            break
        found.append((j, j + len(w)))
        i = j + 1
    if not found:
        print(f"{w}: NOT FOUND")
    else:
        for s, e in found:
            print(f"{w}: {s}-{e}  | snippet={text[max(0,s-5):e+5]!r}")
