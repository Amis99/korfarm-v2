import os
import json
import glob
import sys
from pathlib import Path

# Add script dir to path to reuse validate_question logic if needed
# but better to reimplement or import cleanly.
# We will use subprocess to call validate_question.py for each file to reuse its exact logic,
# or we can import it. importing is better.

sys.path.append(os.path.dirname(__file__))
import validate_question

ROOT_DIR = os.path.join(os.path.dirname(__file__), '../data/sohssure')

def audit_directory(dir_path):
    print(f"\n--- Auditing {os.path.basename(dir_path)} ---")
    
    # 1. Metadata Correctness
    meta_path = os.path.join(dir_path, 'metadata.json')
    if not os.path.exists(meta_path):
        print("  [FAIL] Missing metadata.json")
        return
    
    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
            print(f"  [INFO] Metadata: ID={meta.get('passage_id')}, Level={meta.get('level')}, Genre={meta.get('genre')}")
    except Exception as e:
        print(f"  [FAIL] Invalid metadata.json: {e}")
        return

    # 2. Passage Existence
    passage_path = os.path.join(dir_path, 'passage.md')
    if not os.path.exists(passage_path):
        print("  [FAIL] Missing passage.md")
    else:
        print("  [PASS] passage.md exists")

    # 3. Question Validation
    qs_dir = os.path.join(dir_path, 'questions')
    if not os.path.exists(qs_dir):
        print("  [FAIL] Missing questions directory")
        return

    questions = glob.glob(os.path.join(qs_dir, '*.json'))
    questions.sort()
    
    if len(questions) != 10:
        print(f"  [WARN] Expected 10 questions, found {len(questions)}")
    
    passed_count = 0
    schema = validate_question.load_schema()
    
    for q in questions:
        print(f"  Checking {os.path.basename(q)}...", end='')
        is_valid = validate_question.validate_file(q, schema)
        if is_valid:
            passed_count += 1
        
        # Additional check: Does Question Passage ID match Directory?
        try:
            with open(q, 'r', encoding='utf-8') as f:
                q_data = json.load(f)
                q_pid = q_data.get('passage', {}).get('passage_id')
                if q_pid != meta.get('passage_id'):
                    print(f"    [FAIL] Passage ID Mismatch! Question says {q_pid}, Metadata says {meta.get('passage_id')}")
                    passed_count = 0 # invalidate
        except:
            pass

    print(f"  => Score: {passed_count}/{len(questions)} Passed")

def main():
    if not os.path.exists(ROOT_DIR):
        print(f"Error: {ROOT_DIR} does not exist")
        return

    dirs = sorted([d for d in glob.glob(os.path.join(ROOT_DIR, '*')) if os.path.isdir(d)])
    
    print(f"Found {len(dirs)} passage directories.")
    
    for d in dirs:
        audit_directory(d)

if __name__ == "__main__":
    main()
