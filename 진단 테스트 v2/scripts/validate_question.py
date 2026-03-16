import json
import argparse
import os
import jsonschema
from typing import List, Dict, Any

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '../schemas/question_schema.json')

def load_schema():
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_business_rules(data: Dict[str, Any]) -> List[str]:
    errors = []
    
    # 0. Check Question Type
    q_type = data.get('question', {}).get('type', '')
    
    if q_type == '서술형':
        # Descriptive Validation Logic
        criteria = data.get('grading_criteria', [])
        if not criteria:
            errors.append("Descriptive questions must have 'grading_criteria'")
            return errors
            
        all_competencies = set()
        total_score = 0
        
        for criterion in criteria:
            vector = criterion.get('vector', {})
            total_score += criterion.get('score', 0)
            
            for k, v in vector.items():
                all_competencies.add(k)
                if v <= 0:
                     # Usually meeting criteria gives positive points. 
                     # Allow negative if it's penalty criteria, but warn if unusual.
                     # For now, let's assume strict positive for retrieval of competency.
                     # But user said "how to set vectors". Let's update schema to be flexible, but here check logic.
                     pass 

        if len(all_competencies) < 1:
            errors.append("Descriptive question must involve at least 1 competency in criteria.")
            
        # Optional: Check if total score > 0
        if total_score <= 0:
            errors.append("Total score for criteria should be positive")
            
    else:
        # Multiple Choice Validation Logic (Existing)
        choices = data.get('choices', [])
        
        # 1. Correct Choice Existence
        correct_id = data.get('correct_choice')
        choice_ids = [c['choice_id'] for c in choices]
        if correct_id not in choice_ids:
            errors.append(f"Correct choice '{correct_id}' is not in choices {choice_ids}")
        
        # 2. Distinct Error Paths - REMOVED strictly enforcement
        # error_paths = [c['error_path'] for c in choices if c['choice_id'] != correct_id]
        # if len(error_paths) != len(set(error_paths)):
        #     errors.append("Error paths must be distinct across choices")
        
        # 3. Vector Rules
        all_competencies = set()
        
        for choice in choices:
            c_id = choice['choice_id']
            vector = choice.get('vector', {})
            
            # Collect competencies to check coverage later
            for k in vector.keys():
                all_competencies.add(k)
                
            # Check max 4 competencies per choice
            if len(vector) > 4:
                errors.append(f"Choice {c_id} affects more than 4 competencies ({len(vector)})")
                
            # Check values
            if c_id == correct_id:
                for k, v in vector.items():
                    if v < 0:
                        errors.append(f"Correct choice {c_id} has negative value for {k}: {v}")
            else:
                for k, v in vector.items():
                    if v > 0:
                        errors.append(f"Incorrect choice {c_id} has positive value for {k}: {v}")

        # 4. Competency Coverage (At least 2 unique competencies involved in the question)
        if len(all_competencies) < 2:
            errors.append(f"Question only involves {len(all_competencies)} competencies. Minimum 2 required.")

    return errors

def validate_file(file_path: str, schema: Dict[str, Any]) -> bool:
    print(f"Validating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Schema Validation
        jsonschema.validate(instance=data, schema=schema)
        
        # Business Logic Validation
        biz_errors = validate_business_rules(data)
        
        if biz_errors:
            print(f"  [FAIL] Business Logic Errors:")
            for err in biz_errors:
                print(f"    - {err}")
            return False
            
        print("  [PASS] Valid Question")
        return True
        
    except json.JSONDecodeError as e:
        print(f"  [FAIL] Invalid JSON: {e}")
        return False
    except jsonschema.ValidationError as e:
        print(f"  [FAIL] Schema Error: {e.message}")
        return False
    except Exception as e:
        print(f"  [FAIL] Unexpected Error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Validate Korean Farm v2 Question Metadata')
    parser.add_argument('target', help='File or directory to validate')
    args = parser.parse_args()
    
    schema = load_schema()
    
    target = args.target
    if os.path.isfile(target):
        validate_file(target, schema)
    elif os.path.isdir(target):
        for root, _, files in os.walk(target):
            for file in files:
                if file.endswith('.json') and file != 'metadata.json': # Skip passage metadata if any
                    validate_file(os.path.join(root, file), schema)
    else:
        print(f"Error: {target} is not a valid file or directory")

if __name__ == "__main__":
    main()
