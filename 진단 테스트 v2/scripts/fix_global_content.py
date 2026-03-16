import os
import json
from glob import glob

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import ALLOWED_VECTOR_KEYS, KEY_MAPPING, ERROR_PATH_MAPPING, fix_vector_keys, fix_choice_logic

DATA_DIR = 'data'


def fix_criteria_id(criteria):
    modified = False
    if 'criteria_id' in criteria:
        cid = criteria['criteria_id']
        if isinstance(cid, str):
            if cid.upper().startswith('C') and cid[1:].isdigit():
                criteria['criteria_id'] = int(cid[1:])
                modified = True
            elif cid.isdigit():
                criteria['criteria_id'] = int(cid)
                modified = True
    return modified


def unwrap_nested_properties(data):
    modified = False
    if 'question' in data and isinstance(data['question'], dict):
        q_dict = data['question']
        keys_to_move = ['choices', 'correct_choice', 'model_answer', 'grading_criteria']
        for k in keys_to_move:
            if k in q_dict:
                data[k] = q_dict[k]
                del q_dict[k]
                modified = True
    return modified


def fix_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return

    modified = False

    if unwrap_nested_properties(data):
        modified = True

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
            if fix_criteria_id(criteria):
                modified = True
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
    files = glob(os.path.join(DATA_DIR, '**', 'questions', '*.json'), recursive=True)
    print(f"Found {len(files)} question files. Starting fix...")
    for f in files:
        fix_file(f)


if __name__ == "__main__":
    main()
