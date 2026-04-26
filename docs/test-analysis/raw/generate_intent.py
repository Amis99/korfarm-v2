# -*- coding: utf-8 -*-
import subprocess
import sys

DB_CMD = ["mysql", "-h", "korfarm-db.cbmec44k8411.ap-northeast-2.rds.amazonaws.com",
          "-u", "admin", "-pxXoM4Ld7VAIYl9W874md5kic", "korfarm",
          "--default-character-set=utf8mb4"]

def run_sql(sql):
    result = subprocess.run(
        DB_CMD + ["-e", sql],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        print(f"SQL ERROR: {result.stderr}", file=sys.stderr)
        return []
    lines = result.stdout.strip().split("\n")
    if len(lines) <= 1:
        return []
    headers = lines[0].split("\t")
    rows = []
    for line in lines[1:]:
        cols = line.split("\t")
        rows.append(dict(zip(headers, cols)))
    return rows

def generate_intent(domain, stem, qtype, has_passage):
    s = stem or ""

    kw_dd = any(k in s for k in ["뜻풀이", "뜻으로", "의미로", "뜻하는"])
    kw_blank = any(k in s for k in ["빈칸", "들어갈"])
    kw_syn = any(k in s for k in ["비슷한", "가까운", "유의"])
    kw_ant = any(k in s for k in ["반대", "반의"])
    kw_spell = any(k in s for k in ["맞춤법", "띄어쓰기", "바르게 쓴", "올바른 것"])
    kw_idiom = any(k in s for k in ["속담", "사자성어", "관용", "사자 성어"])
    kw_struct = any(k in s for k in ["짜임", "구조", "전개", "갈래", "문단"])
    kw_topic = any(k in s for k in ["주제", "제목", "중심 생각", "중심생각", "중심 내용", "핵심"])
    kw_reason = any(k in s for k in ["근거", "이유", "까닭", "왜"])
    kw_essay = any(k in s for k in ["서술", "쓰시오", "쓰세요", "설명하시오", "써 보세요"])
    kw_content = any(k in s for k in ["일치", "알 수 있", "내용으로"])
    kw_fig = any(k in s for k in ["비유", "은유", "직유", "의인", "과장"])
    kw_pos = any(k in s for k in ["품사", "명사", "동사", "형용사", "부사", "조사", "어미"])
    kw_hon = any(k in s for k in ["높임", "존댓말", "경어", "하십시오"])
    kw_comp = any(k in s for k in ["주어", "서술어", "목적어", "보어", "관형어", "부사어", "문장 성분", "문장성분"])
    kw_phon = any(k in s for k in ["음운", "모음", "자음", "받침", "음절"])
    kw_infer = any(k in s for k in ["추론", "미루어", "짐작"])
    kw_order = any(k in s for k in ["순서", "흐름", "배열", "차례"])
    kw_summ = any(k in s for k in ["요약", "정리"])
    kw_feeling = any(k in s for k in ["심정", "마음", "심리", "감정", "기분"])
    kw_attitude = any(k in s for k in ["태도", "관점", "입장"])
    kw_apt = any(k in s for k in ["적절", "알맞"])
    kw_link = any(k in s for k in ["연결", "관계"])

    is_essay = (qtype == "서술형")

    if domain == "어휘력":
        if kw_dd:
            return "낱말의 뜻풀이를 정확히 아는지 측정하는 문항"
        elif kw_blank:
            return "문맥에 맞는 어휘를 선택하는 능력을 측정하는 문항"
        elif kw_syn:
            return "유의어를 파악하는 어휘 변별력을 측정하는 문항"
        elif kw_ant:
            return "반의어를 파악하는 어휘 변별력을 측정하는 문항"
        elif kw_idiom:
            return "속담이나 관용 표현의 의미를 아는지 측정하는 문항"
        elif kw_link:
            return "낱말과 뜻의 연결을 정확히 하는 능력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "어휘의 의미를 자신의 말로 설명하는 능력을 평가하는 문항"
        elif kw_apt:
            return "어휘의 적절한 사용을 판별하는 능력을 측정하는 문항"
        else:
            return "어휘의 의미와 쓰임을 정확히 아는지 측정하는 문항"

    elif domain == "문장 독해력":
        if kw_blank:
            return "문장 맥락을 파악하여 빈칸을 완성하는 독해력을 측정하는 문항"
        elif kw_content:
            return "문장의 핵심 내용을 정확히 파악하는 능력을 평가하는 문항"
        elif kw_reason:
            return "문장에서 근거나 이유를 찾아내는 독해력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "문맥 속 어휘의 의미를 파악하는 독해력을 측정하는 문항"
        elif kw_topic:
            return "글의 중심 내용이나 주제를 파악하는 독해력을 평가하는 문항"
        elif kw_fig:
            return "표현의 효과와 의미를 파악하는 독해력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "글의 내용을 자신의 말로 정리하는 독해 표현력을 평가하는 문항"
        elif kw_apt:
            return "문장의 의미를 정확히 이해하는 독해력을 평가하는 문항"
        elif kw_idiom:
            return "속담이나 관용 표현이 쓰인 문장을 이해하는 능력을 측정하는 문항"
        else:
            return "문장의 의미를 정확히 이해하는 독해력을 측정하는 문항"

    elif domain == "구조 독해력":
        if kw_struct:
            return "글의 구조와 전개 방식을 분석하는 능력을 평가하는 문항"
        elif kw_order:
            return "글의 흐름과 순서를 파악하는 구조 독해력을 측정하는 문항"
        elif kw_topic:
            return "글의 중심 내용과 구조를 파악하는 능력을 평가하는 문항"
        elif kw_reason:
            return "글의 구조 속에서 근거를 찾는 독해력을 평가하는 문항"
        elif kw_dd:
            return "글의 구조를 활용하여 의미를 파악하는 능력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "글의 구조를 분석하여 서술하는 능력을 평가하는 문항"
        elif kw_summ:
            return "글의 구조에 따라 내용을 요약하는 능력을 평가하는 문항"
        elif kw_apt:
            return "글의 구조적 특성을 정확히 파악하는 능력을 측정하는 문항"
        elif kw_blank:
            return "글의 구조적 맥락을 파악하여 빈칸을 완성하는 능력을 측정하는 문항"
        elif kw_content:
            return "글의 구조를 이해하고 내용을 정확히 파악하는 능력을 측정하는 문항"
        else:
            return "글의 짜임과 전개 방식을 파악하는 구조 독해력을 측정하는 문항"

    elif domain == "논리 사고력":
        if kw_reason:
            return "주장과 근거의 논리적 관계를 판단하는 능력을 평가하는 문항"
        elif kw_infer:
            return "글의 내용을 바탕으로 논리적 추론을 하는 능력을 측정하는 문항"
        elif kw_apt:
            return "논리적 타당성을 판별하는 사고력을 평가하는 문항"
        elif kw_content:
            return "글의 내용을 논리적으로 분석하는 능력을 평가하는 문항"
        elif kw_essay or is_essay:
            return "논리적 사고를 바탕으로 자신의 의견을 서술하는 능력을 평가하는 문항"
        elif kw_idiom:
            return "관용 표현 속 논리적 의미를 파악하는 능력을 측정하는 문항"
        elif kw_topic:
            return "핵심 주장을 논리적으로 파악하는 능력을 평가하는 문항"
        elif kw_blank:
            return "논리적 맥락에 맞는 내용을 추론하는 능력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "어휘 관계를 논리적으로 파악하는 능력을 측정하는 문항"
        else:
            return "논리적 사고력과 판단력을 종합적으로 측정하는 문항"

    elif domain == "어법·문법 능력":
        if kw_spell:
            return "한글 맞춤법 규칙의 적용 능력을 측정하는 문항"
        elif kw_pos:
            return "품사의 개념과 분류를 정확히 아는지 측정하는 문항"
        elif kw_hon:
            return "높임법의 올바른 사용을 평가하는 문항"
        elif kw_comp:
            return "문장 성분의 역할과 구조를 파악하는 능력을 측정하는 문항"
        elif kw_phon:
            return "음운 체계에 대한 이해를 측정하는 문항"
        elif kw_blank:
            return "문법적으로 올바른 표현을 선택하는 능력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "문법 지식을 활용하여 서술하는 능력을 평가하는 문항"
        elif kw_link:
            return "어법 규칙과 실제 사용의 관계를 파악하는 능력을 측정하는 문항"
        elif kw_apt:
            return "어법에 맞는 표현을 판별하는 능력을 평가하는 문항"
        elif kw_reason:
            return "문법 규칙의 적용 이유를 이해하는 능력을 측정하는 문항"
        else:
            return "국어 어법과 문법 규칙의 이해를 측정하는 문항"

    elif domain == "국어 개념 적용 능력":
        if kw_fig:
            return "비유적 표현을 인식하고 분류하는 능력을 평가하는 문항"
        elif kw_essay or is_essay:
            return "국어 개념을 활용하여 서술하는 능력을 평가하는 문항"
        elif kw_blank:
            return "국어 개념을 맥락에 적용하는 능력을 측정하는 문항"
        elif kw_reason:
            return "국어 개념을 근거로 판단하는 적용력을 측정하는 문항"
        elif kw_apt:
            return "국어 개념의 적절한 적용 여부를 판단하는 능력을 평가하는 문항"
        elif kw_link:
            return "국어 개념과 실제 사례를 연결하는 능력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "어휘 관계 개념을 적용하는 능력을 측정하는 문항"
        elif kw_content:
            return "국어 개념을 활용하여 내용을 분석하는 능력을 측정하는 문항"
        else:
            return "국어 개념을 실제 텍스트에 적용하는 능력을 측정하는 문항"

    elif domain == "비문학 배경지식":
        if kw_content:
            return "비문학 지문의 핵심 정보를 파악하는 배경지식을 측정하는 문항"
        elif kw_reason:
            return "비문학 주제의 원인과 결과를 파악하는 능력을 측정하는 문항"
        elif kw_topic:
            return "비문학 지문의 주제를 파악하는 배경지식을 측정하는 문항"
        elif kw_blank:
            return "비문학 주제에 대한 배경지식을 활용하여 빈칸을 완성하는 문항"
        elif kw_syn or kw_ant:
            return "비문학 어휘의 의미를 정확히 아는지 측정하는 문항"
        elif kw_essay or is_essay:
            return "비문학 배경지식을 활용하여 서술하는 능력을 평가하는 문항"
        elif kw_apt:
            return "비문학 내용에 대한 정확한 이해를 평가하는 문항"
        elif kw_struct:
            return "비문학 글의 전개 구조를 파악하는 능력을 측정하는 문항"
        else:
            return "비문학 주제에 대한 배경지식 보유 여부를 확인하는 문항"

    elif domain == "국어 관련 배경지식":
        if kw_reason:
            return "국어 관련 지식을 근거로 판단하는 능력을 측정하는 문항"
        elif kw_content:
            return "국어 관련 핵심 개념의 이해 여부를 확인하는 문항"
        elif kw_blank:
            return "국어 관련 배경지식을 활용하여 빈칸을 완성하는 문항"
        elif kw_essay or is_essay:
            return "국어 관련 배경지식을 서술로 표현하는 능력을 평가하는 문항"
        elif kw_apt:
            return "국어 관련 배경지식의 정확한 이해를 평가하는 문항"
        elif kw_syn or kw_ant:
            return "국어 관련 어휘의 의미 관계를 파악하는 능력을 측정하는 문항"
        elif kw_idiom:
            return "속담이나 관용 표현에 대한 배경지식을 측정하는 문항"
        elif kw_fig:
            return "국어 표현 기법에 대한 배경지식을 측정하는 문항"
        else:
            return "국어 관련 배경지식의 보유 여부를 확인하는 문항"

    elif domain == "문제 분석 및 전략 수립 능력":
        if kw_reason:
            return "문제의 조건과 근거를 분석하는 전략적 사고력을 측정하는 문항"
        elif kw_blank:
            return "문제 맥락을 분석하여 적절한 답을 도출하는 능력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "어휘 관계 문제를 분석하고 풀이 전략을 세우는 능력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "문제를 분석하여 전략적으로 서술하는 능력을 평가하는 문항"
        elif kw_apt:
            return "문제 해결을 위한 분석력과 전략 수립 능력을 평가하는 문항"
        elif kw_idiom:
            return "관용 표현 문제의 해결 전략을 세우는 능력을 측정하는 문항"
        elif kw_dd:
            return "어휘 문제를 분석하고 풀이 전략을 세우는 능력을 측정하는 문항"
        elif kw_content:
            return "내용 파악 문제를 분석하고 전략적으로 접근하는 능력을 측정하는 문항"
        elif kw_struct:
            return "글의 구조 분석 문제에 전략적으로 접근하는 능력을 측정하는 문항"
        else:
            return "문제 해결 전략을 수립하는 능력을 평가하는 문항"

    elif domain == "선택지 분석 및 전략 수립 능력":
        if kw_essay or is_essay:
            return "주어진 조건을 분석하여 체계적으로 서술하는 능력을 평가하는 문항"
        elif kw_reason:
            return "선택지의 근거를 비교 분석하여 정답을 판단하는 능력을 측정하는 문항"
        elif kw_content:
            return "선택지와 지문 내용을 대조 분석하는 능력을 측정하는 문항"
        elif kw_blank:
            return "선택지를 비교 분석하여 빈칸에 적합한 답을 고르는 능력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "어휘 선택지를 분석하고 변별하는 능력을 측정하는 문항"
        elif kw_dd:
            return "뜻풀이 선택지를 비교 분석하는 능력을 측정하는 문항"
        elif kw_apt:
            return "복수 선택지를 분석하여 적절한 답을 판별하는 능력을 평가하는 문항"
        elif kw_idiom:
            return "관용 표현 관련 선택지를 분석하는 능력을 측정하는 문항"
        else:
            return "선택지를 체계적으로 분석하여 정답을 도출하는 능력을 측정하는 문항"

    # 진단지 domain
    elif domain == "지문근거형":
        if kw_content:
            return "지문에서 직접적 근거를 찾아 내용을 확인하는 능력을 측정하는 문항"
        elif kw_reason:
            return "지문에서 특정 정보의 근거를 정확히 찾는 능력을 측정하는 문항"
        elif kw_apt:
            return "지문의 근거에 기반하여 적절한 답을 판별하는 능력을 측정하는 문항"
        else:
            return "지문에서 명시적 정보를 찾아 답하는 능력을 측정하는 문항"

    elif domain == "논리추론형":
        if kw_reason:
            return "지문 내용을 바탕으로 논리적 이유를 추론하는 능력을 측정하는 문항"
        elif kw_apt:
            return "지문을 바탕으로 논리적 추론의 적절성을 판단하는 문항"
        elif kw_struct:
            return "글의 전개 방식을 논리적으로 추론하는 능력을 측정하는 문항"
        elif kw_feeling:
            return "등장인물의 심리를 논리적으로 추론하는 능력을 측정하는 문항"
        elif kw_essay or is_essay:
            return "논리적 추론 결과를 서술하는 능력을 평가하는 문항"
        elif kw_content:
            return "지문 내용을 바탕으로 논리적으로 추론하는 능력을 측정하는 문항"
        else:
            return "지문의 내용을 바탕으로 논리적 추론을 하는 능력을 측정하는 문항"

    elif domain == "어휘단독형":
        if kw_blank:
            return "문맥에 맞는 어휘를 독립적으로 판단하는 능력을 측정하는 문항"
        elif kw_syn or kw_ant:
            return "어휘의 의미 관계를 독립적으로 파악하는 능력을 측정하는 문항"
        elif kw_dd:
            return "개별 어휘의 뜻을 정확히 아는지 측정하는 문항"
        elif kw_apt:
            return "어휘의 적절한 사용을 독립적으로 판별하는 능력을 측정하는 문항"
        elif kw_fig:
            return "표현적 어휘의 의미를 파악하는 능력을 측정하는 문항"
        else:
            return "어휘력을 지문 없이 독립적으로 측정하는 문항"

    else:
        if kw_essay or is_essay:
            return "해당 영역의 이해와 표현 능력을 종합적으로 평가하는 문항"
        else:
            return "해당 영역의 이해 능력을 종합적으로 측정하는 문항"


# Main
print("=== 문항 데이터 로드 중... ===")
rows = run_sql("""
SELECT tq.id, tq.domain, tq.type, LEFT(tq.stem, 200) as stem_short
FROM test_questions tq
JOIN test_papers tp ON tq.test_id = tp.id
WHERE tp.level_id IN ('SAUSSURE_1','SAUSSURE_2','SAUSSURE_3','saussure3','FREGE_1','FREGE_2','frege3')
   OR tp.id IN ('diag_paper_sohssure','diag_paper_frege')
ORDER BY tq.id
""")
print(f"총 {len(rows)}개 문항 로드 완료")

updates = []
for row in rows:
    qid = row["id"]
    domain = row.get("domain", "")
    stem = row.get("stem_short", "")
    qtype = row.get("type", "객관식")
    has_passage = False

    intent = generate_intent(domain, stem, qtype, has_passage)
    intent_escaped = intent.replace("\\", "\\\\").replace("'", "\\'")
    qid_escaped = qid.replace("\\", "\\\\").replace("'", "\\'")
    updates.append(f"UPDATE test_questions SET intent = '{intent_escaped}' WHERE id = '{qid_escaped}';")

print(f"총 {len(updates)}개 UPDATE문 생성 완료")

batch_size = 100
total_batches = (len(updates) + batch_size - 1) // batch_size
success_count = 0
error_count = 0

for i in range(0, len(updates), batch_size):
    batch = updates[i:i+batch_size]
    batch_num = i // batch_size + 1
    sql = "\n".join(batch)
    result = subprocess.run(
        DB_CMD + ["-e", sql],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode == 0:
        success_count += len(batch)
        print(f"  배치 {batch_num}/{total_batches}: {len(batch)}건 성공")
    else:
        error_count += len(batch)
        print(f"  배치 {batch_num}/{total_batches}: 에러 - {result.stderr[:200]}")

print(f"\n=== 완료 ===")
print(f"성공: {success_count}건, 에러: {error_count}건")

verify = run_sql("""
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN intent IS NULL OR intent = '' THEN 1 ELSE 0 END) as still_empty
FROM test_questions tq
JOIN test_papers tp ON tq.test_id = tp.id
WHERE tp.level_id IN ('SAUSSURE_1','SAUSSURE_2','SAUSSURE_3','saussure3','FREGE_1','FREGE_2','frege3')
   OR tp.id IN ('diag_paper_sohssure','diag_paper_frege')
""")
if verify:
    print(f"검증 결과: 전체 {verify[0]['total']}건 중 빈 intent {verify[0]['still_empty']}건")

# domain별 분포 확인
dist = run_sql("""
SELECT domain, intent, COUNT(*) as cnt
FROM test_questions tq
JOIN test_papers tp ON tq.test_id = tp.id
WHERE (tp.level_id IN ('SAUSSURE_1','SAUSSURE_2','SAUSSURE_3','saussure3','FREGE_1','FREGE_2','frege3')
   OR tp.id IN ('diag_paper_sohssure','diag_paper_frege'))
AND intent IS NOT NULL AND intent != ''
GROUP BY domain, intent
ORDER BY domain, cnt DESC
""")
print(f"\n=== domain별 intent 분포 ===")
cur_domain = ""
for r in dist:
    if r["domain"] != cur_domain:
        cur_domain = r["domain"]
        print(f"\n[{cur_domain}]")
    print(f"  ({r['cnt']}건) {r['intent']}")
