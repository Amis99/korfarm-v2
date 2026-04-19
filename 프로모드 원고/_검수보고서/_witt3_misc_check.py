"""
A1/A3/B1/B2/B3/B4/A5 추가 휴리스틱 — 위 휴리스틱 외 패턴 추가 검출
"""
import json, re, os

items = []
with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_all_mc.jsonl','r',encoding='utf-8') as f:
    for line in f:
        items.append(json.loads(line))

out = []

# 정답이 stem 키워드와 5개 이상 겹침 (A5 강화)
# 또는 오답 4개 중 3+이 황당한 일반 진술
absurd_phrases = [
    '동일한','동일하다','매체 차이는 무관','전혀 무관','전혀 관계 없',
    '아무런','무용하다','쓸모 없다','쓸모없다','전혀 의미가 없',
    '완벽하게 일치','완벽하게 동일','동일한 ~ 사용해야',
    '똑같이','동일시한','동일시 한',
]

universal_facts = [
    '인간은 누구나','우리는 모두','자연을 사랑','환경을 보호','노력해야',
    '평등을 실현','평화를 추구','정직이 최선','부모님께 효도',
    '학생은 공부해야','국가는 국민을',
]

for it in items:
    flags = []
    stem = it['stem']
    ans = it['answer']
    choices = it['choices']
    ans_text = next((c.get('text','') for c in choices if c.get('id') == ans), '')

    # B3: 5선지 중 ans 외에 황당 명제가 3+
    is_neg = any(k in stem for k in ['적절하지 않','일치하지 않','옳지 않','어긋나는','부합하지 않','없는 것은','아닌 것은'])

    # B1/B2: 정답에 '보편 격언'
    for kw in universal_facts:
        if kw in ans_text:
            flags.append(('B1/B2', f'정답에 보편 격언/도덕 "{kw}"'))
            break

    # 긍정형 발문에서 정답이 스테레오타입 진리 (B4)
    if not is_neg and any(k in stem for k in ['가장 적절','적절한 것은','맞는 것은']):
        # 정답 키워드 시작 패턴
        if any(p in ans_text[:30] for p in ['~을 통해','지문의 핵심은','~에 다름 아니다']):
            flags.append(('B4','긍정형 정답에 보편적 일반론'))

    # A5: 정답이 stem과 핵심 키워드 다수 중복
    if not is_neg:
        stem_kw = set(re.findall(r'[가-힣]{4,}', stem))
        ans_kw = set(re.findall(r'[가-힣]{4,}', ans_text))
        if len(stem_kw & ans_kw) >= 3:
            flags.append(('A5', f'정답이 stem 키워드 {len(stem_kw & ans_kw)}개 직접 인용'))

    # A1: 한국어 화자 직관 어긋 — '나의 [N]', '[N]의 [N]' 같은 부자연 표현
    for ph in ['나의 [','이의 [','너의 [']:
        if ph in ans_text:
            flags.append(('A1','부자연 어휘 표현'))
            break

    # E1 후보: 정답 텍스트에 절대화 표현이 들어가지만 부정형이 아님 (지문에 없는 사실 가능성)
    # 이미 A4 처리됨

    # 정답을 제외한 4선지 중 비상식적 진술 다수 (B3)
    if is_neg:
        # 부정형이면 정답이 황당 진술이라 정답이 아닌 4선지가 정상이어야 함 (역케이스)
        pass
    else:
        # 긍정형이면 4개 오답이 황당이어야 정답이 도드라짐
        absurd_count = 0
        for c in choices:
            if c.get('id') == ans: continue
            ct = c.get('text','')
            for kw in absurd_phrases:
                if kw in ct:
                    absurd_count += 1
                    break
        if absurd_count >= 3:
            flags.append(('B3', f'4선지 중 {absurd_count}개에 황당 표현'))

    if flags:
        out.append({
            'chapter':it['chapter'],'file':it['file'],'number':it['number'],
            'answer':it['answer'],'flags':flags,
            'stem':it['stem'][:300],
            'all_choices':[(c.get('id'),c.get('text','')[:200]) for c in it['choices']],
        })

with open(r'C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지\프로모드 원고\_검수보고서\_witt3_misc_dump.txt','w',encoding='utf-8') as f:
    f.write(f'추가 의심 후보 총 {len(out)}건\n\n')
    for h in out:
        f.write(f'=== {h["chapter"]} {h["file"]} Q{h["number"]} 정답={h["answer"]} 신호={h["flags"]} ===\n')
        f.write(f'STEM: {h["stem"]}\n')
        for cid, ct in h["all_choices"]:
            mark = '★' if cid == h['answer'] else ' '
            f.write(f' {mark} {cid} {ct}\n')
        f.write('\n')
print(f'Saved {len(out)} cases')
