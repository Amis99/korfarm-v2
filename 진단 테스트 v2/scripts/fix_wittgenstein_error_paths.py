import os
import json
from glob import glob

WITTGENSTEIN_DIR = 'data/wittgenstein'

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    
    # fix choices error_path
    if 'choices' in data:
        correct_choice_id = data.get('correct_choice')
        for choice in data['choices']:
            if 'error_path' not in choice:
                if choice['choice_id'] == correct_choice_id:
                    choice['error_path'] = "정답"
                else:
                    choice['error_path'] = "지문 내용 불일치"
                modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Fixed {file_path}")

def main():
    files = glob(os.path.join(WITTGENSTEIN_DIR, '**', 'questions', '*.json'), recursive=True)
    for f in files:
        fix_file(f)

if __name__ == "__main__":
    main()
