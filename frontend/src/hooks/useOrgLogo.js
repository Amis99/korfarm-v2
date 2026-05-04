import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { apiGetCamel } from "../utils/adminApi";
import { fileDownloadUrl } from "../utils/fileUpload";

/**
 * 인쇄물 헤더용 — ORG_ADMIN 본인 기관 로고 URL.
 * 학생·HQ_ADMIN 등 ORG_ADMIN 외에는 항상 null 반환 (fetch 안 함).
 *
 * 향후 EC2 → S3 마이그레이션 시 fileDownloadUrl() 만 갱신하면 동작 유지.
 */
export function useOrgLogo() {
  const { user } = useAuth();
  const isOrgAdmin = (user?.roles || []).includes("ORG_ADMIN");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!isOrgAdmin) {
      setLogoUrl(null);
      return;
    }
    let alive = true;
    apiGetCamel("/v1/admin/orgs/me")
      .then((data) => {
        if (!alive) return;
        if (data?.logoFileId) {
          setLogoUrl(fileDownloadUrl(data.logoFileId));
        } else {
          setLogoUrl(null);
        }
      })
      .catch(() => {
        if (alive) setLogoUrl(null);
      });
    return () => { alive = false; };
  }, [isOrgAdmin]);

  return logoUrl;
}
