import json
import os

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import load_config, get_test_dirs, PROJECT_ROOT

OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'output', 'final_sohssure_level1.json')

GENRE_MAP = {
    "문학": "lit",
    "비문학": "non"
}


def assemble():
    final_data = {
        "test_name": "Sohssure Level 1 Diagnostic Test",
        "total_questions": 60,
        "structure": "Grade 1-3 (Lit/Non-Lit)",
        "passages": []
    }

    question_global_idx = 1

    config = load_config()
    passage_dirs = get_test_dirs(config, 'sohssure')
    if not passage_dirs:
        print("Error: No Sohssure passages configured in config.json")
        return

    for path in passage_dirs:
        print(f"Processing {os.path.basename(path)} from {path}...")
        if not os.path.exists(path):
            print(f"  [ERROR] Missing directory: {path}")
            return

        with open(os.path.join(path, 'passage.md'), 'r', encoding='utf-8') as f:
            passage_text = f.read()

        with open(os.path.join(path, 'metadata.json'), 'r', encoding='utf-8') as f:
            meta = json.load(f)

        grade = meta.get('level')
        genre = GENRE_MAP.get(meta.get('genre'), meta.get('genre', ''))

        passage_obj = {
            "passage_id": meta.get('passage_id'),
            "grade": grade,
            "genre": genre,
            "content": passage_text,
            "questions": []
        }

        q_dir = os.path.join(path, 'questions')
        q_files = sorted([f for f in os.listdir(q_dir) if f.endswith('.json')])

        if len(q_files) != 10:
            print(f"  [ERROR] Expected 10 questions in {os.path.basename(path)}, found {len(q_files)}")
            return

        for qf in q_files:
            with open(os.path.join(q_dir, qf), 'r', encoding='utf-8') as f:
                q_data = json.load(f)

            q_data['global_number'] = question_global_idx
            passage_obj['questions'].append(q_data)
            question_global_idx += 1

        final_data['passages'].append(passage_obj)
        print(f"  Added {len(passage_obj['questions'])} questions.")

    grades = [p.get('grade') for p in final_data['passages'] if p.get('grade') is not None]
    if grades:
        final_data['structure'] = f"Grade {min(grades)}-{max(grades)} (Lit/Non-Lit)"

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully assembled {question_global_idx - 1} questions into {OUTPUT_FILE}")


if __name__ == "__main__":
    assemble()
