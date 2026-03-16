import os
import json
import glob
import argparse

def fix_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return False

    modified = False

    # 1. Fix Grading Criteria (Descriptive)
    if 'grading_criteria' in data:
        for idx, criterion in enumerate(data['grading_criteria']):
            if 'criteria_id' not in criterion:
                criterion['criteria_id'] = f"C{idx+1}"
                modified = True

    # 2. Fix Vectors (Multiple Choice)
    if 'choices' in data:
        correct_id = data.get('correct_choice')
        for choice in data['choices']:
            is_correct = (choice['choice_id'] == correct_id)
            
            if 'vector' in choice:
                new_vector = {}
                for key, value in choice['vector'].items():
                    # If incorrect answer has positive value, flip it to negative
                    if not is_correct and value > 0:
                        new_vector[key] = -max(1, value // 2) # e.g. 10 -> -5
                        modified = True
                    else:
                        new_vector[key] = value
                choice['vector'] = new_vector

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Fixed {os.path.basename(file_path)}")
        return True
    return False

def main():
    default_base_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'russell')
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-dir', default=default_base_dir, help='Russell data directory')
    args = parser.parse_args()

    base_dir = args.base_dir
    files = glob.glob(os.path.join(base_dir, "**", "*.json"), recursive=True)
    
    count = 0
    for file_path in files:
        if "metadata.json" in file_path:
            continue
        if fix_data(file_path):
            count += 1
            
    print(f"Fixed {count} files.")

if __name__ == "__main__":
    main()
