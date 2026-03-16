import os
import json
import glob
import argparse

def fix_question_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {file_path}")
            return False

    modified = False
    
    # Check if 'question' key exists
    if 'question' in data and isinstance(data['question'], dict):
        q_dict = data['question']
        
        # Move 'choices' to root
        if 'choices' in q_dict:
            data['choices'] = q_dict.pop('choices')
            modified = True
            print(f"Moved choices to root in {file_path}")
            
        # Move 'correct_choice' to root
        if 'correct_choice' in q_dict:
            data['correct_choice'] = q_dict.pop('correct_choice')
            modified = True
            print(f"Moved correct_choice to root in {file_path}")

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    return False

def main():
    default_base_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'russell')
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-dir', default=default_base_dir, help='Russell data directory')
    args = parser.parse_args()

    base_dir = args.base_dir
    files = glob.glob(os.path.join(base_dir, "**", "*.json"), recursive=True)
    
    print(f"Found {len(files)} files in {base_dir}")
    count = 0
    for file_path in files:
        if "metadata.json" in file_path:
            continue
        if fix_question_json(file_path):
            count += 1
            
    print(f"Fixed {count} files.")

if __name__ == "__main__":
    main()
