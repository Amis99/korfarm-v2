#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Idea 7: IRT 2PL item calibration.

Estimates difficulty (b) and discrimination (a) parameters for each question
using simulated student data. Compares against designed difficulty levels.
"""

import json
import os
import sys
from glob import glob

sys.path.insert(0, os.path.dirname(__file__))
from core import COMPETENCIES, load_config, get_test_dirs, PROJECT_ROOT

import numpy as np
from scipy.optimize import minimize
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px

INPUT_PATH = os.path.join(PROJECT_ROOT, 'output', 'simulated_students.json')
REPORT_PATH = os.path.join(PROJECT_ROOT, 'output', 'irt_report.json')
PLOT_PATH = os.path.join(PROJECT_ROOT, 'output', 'irt_analysis.html')


def irt_2pl(theta, a, b):
    """2PL IRT model: P(correct | theta, a, b)."""
    z = a * (theta - b)
    z = np.clip(z, -30, 30)  # prevent overflow
    return 1.0 / (1.0 + np.exp(-z))


def neg_log_likelihood(params, thetas, responses):
    """Negative log-likelihood for a single item."""
    a, b = params
    if a <= 0.01:
        return 1e10

    p = irt_2pl(thetas, a, b)
    p = np.clip(p, 1e-10, 1 - 1e-10)

    ll = np.sum(responses * np.log(p) + (1 - responses) * np.log(1 - p))
    return -ll


def estimate_theta(students):
    """Estimate student ability (theta) from TCI scores.

    Maps 0-100 TCI to approximately -3 to +3 scale.
    """
    tcis = np.array([s['report']['adjusted_tci'] for s in students])
    # Linear mapping: TCI 0->-3, 50->0, 100->3
    thetas = (tcis - 50) / 50 * 3
    return thetas


def build_response_matrix(students, question_ids):
    """Build binary response matrix: students x questions."""
    q_idx = {qid: i for i, qid in enumerate(question_ids)}
    n_students = len(students)
    n_questions = len(question_ids)

    # -1 = not answered
    matrix = np.full((n_students, n_questions), -1, dtype=float)

    for i, s in enumerate(students):
        for resp in s['responses']:
            qid = resp['question_id']
            if qid in q_idx:
                matrix[i, q_idx[qid]] = 1.0 if resp['is_correct'] else 0.0

    return matrix


def get_question_metadata(config):
    """Load question metadata (level, passage_id) for all questions."""
    meta = {}
    for test_key in config.get('test_order', []):
        for d in get_test_dirs(config, test_key):
            q_dir = os.path.join(d, 'questions')
            if not os.path.isdir(q_dir):
                continue
            for qf in sorted(glob(os.path.join(q_dir, '*.json'))):
                with open(qf, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    qid = data['question_id']
                    meta[qid] = {
                        "question_id": qid,
                        "test_key": test_key,
                        "passage_id": data.get('passage', {}).get('passage_id', ''),
                        "designed_level": data.get('passage', {}).get('level', 0),
                        "genre": data.get('passage', {}).get('genre', ''),
                        "type": data.get('question', {}).get('type', ''),
                    }
    return meta


def calibrate_items(thetas, response_matrix, question_ids):
    """Estimate IRT parameters for each question via MLE."""
    results = []

    for j, qid in enumerate(question_ids):
        responses = response_matrix[:, j]
        valid = responses >= 0
        if valid.sum() < 10:
            results.append({
                "question_id": qid,
                "a": None, "b": None,
                "empirical_accuracy": None,
                "flag": "insufficient_data",
            })
            continue

        valid_thetas = thetas[valid]
        valid_responses = responses[valid]
        emp_acc = valid_responses.mean()

        # Skip if all correct or all incorrect
        if emp_acc <= 0.01 or emp_acc >= 0.99:
            results.append({
                "question_id": qid,
                "a": 0.5 if emp_acc >= 0.99 else 0.3,
                "b": -3.0 if emp_acc >= 0.99 else 3.0,
                "empirical_accuracy": round(float(emp_acc), 3),
                "flag": "extreme_accuracy",
            })
            continue

        # MLE estimation
        try:
            res = minimize(
                neg_log_likelihood,
                x0=[1.0, 0.0],
                args=(valid_thetas, valid_responses),
                method='L-BFGS-B',
                bounds=[(0.1, 5.0), (-4.0, 4.0)],
            )
            a_est, b_est = res.x
        except Exception:
            a_est, b_est = 1.0, 0.0

        results.append({
            "question_id": qid,
            "a": round(float(a_est), 3),
            "b": round(float(b_est), 3),
            "empirical_accuracy": round(float(emp_acc), 3),
            "flag": None,
        })

    return results


def flag_items(irt_results, q_meta):
    """Flag problematic items based on IRT analysis."""
    for item in irt_results:
        if item['flag']:
            continue

        qid = item['question_id']
        meta = q_meta.get(qid, {})
        designed_level = meta.get('designed_level', 0)

        # Map designed level to expected b range
        # Level 1-3 (easy) → b < 0, Level 10-12 (hard) → b > 1.5
        expected_b_center = (designed_level - 6) / 3  # rough mapping
        b = item['b']
        a = item['a']

        flags = []

        # Too easy: designed as hard but IRT says easy
        if designed_level >= 7 and b < -1.0:
            flags.append("too_easy")

        # Too hard: designed as easy but IRT says hard
        if designed_level <= 3 and b > 1.0:
            flags.append("too_hard")

        # Low discrimination
        if a is not None and a < 0.5:
            flags.append("low_discrimination")

        item['flag'] = ",".join(flags) if flags else None
        item['designed_level'] = designed_level

    return irt_results


def create_visualizations(irt_results, q_meta):
    """Create IRT analysis visualizations."""
    figs = []

    # Filter items with valid estimates
    valid = [r for r in irt_results if r['a'] is not None and r['b'] is not None]

    if not valid:
        return "<html><body><h1>No valid IRT estimates</h1></body></html>"

    # 1. Difficulty vs Designed Level scatter
    designed_levels = [q_meta.get(r['question_id'], {}).get('designed_level', 0) for r in valid]
    difficulties = [r['b'] for r in valid]
    discriminations = [r['a'] for r in valid]
    flags = [r.get('flag') or 'normal' for r in valid]

    fig1 = px.scatter(
        x=designed_levels, y=difficulties,
        color=flags, size=discriminations,
        labels={'x': '설계 난이도 (Level)', 'y': 'IRT 난이도 (b)', 'color': '플래그'},
        title="설계 난이도 vs IRT 추정 난이도",
    )
    fig1.update_layout(height=500)
    figs.append(fig1)

    # 2. Discrimination histogram
    fig2 = px.histogram(
        x=discriminations,
        nbins=20,
        title="변별도 (a) 분포",
        labels={'x': '변별도 (a)', 'y': '문항 수'},
    )
    fig2.add_vline(x=0.5, line_dash="dash", line_color="red",
                   annotation_text="최소 기준 (0.5)")
    fig2.update_layout(height=400)
    figs.append(fig2)

    # 3. ICC curves for flagged items
    flagged = [r for r in valid if r.get('flag')][:6]  # top 6 flagged
    if flagged:
        theta_range = np.linspace(-3, 3, 100)
        fig3 = go.Figure()
        for r in flagged:
            p = irt_2pl(theta_range, r['a'], r['b'])
            fig3.add_trace(go.Scatter(
                x=theta_range, y=p,
                mode='lines',
                name=f"{r['question_id']} (a={r['a']}, b={r['b']})",
            ))
        fig3.update_layout(
            title="플래그 문항 ICC 곡선",
            xaxis_title="학생 능력 (θ)",
            yaxis_title="정답 확률",
            height=500,
        )
        figs.append(fig3)

    # 4. Empirical accuracy vs IRT predicted accuracy
    emp_accs = [r['empirical_accuracy'] for r in valid]
    pred_accs = [float(irt_2pl(0, r['a'], r['b'])) for r in valid]

    fig4 = px.scatter(
        x=emp_accs, y=pred_accs,
        labels={'x': '실제 정답률', 'y': 'IRT 예측 정답률 (θ=0)'},
        title="실제 vs 예측 정답률",
    )
    fig4.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode='lines',
                               line=dict(dash='dash', color='gray'),
                               name='완벽한 적합'))
    fig4.update_layout(height=500)
    figs.append(fig4)

    # Build HTML
    html_parts = ["<html><head><title>IRT Analysis</title></head><body>"]
    html_parts.append("<h1>국어농장 v2 — IRT 문항 분석 리포트</h1>")

    for fig in figs:
        html_parts.append(fig.to_html(full_html=False, include_plotlyjs='cdn'))

    # Flagged items table
    flagged_all = [r for r in irt_results if r.get('flag')]
    if flagged_all:
        html_parts.append("<h2>플래그 문항 목록</h2>")
        html_parts.append("<table border='1' cellpadding='5'>")
        html_parts.append("<tr><th>문항 ID</th><th>설계 레벨</th>"
                         "<th>IRT 난이도(b)</th><th>변별도(a)</th>"
                         "<th>실제 정답률</th><th>플래그</th></tr>")
        for r in flagged_all:
            html_parts.append(
                f"<tr><td>{r['question_id']}</td>"
                f"<td>{r.get('designed_level', 'N/A')}</td>"
                f"<td>{r.get('b', 'N/A')}</td>"
                f"<td>{r.get('a', 'N/A')}</td>"
                f"<td>{r.get('empirical_accuracy', 'N/A')}</td>"
                f"<td style='color:red'>{r['flag']}</td></tr>"
            )
        html_parts.append("</table>")

    html_parts.append("</body></html>")
    return "\n".join(html_parts)


def main():
    print("Loading data...")
    config = load_config()

    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        students = json.load(f)
    print(f"Loaded {len(students)} simulated students")

    # Estimate student abilities
    thetas = estimate_theta(students)
    print(f"Theta range: [{thetas.min():.2f}, {thetas.max():.2f}]")

    # Get all question IDs
    q_meta = get_question_metadata(config)
    question_ids = sorted(q_meta.keys())
    print(f"Total questions: {len(question_ids)}")

    # Build response matrix
    response_matrix = build_response_matrix(students, question_ids)
    answered_per_q = (response_matrix >= 0).sum(axis=0)
    print(f"Questions with >10 responses: {(answered_per_q > 10).sum()}")

    # Calibrate
    print("Running IRT calibration...")
    irt_results = calibrate_items(thetas, response_matrix, question_ids)

    # Flag items
    irt_results = flag_items(irt_results, q_meta)

    flagged_count = sum(1 for r in irt_results if r.get('flag'))
    print(f"Flagged items: {flagged_count}/{len(irt_results)}")

    # Save report
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(irt_results, f, ensure_ascii=False, indent=2)
    print(f"Report saved to {REPORT_PATH}")

    # Visualizations
    print("Creating visualizations...")
    html = create_visualizations(irt_results, q_meta)
    with open(PLOT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Visualizations saved to {PLOT_PATH}")

    # Summary
    valid = [r for r in irt_results if r['a'] is not None]
    if valid:
        avg_a = np.mean([r['a'] for r in valid])
        avg_b = np.mean([r['b'] for r in valid])
        print(f"\nSummary:")
        print(f"  Average discrimination (a): {avg_a:.2f}")
        print(f"  Average difficulty (b): {avg_b:.2f}")
        print(f"  Low discrimination (<0.5): {sum(1 for r in valid if r['a'] < 0.5)}")
        print(f"  Too easy flags: {sum(1 for r in irt_results if r.get('flag') and 'too_easy' in r['flag'])}")
        print(f"  Too hard flags: {sum(1 for r in irt_results if r.get('flag') and 'too_hard' in r['flag'])}")


if __name__ == '__main__':
    main()
