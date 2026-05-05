import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiGetCamel } from "../utils/adminApi";

/**
 * ORG_ADMIN 본인 기관 결제 상태 — AdminLayout 상단 배너용.
 * - suspended: 정지 (즉시 결제 필요)
 * - pendingCount > 0 && nextDueAt 임박 (7일 이내): 임박 안내
 * - 그 외: null
 */
export function useOrgBillingStatus() {
  const { user } = useAuth();
  const isOrgAdmin = (user?.roles || []).includes("ORG_ADMIN");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isOrgAdmin) { setStatus(null); return; }
    let alive = true;
    apiGetCamel("/v1/admin/billing/me/status")
      .then((s) => { if (alive) setStatus(s); })
      .catch(() => { if (alive) setStatus(null); });
    return () => { alive = false; };
  }, [isOrgAdmin]);

  return status;
}

/** 마감일과 오늘 사이 일수 (음수면 지남) */
export function daysUntil(dueAtIso) {
  if (!dueAtIso) return null;
  const due = new Date(dueAtIso);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (24 * 60 * 60 * 1000));
}
