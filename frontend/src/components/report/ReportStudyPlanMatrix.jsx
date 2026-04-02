import { useState, useEffect } from "react";
import { apiGet } from "../../utils/api";
import CellStatusBadge from "../CellStatusBadge";

/**
 * 성적표 내 학습 계획표 매트릭스 뷰
 * - planIds를 받아 각 plan의 matrix API 호출
 * - 범위(행) x 에셋(열) 테이블 렌더링
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
      {plans.map((plan) => (
        <MatrixTable key={plan.planId} plan={plan} />
      ))}
    </div>
  );
}

function MatrixTable({ plan }) {
  const { scopes, assets, cells } = plan;
  if (!scopes?.length || !assets?.length) return null;

  const cellMap = {};
  (cells || []).forEach((c) => {
    cellMap[`${c.scopeId}_${c.assetId}`] = c;
  });

  return (
    <div className="ur-sp-matrix-wrap">
      <table className="ur-sp-matrix">
        <thead>
          <tr>
            <th>범위</th>
            {assets.map((a) => (
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
              {assets.map((asset) => {
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
  );
}
