import { Link } from "react-router-dom";

/**
 * 토스페이먼츠 카드사 심사용 표준 하단 정보.
 * 모든 결제 페이지(쇼핑몰/구독/자몽/월결제 등)와 메인 화면에 표시.
 *
 * 필수 6항목: 상호명 / 대표자명 / 사업자등록번호 / 통신판매업신고번호 / 사업장주소 / 유선전화번호
 */
export default function SiteFooter({ compact = false }) {
  return (
    <footer style={{
      borderTop: "1px solid #e5e5e5",
      padding: compact ? "16px 20px" : "32px 20px",
      background: "#fafafa",
      color: "#555",
      fontSize: 12,
      lineHeight: 1.7,
      marginTop: compact ? 16 : 40,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>국어농장 — (주)디셈버글로리</div>
        <p style={{ margin: "4px 0" }}>
          상호: <strong>(주)디셈버글로리</strong> &nbsp;|&nbsp; 대표: <strong>박종찬</strong> &nbsp;|&nbsp;
          사업자등록번호: <strong>226-86-00815</strong> &nbsp;|&nbsp;
          통신판매업신고: <strong>제2021-부산해운대-0501호</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          사업장주소: <strong>부산광역시 해운대구 세실로27번길 21 원재프라자 8층</strong> &nbsp;|&nbsp;
          유선전화번호: <strong>010-8950-0655</strong>
        </p>
        {!compact && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#777" }}>
            <Link to="/terms" style={{ color: "#555", marginRight: 12 }}>이용약관</Link>
            <Link to="/privacy" style={{ color: "#555", marginRight: 12 }}>개인정보처리방침</Link>
            <Link to="/refund-policy" style={{ color: "#555", marginRight: 12 }}>환불규정</Link>
            <Link to="/inquiry" style={{ color: "#555" }}>고객센터</Link>
          </p>
        )}
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#999" }}>
          © {new Date().getFullYear()} (주)디셈버글로리. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
