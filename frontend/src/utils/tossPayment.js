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
 * 토스 결제 요청
 * @param {Object} params
 * @param {string} params.clientKey - 토스 클라이언트 키
 * @param {string} params.method - 결제 수단 ("CARD", "TRANSFER", "VIRTUAL_ACCOUNT" 등)
 * @param {number} params.amount - 결제 금액
 * @param {string} params.orderId - 주문 ID (tossOrderId)
 * @param {string} params.orderName - 주문명
 * @param {string} [params.customerName] - 고객명
 */
export async function requestTossPayment({
  clientKey,
  method = "CARD",
  amount,
  orderId,
  orderName,
  customerName,
}) {
  const toss = await getTossPayments(clientKey);
  const payment = toss.payment({ customerKey: orderId });

  const base = window.location.origin + (import.meta.env.BASE_URL || "/");
  const successUrl = `${base}payment/success`;
  const failUrl = `${base}payment/fail`;

  await payment.requestPayment({
    method,
    amount: { currency: "KRW", value: amount },
    orderId,
    orderName,
    customerName,
    successUrl,
    failUrl,
  });
}
