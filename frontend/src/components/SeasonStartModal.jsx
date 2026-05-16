import { useEffect, useState } from "react";
import { apiGet, apiPost, camelize } from "../utils/api";

/**
 * 새 시즌 시작 안내 모달 — 2026-05-16 신설.
 *
 * 매월 1일 새 시즌이 시작되면 학생/학부모/관리자 첫 진입 시 1회 표시.
 * 닫기 시 `POST /v1/seasons/modal-seen` 호출 → 다시 안 보임.
 *
 * 마운트 시 자동으로 status 조회. shouldShow=false 면 렌더링 안 함.
 */
export default function SeasonStartModal() {
  const [status, setStatus] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet("/v1/seasons/current/modal-status")
      .then((res) => {
        if (!alive) return;
        const data = camelize(res?.data ?? res);
        if (data?.shouldShow) setStatus(data);
      })
      .catch(() => { /* 조용히 무시 */ });
    return () => { alive = false; };
  }, []);

  const close = async () => {
    if (closing) return;
    setClosing(true);
    try {
      await apiPost("/v1/seasons/modal-seen", { seasonId: status.seasonId });
    } catch (e) { /* 실패해도 모달 닫기 */ }
    setStatus(null);
  };

  if (!status) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        padding: 16,
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fef9f0", border: "2px solid #c8a87f", borderRadius: 12,
          maxWidth: 460, width: "100%", padding: "24px 24px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          fontFamily: "'Nanum Pen Script', 'Gowun Dodum', sans-serif",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 12, fontSize: 22, color: "#4a3826", textAlign: "center" }}>
          🌱 {status.seasonName} 시작
        </h2>

        <ModalBody role={status.role} payload={status.payload} />

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={close}
            disabled={closing}
            style={{
              background: "#5b8c5a", color: "#fff", border: "none",
              padding: "10px 24px", borderRadius: 8, fontSize: 16, fontWeight: 600,
              cursor: closing ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            새 시즌 출발!
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalBody({ role, payload }) {
  const p = payload || {};

  if (role === "STUDENT") {
    if (!p.hasPrevious) {
      return (
        <p style={bodyStyle}>
          오늘부터 새 시즌이 시작돼요.<br />
          씨앗과 작물을 모아 농장을 가꾸어 보세요! 🌾
        </p>
      );
    }
    return (
      <div>
        <p style={bodyStyle}>
          <strong>{p.prevSeasonName}</strong> 결과
        </p>
        <div style={{ background: "#fff", border: "1px solid #d4b896", borderRadius: 8, padding: 14, margin: "8px 0 12px" }}>
          <RowItem label="레벨별 순위" value={p.myLevelRank ? `${p.myLevelRank}위 (${p.myLevelScore?.toLocaleString("ko-KR")}점)` : "미참여"} />
          <RowItem label="레벨 통합 순위" value={p.myIntegratedRank ? `${p.myIntegratedRank}위 / ${p.totalParticipants}명 중` : "미참여"} />
        </div>
        <p style={{ ...bodyStyle, color: "#5b8c5a", fontWeight: 600 }}>
          새 시즌은 0점부터! 🌱<br />
          (시즌 랭킹용 씨앗·작물만 0으로 리셋. 결제용 자몽·작물 지갑은 그대로!)
        </p>
      </div>
    );
  }

  if (role === "PARENT") {
    return (
      <p style={bodyStyle}>
        새 시즌이 시작됐어요.<br />
        {p.hasPrevious && p.prevSeasonName ? <><strong>{p.prevSeasonName}</strong>이 종료되었고,</> : null}
        자녀의 새 시즌 출발을 응원해 주세요. 🌱
      </p>
    );
  }

  // HQ_ADMIN / ORG_ADMIN
  return (
    <p style={bodyStyle}>
      새 시즌이 시작됐어요.<br />
      {p.hasPrevious && p.prevSeasonName ? <><strong>{p.prevSeasonName}</strong>이 종료되었고, </> : null}
      시즌 랭킹용 씨앗·작물이 0으로 리셋되었습니다.<br />
      (결제용 자몽·작물 지갑은 그대로 유지됩니다.)
    </p>
  );
}

function RowItem({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 15 }}>
      <span style={{ color: "#7a6a5a" }}>{label}</span>
      <strong style={{ color: "#4a3826" }}>{value}</strong>
    </div>
  );
}

const bodyStyle = {
  margin: "8px 0", textAlign: "center", color: "#5a4636", fontSize: 16, lineHeight: 1.6,
};
