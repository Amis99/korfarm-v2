"""
비트3 4-페르소나(T·S·M·I) 점검 자동 탐지 스크립트
셔플 후 정답 위치 분포 + 신호별 의심 문항 자동 추출
"""
import json, os, re, sys, io
from collections import Counter, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\비트겐슈타인3'
mc_path = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_all_mc.jsonl'

items = []
with open(mc_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        items.append(json.loads(line))

print(f'총 객관식 수: {len(items)}', file=sys.stderr)

# === 정답 위치 분포 통계 ===
ans_total = Counter()
ans_by_chapter = defaultdict(Counter)
ans_by_qnum = defaultdict(Counter)
ans_by_area = defaultdict(Counter)

for it in items:
    ans = it['answer']
    ans_total[ans] += 1
    ans_by_chapter[it['chapter']][ans] += 1
    ans_by_qnum[it['number']][ans] += 1
    ans_by_area[it['area']][ans] += 1

POS = ['①','②','③','④','⑤']

print('\n=== 전체 정답 위치 분포 ===')
N = len(items)
for p in POS:
    c = ans_total[p]
    print(f'  {p}: {c} ({c/N*100:.1f}%)')

print('\n=== 챕터별 정답 위치 분포 ===')
print('| 챕터 | ① | ② | ③ | ④ | ⑤ | 합계 |')
print('|---|---|---|---|---|---|---|')
for ch in sorted(ans_by_chapter.keys()):
    cnt = ans_by_chapter[ch]
    tot = sum(cnt.values())
    row = f'| {ch} '
    for p in POS:
        c = cnt[p]
        row += f'| {c} ({c/tot*100:.0f}%) '
    row += f'| {tot} |'
    print(row)

print('\n=== 문항번호별 정답 위치 분포 ===')
print('| Q | ① | ② | ③ | ④ | ⑤ | 합계 |')
print('|---|---|---|---|---|---|---|')
for q in sorted(ans_by_qnum.keys()):
    cnt = ans_by_qnum[q]
    tot = sum(cnt.values())
    row = f'| Q{q} '
    for p in POS:
        c = cnt[p]
        row += f'| {c} ({c/tot*100:.0f}%) '
    row += f'| {tot} |'
    print(row)

print('\n=== 영역별 정답 위치 분포 ===')
print('| 영역 | ① | ② | ③ | ④ | ⑤ | 합계 |')
print('|---|---|---|---|---|---|---|')
for area in ['reading','literature','grammar']:
    cnt = ans_by_area[area]
    tot = sum(cnt.values())
    row = f'| {area} '
    for p in POS:
        c = cnt[p]
        row += f'| {c} ({c/tot*100:.0f}%) '
    row += f'| {tot} |'
    print(row)

# === 의심 신호 자동 탐지 ===
suspects = []  # {file, q, area, persona, signal, answer, reason, severity}

ABS_WORDS = ['완전히','전혀','반드시','결코','절대','오직','유일하게','전부']
ABS_RE = re.compile('|'.join(ABS_WORDS))
NEG_RE = re.compile(r'(적절하지\s*않은|옳지\s*않은|틀린|아닌|일치하지\s*않는|어긋나는|볼\s*수\s*없는)')

for it in items:
    ch = it['chapter']
    fn = it['file']
    q = it['number']
    area = it['area']
    stem = it['stem']
    ans = it['answer']
    explanation = it.get('explanation','') or ''
    choices = it['choices']
    correct_choice = next((c for c in choices if c.get('id')==ans), None)
    correct_text = (correct_choice.get('text','') if correct_choice else '')

    is_neg = bool(NEG_RE.search(stem))

    # ============ T·S 신호: 부정형 발문 + 단정어 ============
    if is_neg and ABS_RE.search(correct_text):
        suspects.append({
            'file': f'{ch}/{fn}', 'q': q, 'area': area,
            'persona': 'T·S', 'signal': 'T1·S5',
            'answer': ans,
            'reason': f'부정형 발문+정답에 단정어 "{ABS_RE.search(correct_text).group()}" — 글 안 읽고도 정답 추측 가능',
            'severity': 'high'
        })

    # ============ M2 신호: 데이터 무결성 (grammar만 isCorrect 체크) ============
    if area == 'grammar':
        has_iscorrect = any('isCorrect' in c for c in choices)
        if has_iscorrect:
            correct_ids = [c['id'] for c in choices if c.get('isCorrect')]
            if len(correct_ids) != 1:
                suspects.append({
                    'file': f'{ch}/{fn}', 'q': q, 'area': area,
                    'persona': 'M', 'signal': 'M2',
                    'answer': ans,
                    'reason': f'isCorrect=True인 선지가 {len(correct_ids)}개 (1개여야 함)',
                    'severity': 'critical'
                })
            elif correct_ids[0] != ans:
                suspects.append({
                    'file': f'{ch}/{fn}', 'q': q, 'area': area,
                    'persona': 'M', 'signal': 'M2',
                    'answer': ans,
                    'reason': f'answer({ans})과 isCorrect 선지({correct_ids[0]}) 불일치 — 셔플 누락 가능성',
                    'severity': 'critical'
                })

    # ============ S5 신호: 정답 길이 단서 ============
    lens = [len(c.get('text','')) for c in choices]
    if len(lens) == 5:
        correct_idx = next((i for i,c in enumerate(choices) if c.get('id')==ans), -1)
        if correct_idx >= 0:
            correct_len = lens[correct_idx]
            others = [l for i,l in enumerate(lens) if i!=correct_idx]
            avg_other = sum(others)/len(others) if others else 0
            if avg_other > 0 and (correct_len > avg_other * 1.7 or correct_len < avg_other * 0.5):
                ratio = correct_len / avg_other
                already = any(s for s in suspects if s['file']==f'{ch}/{fn}' and s['q']==q)
                if not already:
                    suspects.append({
                        'file': f'{ch}/{fn}', 'q': q, 'area': area,
                        'persona': 'S', 'signal': 'S5',
                        'answer': ans,
                        'reason': f'정답 길이가 평균의 {ratio:.1f}배 — 길이 단서 의심 (정답 {correct_len}자 vs 평균 {avg_other:.0f}자)',
                        'severity': 'medium'
                    })

    # ============ M4 신호: 5선지 어미 단조 (5글자 이상 동일일 때만) ============
    if len(choices) == 5:
        endings = []
        for c in choices:
            t = c.get('text','').strip()
            endings.append(t[-6:] if len(t)>=6 else t)
        ec = Counter(endings)
        most = ec.most_common(1)[0]
        if most[1] >= 5 and len(most[0]) >= 6:  # 5개 모두 6자 이상 동일
            already = any(s for s in suspects if s['file']==f'{ch}/{fn}' and s['q']==q and 'M' in s['signal'])
            if not already:
                suspects.append({
                    'file': f'{ch}/{fn}', 'q': q, 'area': area,
                    'persona': 'M', 'signal': 'M4',
                    'answer': ans,
                    'reason': f'5선지 모두 동일 어미 "{most[0]}" — 어미 단조',
                    'severity': 'medium'
                })

# === 신호 분포 ===
sig_counter = Counter(s['signal'] for s in suspects)
sev_counter = Counter(s['severity'] for s in suspects)

print('\n=== 의심 신호 분포 ===')
print(f'  총 의심 건수: {len(suspects)}')
print(f'  중요도: {dict(sev_counter)}')
print(f'  신호별: {dict(sig_counter.most_common())}')

# === 의심 문항 출력 (severity 순) ===
print('\n=== 의심 문항 표 ===')
print('| 파일 | Q | 영역 | 페르소나 | 신호 | 정답 | 의심 사유 | 우선순위 |')
print('|---|---|---|---|---|---|---|---|')
sev_order = {'critical':0, 'high':1, 'medium':2, 'low':3}
for s in sorted(suspects, key=lambda x: (sev_order[x['severity']], x['file'], x['q'])):
    print(f"| {s['file']} | Q{s['q']} | {s['area']} | {s['persona']} | {s['signal']} | {s['answer']} | {s['reason']} | {s['severity']} |")

# 별도 jsonl 저장
out_path = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_persona4_suspects.jsonl'
with open(out_path, 'w', encoding='utf-8') as f:
    for s in sorted(suspects, key=lambda x: (sev_order[x['severity']], x['file'], x['q'])):
        f.write(json.dumps(s, ensure_ascii=False)+'\n')
print(f'\n의심 문항 jsonl 저장: {out_path}', file=sys.stderr)
