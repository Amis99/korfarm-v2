import { Link } from "react-router-dom";

function HarvestLedgerPage() {
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <h1>수확 장부</h1>
      <p style={{ color: "#8a7468", marginTop: 12 }}>해당 기능은 준비 중입니다.</p>
      <Link to="/start" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default HarvestLedgerPage;
