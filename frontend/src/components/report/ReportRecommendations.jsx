import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../utils/api";

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
 * 콘텐츠 카드 클릭 → /learning/{contentId} (또는 /daily-quiz · /daily-reading · /study-learning)
 * 백엔드가 contentType 별로 정식 path 를 만들어 보냄 (UnifiedReportService.pathForContent).
 *
 * "다음 주 학습으로 등록" 버튼 — 추천 6~12장을 학습 계획표에 일괄 등록 (마감 7일 후 23:59).
 *   - 학생 본인: studentId 생략 → 본인 plan
 *   - 학부모: studentId = 자녀 ID
 *   - 관리자: studentId = 임의 학생
 */
export default function ReportRecommendations({ bundle, legacy, studentId }) {
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState(null);

  const allItems = useMemo(() => {
    if (!bundle) return [];
    const a = bundle.competency?.items || [];
    const b = bundle.area?.items || [];
    const map = new Map();
    [...a, ...b].forEach((it) => {
      if (it && it.contentId && !map.has(it.contentId)) map.set(it.contentId, it);
    });
    return [...map.values()];
  }, [bundle]);

  const handleBulkRegister = async () => {
    if (allItems.length === 0 || registering) return;
    if (!window.confirm(`추천 학습 ${allItems.length}건을 학습 계획표에 일괄 등록하시겠어요?\n마감일은 7일 후 23:59로 설정됩니다.`)) {
      return;
    }
    setRegistering(true);
    try {
      const body = {
        contentIds: allItems.map((it) => it.contentId),
      };
      if (studentId) body.studentId = studentId;
      const res = await apiPost("/v1/study-plans/bulk-from-recommendations", body);
      const data = res?.data || res;
      const created = data?.createdAssignments ?? 0;
      const skipped = data?.skippedAssignments ?? 0;
      const dueAt = data?.dueAt ? data.dueAt.slice(0, 10) : "";
      setToast({
        kind: "success",
        text: `학습 계획표에 ${created}건 등록 완료${skipped ? ` · ${skipped}건은 이미 등록됨` : ""}${dueAt ? ` · 마감 ${dueAt}` : ""}`,
      });
      setTimeout(() => setToast(null), 4500);
    } catch (err) {
      console.error("[reco] bulk register failed", err);
      setToast({
        kind: "error",
        text: err?.message || "일괄 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
      setTimeout(() => setToast(null), 4500);
    } finally {
      setRegistering(false);
    }
  };

  // 신규 bundle 우선, 없으면 legacy(구버전 추천)으로 폴백
  if (bundle && (bundle.competency?.items?.length || bundle.area?.items?.length)) {
    return (
      <div className="ur-recommendations">
        <div className="ur-reco-actions">
          <button
            type="button"
            className="ur-reco-bulk-btn"
            disabled={registering || allItems.length === 0}
            onClick={handleBulkRegister}
          >
            {registering ? "등록 중..." : `다음 주 학습으로 일괄 등록 (${allItems.length}건)`}
          </button>
          {toast && (
            <span className={`ur-reco-toast ur-reco-toast-${toast.kind}`}>{toast.text}</span>
          )}
        </div>
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
