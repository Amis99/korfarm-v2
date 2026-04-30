#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
시험지 배점 100점 표준화 스크립트
generated/pro-tests/*.json 180개 파일의 배점을 수정하여 총점 = 100으로 맞춤.

알고리즘:
1. 서술형 없는 경우: 100 ÷ n 균등 배분, 나머지는 뒤쪽 문제에 +1
2. 서술형 있는 경우: mc_pts를 2~14 범위에서 탐색
   - remaining = 100 - n_mc × mc_pts
   - remaining / n_essay 가 정수이고 essay_pts > mc_pts 면 후보
   - essay_pts ≈ 2 × mc_pts 에 가장 가까운 후보 선택
3. 깨끗한 해 없으면: mc_pts 고정, 서술형에 나머지 분배 (일부 서술형에 +1)
"""

import json
import glob
import os
import sys

# Windows 콘솔 인코딩 문제 방지
sys.stdout.reconfigure(encoding='utf-8')

TARGET = 100
TESTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'generated', 'pro-tests')


def compute_points(n_mc, n_essay):
    """n_mc개 객관식 + n_essay개 서술형으로 총점 100을 만드는 배점 계산.

    Returns:
        (mc_points_list, essay_points_list)
        각각 길이가 n_mc, n_essay인 리스트
    """
    n_total = n_mc + n_essay

    # 서술형 없는 경우: 균등 배분
    if n_essay == 0:
        base = TARGET // n_total
        extra = TARGET % n_total
        # 앞쪽 문제에 base, 뒤쪽 extra개 문제에 base+1
        mc_pts = [base] * (n_total - extra) + [base + 1] * extra
        return mc_pts, []

    # 서술형 있는 경우: 깨끗한 해 탐색
    best_candidate = None
    best_diff = float('inf')

    for mc_p in range(2, 15):
        remaining = TARGET - n_mc * mc_p
        if remaining <= 0:
            continue
        if remaining % n_essay == 0:
            essay_p = remaining // n_essay
            if essay_p > mc_p:
                ratio = essay_p / mc_p
                diff = abs(ratio - 2.0)
                if diff < best_diff:
                    best_diff = diff
                    best_candidate = (mc_p, essay_p, True)  # True = 깨끗한 해

    # 깨끗한 해가 있으면 사용
    if best_candidate is not None:
        mc_p, essay_p, _ = best_candidate
        return [mc_p] * n_mc, [essay_p] * n_essay

    # 깨끗한 해 없음: fallback — mc_pts 탐색 후 서술형 불균등 분배
    best_fallback = None
    best_fb_diff = float('inf')

    for mc_p in range(2, 15):
        remaining = TARGET - n_mc * mc_p
        if remaining <= 0:
            continue
        base_essay = remaining // n_essay
        extra_essay = remaining % n_essay
        if base_essay <= mc_p:
            continue  # 서술형이 객관식보다 작거나 같으면 부적절
        avg_essay = remaining / n_essay
        ratio = avg_essay / mc_p
        diff = abs(ratio - 2.0)
        if diff < best_fb_diff:
            best_fb_diff = diff
            best_fallback = (mc_p, base_essay, extra_essay)

    if best_fallback is not None:
        mc_p, base_essay, extra_essay = best_fallback
        # 뒤쪽 서술형에 +1 배점
        essay_pts = [base_essay] * (n_essay - extra_essay) + [base_essay + 1] * extra_essay
        return [mc_p] * n_mc, essay_pts

    # 최후 수단: 전체 균등 분배 (서술형/객관식 구분 없이)
    base = TARGET // n_total
    extra = TARGET % n_total
    all_pts = [base] * (n_total - extra) + [base + 1] * extra
    return all_pts[:n_mc], all_pts[n_mc:]


def fix_file(filepath):
    """단일 JSON 파일의 배점을 수정. 수정 전/후 정보를 반환."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data['questions']
    old_total = sum(q['points'] for q in questions)

    # 이미 100점이면 스킵
    if old_total == TARGET:
        return {
            'file': os.path.basename(filepath),
            'changed': False,
            'old_total': old_total,
            'new_total': old_total,
            'n_mc': sum(1 for q in questions if q['type'] == '객관식'),
            'n_essay': sum(1 for q in questions if q['type'] == '서술형'),
        }

    # 객관식/서술형 인덱스 분리
    mc_indices = [i for i, q in enumerate(questions) if q['type'] == '객관식']
    essay_indices = [i for i, q in enumerate(questions) if q['type'] == '서술형']

    mc_pts_list, essay_pts_list = compute_points(len(mc_indices), len(essay_indices))

    # 배점 적용
    for idx, pts in zip(mc_indices, mc_pts_list):
        questions[idx]['points'] = pts
    for idx, pts in zip(essay_indices, essay_pts_list):
        questions[idx]['points'] = pts

    new_total = sum(q['points'] for q in questions)
    assert new_total == TARGET, f"{filepath}: 총점 {new_total} != {TARGET}"

    # 저장
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return {
        'file': os.path.basename(filepath),
        'changed': True,
        'old_total': old_total,
        'new_total': new_total,
        'n_mc': len(mc_indices),
        'n_essay': len(essay_indices),
        'mc_pts': mc_pts_list[0] if mc_pts_list else None,
        'essay_pts': sorted(set(essay_pts_list)) if essay_pts_list else [],
    }


def main():
    files = sorted(glob.glob(os.path.join(TESTS_DIR, '*.json')))
    print(f"대상 파일: {len(files)}개\n")

    changed = 0
    skipped = 0
    results_by_level = {}

    for filepath in files:
        result = fix_file(filepath)
        basename = result['file']
        level = basename.split('_ch')[0]

        if level not in results_by_level:
            results_by_level[level] = []
        results_by_level[level].append(result)

        if result['changed']:
            changed += 1
        else:
            skipped += 1

    # 요약 출력
    print("=" * 70)
    print("수정 요약")
    print("=" * 70)

    for level in sorted(results_by_level.keys()):
        items = results_by_level[level]
        changed_items = [i for i in items if i['changed']]
        skipped_items = [i for i in items if not i['changed']]

        print(f"\n[{level}] 총 {len(items)}개 — 수정 {len(changed_items)}, 스킵 {len(skipped_items)}")

        if changed_items:
            # 대표 패턴 출력
            patterns = {}
            for item in changed_items:
                key = (item['n_mc'], item['n_essay'], item['mc_pts'], tuple(item.get('essay_pts', [])))
                if key not in patterns:
                    patterns[key] = []
                patterns[key].append(item)

            for (n_mc, n_essay, mc_p, essay_p), files_list in patterns.items():
                old_totals = sorted(set(i['old_total'] for i in files_list))
                old_str = '/'.join(str(t) for t in old_totals)
                essay_str = '+'.join(str(p) for p in essay_p) if essay_p else '-'
                print(f"  패턴: {n_mc}객+{n_essay}서 | MC={mc_p}점 Essay={essay_str}점 | "
                      f"변경 전 {old_str}→100 | {len(files_list)}파일")

        if skipped_items:
            print(f"  이미 100점: {len(skipped_items)}파일")

    print(f"\n{'=' * 70}")
    print(f"총 {len(files)}파일: 수정 {changed}개, 스킵(이미 100점) {skipped}개")

    # 검증
    print(f"\n검증 중...")
    all_ok = True
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        total = sum(q['points'] for q in data['questions'])
        if total != TARGET:
            print(f"  ✗ {os.path.basename(filepath)}: 총점 {total}")
            all_ok = False

    if all_ok:
        print(f"  모든 {len(files)}개 파일 총점 = 100 확인 완료!")
    else:
        print(f"  일부 파일의 총점이 100이 아닙니다!")


if __name__ == '__main__':
    main()
