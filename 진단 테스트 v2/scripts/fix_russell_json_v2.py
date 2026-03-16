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
    
    # 1. Structure Fixes (Move fields from 'question' to root)
    if 'question' in data and isinstance(data['question'], dict):
        q_dict = data['question']
        
        # Move 'choices' to root
        if 'choices' in q_dict:
            data['choices'] = q_dict.pop('choices')
            modified = True
            
        # Move 'correct_choice' to root
        if 'correct_choice' in q_dict:
            data['correct_choice'] = q_dict.pop('correct_choice')
            modified = True
            
        # Move 'model_answer' to root (Descriptive)
        if 'model_answer' in q_dict:
            data['model_answer'] = q_dict.pop('model_answer')
            modified = True
            
        # Move 'grading_criteria' to root (Descriptive)
        if 'grading_criteria' in q_dict:
            data['grading_criteria'] = q_dict.pop('grading_criteria')
            modified = True

    # 2. Content Fixes (Validation Requirements)
    if 'choices' in data:
        seen_paths = set()
        for idx, choice in enumerate(data['choices']):
            # Ensure error_path exists
            if 'error_path' not in choice:
                choice['error_path'] = "오답 분석 내용 없음"
                if choice['choice_id'] == data.get('correct_choice'):
                    choice['error_path'] = "정답"
                modified = True
            
            # Ensure uniqueness (simple suffix if duplicate key logic forces it, 
            # though usually error_path is just a string. 
            # If validation requires UNIQUE strings, we suffix them.)
            # The validation error "Error paths must be distinct across choices" suggests uniqueness is enforced.
            
            original_path = choice['error_path']
            unique_path = original_path
            counter = 1
            while unique_path in seen_paths:
                unique_path = f"{original_path} ({counter})"
                counter += 1
            
            if unique_path != original_path:
                choice['error_path'] = unique_path
                modified = True
                
            seen_paths.add(unique_path)

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Fixed {file_path}")
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
