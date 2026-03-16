# -*- coding: utf-8 -*-
"""Vector key normalization and choice-logic fixing."""

from .constants import ALLOWED_VECTOR_KEYS, KEY_MAPPING, ERROR_PATH_MAPPING


def fix_vector_keys(vector):
    """Normalize vector keys using KEY_MAPPING and whitespace stripping."""
    new_vector = {}
    for k, v in vector.items():
        new_key = KEY_MAPPING.get(k, k)
        if new_key not in ALLOWED_VECTOR_KEYS:
            stripped = new_key.strip()
            for allowed in ALLOWED_VECTOR_KEYS:
                if allowed == stripped:
                    new_key = allowed
                    break
        new_vector[new_key] = v
    return new_vector


def fix_choice_logic(choice, is_correct, fix_error_path=True):
    """Fix vector polarity and error_path for a single choice.

    Returns True if any modification was made.
    """
    modified = False

    # Error path fixes
    if fix_error_path:
        if 'error_path' not in choice:
            choice['error_path'] = "정답" if is_correct else "지문 내용 불일치"
            modified = True
        elif choice.get('error_path') in ERROR_PATH_MAPPING:
            choice['error_path'] = ERROR_PATH_MAPPING[choice['error_path']]
            modified = True

    # Vector polarity
    current_vector = choice.get('vector', {})
    new_vector = {}

    if is_correct:
        for k, v in current_vector.items():
            if v < 0:
                new_vector[k] = abs(v)
                modified = True
            else:
                new_vector[k] = v
    else:
        for k, v in current_vector.items():
            if v > 0:
                if v >= 10:
                    val = -3
                elif v >= 5:
                    val = -2
                else:
                    val = -1
                new_vector[k] = val
                modified = True
            else:
                new_vector[k] = v

    choice['vector'] = new_vector
    return modified


def normalize_positive(val):
    """Normalize a positive vector value (always 10)."""
    return 10


def normalize_negative(val):
    """Normalize a negative vector value to [-5, -2] range."""
    if val <= -5:
        return -5
    if val in (-4, -3, -2):
        return val
    if val == -1:
        return -2
    return -3
