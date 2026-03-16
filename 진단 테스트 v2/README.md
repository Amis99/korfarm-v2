# Diagnostic Test v2

This repository contains question metadata, validation scripts, and HTML generators
for the Korean-language diagnostic test system.

## Layout

- `data/`: passage folders with `metadata.json`, `passage.md`, and `questions/*.json`
- `schemas/`: JSON schema for question validation
- `scripts/`: validators, fixers, assembly, simulation, and HTML generators
- `output/`: generated HTML and assembled JSON outputs
- `config.json`: selected passage sets and scoring band ranges

## Quick Start

1) Install dependencies:
```bash
python -m pip install -r requirements.txt
```

2) Validate questions:
```bash
python scripts/validate_question.py data/frege
```

3) Assemble Sohssure (Level 1 test set) and render HTML:
```bash
python scripts/assemble_sohssure_final.py
python scripts/generate_sohssure_html.py
```

4) Generate a combined HTML test paper:
```bash
python scripts/generate_test_paper.py output/final_test_frege.html data/frege/F1_LIT_P1 data/frege/F1_NON_P1 --title "Frege"
```

5) Balance answer distribution (updates JSON files in place):
```bash
python scripts/balance_answers.py
```

6) Run scoring simulation:
```bash
python scripts/simulate_scoring.py
```

## Configuration (`config.json`)

- `test_order`: ordered list of test keys used by scripts.
- `tests.<key>.passages`: list of passage directories used for assembly, balance, and simulation.
- `scoring.level_band_ranges`: maps grade-level ranges to internal bands (1-3).
- `scoring.level_multipliers`: scaling factors applied during simulation to penalty vectors.
- `scoring.base_score`, `scoring.correct_weight`, `scoring.incorrect_weight`: scoring parameters used in simulation/report generation.
- `scoring.apply_level_multiplier`: toggle for applying level multipliers to incorrect vectors.

If you want a different Sohssure set, update the Sohssure `passages` list in
`config.json` so all scripts stay in sync.

## Notes

- `scripts/generate_test_paper.py` uses Paged.js from a CDN for print layout.
- `scripts/balance_answers.py` modifies question JSON files; keep backups if needed.
