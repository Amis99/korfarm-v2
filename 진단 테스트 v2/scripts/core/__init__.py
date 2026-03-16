# -*- coding: utf-8 -*-
"""Core shared module for the diagnostic test system."""

from .constants import (
    COMPETENCIES,
    COMPETENCIES_SET,
    ALLOWED_VECTOR_KEYS,
    KEY_MAPPING,
    ERROR_PATH_MAPPING,
    ERROR_PATHS,
)
from .config import (
    PROJECT_ROOT,
    load_config,
    get_test_dirs,
    get_test_label,
    get_level_multiplier,
)
from .scoring import (
    normalize_key,
    apply_vector,
    clamp_scores,
    accumulate_error,
    calculate_confidence,
    apply_confidence_to_tci,
    calculate_recommendation,
)
from .vectors import (
    fix_vector_keys,
    fix_choice_logic,
    normalize_positive,
    normalize_negative,
)

__all__ = [
    "COMPETENCIES", "COMPETENCIES_SET", "ALLOWED_VECTOR_KEYS",
    "KEY_MAPPING", "ERROR_PATH_MAPPING", "ERROR_PATHS",
    "PROJECT_ROOT", "load_config", "get_test_dirs", "get_test_label",
    "get_level_multiplier",
    "normalize_key", "apply_vector", "clamp_scores", "accumulate_error",
    "calculate_confidence", "apply_confidence_to_tci", "calculate_recommendation",
    "fix_vector_keys", "fix_choice_logic", "normalize_positive", "normalize_negative",
]
