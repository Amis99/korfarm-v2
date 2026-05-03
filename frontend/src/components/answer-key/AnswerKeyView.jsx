/**
 * 정답·해설 공용 렌더 컴포넌트.
 * 학생 ProAnswerKeyPage 와 어드민 콘텐츠 에디터 미리보기 (AnswerKeyModule) 양쪽에서 재사용.
 *
 * Props:
 *   sections — payload.sections 또는 payload.payload.sections 의 배열
 *
 * 데이터 구조 호환:
 *   - 새 구조: section.groups[].items[]
 *   - 옛 평탄 구조: section.items[]
 */

// 정답 인라인 표시 (객관식/OX/단답형)
function CompactAnswers({ items }) {
  const hasQuestions = items.some((it) => it.question);
  return (
    <div className="ak-compact">
      {items.map((item, i) => (
        <span key={i} className="ak-compact-item">
          {item.num && <span className="ak-compact-num">{item.num}.</span>}
          {hasQuestions && item.question && (
            <span className="ak-compact-q">{item.question}{" → "}</span>
          )}
          <span className="ak-compact-ans">{item.answer}</span>
        </span>
      ))}
    </div>
  );
}

// 해설 접기/펼치기
function Explanations({ items }) {
  const withExpl = items.filter((it) => it.explanation);
  if (withExpl.length === 0) return null;
  return (
    <details className="ak-details" open>
      <summary className="ak-details-summary">해설</summary>
      <div className="ak-details-body">
        {withExpl.map((item, i) => (
          <div key={i} className="ak-expl-row">
            {item.num && <span className="ak-expl-num">{item.num}.</span>}
            <span className="ak-expl-text">{item.explanation}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

// 빈칸 채우기 (문자열 정답)
function FillAnswer({ items }) {
  return (
    <div className="ak-fill">
      {items.map((item, i) => (
        <div key={i} className="ak-fill-row">
          {item.question && <p className="ak-fill-q">{item.question}</p>}
          <p className="ak-fill-text">{item.answer}</p>
          {item.explanation && (
            <p className="ak-expl-text">{item.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// 서술형/글쓰기 (모범답안)
function EssayAnswers({ items }) {
  return (
    <div className="ak-essays">
      {items.map((item, i) => (
        <div key={i} className="ak-essay-item">
          {item.num && <span className="ak-essay-num">{item.num}.</span>}
          {item.question && <p className="ak-essay-q">{item.question}</p>}
          <div className="ak-essay-ans">{item.answer}</div>
          {item.explanation && (
            <p className="ak-expl-text" style={{ marginTop: 4 }}>{item.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// 그룹 렌더러 (group.type 별 분기)
function AnswerGroup({ group }) {
  const { title, type, items = [] } = group;
  return (
    <div className="ak-group">
      {title && <h4 className="ak-group-title">{title}</h4>}
      {type === "choice" || type === "ox" || type === "short" || type === "nested" ? (
        <>
          <CompactAnswers items={items} />
          <Explanations items={items} />
        </>
      ) : type === "fill" ? (
        <FillAnswer items={items} />
      ) : type === "essay" ? (
        <EssayAnswers items={items} />
      ) : (
        <>
          <CompactAnswers items={items} />
          <Explanations items={items} />
        </>
      )}
    </div>
  );
}

// 평탄 구조 (label + items, groups 없음) 호환
function LegacyItems({ items }) {
  return (
    <div className="ak-group">
      {items.map((item, i) => (
        <div key={i} className="ak-legacy-row">
          {item.question && (
            <p className="ak-legacy-q">
              {(item.number ?? item.num) && (
                <span className="ak-compact-num">{item.number ?? item.num}.</span>
              )}{" "}
              {item.question}
            </p>
          )}
          <div className="ak-compact-ans-line">
            {!item.question && (item.number ?? item.num) && (
              <span className="ak-compact-num">{item.number ?? item.num}.</span>
            )}
            <span className="ak-compact-ans">
              {item.answer || item.modelAnswer || ""}
            </span>
          </div>
          {item.explanation && (
            <p className="ak-expl-text">{item.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AnswerKeyView({ sections }) {
  const list = Array.isArray(sections) ? sections : [];
  if (list.length === 0) {
    return (
      <div className="pro-center" style={{ padding: 24, color: "var(--admin-muted, #888)" }}>
        <p>정답과 해설 데이터가 아직 등록되지 않았습니다.</p>
      </div>
    );
  }
  return (
    <div className="ak-body">
      {list.map((section, si) => (
        <section key={si} className="ak-section">
          <h3 className="ak-section-title">{section.title || section.label || `섹션 ${si + 1}`}</h3>
          {section.groups
            ? section.groups.map((g, gi) => <AnswerGroup key={gi} group={g} />)
            : section.items
              ? <LegacyItems items={section.items} />
              : null}
        </section>
      ))}
    </div>
  );
}
