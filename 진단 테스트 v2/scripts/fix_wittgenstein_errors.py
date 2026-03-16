import os
import json
from glob import glob

WITTGENSTEIN_DIR = 'data/wittgenstein'

ALLOWED_TYPES = [
    "지문근거형",
    "외부지식형",
    "논리추론형",
    "어휘단독형",
    "서술형"
]

TYPE_MAPPING = {
    "구조분석형": "논리추론형",
    # Add others if found
}

def fix_errors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    changed = False
    
    # 1. Fix Question Type
    q_type = data.get('question', {}).get('type')
    if q_type and q_type not in ALLOWED_TYPES:
        if q_type in TYPE_MAPPING:
            data['question']['type'] = TYPE_MAPPING[q_type]
            print(f"Fixed Type: {q_type} -> {TYPE_MAPPING[q_type]} in {file_path}")
            changed = True
        else:
            print(f"WARNING: Unknown Type '{q_type}' in {file_path}")
            
    # 2. Fix Criteria ID
    if 'grading_criteria' in data:
        criteria = data['grading_criteria']
        for c in criteria:
            cid = c.get('criteria_id')
            if isinstance(cid, str) and cid.startswith('C'):
                try:
                    c['criteria_id'] = int(cid[1:])
                    print(f"Fixed Criteria ID: {cid} -> {c['criteria_id']} in {file_path}")
                    changed = True
                except ValueError:
                    pass
            elif isinstance(cid, str):
                # Try to just int it
                try:
                    c['criteria_id'] = int(cid)
                    changed = True
                except:
                    pass

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    files = glob(os.path.join(WITTGENSTEIN_DIR, '**', 'questions', '*.json'), recursive=True)
    print(f"Found {len(files)} files.")
    for f in files:
        fix_errors(f)
    print("Done fixing errors.")

if __name__ == "__main__":
    main()
