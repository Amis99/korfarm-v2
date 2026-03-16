#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Computerized Adaptive Testing (CAT) engine for the diagnostic test."""

import sys
import os
import random

sys.path.insert(0, os.path.dirname(__file__))
from core import (
    COMPETENCIES, load_config, get_level_multiplier,
    normalize_key, apply_vector, clamp_scores,
    calculate_confidence, apply_confidence_to_tci, calculate_recommendation,
    get_test_label,
)

MIN_QUESTIONS = 15
MAX_QUESTIONS = 40
EARLY_STOP_MARGIN = 5.0   # TCI distance from boundaries for early stop
MIN_TOUCHES_ALL = 3        # Each competency must be measured at least this many times


class CATEngine:
    """Adaptive test engine that selects questions targeting weak competencies."""

    def __init__(self, question_pool, config, test_key):
        self.pool = [q for q in question_pool
                     if q.get('question', {}).get('type') != '서술형']
        self.config = config
        self.test_key = test_key
        self.used = set()
        base = float(config.get('scoring', {}).get('base_score', 50.0))
        self.scores = {c: base for c in COMPETENCIES}
        self.touch_counts = {c: 0 for c in COMPETENCIES}
        self.answered_count = 0
        self.correct_count = 0

    def _question_competencies(self, q):
        """Return the set of competencies a question measures."""
        comps = set()
        for choice in q.get('choices', []):
            for k in choice.get('vector', {}).keys():
                nk = normalize_key(k)
                if nk in self.scores:
                    comps.add(nk)
        return comps

    def _question_difficulty(self, q):
        """Estimate difficulty from passage level."""
        return q.get('passage', {}).get('level', 6)

    def _question_info(self, q):
        """Information value = number of distinct competencies measured."""
        return len(self._question_competencies(q))

    def _weak_competencies(self, n=2):
        """Identify the n weakest competencies that have been touched at least once."""
        touched = {c: s for c, s in self.scores.items() if self.touch_counts[c] > 0}
        if not touched:
            return list(self.scores.keys())[:n]
        return sorted(touched, key=lambda c: touched[c])[:n]

    def _untouched_competencies(self):
        """Competencies that haven't been measured yet."""
        return [c for c, t in self.touch_counts.items() if t == 0]

    def select_next_batch(self, batch_size=5):
        """Select the next batch of questions targeting weak areas."""
        available = [q for q in self.pool if q['question_id'] not in self.used]
        if not available:
            return []

        # Priority 1: Cover untouched competencies
        untouched = self._untouched_competencies()
        if untouched:
            target_comps = set(untouched)
        else:
            target_comps = set(self._weak_competencies(2))

        # Score each available question
        scored = []
        for q in available:
            q_comps = self._question_competencies(q)
            overlap = len(q_comps & target_comps)
            info = self._question_info(q)
            difficulty = self._question_difficulty(q)
            # Higher overlap = better, higher info = better, variety in difficulty
            score = overlap * 10 + info * 2 + random.random()
            scored.append((score, difficulty, q))

        scored.sort(key=lambda x: -x[0])

        # Select batch with level diversity
        batch = []
        levels_used = set()
        for score, diff, q in scored:
            if len(batch) >= batch_size:
                break
            # Prefer level diversity in the batch
            if diff not in levels_used or len(batch) < batch_size:
                batch.append(q)
                levels_used.add(diff)
                self.used.add(q['question_id'])

        return batch

    def process_response(self, question, choice_id):
        """Process a student's response and update scores."""
        correct_id = question.get('correct_choice')
        selected = next((c for c in question.get('choices', [])
                         if c['choice_id'] == choice_id), None)
        if not selected:
            return

        self.answered_count += 1
        vector = selected.get('vector', {})
        level = question.get('passage', {}).get('level')
        multiplier = get_level_multiplier(self.config, self.test_key, level)

        correct_weight = float(self.config.get('scoring', {}).get('correct_weight', 0.5))
        incorrect_weight = float(self.config.get('scoring', {}).get('incorrect_weight', 0.8))

        if choice_id == correct_id:
            self.correct_count += 1
            apply_vector(self.scores, vector, correct_weight, multiplier=1.0)
        else:
            apply_vector(self.scores, vector, incorrect_weight, multiplier=multiplier)

        # Update touch counts
        for k in vector:
            nk = normalize_key(k)
            if nk in self.touch_counts:
                self.touch_counts[nk] += 1

        clamp_scores(self.scores)

    def _current_tci(self):
        return sum(self.scores.values()) / len(self.scores)

    def should_stop(self):
        """Check if the test should end. Returns (should_stop, reason)."""
        # Condition 1: Below minimum
        if self.answered_count < MIN_QUESTIONS:
            return False, "min_not_reached"

        # Condition 2: Maximum reached
        if self.answered_count >= MAX_QUESTIONS:
            return True, "max_reached"

        # Condition 3: No more questions
        available = [q for q in self.pool if q['question_id'] not in self.used]
        if not available:
            return True, "pool_exhausted"

        tci = self._current_tci()

        # Condition 4: TCI far from boundaries (clear classification)
        boundaries = [35, 45, 55, 65]
        min_dist = min(abs(tci - b) for b in boundaries)
        if min_dist >= EARLY_STOP_MARGIN and self.answered_count >= 20:
            # Also check all competencies are measured enough
            all_measured = all(t >= MIN_TOUCHES_ALL for t in self.touch_counts.values())
            if all_measured:
                return True, "stable_classification"

        # Condition 5: All competencies well-measured and stable
        if self.answered_count >= 25:
            all_measured = all(t >= MIN_TOUCHES_ALL for t in self.touch_counts.values())
            if all_measured:
                values = list(self.scores.values())
                mean = sum(values) / len(values)
                variance = sum((v - mean) ** 2 for v in values) / len(values)
                # Low variance = stable scores
                if variance < 100:
                    return True, "scores_stable"

        return False, "continue"

    def get_interim_report(self):
        """Return current diagnostic state."""
        tci = self._current_tci()
        confidence = calculate_confidence(self.answered_count, self.config)
        base = float(self.config.get('scoring', {}).get('base_score', 50.0))
        adj_tci = apply_confidence_to_tci(tci, confidence, base)

        test_order = self.config.get('test_order', [])
        label_map = {k: get_test_label(self.config, k) for k in test_order}
        recommendation = calculate_recommendation(
            self.test_key, adj_tci, test_order, label_map, confidence
        )

        weak = self._weak_competencies(2)

        return {
            "answered": self.answered_count,
            "correct": self.correct_count,
            "raw_tci": round(tci, 2),
            "confidence": round(confidence, 2),
            "adjusted_tci": round(adj_tci, 2),
            "recommendation": recommendation,
            "scores": {k: round(v, 1) for k, v in self.scores.items()},
            "touch_counts": dict(self.touch_counts),
            "weak_competencies": weak,
            "remaining_pool": len([q for q in self.pool if q['question_id'] not in self.used]),
        }
