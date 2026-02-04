import json
import os
import re
import sys

def validate_json(file_path):
    print(f"Validating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[FAIL] JSON Load Error: {e}")
        return False

    errors = []

    # 1. Top-level Meta
    required_fields = ["contentId", "contentType", "title", "targetLevel", "payload"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing top-level field: {field}")

    # 2. Page Structure
    if "questions" not in data.get("payload", {}):
        errors.append("Missing payload.questions")
        return False
    
    questions = data["payload"]["questions"]
    if len(questions) != 10:
        errors.append(f"Question count mismatch: Found {len(questions)}, expected 10")

    # 3. Question Structure
    for i, q in enumerate(questions):
        q_id = q.get("id", f"unknown-{i}")
        
        # Check ID format
        if not re.match(r"^dq-[a-z0-9]+-\d{3}-\d+$", q_id):
            errors.append(f"Invalid ID format: {q_id}")

        # Check required question fields
        if "type" not in q:
            errors.append(f"Missing type in {q_id}")
        if "stem" not in q:
            errors.append(f"Missing stem in {q_id}")
        if "scoring" not in q:
             errors.append(f"Missing scoring in {q_id}")

        # Type-specific checks
        q_type = q.get("type")
        if q_type == "MULTI_CHOICE":
            if "choices" not in q or len(q["choices"]) != 4:
                errors.append(f"Invalid choices in {q_id}: Expected 4 choices")
            if "answerId" not in q:
                errors.append(f"Missing answerId in {q_id}")
        elif q_type == "SENTENCE_BUILDING":
            if "sentenceParts" not in q:
                errors.append(f"Missing sentenceParts in {q_id}")

    if errors:
        print("[FAIL] Validation Failed:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print("[PASS] Validation Success")
        return True

if __name__ == "__main__":
    base_dir = "c:/Users/RENEWCOM PC/Documents/국어농장v2홈페이지/frontend/public/daily-quiz"
    levels = ["saussure1", "wittgenstein3"]
    files_to_check = []
    
    for level in levels:
        for day in range(1, 8):
            filename = f"{day:03d}.json"
            files_to_check.append(os.path.join(base_dir, level, filename))
    
    success_count = 0
    for file_path in files_to_check:
        if os.path.exists(file_path):
            if validate_json(file_path):
                success_count += 1
        else:
            print(f"[FAIL] File not found: {file_path}")
            
    if success_count == len(files_to_check):
        print("ALL PASSED")
        sys.exit(0)
    else:
        sys.exit(1)
