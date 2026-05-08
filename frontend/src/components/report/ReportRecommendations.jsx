import { useNavigate } from "react-router-dom";

/**
 * 통합 분석표 — 다음 추천 학습 (V3)
 *
 * props.bundle:
 *   {
 *     competency: { strategy, strategyLabel, targetLabels, items[] },
 *     area:       { strategy, strategyLabel, targetLabels, items[] },
 *     levelId
 *   }
 *
 * 콘텐츠 카드 클릭 → /engine?contentId=...&contentType=... 로 직접 이동.
 * AI 튜터 링크 없음. 자몽/작물 미차감 (학습 콘텐츠 진입은 무료).
 */
export default function ReportRecommendations({ bundle, legacy }) {
  const navigate = useNavigate();

  // 신규 bundle 우선, 없으면 legacy(구버전 추천)으로 폴백
  if (bundle && (bundle.competency?.items?.length || bundle.area?.items?.length)) {
    return (
      <div className="ur-recommendations">
        <RecoGroup
          title="역량 보강"
          group={bundle.competency}
          onClick={(item) => navigate(item.path)}
        />
        <RecoGroup
          title="영역 보강"
          group={bundle.area}
          onClick={(item) => navigate(item.path)}
        />
      </div>
    );
  }

  // 구버전 호환 — recommendations 배열
  if (legacy && legacy.length > 0) {
    return (
      <div className="ur-recommendations">
        <p className="ur-rec-reason">{legacy[0]?.reason}</p>
        <div className="ur-rec-grid">
          {legacy.flatMap((rec) => rec.items).map((item, i) => (
            <button
              key={i}
              className="ur-rec-item"
              onClick={() => navigate(item.path)}
            >
              <span className="ur-rec-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function RecoGroup({ title, group, onClick }) {
  if (!group || !group.items || group.items.length === 0) return null;
  const targetText = (group.targetLabels || []).join(" · ");
  return (
    <div className="ur-reco-group">
      <div className="ur-reco-group-head">
        <span className="ur-reco-group-title">{title}</span>
        <span className={`ur-reco-strategy-tag ur-reco-strategy-${group.strategy}`}>
          {group.strategyLabel}
        </span>
        {targetText && <span className="ur-reco-target">{targetText}</span>}
      </div>
      <div className="ur-rec-grid">
        {group.items.map((item) => (
          <button
            key={item.contentId}
            className="ur-rec-item"
            onClick={() => onClick(item)}
            title={item.title}
          >
            <span className="ur-rec-item-type">{item.contentTypeLabel || item.contentType}</span>
            <span className="ur-rec-item-label">{item.title}</span>
            {item.levelId && (
              <span className="ur-rec-item-meta">{item.levelId}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
