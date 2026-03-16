# -*- coding: utf-8 -*-
"""Configuration loading and path resolution."""

import json
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CONFIG_PATH = os.path.join(PROJECT_ROOT, 'config.json')


def load_config(path=None):
    """Load config.json and return as dict."""
    p = path or CONFIG_PATH
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_test_dirs(config, test_key):
    """Return absolute paths for passages of a given test key."""
    dirs = config.get('tests', {}).get(test_key, {}).get('passages', [])
    return [os.path.join(PROJECT_ROOT, d) if not os.path.isabs(d) else d for d in dirs]


def get_test_label(config, test_key):
    """Return the human-readable label for a test key."""
    return config.get('tests', {}).get(test_key, {}).get('label', test_key)


def get_level_multiplier(config, test_key, level, apply=None):
    """Return the level-based scoring multiplier."""
    if apply is None:
        apply = config.get('scoring', {}).get('apply_level_multiplier', True)
    if not apply:
        return 1.0

    band_ranges = config.get('scoring', {}).get('level_band_ranges', {})
    multipliers = config.get('scoring', {}).get('level_multipliers', {})
    band_range = band_ranges.get(test_key)
    if not band_range or level is None:
        return 1.0

    min_level, max_level = band_range
    if not (min_level <= level <= max_level):
        return 1.0

    band = level - min_level + 1
    return multipliers.get(str(band), 1.0)
