#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix unescaped double quotes inside JSON string values"""

import json
import os

files = [43, 44, 45, 46, 47, 49]
base = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\frontend\public\farm\background\wittgenstein1'

for num in files:
    path = os.path.join(base, f'bg_w1_{num:02d}.json')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    fixed_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('"text"') or stripped.startswith('"stem"') or stripped.startswith('"description"'):
            colon_pos = line.index(':')
            before = line[:colon_pos + 1]
            after = line[colon_pos + 1:].strip()

            if after.startswith('"'):
                has_comma = after.rstrip().endswith(',')
                if has_comma:
                    after = after.rstrip()[:-1]

                inner = after[1:-1]

                fixed_inner = ''
                i = 0
                while i < len(inner):
                    ch = inner[i]
                    if ch == '\\' and i + 1 < len(inner) and inner[i + 1] == '"':
                        fixed_inner += '\\"'
                        i += 2
                    elif ch == '"':
                        fixed_inner += '\\"'
                        i += 1
                    else:
                        fixed_inner += ch
                        i += 1

                after = '"' + fixed_inner + '"'
                if has_comma:
                    after += ','

                line = before + ' ' + after

        fixed_lines.append(line)

    fixed_content = '\n'.join(fixed_lines)

    try:
        json.loads(fixed_content)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f'bg_w1_{num:02d}: FIXED')
    except json.JSONDecodeError as e:
        print(f'bg_w1_{num:02d}: STILL ERROR - {e}')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
