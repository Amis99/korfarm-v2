function HarvestCraftModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="result-overlay" onClick={onClose}>
      <div
        className="result-card"
        style={{ padding: 24, background: "#fff", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>씨앗 교환</h2>
        <p>씨앗 10개를 모아 수확물 1개로 교환할 수 있습니다.</p>
        <p style={{ color: "#8a7468", fontSize: 13, marginTop: 8 }}>
          (교환 기능 준비 중)
        </p>
        <button
          type="button"
          style={{
            marginTop: 16,
            border: "none",
            background: "#ff8f2b",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
          }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default HarvestCraftModal;
