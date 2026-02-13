import json
import re
from pathlib import Path


MISSING_PATH = Path("witt_lit_local_md_examq_missing_20260212.json")


PAT = re.compile(r"정답|해설|①|②|③|④|⑤|\*\*\s*\d+\s*\\?\.|^\s*\d+\s*\\?\.|물음|<보기>|〈보기〉")


def main() -> None:
    rows = json.loads(MISSING_PATH.read_text(encoding="utf-8"))
    for r in rows:
        path = Path(r["filePath"])
        print("=" * 80)
        print(r.get("newId"), r.get("title"), r.get("reason"))
        print(path)
        if not path.exists():
            print("! file missing")
            continue
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        hits = []
        for i, ln in enumerate(lines, start=1):
            if PAT.search(ln.strip()):
                hits.append((i, ln))
        if not hits:
            print("! no pattern hits")
            continue
        for i, ln in hits[:160]:
            print(f"{i}:{ln.encode('unicode_escape').decode()}")


if __name__ == "__main__":
    main()

