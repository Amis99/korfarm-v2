import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

let tossInstance = null;
let cachedClientKey = null;

async function getTossPayments(clientKey) {
  if (tossInstance && cachedClientKey === clientKey) return tossInstance;
  tossInstance = await loadTossPayments(clientKey);
  cachedClientKey = clientKey;
  return tossInstance;
}

/**
 * 토스 결제 요청 — 토스페이먼츠 표준 통합
 * https://docs.tosspayments.com/guides/payment-widget/integration
 *
 * @param {Object} params
 * @param {string} params.clientKey   - 토스 클라이언트 키 (백엔드 config 또는 prepare 응답에서)
 * @param {string} params.customerKey - 사용자 고유 ID (가맹점에서 정의). 비회원이면 "ANONYMOUS".
 * @param {string} params.method      - "CARD" / "TRANSFER" / "VIRTUAL_ACCOUNT" / "MOBILE_PHONE" / "CULTURE_GIFT_CERTIFICATE" / "BOOK_GIFT_CERTIFICATE" / "GAME_GIFT_CERTIFICATE"
 * @param {number} params.amount      - 결제 금액 (KRW)
 * @param {string} params.orderId     - 주문 ID (토스 orderId, 6~64자, 가맹점 내 고유)
 * @param {string} params.orderName   - 주문명 (예: "프레게 문법 집중 교재")
 * @param {string} [params.customerName]        - 구매자 이름
 * @param {string} [params.customerEmail]       - 구매자 이메일 (영수증 발송)
 * @param {string} [params.customerMobilePhone] - 구매자 휴대폰 (가상계좌 SMS 알림 등). 숫자만.
 */
export async function requestTossPayment({
  clientKey,
  customerKey,
  method = "CARD",
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  customerMobilePhone,
}) {
  if (!clientKey) throw new Error("clientKey 누락");
  if (!customerKey) throw new Error("customerKey 누락 (사용자 ID 또는 ANONYMOUS)");
  if (!orderId) throw new Error("orderId 누락");
  if (!orderName) throw new Error("orderName 누락");
  if (!amount || amount <= 0) throw new Error("amount 가 0 이하입니다");

  const toss = await getTossPayments(clientKey);
  const payment = toss.payment({ customerKey });

  const base = window.location.origin + (import.meta.env.BASE_URL || "/");
  const successUrl = `${base}payment/success`;
  const failUrl = `${base}payment/fail`;

  // 결제 수단별 추가 옵션
  const opts = {
    method,
    amount: { currency: "KRW", value: amount },
    orderId,
    orderName,
    successUrl,
    failUrl,
  };
  if (customerName) opts.customerName = customerName;
  if (customerEmail) opts.customerEmail = customerEmail;
  if (customerMobilePhone) opts.customerMobilePhone = customerMobilePhone;

  // CARD 의 경우 useEscrow / flowMode 등 옵션 (기본값 사용)
  if (method === "CARD") {
    opts.card = { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false };
  }

  await payment.requestPayment(opts);
}
