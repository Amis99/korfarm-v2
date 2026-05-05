import SiteFooter from "../components/SiteFooter";

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>환불규정</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
          본 환불규정은 「콘텐츠산업진흥법」, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령에 따라 작성되었습니다.
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제1조 (목적)</h2>
          <p>본 규정은 (주)디셈버글로리(이하 "회사")가 운영하는 국어농장 서비스의 유료 콘텐츠·구독 결제·자몽(AI 사용권) 충전·쇼핑몰 상품 구매에 대한 결제 취소 및 환불 절차를 정합니다.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제2조 (구독 서비스 환불)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>월 정기결제 회원: 결제일로부터 7일 이내, 서비스를 한 번도 이용하지 않은 경우 전액 환불 가능합니다.</li>
            <li>결제일로부터 7일이 지났거나 서비스를 이미 이용한 경우, 잔여 일수에 대한 일할 계산으로 환불됩니다 (월 30일 기준).</li>
            <li>연간 정기결제 회원: 잔여 이용 기간을 12로 나눈 1일분 단가로 일할 계산하여 환불됩니다.</li>
            <li>회원의 귀책사유 없이 회사 측 사유로 서비스가 중단된 경우 미사용 기간 전액 환불됩니다.</li>
          </ol>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제3조 (자몽(AI 사용권) 환불)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>충전 후 사용하지 않은 자몽은 충전일로부터 7일 이내 전액 환불 가능합니다.</li>
            <li>일부 사용 후 환불 시, 사용한 자몽 분에 대한 단가(개인 1자몽 = 250원, 기관 1자몽 = 200원)를 차감한 잔액이 환불됩니다.</li>
            <li>학습으로 획득한 작물·씨앗에서 변환된 분은 현금 환불 대상이 아닙니다.</li>
            <li>AI 호출이 정상 완료된 후에는 해당 호출 분에 대한 환불 요청은 불가합니다 (단, 회사 측 시스템 오류로 인한 실패는 즉시 환불).</li>
          </ol>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제4조 (기관 월 사용료 환불)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>해당 월의 1일~말일까지 서비스 제공 약정이며, 결제 후 부분 환불은 원칙적으로 불가합니다.</li>
            <li>회사 측 사유로 서비스가 중단된 경우 미제공 기간에 대한 일할 계산으로 환불됩니다.</li>
          </ol>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제5조 (쇼핑몰 상품 환불·교환)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>유형 상품(교재 등)은 수령일로부터 7일 이내 환불·교환 신청 가능합니다.</li>
            <li>오염, 미세한 잡사, 착용 흔적이 있거나 수령 후 7일 이후의 환불·교환은 불가합니다.</li>
            <li>색상 교환 및 단순 변심에 의한 교환·환불은 고객 부담의 왕복 배송비(편도 5,000원)가 청구됩니다.</li>
            <li>제품 하자·오배송으로 인한 환불·교환은 회사가 부담합니다.</li>
          </ol>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제6조 (환불 신청 방법)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>회사 홈페이지의 1:1 문의 또는 고객센터(010-8950-0655)로 환불을 신청할 수 있습니다.</li>
            <li>환불 신청 후 영업일 기준 3~5일 내에 처리됩니다 (카드 결제 취소는 카드사 사정에 따라 추가 시일 소요).</li>
          </ol>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>제7조 (환불 제한)</h2>
          <ol style={{ paddingLeft: 20 }}>
            <li>회원이 회사 약관·이용 정책을 위반하여 이용 정지된 경우 환불이 제한될 수 있습니다.</li>
            <li>이미 사용한 콘텐츠·서비스 분은 환불 대상에서 제외됩니다.</li>
          </ol>
        </section>

        <p style={{ color: "#888", fontSize: 12, marginTop: 32 }}>
          시행일자: 2026년 5월 6일<br />
          본 규정에 명시되지 않은 사항은 관련 법령 및 일반 상관례에 따릅니다.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
