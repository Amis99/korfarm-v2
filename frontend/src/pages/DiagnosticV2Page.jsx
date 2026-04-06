import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import "../styles/diagnostic-v2.css";

const TIER_INFO = {
  sohssure: { label: "소쉬르", desc: "초등 1~3학년", icon: "eco" },
  frege: { label: "프레게", desc: "초등 4~6학년", icon: "psychology" },
  russell: { label: "러셀", desc: "중학생", icon: "menu_book" },
  wittgenstein: { label: "비트겐슈타인", desc: "고등학생", icon: "school" },
};

function DiagnosticV2Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParentMode = !!studentId;

  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const url = isParentMode
      ? `/v1/parents/children/${studentId}/diagnostic/tiers`
      : "/v1/diagnostic/tiers";
    apiGet(url)
      .then(setTiers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isParentMode, studentId]);

  const handleStartOnline = async () => {
    if (creating || isParentMode) return;
    setCreating(true);
    try {
      const res = await apiPost("/v1/diagnostic/sessions", { tier: selectedTier, mode: "online" });
      navigate(`/diagnostic/v2/test/${res.sessionId}`, { state: { firstBatch: res.firstBatch } });
    } catch (err) {
      alert(err.message || "세션 생성에 실패했습니다.");
    } finally {
      setCreating(false);
      setSelectedTier(null);
    }
  };

  const handleStartPrint = () => {
    if (isParentMode) return;
    navigate(`/diagnostic/v2/print/${selectedTier}`);
    setSelectedTier(null);
  };

  // 완료된 세션이 하나라도 있으면 재진단 차단
  const hasAnyCompleted = tiers.some(t => t.hasCompleted);

  const handleCardClick = (key, tier) => {
    if (tier?.hasCompleted && tier.lastSessionId) {
      // 완료된 tier → 리포트로 이동
      const reportUrl = isParentMode
        ? `/diagnostic/v2/report/${tier.lastSessionId}?studentId=${studentId}`
        : `/diagnostic/v2/report/${tier.lastSessionId}`;
      navigate(reportUrl);
    } else if (!isParentMode && !hasAnyCompleted) {
      // 완료된 세션이 없을 때만 새 테스트 허용
      setSelectedTier(key);
    }
  };

  if (loading) return <div className="diag-v2-loading">불러오는 중...</div>;

  return (
    <div className="diag-v2-page">
      <div className="diag-v2-header">
        <h1>{isParentMode ? "자녀 역량 진단 결과" : "온라인 역량 진단"}</h1>
        <p>{isParentMode ? "자녀의 진단 결과를 확인하세요." : "10대 핵심 역량을 정밀 측정하고 맞춤 학습 레벨을 추천받으세요."}</p>
      </div>

      <div className="diag-v2-tier-grid">
        {Object.entries(TIER_INFO).map(([key, info]) => {
          const tier = tiers.find(t => t.tier === key);
          return (
            <div
              key={key}
              className={`diag-v2-tier-card ${tier?.hasCompleted ? "completed" : ""} ${!tier?.hasCompleted && hasAnyCompleted && !isParentMode ? "locked" : ""}`}
              onClick={() => handleCardClick(key, tier)}
            >
              <span className="material-symbols-outlined diag-v2-tier-icon">{info.icon}</span>
              <div className="diag-v2-tier-label">{info.label}</div>
              <div className="diag-v2-tier-desc">{info.desc}</div>
              <div className="diag-v2-tier-meta"></div>
              {tier?.hasCompleted && tier.lastTci != null && (
                <div className="diag-v2-tier-tci">TCI {tier.lastTci.toFixed(1)}</div>
              )}
              {tier?.hasCompleted && (
                <button
                  className="diag-v2-mode-btn"
                  style={{ marginTop: 8, padding: "8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tier.lastSessionId) {
                      const reportUrl = isParentMode
                        ? `/diagnostic/v2/report/${tier.lastSessionId}?studentId=${studentId}`
                        : `/diagnostic/v2/report/${tier.lastSessionId}`;
                      navigate(reportUrl);
                    }
                  }}
                >
                  <span className="mode-title">결과 보기</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!isParentMode && hasAnyCompleted && (
        <div className="diag-v2-blocked-notice">
          진단 테스트는 가입 시 1회만 응시 가능합니다. 결과 카드를 눌러 리포트를 확인하세요.
        </div>
      )}

      {/* 응시 형식 선택 모달 — 온라인 / 출력 후 OMR */}
      {selectedTier && !isParentMode && (
        <div className="diag-v2-modal-overlay" onClick={() => setSelectedTier(null)}>
          <div className="diag-v2-modal" onClick={e => e.stopPropagation()}>
            <h2>{TIER_INFO[selectedTier]?.label} 진단 시작</h2>
            <p className="diag-v2-modal-notice">
              객관식 48문항 · 60분 제한<br />
              <strong>문제를 다 풀면 답안을 바로 제출하세요.</strong><br />
              찍고 넘어간 문제는 풀이속도 측정 시 1문항당 3분이 가산됩니다.
            </p>
            <button className="diag-v2-mode-btn" onClick={handleStartOnline} disabled={creating}>
              <div className="mode-title">온라인으로 풀기</div>
              <div className="mode-desc">화면에서 48문항을 한 번에 풀고 즉시 채점</div>
            </button>
            <button className="diag-v2-mode-btn" onClick={handleStartPrint} disabled={creating}>
              <div className="mode-title">출력 후 OMR 입력</div>
              <div className="mode-desc">시험지를 인쇄한 뒤 종이에 풀고, 답안만 입력</div>
            </button>
            <button className="diag-v2-modal-close" onClick={() => setSelectedTier(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticV2Page;
