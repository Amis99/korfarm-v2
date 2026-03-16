import os
import json
from glob import glob

WITTGENSTEIN_DIR = 'data/wittgenstein'

def check_error_path(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if data.get('question', {}).get('type') == '서술형':
        return

    choices = data.get('choices', [])
    for i, c in enumerate(choices):
        if 'error_path' not in c:
            print(f"MISSING error_path in {file_path}, Choice {c['choice_id']}")

def main():
    files = glob(os.path.join(WITTGENSTEIN_DIR, '**', 'questions', '*.json'), recursive=True)
    for f in files:
        check_error_path(f)

if __name__ == "__main__":
    main()
