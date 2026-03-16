import os
import json
import random
from glob import glob

import sys
sys.path.insert(0, os.path.dirname(__file__))
from core import load_config, get_test_dirs


def get_mc_files(dirs):
    files = []
    for d in dirs:
        q_files = sorted(glob(os.path.join(d, 'questions', '*.json')))
        for qf in q_files:
            with open(qf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data['question'].get('type') != '서술형':
                    files.append(qf)
    return files


def balance_files(file_list):
    total = len(file_list)
    print(f"Balancing {total} files...")

    constrained_files = []
    full_files = []

    for f in file_list:
        with open(f, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            if len(data.get('choices', [])) < 5:
                constrained_files.append((f, len(data['choices'])))
            else:
                full_files.append(f)

    random.shuffle(constrained_files)
    random.shuffle(full_files)

    if total == 48:
        target_counts = {'A': 10, 'B': 10, 'C': 10, 'D': 9, 'E': 9}
    else:
        target_counts = {'A': total // 5, 'B': total // 5, 'C': total // 5,
                         'D': total // 5, 'E': total // 5}
        for k in ['A', 'B', 'C', 'D', 'E'][:total % 5]:
            target_counts[k] += 1

    final_assignments = {}

    for f, c_len in constrained_files:
        valid_keys = ['A', 'B', 'C', 'D', 'E'][:c_len]
        candidates = [k for k in valid_keys if target_counts[k] > 0]
        if not candidates:
            candidates = valid_keys
        pick = random.choice(candidates)
        target_counts[pick] -= 1
        final_assignments[f] = pick

    remaining_targets = []
    for k, v in target_counts.items():
        remaining_targets.extend([k] * v)

    random.shuffle(remaining_targets)

    for f, t in zip(full_files, remaining_targets):
        final_assignments[f] = t

    dist = {}
    for t in final_assignments.values():
        dist[t] = dist.get(t, 0) + 1
    print(f"Planned Distribution: {dist}")

    idx_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
    id_list = ['A', 'B', 'C', 'D', 'E']

    for fpath in file_list:
        target_choice = final_assignments[fpath]

        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        choices = data['choices']
        current_correct_id = data['correct_choice']

        correct_obj = next(c for c in choices if c['choice_id'] == current_correct_id)
        incorrect_objs = [c for c in choices if c['choice_id'] != current_correct_id]

        random.shuffle(incorrect_objs)

        target_idx = idx_map[target_choice]

        new_choices_list = []
        wrong_ptr = 0

        for i in range(len(choices)):
            if i == target_idx:
                new_choices_list.append(correct_obj)
            else:
                new_choices_list.append(incorrect_objs[wrong_ptr])
                wrong_ptr += 1

        for i, c in enumerate(new_choices_list):
            c['choice_id'] = id_list[i]

        data['choices'] = new_choices_list
        data['correct_choice'] = target_choice

        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    print("Done balancing.")


if __name__ == "__main__":
    config = load_config()
    test_order = config.get('test_order', [])

    for test_key in test_order:
        label = config.get('tests', {}).get(test_key, {}).get('label', test_key)
        print(f"Processing {label}...")
        dirs = get_test_dirs(config, test_key)
        if not dirs:
            print(f"  [WARN] No passages configured for {test_key}. Skipping.")
            continue

        files = get_mc_files(dirs)
        balance_files(files)
