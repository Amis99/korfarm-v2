import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * 페이지 첫 로드 시 권한 체크. 부족하면 /admin 으로 즉시 redirect.
 * - 본사 관리자 전용 페이지 (지식과 지혜·프로 모드·학습자료 DB·게시판 관리·수정 이력·AI 사용 내역) 에서 사용
 *
 * 사용:
 *   useRequireRole("HQ_ADMIN");
 */
export function useRequireRole(...required) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    const roles = user?.roles || [];
    const ok = required.length === 0 || required.some((r) => roles.includes(r));
    if (!ok) {
      navigate("/admin?reason=forbidden", { replace: true });
    }
  }, [user, loading, required, navigate]);
}
