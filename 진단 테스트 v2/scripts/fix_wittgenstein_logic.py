import os
import json
from glob import glob

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import fix_vector_keys, fix_choice_logic

WITTGENSTEIN_DIR = 'data/wittgenstein'


def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modified = False

    if 'choices' in data:
        correct_choice_id = data.get('correct_choice')
        for choice in data['choices']:
            old_vector = choice.get('vector', {})
            new_vector = fix_vector_keys(old_vector)
            if new_vector != old_vector:
                choice['vector'] = new_vector
                modified = True

            is_correct = (choice['choice_id'] == correct_choice_id)
            if fix_choice_logic(choice, is_correct):
                modified = True

    if 'grading_criteria' in data:
        for criteria in data['grading_criteria']:
            old_vector = criteria.get('vector', {})
            new_vector = fix_vector_keys(old_vector)
            if new_vector != old_vector:
                criteria['vector'] = new_vector
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
