# -*- coding: utf-8 -*-
"""Scoring logic: vector application, clamping, confidence, recommendation."""

from .constants import COMPETENCIES, KEY_MAPPING


def normalize_key(k):
    """Map legacy competency names to canonical ones."""
    k = k.strip()
    return KEY_MAPPING.get(k, k)


def apply_vector(scores, vector, weight, multiplier=1.0):
    """Apply a competency vector to the running score dict."""
    for k, v in vector.items():
        nk = normalize_key(k)
        if nk not in scores:
            continue
        delta = v * weight
        if v < 0:
            delta *= multiplier
        scores[nk] += delta


def clamp_scores(scores, low=0, high=100):
    """Clamp all score values to [low, high]."""
    for k in scores:
        if scores[k] < low:
            scores[k] = low
        elif scores[k] > high:
            scores[k] = high


def accumulate_error(error_contrib, vector, error_path, weight, multiplier=1.0):
    """Accumulate error-path penalty contributions per competency."""
    if not error_path:
        error_path = "unknown"
    for k, v in vector.items():
        nk = normalize_key(k)
        if nk not in error_contrib:
            continue
        penalty = abs(v * weight)
        if v < 0:
            penalty *= multiplier
        if penalty <= 0:
            continue
        error_contrib[nk][error_path] = error_contrib[nk].get(error_path, 0.0) + penalty


# --- Confidence system (Idea 3) ---

def calculate_confidence(answered_count, config):
    """Return confidence in [0.0, 1.0] based on number of answered questions."""
    conf_cfg = config.get('confidence', {})
    if not conf_cfg.get('enabled', False):
        return 1.0

    min_q = conf_cfg.get('min_questions', 10)
    full_q = conf_cfg.get('full_confidence_questions', 40)

    if answered_count < min_q:
        return 0.0
    if answered_count >= full_q:
        return 1.0
    return (answered_count - min_q) / (full_q - min_q)


def apply_confidence_to_tci(raw_tci, confidence, base=50.0):
    """Shrink TCI toward base proportionally to confidence."""
    return base + confidence * (raw_tci - base)


def calculate_recommendation(test_key, tci, test_order, label_map, confidence=1.0):
    """Determine recommended level from TCI, with confidence gating."""
    try:
        idx = test_order.index(test_key)
    except ValueError:
        return {"test_key": test_key, "level": None, "label": "Unknown"}

    label = label_map[test_key]

    if confidence < 0.5:
        low_label = "진단 불가 (응답 부족)"
        return {"test_key": test_key, "level": None, "label": low_label}

    if tci < 35:
        if idx == 0:
            return {"test_key": test_key, "level": 1, "label": f"{label} 1"}
        prev_key = test_order[idx - 1]
        return {"test_key": prev_key, "level": 3, "label": f"{label_map[prev_key]} 3"}
    if tci < 45:
        return {"test_key": test_key, "level": 1, "label": f"{label} 1"}
    if tci < 55:
        return {"test_key": test_key, "level": 2, "label": f"{label} 2"}
    if tci < 65:
        return {"test_key": test_key, "level": 3, "label": f"{label} 3"}

    if idx == len(test_order) - 1:
        return {"test_key": test_key, "level": 3, "label": f"{label} 3"}
    next_key = test_order[idx + 1]
    return {"test_key": next_key, "level": 1, "label": f"{label_map[next_key]} 1"}
