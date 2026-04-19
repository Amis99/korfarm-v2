"""
비트겐슈타인3 객관식 자동 휴리스틱 1차 스크리닝
- A1: 어색 어휘/오타
- A2: 정답 위치 편향 (전체 통계 + cq_03/문항번호별)
- A3: 정답 보편성 + 오답 비상식
- A4: 부정형 발문 + 강한 단정어 in 정답
- A5: 정답이 stem과 표면 일치(paraphrase)
- B1/B2/B3/B4: 일반상식·도덕격언, 비상식 오답
- C1/C2/C3: 어색 한국어, AI 어투
- D1/D2/D3/D4: 출제 모호
"""
import json, re, os, collections

base = r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서'
items = []
with open(os.path.join(base,'_witt3_all_mc.jsonl'),'r',encoding='utf-8') as f:
    for line in f:
        items.append(json.loads(line))

# A2: 정답 위치 분포 — 챕터별, 문항번호별
ans_total = collections.Counter()
ans_by_num = collections.defaultdict(collections.Counter)
ans_by_ch = collections.defaultdict(collections.Counter)
for it in items:
    ans = it['answer']
    ans_total[ans] += 1
    ans_by_num[it.get('number','?')][ans] += 1
    ans_by_ch[it['chapter']][ans] += 1

print('=== 정답 위치 분포 (전체) ===')
total = sum(ans_total.values())
for k in ['①','②','③','④','⑤']:
    v = ans_total[k]
    print(f'  {k}: {v} ({v/total*100:.1f}%)')

print('\n=== 문항 번호별 정답 분포 ===')
for num in sorted(ans_by_num.keys(), key=lambda x: (isinstance(x,str), x)):
    cnt = ans_by_num[num]
    s = sum(cnt.values())
    if s == 0: continue
    parts = ' '.join(f'{k}:{cnt[k]}({cnt[k]/s*100:.0f}%)' for k in ['①','②','③','④','⑤'])
    print(f'  Q{num} (n={s}): {parts}')

print('\n=== 챕터별 정답 ① 비율 ===')
for ch in sorted(ans_by_ch.keys()):
    cnt = ans_by_ch[ch]
    s = sum(cnt.values())
    print(f'  {ch}: ①={cnt["①"]}/{s} ({cnt["①"]/s*100:.0f}%)')


# 부정형 발문 + 강한 단정어 in 정답
def is_negative_stem(stem):
    s = stem
    return any(k in s for k in ['적절하지 않은','일치하지 않','옳지 않','적절하지 않','어긋나는','부합하지 않','없는 것은','아닌 것은','거리가 먼'])

strong_words = ['전혀','절대','완전히','반드시','오직','결코','오로지','모든','어떤 ~도','단지','오로지']

suspect = []

for it in items:
    flags = []
    stem = it['stem']
    ans = it['answer']
    choices = it['choices']
    ans_text = next((c.get('text','') for c in choices if c.get('id') == ans), '')

    # A4: 부정형 + 강한 단정
    if is_negative_stem(stem):
        for w in ['전혀','절대','완전히','결코','오로지','반드시','오직']:
            if w in ans_text:
                flags.append(('A4', f'부정형 발문 정답에 강한 단정어 "{w}"'))
                break

    # A5: 정답이 stem 표현 그대로 paraphrase — 어휘 5어 이상 일치
    if not is_negative_stem(stem):
        # 명사 4글자 이상 키워드 추출
        stem_kw = set(re.findall(r'[가-힣]{4,}', stem))
        ans_kw = set(re.findall(r'[가-힣]{4,}', ans_text))
        overlap = stem_kw & ans_kw
        if len(overlap) >= 3:
            flags.append(('A5', f'정답이 stem 키워드 {len(overlap)}개와 직접 겹침: {list(overlap)[:3]}'))

    # C1: 어색 결합 — "하하는", "매우 매우", "을을", "이이"
    full_text = ' '.join([c.get('text','') for c in choices])
    for pat, why in [
        (r'하하[는다]', '"하하는/하하다" 어색 결합'),
        (r'매우\s+매우', '"매우 매우" 중복'),
        (r'을\s*을\s', '조사 중복 "을 을"'),
        (r'이\s*이\s', '조사 중복 "이 이"'),
        (r'것것', '"것것" 중복'),
        (r'에에', '"에에" 중복'),
    ]:
        m = re.search(pat, full_text)
        if m:
            flags.append(('C1', why))
            break

    # C2: AI 단조 어구가 5선지 모두에
    for phrase in ['~을 통해','~라 할 수 있다','~에 다름 아니다','다름 아니다']:
        ph = phrase.replace('~','')
        if all(ph in c.get('text','') for c in choices) and ph:
            flags.append(('C2', f'5선지 모두 "{ph}" 반복'))
            break

    # B1/B2: 정답이 일반 격언/도덕적 진술
    moral_kw = ['열심히 노력','환경을 보호','정직이 최선','부모님께 효도','자연을 사랑','우리는 모두']
    for kw in moral_kw:
        if kw in ans_text:
            flags.append(('B1/B2', f'정답에 일반 격언 "{kw}"'))
            break

    # B3: 오답 4개 중 다수가 비상식 — 황당 명제 키워드
    absurd_kw = ['벌받는다','죽어야 한다','쓸모없다','무가치하다','전혀 의미가 없다','전혀 가치가 없다','존재하지 않는다']
    absurd_in_distractors = 0
    for c in choices:
        if c.get('id') == ans: continue
        for kw in absurd_kw:
            if kw in c.get('text',''):
                absurd_in_distractors += 1
                break
    if absurd_in_distractors >= 3:
        flags.append(('B3', f'오답 {absurd_in_distractors}개에 황당 명제'))

    # D2: 5선지 의미 중복 (상위 키워드 비교)
    sigs = []
    for c in choices:
        kw = tuple(sorted(set(re.findall(r'[가-힣]{3,}', c.get('text',''))))[:5])
        sigs.append((c.get('id'), kw))
    seen = {}
    for cid, kw in sigs:
        if kw in seen and len(kw) >= 3:
            flags.append(('D2', f'선지 {seen[kw]} ↔ {cid} 키워드 거의 동일'))
            break
        seen[kw] = cid

    # D4: 단답형 어휘에서 단어 부자연 — "나의 [N]" 등
    if '나의 [' in ans_text or '의 [' in ans_text and '나의' in stem:
        flags.append(('D4', '단답형 어휘 부자연 가능성'))

    # 정답 텍스트 짧은데 stem이 어휘 객관식이면 검토
    if len(ans_text) <= 3 and any(k in stem for k in ['단어','어휘','발음','표기']):
        flags.append(('D4_check','어휘 단답 — 직관 어긋 여부 확인 필요'))

    if flags:
        suspect.append((it, flags))

print(f'\n=== 휴리스틱 의심 후보: {len(suspect)}건 ===')
# 신호별 카운트
signal_counter = collections.Counter()
for it, flags in suspect:
    for code, _ in flags:
        signal_counter[code] += 1
print('신호별:', dict(signal_counter))

# 결과 저장
with open(os.path.join(base,'_witt3_heuristic_out.jsonl'),'w',encoding='utf-8') as f:
    for it, flags in suspect:
        f.write(json.dumps({
            'chapter': it['chapter'],
            'file': it['file'],
            'area': it['area'],
            'number': it['number'],
            'stem': it['stem'][:120],
            'answer': it['answer'],
            'flags': flags,
        }, ensure_ascii=False)+'\n')

print('저장: _witt3_heuristic_out.jsonl')
