import AdminDuelQuestionsPage from "./AdminDuelQuestionsPage";

/**
 * 어드민 — 테마 대결 관리 (5번째 탭).
 * AdminDuelQuestionsPage 를 themeOnly=true 로 호출 — 서버 탭이
 * "전사 공용 (theme_common)" + "우리 기관 (theme_<orgId>)" 으로 자동 한정.
 *
 * HQ_ADMIN: 전사 공용 + 모든 기관(향후 dropdown 으로 확장 가능)
 * ORG_ADMIN: 본인 기관만 노출 (백엔드 권한으로도 검증)
 */
function AdminThemeDuelPage({ wrap = false }) {
  return <AdminDuelQuestionsPage wrap={wrap} themeOnly={true} />;
}

export default AdminThemeDuelPage;
