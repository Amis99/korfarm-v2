#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""국어농장 v2 진단 테스트 — Streamlit 웹앱"""

import json
import os
import sqlite3
import sys
from datetime import datetime
from glob import glob

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

# Add scripts to path so we can import core
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
from core import (
    COMPETENCIES, load_config, get_test_dirs, get_test_label,
    get_level_multiplier, normalize_key, apply_vector, clamp_scores,
    accumulate_error, calculate_confidence, apply_confidence_to_tci,
    calculate_recommendation, PROJECT_ROOT,
)

DB_PATH = os.path.join(PROJECT_ROOT, 'db', 'diagnostic.db')
SCHEMA_PATH = os.path.join(PROJECT_ROOT, 'db', 'schema.sql')

# ─── Database helpers ───────────────────────────────────────────────

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    return conn


def insert_student(name, grade):
    conn = get_db()
    cur = conn.execute("INSERT INTO students (name, grade) VALUES (?, ?)", (name, grade))
    conn.commit()
    sid = cur.lastrowid
    conn.close()
    return sid


def get_students():
    conn = get_db()
    rows = conn.execute("SELECT * FROM students ORDER BY created_at DESC").fetchall()
    conn.close()
    return rows


def create_session(student_id, test_key, mode='full'):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO test_sessions (student_id, test_key, mode) VALUES (?, ?, ?)",
        (student_id, test_key, mode)
    )
    conn.commit()
    sid = cur.lastrowid
    conn.close()
    return sid


def save_response(session_id, question_id, choice_id, is_correct, response_time=None):
    conn = get_db()
    conn.execute(
        "INSERT INTO responses (session_id, question_id, choice_id, is_correct, response_time_sec) "
        "VALUES (?, ?, ?, ?, ?)",
        (session_id, question_id, choice_id, 1 if is_correct else 0, response_time)
    )
    conn.commit()
    conn.close()


def complete_session(session_id, raw_tci, confidence, adjusted_tci, recommended_level, next_step):
    conn = get_db()
    conn.execute(
        "UPDATE test_sessions SET completed_at=?, raw_tci=?, confidence=?, "
        "adjusted_tci=?, recommended_level=?, next_step_code=? WHERE id=?",
        (datetime.now().isoformat(), raw_tci, confidence, adjusted_tci,
         recommended_level, next_step, session_id)
    )
    conn.commit()
    conn.close()


def save_competency_scores(session_id, scores, confidence):
    conn = get_db()
    for comp, score in scores.items():
        conn.execute(
            "INSERT INTO competency_scores (session_id, competency, score, confidence) "
            "VALUES (?, ?, ?, ?)",
            (session_id, comp, score, confidence)
        )
    conn.commit()
    conn.close()


def get_student_sessions(student_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM test_sessions WHERE student_id=? ORDER BY started_at DESC",
        (student_id,)
    ).fetchall()
    conn.close()
    return rows


def get_session_scores(session_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT competency, score FROM competency_scores WHERE session_id=?",
        (session_id,)
    ).fetchall()
    conn.close()
    return {r['competency']: r['score'] for r in rows}


def get_all_sessions():
    conn = get_db()
    rows = conn.execute(
        "SELECT ts.*, s.name, s.grade FROM test_sessions ts "
        "JOIN students s ON ts.student_id = s.id "
        "ORDER BY ts.started_at DESC"
    ).fetchall()
    conn.close()
    return rows


# ─── Question loading ───────────────────────────────────────────────

def load_all_questions(config, test_key):
    """Load all questions for a test, grouped by passage."""
    passages = []
    for d in get_test_dirs(config, test_key):
        passage_md_path = os.path.join(d, 'passage.md')
        meta_path = os.path.join(d, 'metadata.json')

        passage_text = ""
        if os.path.exists(passage_md_path):
            with open(passage_md_path, 'r', encoding='utf-8') as f:
                passage_text = f.read()

        meta = {}
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)

        questions = []
        q_dir = os.path.join(d, 'questions')
        if os.path.isdir(q_dir):
            for qf in sorted(glob(os.path.join(q_dir, '*.json'))):
                with open(qf, 'r', encoding='utf-8') as f:
                    questions.append(json.load(f))

        passages.append({
            "dir": d,
            "text": passage_text,
            "meta": meta,
            "questions": questions,
        })
    return passages


# ─── Scoring engine (reuses core) ──────────────────────────────────

def score_responses(config, test_key, responses):
    """Score a list of {question_id, choice_id} responses. Returns full report dict."""
    base_score = float(config.get('scoring', {}).get('base_score', 50.0))
    scores = {c: base_score for c in COMPETENCIES}
    correct_weight = float(config.get('scoring', {}).get('correct_weight', 0.5))
    incorrect_weight = float(config.get('scoring', {}).get('incorrect_weight', 0.8))
    error_contrib = {c: {} for c in COMPETENCIES}

    # Build question lookup
    q_lookup = {}
    for d in get_test_dirs(config, test_key):
        q_dir = os.path.join(d, 'questions')
        if not os.path.isdir(q_dir):
            continue
        for qf in glob(os.path.join(q_dir, '*.json')):
            with open(qf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                q_lookup[data['question_id']] = data

    answered = 0
    correct_total = 0
    for resp in responses:
        qid = resp['question_id']
        cid = resp['choice_id']
        q = q_lookup.get(qid)
        if not q:
            continue

        answered += 1
        correct_id = q.get('correct_choice')
        selected = next((c for c in q.get('choices', []) if c['choice_id'] == cid), None)
        if not selected:
            continue

        vector = selected.get('vector', {})
        level = q.get('passage', {}).get('level')
        multiplier = get_level_multiplier(config, test_key, level)

        if cid == correct_id:
            correct_total += 1
            apply_vector(scores, vector, correct_weight, multiplier=1.0)
        else:
            apply_vector(scores, vector, incorrect_weight, multiplier=multiplier)
            accumulate_error(error_contrib, vector, selected.get('error_path'),
                             incorrect_weight, multiplier)

    clamp_scores(scores)
    raw_tci = sum(scores.values()) / len(scores)
    confidence = calculate_confidence(answered, config)
    adjusted_tci = apply_confidence_to_tci(raw_tci, confidence, base=base_score)

    test_order = config.get('test_order', [])
    label_map = {k: get_test_label(config, k) for k in test_order}
    recommendation = calculate_recommendation(test_key, adjusted_tci, test_order, label_map, confidence)

    bottlenecks = sorted(scores.items(), key=lambda x: x[1])[:2]
    bottleneck_errors = {}
    for comp, _ in bottlenecks:
        if error_contrib.get(comp):
            top_error = max(error_contrib[comp].items(), key=lambda x: x[1])[0]
            bottleneck_errors[comp] = top_error

    next_step = "maintain"
    if recommendation["test_key"] != test_key:
        rec_idx = test_order.index(recommendation["test_key"]) if recommendation["test_key"] in test_order else -1
        cur_idx = test_order.index(test_key) if test_key in test_order else -1
        if rec_idx < cur_idx:
            next_step = "review_previous_tier"
        else:
            next_step = "advance_next_tier"
    elif recommendation.get("level"):
        next_step = f"reinforce_level_{recommendation['level']}"

    return {
        "scores": scores,
        "raw_tci": raw_tci,
        "confidence": confidence,
        "adjusted_tci": adjusted_tci,
        "recommendation": recommendation,
        "bottleneck_competencies": [b[0] for b in bottlenecks],
        "bottleneck_errors": bottleneck_errors,
        "error_contributions": error_contrib,
        "next_step": next_step,
        "answered": answered,
        "correct": correct_total,
    }


# ─── Diagnostic narrative ──────────────────────────────────────────

NARRATIVE_TEMPLATES = {
    "어휘력": "어휘의 정확한 의미를 파악하는 데 어려움이 있습니다. 다양한 어휘를 문맥 속에서 학습하는 것이 도움됩니다.",
    "문장 독해력": "문장 내 주어-서술어 호응이나 핵심 정보를 놓치는 경향이 있습니다. 문장 구조를 의식적으로 분석하는 연습이 필요합니다.",
    "구조 독해력": "글 전체의 논리적 흐름과 구조를 파악하는 데 보완이 필요합니다. 문단 간 관계를 도식화하는 훈련을 권장합니다.",
    "논리 사고력": "논리적 추론 과정에서 비약이나 전제 누락이 나타납니다. 인과 관계와 조건 관계를 구분하는 연습이 도움됩니다.",
    "어법·문법 능력": "문법 규칙 적용에 오류가 있습니다. 기본 품사, 문장 성분, 음운 규칙을 체계적으로 복습하세요.",
    "국어 개념 적용 능력": "국어 교과 개념을 실제 문제에 적용하는 데 어려움이 있습니다. 개념 학습 후 다양한 적용 문제를 풀어보세요.",
    "국어 관련 배경지식": "국어 관련 배경지식이 부족합니다. 문학사, 문학 용어, 갈래별 특성 등을 보충하세요.",
    "비문학 배경지식": "비문학 소재에 대한 배경지식이 부족합니다. 다양한 주제의 비문학 지문을 꾸준히 읽는 것을 권장합니다.",
    "문제 분석 및 전략 수립 능력": "문제가 요구하는 바를 정확히 파악하지 못하는 경향이 있습니다. 문제 유형별 접근 전략을 학습하세요.",
    "선택지 분석 및 전략 수립 능력": "선택지 간 미세한 차이를 구별하는 데 어려움이 있습니다. 소거법과 선택지 비교 전략을 연습하세요.",
}


def generate_narrative(bottleneck_competencies, bottleneck_errors):
    parts = []
    for comp in bottleneck_competencies:
        text = NARRATIVE_TEMPLATES.get(comp, f"{comp} 영역의 보강이 필요합니다.")
        error = bottleneck_errors.get(comp)
        if error:
            text += f" (주요 오류 패턴: {error})"
        parts.append(f"**{comp}**: {text}")
    return "\n\n".join(parts)


# ─── Charts ─────────────────────────────────────────────────────────

def radar_chart(scores):
    cats = list(scores.keys())
    vals = list(scores.values())
    vals.append(vals[0])
    cats.append(cats[0])

    fig = go.Figure(go.Scatterpolar(
        r=vals, theta=cats, fill='toself',
        line=dict(color='#2E86AB', width=2),
        fillcolor='rgba(46, 134, 171, 0.3)',
    ))
    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
        showlegend=False, height=500,
        title="10대 역량 레이더 차트",
    )
    return fig


def gauge_chart(tci, confidence):
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=tci,
        title={'text': f"TCI (신뢰도: {confidence:.0%})"},
        gauge={
            'axis': {'range': [0, 100]},
            'bar': {'color': '#2E86AB'},
            'steps': [
                {'range': [0, 35], 'color': '#ffcccc'},
                {'range': [35, 45], 'color': '#ffe0b2'},
                {'range': [45, 55], 'color': '#fff9c4'},
                {'range': [55, 65], 'color': '#c8e6c9'},
                {'range': [65, 100], 'color': '#a5d6a7'},
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75, 'value': 50
            }
        }
    ))
    fig.update_layout(height=350)
    return fig


def history_chart(sessions):
    if not sessions:
        return None
    data = []
    for s in sessions:
        if s['adjusted_tci'] is not None:
            data.append({
                "날짜": s['started_at'][:10] if s['started_at'] else "",
                "TCI": s['adjusted_tci'],
                "시험": s['test_key'],
            })
    if not data:
        return None
    df = pd.DataFrame(data)
    fig = px.line(df, x="날짜", y="TCI", color="시험", markers=True,
                  title="역량 변화 추이")
    fig.update_layout(height=400)
    return fig


# ─── Page definitions ───────────────────────────────────────────────

def page_main():
    st.title("국어농장 v2 진단 테스트")
    st.markdown("학생 정보를 입력하고 진단 테스트를 시작하세요.")

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("학생 등록")
        name = st.text_input("이름")
        grade = st.number_input("학년", min_value=1, max_value=12, value=1)
        if st.button("등록", type="primary"):
            if name.strip():
                sid = insert_student(name.strip(), grade)
                st.success(f"등록 완료! (ID: {sid})")
                st.rerun()
            else:
                st.error("이름을 입력하세요.")

    with col2:
        st.subheader("등록된 학생")
        students = get_students()
        if students:
            for s in students[:10]:
                st.write(f"- **{s['name']}** (학년: {s['grade']}, ID: {s['id']})")
        else:
            st.info("등록된 학생이 없습니다.")


def page_select_test():
    st.title("시험 선택")

    students = get_students()
    if not students:
        st.warning("먼저 학생을 등록하세요.")
        return

    student_options = {f"{s['name']} (ID:{s['id']})": s['id'] for s in students}
    selected = st.selectbox("학생 선택", list(student_options.keys()))
    student_id = student_options[selected]

    config = load_config()
    test_order = config.get('test_order', [])
    test_labels = {k: get_test_label(config, k) for k in test_order}

    test_key = st.selectbox("시험 종류",
                            test_order,
                            format_func=lambda x: f"{test_labels[x]} (레벨 {config['scoring']['level_band_ranges'][x][0]}-{config['scoring']['level_band_ranges'][x][1]})")

    mode = st.radio("모드", ["full", "adaptive"],
                    format_func=lambda x: "전체 (60문항)" if x == "full" else "적응형 (15~40문항)")

    if st.button("시험 시작", type="primary"):
        session_id = create_session(student_id, test_key, mode)
        passages = load_all_questions(config, test_key)

        st.session_state['exam'] = {
            'session_id': session_id,
            'student_id': student_id,
            'test_key': test_key,
            'mode': mode,
            'config': config,
            'passages': passages,
            'current_passage': 0,
            'current_question': 0,
            'responses': [],
            'started': True,
        }
        st.session_state['page'] = 'exam'
        st.rerun()


def page_exam():
    st.title("시험 진행")

    if 'exam' not in st.session_state or not st.session_state['exam'].get('started'):
        st.warning("시험이 시작되지 않았습니다. '시험 선택' 페이지로 이동하세요.")
        return

    exam = st.session_state['exam']
    passages = exam['passages']
    config = exam['config']
    test_key = exam['test_key']
    mode = exam['mode']

    # For adaptive mode, try importing CAT engine
    cat_engine = None
    if mode == 'adaptive':
        try:
            from cat_engine import CATEngine
            if 'cat_engine' not in exam:
                all_questions = []
                for p in passages:
                    all_questions.extend(p['questions'])
                cat_engine = CATEngine(all_questions, config, test_key)
                exam['cat_engine'] = cat_engine
                exam['cat_batch'] = cat_engine.select_next_batch()
                exam['cat_q_idx'] = 0
            else:
                cat_engine = exam['cat_engine']
        except ImportError:
            st.error("CAT 엔진을 불러올 수 없습니다. 전체 모드로 진행합니다.")
            mode = 'full'

    # Calculate total and progress
    if mode == 'adaptive' and cat_engine:
        total_answered = len(exam['responses'])
        current_batch = exam.get('cat_batch', [])
        cat_q_idx = exam.get('cat_q_idx', 0)

        if cat_q_idx >= len(current_batch):
            # Process batch and check stop
            should_stop, reason = cat_engine.should_stop()
            if should_stop:
                st.session_state['page'] = 'report'
                st.rerun()
                return
            exam['cat_batch'] = cat_engine.select_next_batch()
            exam['cat_q_idx'] = 0
            current_batch = exam['cat_batch']
            cat_q_idx = 0

        if not current_batch:
            st.session_state['page'] = 'report'
            st.rerun()
            return

        q = current_batch[cat_q_idx]
        # Find passage for this question
        passage_text = ""
        for p in passages:
            for pq in p['questions']:
                if pq['question_id'] == q['question_id']:
                    passage_text = p['text']
                    break

        st.progress(min(total_answered / 40, 1.0),
                    text=f"응답: {total_answered}문항 | 적응형 모드")

    else:
        # Full mode
        total_questions = sum(len(p['questions']) for p in passages)
        total_answered = len(exam['responses'])
        cp = exam['current_passage']
        cq = exam['current_question']

        if cp >= len(passages):
            st.session_state['page'] = 'report'
            st.rerun()
            return

        passage = passages[cp]
        passage_text = passage['text']
        questions = passage['questions']

        if cq >= len(questions):
            exam['current_passage'] += 1
            exam['current_question'] = 0
            st.rerun()
            return

        q = questions[cq]
        st.progress(total_answered / max(total_questions, 1),
                    text=f"{total_answered + 1}/{total_questions} 문항")

    # Display
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.subheader(f"지문: {q.get('passage', {}).get('passage_id', '')}")
        st.markdown(passage_text[:3000] if len(passage_text) > 3000 else passage_text)

    with col_right:
        st.subheader(f"문항 {q.get('question_id', '')}")
        st.markdown(f"**{q.get('question', {}).get('stem', '')}**")

        box = q.get('question', {}).get('box')
        if box:
            st.info(box)

        choices = q.get('choices', [])
        if choices:
            choice_labels = [f"{c['choice_id']}. {c['text']}" for c in choices]
            answer_key = f"answer_{q['question_id']}"
            selected = st.radio("답을 선택하세요:", choice_labels,
                                key=answer_key, index=None)

            if st.button("제출", key=f"submit_{q['question_id']}", type="primary"):
                if selected is None:
                    st.warning("답을 선택하세요.")
                else:
                    choice_id = selected.split(".")[0]
                    correct_id = q.get('correct_choice')
                    is_correct = (choice_id == correct_id)

                    # Save response
                    resp = {'question_id': q['question_id'], 'choice_id': choice_id}
                    exam['responses'].append(resp)
                    save_response(exam['session_id'], q['question_id'],
                                  choice_id, is_correct)

                    if mode == 'adaptive' and cat_engine:
                        cat_engine.process_response(q, choice_id)
                        exam['cat_q_idx'] += 1
                    else:
                        exam['current_question'] += 1

                    st.rerun()

    # Skip / finish buttons
    st.divider()
    col_a, col_b = st.columns(2)
    with col_b:
        if st.button("시험 종료 및 채점"):
            st.session_state['page'] = 'report'
            st.rerun()


def page_report():
    st.title("진단 리포트")

    if 'exam' not in st.session_state:
        st.warning("시험 데이터가 없습니다.")
        return

    exam = st.session_state['exam']
    config = exam['config']
    test_key = exam['test_key']
    responses = exam['responses']
    session_id = exam['session_id']

    if not responses:
        st.warning("응답한 문항이 없습니다.")
        return

    report = score_responses(config, test_key, responses)

    # Save to DB
    complete_session(session_id, report['raw_tci'], report['confidence'],
                     report['adjusted_tci'], report['recommendation']['label'],
                     report['next_step'])
    save_competency_scores(session_id, report['scores'], report['confidence'])

    # Display results
    col1, col2 = st.columns([1, 1])

    with col1:
        st.plotly_chart(gauge_chart(report['adjusted_tci'], report['confidence']),
                        use_container_width=True)
        st.metric("정답률", f"{report['correct']}/{report['answered']} "
                            f"({report['correct']/max(report['answered'],1)*100:.0f}%)")
        st.metric("권장 다음 단계", report['recommendation']['label'])

    with col2:
        st.plotly_chart(radar_chart(report['scores']), use_container_width=True)

    # Bottleneck analysis
    st.subheader("병목 역량 분석")
    narrative = generate_narrative(report['bottleneck_competencies'],
                                   report['bottleneck_errors'])
    st.markdown(narrative)

    # Error path frequency
    st.subheader("오답 경로 빈도 분석")
    all_errors = {}
    for comp, paths in report['error_contributions'].items():
        for path, val in paths.items():
            all_errors[f"{comp} → {path}"] = all_errors.get(f"{comp} → {path}", 0) + val

    if all_errors:
        sorted_errors = sorted(all_errors.items(), key=lambda x: -x[1])[:10]
        df = pd.DataFrame(sorted_errors, columns=["오류 경로", "누적 패널티"])
        st.bar_chart(df.set_index("오류 경로"))

    # Score table
    st.subheader("역량별 상세 점수")
    score_df = pd.DataFrame([
        {"역량": k, "점수": round(v, 1)} for k, v in report['scores'].items()
    ])
    st.dataframe(score_df, use_container_width=True, hide_index=True)

    # Clear exam state
    if 'exam' in st.session_state:
        del st.session_state['exam']


def page_history():
    st.title("학습 이력")

    students = get_students()
    if not students:
        st.info("등록된 학생이 없습니다.")
        return

    student_options = {f"{s['name']} (ID:{s['id']})": s['id'] for s in students}
    selected = st.selectbox("학생 선택", list(student_options.keys()))
    student_id = student_options[selected]

    sessions = get_student_sessions(student_id)
    if not sessions:
        st.info("시험 이력이 없습니다.")
        return

    # History chart
    fig = history_chart(sessions)
    if fig:
        st.plotly_chart(fig, use_container_width=True)

    # Session list
    st.subheader("시험 기록")
    for s in sessions:
        with st.expander(
            f"{s['test_key']} | TCI: {s['adjusted_tci'] or 'N/A'} | "
            f"{s['started_at'][:16] if s['started_at'] else 'N/A'}"
        ):
            if s['adjusted_tci'] is not None:
                scores = get_session_scores(s['id'])
                if scores:
                    st.plotly_chart(radar_chart(scores), use_container_width=True)
            st.write(f"- 모드: {s['mode']}")
            st.write(f"- 권장 레벨: {s['recommended_level'] or 'N/A'}")
            st.write(f"- 신뢰도: {s['confidence'] or 'N/A'}")


def page_admin():
    st.title("관리자 대시보드")

    sessions = get_all_sessions()
    if not sessions:
        st.info("시험 데이터가 없습니다.")
        return

    # Overview metrics
    total_students = len(set(s['student_id'] for s in sessions))
    completed = [s for s in sessions if s['adjusted_tci'] is not None]

    col1, col2, col3 = st.columns(3)
    col1.metric("전체 학생 수", total_students)
    col2.metric("전체 시험 수", len(sessions))
    col3.metric("평균 TCI", f"{sum(s['adjusted_tci'] for s in completed)/max(len(completed),1):.1f}"
                if completed else "N/A")

    # Per-test stats
    st.subheader("시험별 통계")
    test_stats = {}
    for s in completed:
        tk = s['test_key']
        if tk not in test_stats:
            test_stats[tk] = []
        test_stats[tk].append(s['adjusted_tci'])

    if test_stats:
        stat_df = pd.DataFrame([
            {
                "시험": tk,
                "응시 수": len(vals),
                "평균 TCI": round(sum(vals) / len(vals), 1),
                "최소": round(min(vals), 1),
                "최대": round(max(vals), 1),
            }
            for tk, vals in test_stats.items()
        ])
        st.dataframe(stat_df, use_container_width=True, hide_index=True)

    # Question-level analysis
    st.subheader("문항별 정답률")
    conn = get_db()
    q_stats = conn.execute(
        "SELECT question_id, "
        "COUNT(*) as total, "
        "SUM(is_correct) as correct_count "
        "FROM responses GROUP BY question_id ORDER BY question_id"
    ).fetchall()
    conn.close()

    if q_stats:
        q_df = pd.DataFrame([
            {
                "문항 ID": r['question_id'],
                "응답 수": r['total'],
                "정답 수": r['correct_count'],
                "정답률": round(r['correct_count'] / max(r['total'], 1) * 100, 1),
            }
            for r in q_stats
        ])
        st.dataframe(q_df, use_container_width=True, hide_index=True)


# ─── Main app routing ───────────────────────────────────────────────

def main():
    st.set_page_config(
        page_title="국어농장 v2 진단 테스트",
        page_icon="📚",
        layout="wide",
    )

    # Sidebar navigation
    pages = {
        "메인 / 학생 등록": page_main,
        "시험 선택": page_select_test,
        "시험 진행": page_exam,
        "진단 리포트": page_report,
        "학습 이력": page_history,
        "관리자 대시보드": page_admin,
    }

    # Override page if exam is in progress
    if st.session_state.get('page') == 'exam':
        default_idx = 2
    elif st.session_state.get('page') == 'report':
        default_idx = 3
    else:
        default_idx = 0

    with st.sidebar:
        st.title("국어농장 v2")
        page_name = st.radio("메뉴", list(pages.keys()), index=default_idx)

    pages[page_name]()


if __name__ == "__main__":
    main()
