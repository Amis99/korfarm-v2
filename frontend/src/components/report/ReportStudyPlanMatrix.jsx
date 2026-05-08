import { useState, useEffect, useRef } from "react";
import { apiGet } from "../../utils/api";
import CellStatusBadge from "../CellStatusBadge";

/**
 * 학습 계획표 매트릭스 뷰
 * - planIds를 받아 각 plan의 matrix API 호출
 * - 범위(행) × 에셋(열) 테이블
 * - V2: 가로 폭 부족 시 한 행을 N행으로 자동 분할 (ResizeObserver). 가로 스크롤 X.
 */
export default function ReportStudyPlanMatrix({ planIds }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planIds || planIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      try {
        const results = await Promise.all(
          planIds.map(async (planId) => {
            try {
              const data = await apiGet(`/v1/study-plans/${planId}/matrix`);
              return { planId, ...data };
            } catch { return null; }
          })
        );
        if (!cancelled) {
          setPlans(results.filter(Boolean));
        }
      } catch (err) {
        console.error("매트릭스 로드 실패:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [planIds]);

  if (loading) {
    return <p style={{ color: "#888", fontSize: 13 }}>매트릭스 로드 중...</p>;
  }

  if (plans.length === 0) {
    return <p style={{ color: "#888", fontSize: 13 }}>계획표 데이터가 없습니다.</p>;
  }

  return (
    <div>
      <CellLegend />
      {plans.map((plan) => (
        <MatrixTable key={plan.planId} plan={plan} />
      ))}
    </div>
  );
}

/** 셀 상태 색상 범례 — 5단계 stage */
function CellLegend() {
  const items = [
    { cls: "stage-unassigned", label: "배정 전" },
    { cls: "stage-pending", label: "미수행" },
    { cls: "stage-overdue", label: "미완료" },
    { cls: "stage-done", label: "수행완료" },
    { cls: "stage-reviewed", label: "점검완료" },
  ];
  return (
    <div className="ur-sp-legend">
      {items.map((it) => (
        <span key={it.cls} className="ur-sp-legend-item">
          <span className={`cell-stage ${it.cls}`}>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

const ROW_HEAD_MIN_PX = 96;     // 범위 헤더 최소 폭
const CELL_MIN_PX = 80;         // 셀 최소 폭

function MatrixTable({ plan }) {
  const { scopes, assets, cells } = plan;
  const wrapRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth || 0);
    update();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener("resize", update);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, []);

  if (!scopes?.length || !assets?.length) return null;

  const cellMap = {};
  (cells || []).forEach((c) => {
    cellMap[`${c.scopeId}_${c.assetId}`] = c;
  });

  // 컨테이너 폭에서 chunk 크기 결정. 측정 전(초기 0)에는 모든 에셋을 한 chunk 로.
  const usable = Math.max(0, containerWidth - ROW_HEAD_MIN_PX);
  const perChunk = containerWidth === 0
    ? assets.length
    : Math.max(1, Math.floor(usable / CELL_MIN_PX));

  const chunks = [];
  for (let i = 0; i < assets.length; i += perChunk) {
    chunks.push(assets.slice(i, i + perChunk));
  }

  return (
    <div className="ur-sp-matrix-wrap" ref={wrapRef}>
      {chunks.map((chunkAssets, idx) => (
        <div key={idx} className="ur-sp-matrix-chunk">
          {idx > 0 && (
            <div className="ur-sp-chunk-cont">↳ 이어서</div>
          )}
          <table className="ur-sp-matrix">
            <thead>
              <tr>
                <th>범위</th>
                {chunkAssets.map((a) => (
                  <th key={a.id}>
                    <span className="ur-sp-asset-label">{a.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scopes.map((scope) => (
                <tr key={scope.id}>
                  <th className="ur-sp-scope">{scope.label}</th>
                  {chunkAssets.map((asset) => {
                    const cell = cellMap[`${scope.id}_${asset.id}`];
                    return (
                      <td key={asset.id}>
                        {cell ? (
                          <CellStatusBadge
                            status={cell.status}
                            score={cell.score}
                            assetType={asset.assetType}
                            assetKind={asset.assetKind}
                          />
                        ) : (
                          <span style={{ color: "#bbb", fontSize: "0.75rem" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
