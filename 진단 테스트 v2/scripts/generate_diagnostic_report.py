import argparse
import json
import os
from glob import glob

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import (
    COMPETENCIES, load_config, get_test_dirs, get_level_multiplier,
    normalize_key, apply_vector, clamp_scores, accumulate_error,
    calculate_confidence, apply_confidence_to_tci, calculate_recommendation,
)


def load_questions_for_test(config, test_key):
    questions = {}
    for d in get_test_dirs(config, test_key):
        for qf in glob(os.path.join(d, 'questions', '*.json')):
            with open(qf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                qid = data.get('question_id')
                if qid:
                    questions[qid] = data
    return questions


def build_report(config, test_key, responses, student_id=None):
    base_score = float(config.get('scoring', {}).get('base_score', 50.0))
    scores = {c: base_score for c in COMPETENCIES}
    correct_weight = float(config.get('scoring', {}).get('correct_weight', 0.5))
    incorrect_weight = float(config.get('scoring', {}).get('incorrect_weight', 0.8))
    apply_level_multiplier = bool(config.get('scoring', {}).get('apply_level_multiplier', True))

    questions = load_questions_for_test(config, test_key)
    error_contrib = {c: {} for c in COMPETENCIES}
    errors = []
    answered_count = 0

    for ans in responses:
        qid = ans.get('question_id')
        if not qid or qid not in questions:
            errors.append(f"Unknown question_id: {qid}")
            continue

        q = questions[qid]
        qtype = q.get('question', {}).get('type')
        answered_count += 1

        if qtype == '서술형':
            criteria_ids = set(ans.get('criteria_ids', []))
            if not criteria_ids:
                continue
            for crit in q.get('grading_criteria', []):
                if crit.get('criteria_id') in criteria_ids:
                    vector = crit.get('vector', {})
                    apply_vector(scores, vector, correct_weight, multiplier=1.0)
            continue

        choice_id = ans.get('choice_id')
        if not choice_id:
            errors.append(f"Missing choice_id for {qid}")
            continue

        correct_id = q.get('correct_choice')
        choices = q.get('choices', [])
        selected = next((c for c in choices if c.get('choice_id') == choice_id), None)
        if not selected:
            errors.append(f"Invalid choice_id {choice_id} for {qid}")
            continue

        vector = selected.get('vector', {})
        level = q.get('passage', {}).get('level')
        multiplier = get_level_multiplier(config, test_key, level,
                                          apply=apply_level_multiplier)

        if choice_id == correct_id:
            apply_vector(scores, vector, correct_weight, multiplier=1.0)
        else:
            apply_vector(scores, vector, incorrect_weight, multiplier=multiplier)
            accumulate_error(error_contrib, vector, selected.get('error_path'),
                             incorrect_weight, multiplier)

    clamp_scores(scores)
    raw_tci = sum(scores.values()) / len(scores)

    # Confidence
    confidence = calculate_confidence(answered_count, config)
    adjusted_tci = apply_confidence_to_tci(raw_tci, confidence, base=base_score)

    test_order = config.get('test_order', [])
    label_map = {k: config.get('tests', {}).get(k, {}).get('label', k) for k in test_order}
    recommendation = calculate_recommendation(
        test_key, adjusted_tci, test_order, label_map, confidence=confidence
    )

    bottlenecks = sorted(scores.items(), key=lambda x: (x[1], x[0]))[:2]
    bottleneck_competencies = [b[0] for b in bottlenecks]
    bottleneck_errors = {}
    for comp, _ in bottlenecks:
        if error_contrib.get(comp):
            top_error = max(error_contrib[comp].items(), key=lambda x: x[1])[0]
            bottleneck_errors[comp] = top_error
        else:
            bottleneck_errors[comp] = None

    next_step_code = "maintain"
    if recommendation["test_key"] != test_key:
        if test_order.index(recommendation["test_key"]) < test_order.index(test_key):
            next_step_code = "review_previous_tier"
        else:
            next_step_code = "advance_next_tier"
    elif recommendation["level"] is not None:
        if recommendation["level"] == 1:
            next_step_code = "reinforce_level_1"
        elif recommendation["level"] == 2:
            next_step_code = "reinforce_level_2"
        elif recommendation["level"] == 3:
            next_step_code = "reinforce_level_3"

    return {
        "student_id": student_id,
        "test_key": test_key,
        "raw_tci": round(raw_tci, 2),
        "confidence": round(confidence, 2),
        "adjusted_tci": round(adjusted_tci, 2),
        "tci": round(adjusted_tci, 2),
        "recommended": recommendation,
        "scores": {k: round(v, 1) for k, v in scores.items()},
        "bottleneck_competencies": bottleneck_competencies,
        "bottleneck_error_paths": bottleneck_errors,
        "error_contributions": {
            comp: dict(sorted(paths.items(), key=lambda x: -x[1])[:5])
            for comp, paths in error_contrib.items() if paths
        },
        "next_step_code": next_step_code,
        "answered_count": answered_count,
        "errors": errors,
    }


def load_responses(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, dict) and 'answers' in data:
        return data
    return {"answers": data}


def main():
    parser = argparse.ArgumentParser(description='Generate diagnostic report from responses')
    parser.add_argument('--responses', required=True, help='Path to responses JSON')
    parser.add_argument('--test-key', required=True,
                        help='Test key (sohssure|frege|russell|wittgenstein)')
    parser.add_argument('--output', required=True, help='Output report JSON')
    args = parser.parse_args()

    config = load_config()
    responses_data = load_responses(args.responses)
    answers = responses_data.get('answers', [])

    report = build_report(config, args.test_key, answers,
                          student_id=responses_data.get('student_id'))

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Report generated: TCI={report['tci']}, Confidence={report['confidence']}")


if __name__ == '__main__':
    main()
