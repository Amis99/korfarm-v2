import os
import json
import random
import csv
from glob import glob

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import (
    COMPETENCIES, load_config, get_test_dirs, get_test_label,
    get_level_multiplier, normalize_key,
    calculate_confidence, apply_confidence_to_tci, calculate_recommendation,
)

# Answer counts to simulate (includes low-response scenarios for confidence testing)
ANSWER_COUNTS = [5, 10, 15, 20, 30, 40, 50, 60]
# Accuracy rates to simulate
ACCURACY_RATES = [0.2, 0.4, 0.6, 0.8, 1.0]


def get_questions(dirs):
    questions = []
    for d in dirs:
        q_files = glob(os.path.join(d, 'questions', '*.json'))
        for qf in q_files:
            try:
                with open(qf, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('question', {}).get('type') != '서술형':
                        questions.append(data)
            except Exception:
                pass
    return sorted(questions, key=lambda x: x['question_id'])


def run_simulation(test_key, question_pool, config, tier_keys, label_map):
    results = []
    total_q = len(question_pool)

    base_score = float(config.get('scoring', {}).get('base_score', 50.0))
    correct_weight = float(config.get('scoring', {}).get('correct_weight', 0.5))
    incorrect_weight = float(config.get('scoring', {}).get('incorrect_weight', 0.8))

    if total_q > 60:
        test_set = random.sample(question_pool, 60)
    else:
        test_set = question_pool

    for ans_count in ANSWER_COUNTS:
        if ans_count > len(test_set):
            continue

        for accuracy in ACCURACY_RATES:
            scores = {c: base_score for c in COMPETENCIES}

            answered_questions = random.sample(test_set, ans_count)
            correct_count = int(ans_count * accuracy)

            random.shuffle(answered_questions)

            # Process CORRECT
            for q in answered_questions[:correct_count]:
                correct_id = q['correct_choice']
                try:
                    choice = next(c for c in q['choices'] if c['choice_id'] == correct_id)
                    for k, v in choice.get('vector', {}).items():
                        nk = normalize_key(k)
                        if nk in scores:
                            scores[nk] += (v * correct_weight)
                except StopIteration:
                    pass

            # Process INCORRECT
            for q in answered_questions[correct_count:]:
                correct_id = q['correct_choice']
                incorrect_choices = [c for c in q['choices'] if c['choice_id'] != correct_id]
                if incorrect_choices:
                    choice = random.choice(incorrect_choices)
                    multiplier = get_level_multiplier(config, test_key, q.get('passage', {}).get('level'))
                    for k, v in choice.get('vector', {}).items():
                        nk = normalize_key(k)
                        if nk in scores:
                            scaled = v * incorrect_weight
                            if v < 0:
                                scaled *= multiplier
                            scores[nk] += scaled

            # Clamp
            for k in scores:
                scores[k] = max(0, min(100, scores[k]))

            # Raw TCI
            raw_tci = sum(scores.values()) / 10.0

            # Confidence
            confidence = calculate_confidence(ans_count, config)
            adjusted_tci = apply_confidence_to_tci(raw_tci, confidence, base=base_score)

            # Level recommendation
            final_grade = calculate_recommendation(
                test_key, adjusted_tci, tier_keys, label_map, confidence=confidence
            )

            row = {
                "Test": label_map[test_key],
                "Answered": ans_count,
                "Accuracy": f"{int(accuracy*100)}%",
                "Correct_Cnt": correct_count,
                "Raw_TCI": round(raw_tci, 2),
                "Confidence": round(confidence, 2),
                "Adjusted_TCI": round(adjusted_tci, 2),
                "Final_Level": final_grade["label"],
            }
            for k, v in scores.items():
                row[k] = round(v, 1)

            results.append(row)

    return results


def main():
    all_results = []
    config = load_config()
    test_order = config.get('test_order', [])
    label_map = {k: get_test_label(config, k) for k in test_order}

    for test_key in test_order:
        dirs = get_test_dirs(config, test_key)
        if not dirs:
            print(f"Skipping {test_key}: no configured passages.")
            continue

        label = label_map[test_key]
        print(f"Simulating {label}...")
        q_pool = get_questions(dirs)

        for _ in range(5):
            res = run_simulation(test_key, q_pool, config, test_order, label_map)
            all_results.extend(res)

    if not all_results:
        print("No results generated.")
        return

    keys = ["Test", "Answered", "Accuracy", "Correct_Cnt",
            "Raw_TCI", "Confidence", "Adjusted_TCI", "Final_Level"] + COMPETENCIES

    with open('simulation_results.csv', 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(all_results)

    print(f"Simulation complete. {len(all_results)} rows saved to simulation_results.csv")


if __name__ == "__main__":
    main()
