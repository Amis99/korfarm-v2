#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unified quality gate: 8 validation rules across all question files."""

import argparse
import json
import os
import sys
from glob import glob
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from core import COMPETENCIES_SET, load_config, get_test_dirs, PROJECT_ROOT

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'schemas', 'question_schema.json')


def load_schema():
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def collect_question_files(config, test_key=None):
    """Collect all question file paths, optionally filtered by test key."""
    files = []
    test_keys = [test_key] if test_key else config.get('test_order', [])
    for tk in test_keys:
        dirs = get_test_dirs(config, tk)
        for d in dirs:
            q_dir = os.path.join(d, 'questions')
            if os.path.isdir(q_dir):
                for qf in sorted(glob(os.path.join(q_dir, '*.json'))):
                    files.append((tk, d, qf))
    return files


class ValidationResult:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, file, rule, msg):
        self.errors.append({"file": file, "rule": rule, "message": msg, "severity": "ERROR"})

    def warning(self, file, rule, msg):
        self.warnings.append({"file": file, "rule": rule, "message": msg, "severity": "WARNING"})

    @property
    def ok(self):
        return len(self.errors) == 0


def rule_1_json_schema(data, filepath, schema, result):
    """Rule 1: JSON schema validation."""
    try:
        import jsonschema
        jsonschema.validate(instance=data, schema=schema)
    except Exception as e:
        result.error(filepath, 1, f"Schema validation failed: {e.message if hasattr(e, 'message') else str(e)}")


def rule_2_vector_polarity(data, filepath, result):
    """Rule 2: Correct choice vectors positive, incorrect negative."""
    correct_id = data.get('correct_choice')
    for choice in data.get('choices', []):
        cid = choice.get('choice_id')
        vector = choice.get('vector', {})
        if cid == correct_id:
            for k, v in vector.items():
                if v < 0:
                    result.error(filepath, 2, f"Correct choice {cid}: negative value for '{k}' = {v}")
        else:
            for k, v in vector.items():
                if v > 0:
                    result.error(filepath, 2, f"Incorrect choice {cid}: positive value for '{k}' = {v}")


def rule_3_min_competencies(data, filepath, result):
    """Rule 3: At least 2 competencies per question."""
    all_keys = set()
    for choice in data.get('choices', []):
        all_keys.update(choice.get('vector', {}).keys())
    if len(all_keys) < 2:
        result.error(filepath, 3, f"Only {len(all_keys)} competencies. Minimum 2 required.")


def rule_4_max_competencies_per_choice(data, filepath, result):
    """Rule 4: Maximum 4 competencies per choice."""
    for choice in data.get('choices', []):
        vec = choice.get('vector', {})
        if len(vec) > 4:
            result.error(filepath, 4,
                         f"Choice {choice.get('choice_id')}: {len(vec)} competencies (max 4)")


def rule_5_error_path_uniqueness(data, filepath, result):
    """Rule 5: error_path should be unique within a question (WARNING)."""
    correct_id = data.get('correct_choice')
    paths = []
    for choice in data.get('choices', []):
        if choice.get('choice_id') != correct_id:
            paths.append(choice.get('error_path', ''))
    if len(paths) != len(set(paths)):
        result.warning(filepath, 5, "Duplicate error_path values among incorrect choices")


def rule_6_answer_distribution(passage_files, result):
    """Rule 6: Answer distribution within a passage (no letter > 30%)."""
    if not passage_files:
        return
    dist = {}
    for _, _, fpath in passage_files:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            cc = data.get('correct_choice')
            if cc:
                dist[cc] = dist.get(cc, 0) + 1
        except Exception:
            pass

    total = sum(dist.values())
    if total == 0:
        return
    for letter, count in dist.items():
        ratio = count / total
        if ratio > 0.30:
            sample_file = passage_files[0][2]
            result.warning(
                os.path.dirname(os.path.dirname(sample_file)),
                6,
                f"Answer '{letter}' is {ratio:.0%} of {total} questions (limit 30%)"
            )


def rule_7_passage_completeness(passage_dir, passage_files, result):
    """Rule 7: Each passage should have exactly 10 questions."""
    count = len(passage_files)
    if count != 10:
        result.error(passage_dir, 7, f"Expected 10 questions, found {count}")


def rule_8_metadata_match(data, filepath, passage_dir, result):
    """Rule 8: Question passage metadata must match directory metadata.json."""
    meta_path = os.path.join(passage_dir, 'metadata.json')
    if not os.path.exists(meta_path):
        result.error(filepath, 8, "Missing metadata.json in passage directory")
        return

    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
    except Exception:
        result.error(filepath, 8, "Cannot read metadata.json")
        return

    q_passage = data.get('passage', {})
    if q_passage.get('passage_id') != meta.get('passage_id'):
        result.error(filepath, 8,
                     f"passage_id mismatch: question={q_passage.get('passage_id')}, meta={meta.get('passage_id')}")
    if q_passage.get('level') != meta.get('level'):
        result.error(filepath, 8,
                     f"level mismatch: question={q_passage.get('level')}, meta={meta.get('level')}")
    if q_passage.get('genre') != meta.get('genre'):
        result.error(filepath, 8,
                     f"genre mismatch: question={q_passage.get('genre')}, meta={meta.get('genre')}")


def run_validation(config, test_key=None):
    schema = load_schema()
    all_files = collect_question_files(config, test_key)
    result = ValidationResult()

    # Group by passage directory for rules 6, 7
    passages = {}
    for tk, pdir, fpath in all_files:
        passages.setdefault(pdir, []).append((tk, pdir, fpath))

    for tk, pdir, fpath in all_files:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            result.error(fpath, 1, f"Invalid JSON: {e}")
            continue

        qtype = data.get('question', {}).get('type')
        if qtype == '서술형':
            rule_1_json_schema(data, fpath, schema, result)
            rule_8_metadata_match(data, fpath, pdir, result)
            continue

        rule_1_json_schema(data, fpath, schema, result)
        rule_2_vector_polarity(data, fpath, result)
        rule_3_min_competencies(data, fpath, result)
        rule_4_max_competencies_per_choice(data, fpath, result)
        rule_5_error_path_uniqueness(data, fpath, result)
        rule_8_metadata_match(data, fpath, pdir, result)

    # Per-passage rules
    for pdir, pfiles in passages.items():
        rule_6_answer_distribution(pfiles, result)
        rule_7_passage_completeness(pdir, pfiles, result)

    return result, len(all_files)


def print_summary(result, total_files):
    print(f"\n{'='*60}")
    print(f"Validation Summary: {total_files} files checked")
    print(f"{'='*60}")
    print(f"  ERRORS:   {len(result.errors)}")
    print(f"  WARNINGS: {len(result.warnings)}")

    if result.errors:
        print(f"\n--- ERRORS ---")
        for e in result.errors[:50]:
            relpath = os.path.relpath(e['file'], PROJECT_ROOT)
            print(f"  [Rule {e['rule']}] {relpath}: {e['message']}")
        if len(result.errors) > 50:
            print(f"  ... and {len(result.errors) - 50} more errors")

    if result.warnings:
        print(f"\n--- WARNINGS ---")
        for w in result.warnings[:20]:
            relpath = os.path.relpath(w['file'], PROJECT_ROOT)
            print(f"  [Rule {w['rule']}] {relpath}: {w['message']}")
        if len(result.warnings) > 20:
            print(f"  ... and {len(result.warnings) - 20} more warnings")

    if result.ok:
        print(f"\nRESULT: PASS")
    else:
        print(f"\nRESULT: FAIL ({len(result.errors)} errors)")


def main():
    parser = argparse.ArgumentParser(description='Unified quality gate for diagnostic test questions')
    parser.add_argument('--test', help='Validate specific test (sohssure|frege|russell|wittgenstein)')
    parser.add_argument('--output', help='Save JSON report to file')
    parser.add_argument('--strict', action='store_true', help='Exit with code 1 on any error')
    args = parser.parse_args()

    config = load_config()
    result, total = run_validation(config, test_key=args.test)
    print_summary(result, total)

    if args.output:
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_files": total,
            "error_count": len(result.errors),
            "warning_count": len(result.warnings),
            "errors": result.errors,
            "warnings": result.warnings,
        }
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\nJSON report saved to {args.output}")

    if args.strict and not result.ok:
        sys.exit(1)


if __name__ == '__main__':
    main()
