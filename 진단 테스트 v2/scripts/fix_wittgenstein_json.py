import os
import json
from glob import glob

WITTGENSTEIN_DIR = 'data/wittgenstein'

def fix_json_structure(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    question_obj = data.get('question', {})
    changed = False
    
    # Move choices
    if 'choices' in question_obj:
        data['choices'] = question_obj.pop('choices')
        changed = True
        
    # Move correct_choice
    if 'correct_choice' in question_obj:
        data['correct_choice'] = question_obj.pop('correct_choice')
        changed = True
        
    # Move model_answer
    if 'model_answer' in question_obj:
        data['model_answer'] = question_obj.pop('model_answer')
        changed = True
        
    # Move grading_criteria
    if 'grading_criteria' in question_obj:
        data['grading_criteria'] = question_obj.pop('grading_criteria')
        changed = True
        
    # Move error_path (if accidentally put there, though usually inside choices)
    
    if changed:
        print(f"Fixing {file_path}...")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    files = glob(os.path.join(WITTGENSTEIN_DIR, '**', 'questions', '*.json'), recursive=True)
    print(f"Found {len(files)} files.")
    for f in files:
        fix_json_structure(f)
    print("Done.")

if __name__ == "__main__":
    main()
