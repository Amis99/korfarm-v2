import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import SeasonStartModal from "./components/SeasonStartModal";

// 핵심 페이지 (정적 import - 초기 로딩 필수)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StartPage from "./pages/StartPage";
import StudentHomePage from "./pages/StudentHomePage";
import ParentHomePage from "./pages/ParentHomePage";
import NotFoundPage from "./pages/NotFoundPage";

// 나머지 페이지 (lazy import - 코드 분할)
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ResetPage = lazy(() => import("./pages/ResetPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));

const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PostWritePage = lazy(() => import("./pages/PostWritePage"));

const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentFailPage = lazy(() => import("./pages/PaymentFailPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

const RankingPage = lazy(() => import("./pages/RankingPage"));
const ParentLinksPage = lazy(() => import("./pages/ParentLinksPage"));
const ChildGrapefruitPage = lazy(() => import("./pages/ChildGrapefruitPage"));

const DailyLearningPage = lazy(() => import("./pages/DailyLearningPage"));
const DailyQuizPage = lazy(() => import("./pages/DailyQuizPage"));
const DailyReadingPage = lazy(() => import("./pages/DailyReadingPage"));
const LearningHubPage = lazy(() => import("./pages/LearningHubPage"));
const LearningRunnerPage = lazy(() => import("./pages/LearningRunnerPage"));
const StudyLearningPage = lazy(() => import("./pages/StudyLearningPage"));

const ProModePage = lazy(() => import("./pages/ProModePage"));
const ProChapterPage = lazy(() => import("./pages/ProChapterPage"));
const ProTestPage = lazy(() => import("./pages/ProTestPage"));
const ProAnswerKeyPage = lazy(() => import("./pages/ProAnswerKeyPage"));

const FarmModePage = lazy(() => import("./pages/FarmModePage"));
const FarmListPage = lazy(() => import("./pages/FarmListPage"));

const WritingPage = lazy(() => import("./pages/WritingPage"));
const WisdomBoardPage = lazy(() => import("./pages/WisdomBoardPage"));
const WisdomWritePage = lazy(() => import("./pages/WisdomWritePage"));
const WisdomPostDetailPage = lazy(() => import("./pages/WisdomPostDetailPage"));

const TestStoragePage = lazy(() => import("./pages/TestStoragePage"));
const TestDetailPage = lazy(() => import("./pages/TestDetailPage"));
const TestOmrPage = lazy(() => import("./pages/TestOmrPage"));
const TestReportPage = lazy(() => import("./pages/TestReportPage"));
const TestWrongNotePage = lazy(() => import("./pages/TestWrongNotePage"));

const HarvestLedgerPage = lazy(() => import("./pages/HarvestLedgerPage"));
const SeedLedgerPage = lazy(() => import("./pages/SeedLedgerPage"));
const DuelMainPage = lazy(() => import("./pages/DuelMainPage"));
const DuelThemeMainPage = lazy(() => import("./pages/DuelThemeMainPage"));
const DuelLobbyPage = lazy(() => import("./pages/DuelLobbyPage"));
const DuelWaitingRoomPage = lazy(() => import("./pages/DuelWaitingRoomPage"));
const DuelMatchPage = lazy(() => import("./pages/DuelMatchPage"));
const DuelResultPage = lazy(() => import("./pages/DuelResultPage"));
const DiagnosticPrintPage = lazy(() => import("./pages/DiagnosticPrintPage"));
const DiagnosticV2Page = lazy(() => import("./pages/DiagnosticV2Page"));
const DiagnosticTestPage = lazy(() => import("./pages/DiagnosticTestPage"));
const DiagnosticReportPage = lazy(() => import("./pages/DiagnosticReportPage"));
const UnifiedReportPage = lazy(() => import("./pages/UnifiedReportPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

// 관리자 페이지
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const OpsStation = lazy(() => import("./pages/OpsStation"));
const AdminOrgsPage = lazy(() => import("./pages/AdminOrgsPage"));
const AdminClassesPage = lazy(() => import("./pages/AdminClassesPage"));
// AdminStudentsPage / AdminMembersPage / AdminParentLinksPage 는 AdminUsersPage 로 통합됨 (2026-05-18)
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const OrgApplyPage = lazy(() => import("./pages/OrgApplyPage"));
const AdminOrgApplicationsPage = lazy(() => import("./pages/AdminOrgApplicationsPage"));
const AdminStudentDetailPage = lazy(() => import("./pages/AdminStudentDetailPage"));
const AdminContentPage = lazy(() => import("./pages/AdminContentPage"));
const AdminContentUploadPage = lazy(() => import("./pages/AdminContentUploadPage"));
const AdminContentPreviewPage = lazy(() => import("./pages/AdminContentPreviewPage"));
const AdminContentEditorPage = lazy(() => import("./pages/AdminContentEditorPage"));
const AdminPrintContentPage = lazy(() => import("./pages/AdminPrintContentPage"));
const AdminShopPage = lazy(() => import("./pages/AdminShopPage"));
const AdminDuelPage = lazy(() => import("./pages/AdminDuelPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminOrgSettingsPage = lazy(() => import("./pages/AdminOrgSettingsPage"));
const AdminGrapefruitPricingPage = lazy(() => import("./pages/AdminGrapefruitPricingPage"));
const AdminGrapefruitWalletPage = lazy(() => import("./pages/AdminGrapefruitWalletPage"));
const AdminOrgBillingPage = lazy(() => import("./pages/AdminOrgBillingPage"));
const AdminAllOrgBillingPage = lazy(() => import("./pages/AdminAllOrgBillingPage"));
const MyGrapefruitPage = lazy(() => import("./pages/MyGrapefruitPage"));
const MyWalletPage = lazy(() => import("./pages/MyWalletPage"));
const MyAiStudyPage = lazy(() => import("./pages/MyAiStudyPage"));
const MyTutorPage = lazy(() => import("./pages/MyTutorPage"));
const TutorPersonaSelectPage = lazy(() => import("./pages/TutorPersonaSelectPage"));
const AnalysisReportPage = lazy(() => import("./pages/AnalysisReportPage"));
const AdminNoticePage = lazy(() => import("./pages/AdminNoticePage"));
const AdminOwnStudyContentsPage = lazy(() => import("./pages/AdminOwnStudyContentsPage"));
const AdminWisdomPage = lazy(() => import("./pages/AdminWisdomPage"));
const AdminWisdomDetailPage = lazy(() => import("./pages/AdminWisdomDetailPage"));
const AdminTestPage = lazy(() => import("./pages/AdminTestPage"));
const AdminAiUsagePage = lazy(() => import("./pages/AdminAiUsagePage"));
const AdminTestEditorPage = lazy(() => import("./pages/AdminTestEditorPage"));
const AdminTextbookListPage = lazy(() => import("./textbook/pages/AdminTextbookListPage"));
const TextbookEditorPage = lazy(() => import("./textbook/canvas/CanvasTextbookEditorPage"));
const AdminOfflineOmrPage = lazy(() => import("./pages/AdminOfflineOmrPage"));
const AdminTestStatisticsPage = lazy(() => import("./pages/AdminTestStatisticsPage"));
const AdminStudentReportPage = lazy(() => import("./pages/AdminStudentReportPage"));
const AdminProPage = lazy(() => import("./pages/AdminProPage"));
const AdminStudyPlanDashboardPage = lazy(() => import("./pages/AdminStudyPlanDashboardPage"));
const StudyPlanPage = lazy(() => import("./pages/StudyPlanPage"));
const StudyPlanSubmitPage = lazy(() => import("./pages/StudyPlanSubmitPage"));
const ParentStudyPlanPage = lazy(() => import("./pages/ParentStudyPlanPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const DiagnosticInfoPage = lazy(() => import("./pages/DiagnosticInfoPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const PricingDetailPage = lazy(() => import("./pages/PricingPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
// AdminDuelQuestionsPage는 AdminDuelPage 내부에서 직접 import됨
const AdminInquiryPage = lazy(() => import("./pages/AdminInquiryPage"));
const InquiryPage = lazy(() => import("./pages/InquiryPage"));
const AdminMembershipApprovalPage = lazy(() => import("./pages/AdminMembershipApprovalPage"));
const AdminQBImportPage = lazy(() => import("./pages/AdminQBImportPage"));
const AdminQBRecordDetailPage = lazy(() => import("./pages/AdminQBRecordDetailPage"));
const AdminQBCodesPage = lazy(() => import("./pages/AdminQBCodesPage"));
const AdminEditHistoryPage = lazy(() => import("./pages/AdminEditHistoryPage"));
const AdminLearningDBPage = lazy(() => import("./pages/AdminLearningDBPage"));
const AdminStudyContentPage = lazy(() => import("./pages/AdminStudyContentPage"));
const AdminStudyContentEditorV2Page = lazy(() => import("./pages/AdminStudyContentEditorV2Page"));
const AdminBoardsPage = lazy(() => import("./pages/AdminBoardsPage"));
const AdminChatArchivesPage = lazy(() => import("./pages/AdminChatArchivesPage"));

/* 로그인 상태에서 공개 페이지 접근 시 /start로 리다이렉트 */
function PublicOnlyRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/start" replace />;
  return children;
}

/* /start 진입 — 학부모면 /parent-home, 그 외 모두 새 학생 메인 (StudentHomePage). 옛 StartPage 는 /start-legacy 로 보존 */
function StartRouter() {
  const { user } = useAuth();
  const isParent = user?.roles?.includes("PARENT");
  if (isParent) return <Navigate to="/parent-home" replace />;
  return <StudentHomePage />;
}

/* /tests/history → /tests?tab=history 리다이렉트 (기존 쿼리 파라미터 보존) */
function TestsHistoryRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", "history");
  return <Navigate to={`/tests?${params.toString()}`} replace />;
}

/* /admin/question-bank/records/:id → /admin/learning-db/qb-records/:id 리다이렉트 */
function QBRecordRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/learning-db/qb-records/${id}`} replace />;
}

function GlobalLogo() {
  const { pathname } = useLocation();
  const { isLoggedIn } = useAuth();
  const hideLogo =
    pathname === "/" || pathname.startsWith("/admin") || pathname === "/ops" || pathname.startsWith("/duel/match") ||
    pathname === "/start" || pathname === "/start-new" || pathname === "/parent-home" ||
    pathname === "/tutor/persona-select" || pathname === "/my/grapefruit" || pathname === "/report";
  if (hideLogo) {
    return null;
  }
  const label = "\uAD6D\uC5B4\uB18D\uC7A5";
  const hideHomeBtn =
    pathname === "/start" || pathname === "/daily-quiz" || pathname === "/daily-reading" || pathname === "/login" || pathname === "/signup";
  return (
    <div className="global-logo-bar">
      <Link className="global-logo-link" to="/" aria-label={label}>
        <img src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt={label} />
      </Link>
      {isLoggedIn && !hideHomeBtn && (
        <Link className="global-home-btn" to="/start">
          <span className="material-symbols-outlined">cottage</span>
          학습 홈
        </Link>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh", color: "#8a7468" }}>
      불러오는 중...
    </div>
  );
}

/* 인증 필요 라우트를 간결하게 작성하기 위한 헬퍼 */
const P = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
const A = (page) => <AdminRoute>{page}</AdminRoute>;

/* 로그인 사용자에게만 새 시즌 안내 모달 표시 — 학생/학부모/관리자 모두 */
function SeasonModalGate() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return null;
  return <SeasonStartModal />;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalLogo />
      <SeasonModalGate />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset" element={<ResetPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/diagnostic-info" element={<DiagnosticInfoPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/features" element={<Navigate to="/about" replace />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/pricing" element={<PricingDetailPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />

          {/* 인증 필요 페이지 */}
          <Route path="/start" element={P(<StartRouter />)} />
          <Route path="/start-new" element={P(<StudentHomePage />)} />
          <Route path="/start-legacy" element={P(<StartPage />)} />
          <Route path="/parent-home" element={P(<ParentHomePage />)} />
          <Route path="/profile" element={P(<ProfilePage />)} />
          <Route path="/pending" element={P(<PendingApprovalPage />)} />
          <Route path="/community" element={P(<CommunityPage />)} />
          <Route path="/community/new" element={P(<PostWritePage />)} />
          <Route path="/shop" element={P(<ShopPage />)} />
          <Route path="/shop/products/:productId" element={P(<ProductDetailPage />)} />
          <Route path="/payment/result" element={P(<PaymentResultPage />)} />
          <Route path="/payment/success" element={P(<PaymentSuccessPage />)} />
          <Route path="/payment/fail" element={P(<PaymentFailPage />)} />
          <Route path="/subscription" element={P(<SubscriptionPage />)} />
          <Route path="/ranking" element={P(<RankingPage />)} />
          <Route path="/parents/links" element={P(<ParentLinksPage />)} />
          <Route path="/parents/grapefruit" element={P(<ChildGrapefruitPage />)} />
          <Route path="/daily" element={P(<DailyLearningPage />)} />
          <Route path="/daily-quiz" element={P(<DailyQuizPage />)} />
          <Route path="/daily-reading" element={P(<DailyReadingPage />)} />
          <Route path="/learning" element={P(<LearningHubPage />)} />
          <Route path="/learning/:learningId" element={P(<LearningRunnerPage />)} />
          <Route path="/study-learning/:contentId" element={P(<StudyLearningPage />)} />
          <Route path="/pro-mode" element={P(<ProModePage />)} />
          <Route path="/pro-mode/chapter/:chapterId" element={P(<ProChapterPage />)} />
          <Route path="/pro-mode/chapter/:chapterId/test" element={P(<ProTestPage />)} />
          <Route path="/pro-mode/chapter/:chapterId/answer-key" element={P(<ProAnswerKeyPage />)} />
          <Route path="/farm-mode" element={P(<FarmModePage />)} />
          <Route path="/farm-mode/:farmId" element={P(<FarmListPage />)} />
          <Route path="/writing" element={P(<WritingPage />)} />
          <Route path="/writing/post/:postId" element={P(<WisdomPostDetailPage />)} />
          <Route path="/writing/:levelId/new" element={P(<WisdomWritePage />)} />
          <Route path="/writing/:levelId" element={P(<WisdomBoardPage />)} />
          <Route path="/tests" element={P(<TestStoragePage />)} />
          <Route path="/tests/history" element={<TestsHistoryRedirect />} />
          <Route path="/tests/:testId" element={P(<TestDetailPage />)} />
          <Route path="/tests/:testId/omr" element={P(<TestOmrPage />)} />
          <Route path="/tests/:testId/report" element={P(<TestReportPage />)} />
          <Route path="/tests/:testId/wrong-note" element={P(<TestWrongNotePage />)} />
          <Route path="/harvest-ledger" element={P(<HarvestLedgerPage />)} />
          <Route path="/seed-log" element={P(<SeedLedgerPage />)} />
          <Route path="/duel" element={P(<DuelMainPage />)} />
          <Route path="/duel/theme" element={P(<DuelThemeMainPage />)} />
          <Route path="/duel/lobby/:serverId" element={P(<DuelLobbyPage />)} />
          <Route path="/duel/room/:roomId" element={P(<DuelWaitingRoomPage />)} />
          <Route path="/duel/match/:matchId" element={P(<DuelMatchPage />)} />
          <Route path="/duel/result/:matchId" element={P(<DuelResultPage />)} />
          <Route path="/search" element={P(<SearchResultsPage />)} />
          <Route path="/report" element={P(<AnalysisReportPage />)} />
          <Route path="/report/legacy" element={P(<UnifiedReportPage />)} />
          <Route path="/tutor/persona-select" element={P(<TutorPersonaSelectPage />)} />
          {/* /assignments 라우트는 학습 계획표로 통합되어 폐기 (V2 study-plan) */}
          <Route path="/assignments" element={<Navigate to="/study-plan" replace />} />
          <Route path="/diagnostic/v2" element={P(<DiagnosticV2Page />)} />
          <Route path="/diagnostic/v2/test/:sessionId" element={P(<DiagnosticTestPage />)} />
          <Route path="/diagnostic/v2/print/:tier" element={P(<DiagnosticPrintPage />)} />
          <Route path="/diagnostic/v2/report/:sessionId" element={P(<DiagnosticReportPage />)} />
          {/* 구 진단 인쇄 경로 호환 */}
          <Route path="/diagnostic/print" element={P(<DiagnosticV2Page />)} />
          <Route path="/study-plan" element={P(<StudyPlanPage />)} />
          <Route path="/study-plan/submit/:cellId" element={P(<StudyPlanSubmitPage />)} />
          <Route path="/parents/children/:studentId/study-plan" element={P(<ParentStudyPlanPage />)} />

          {/* 관리자 전용 페이지 */}
          <Route path="/admin" element={A(<AdminPage />)} />
          <Route path="/admin/settings" element={A(<AdminSettingsPage />)} />
          <Route path="/admin/approvals" element={A(<AdminMembershipApprovalPage />)} />
          <Route path="/admin/orgs" element={A(<AdminOrgsPage />)} />
          <Route path="/admin/classes" element={A(<AdminClassesPage />)} />
          {/* 회원 관리 통합 페이지 (2026-05-18) — 학생/학부모/기관관리자/본사관리자 4탭 */}
          <Route path="/admin/users" element={A(<AdminUsersPage />)} />
          {/* 옛 분리 메뉴 호환 redirect */}
          <Route path="/admin/students" element={<Navigate to="/admin/users?tab=STUDENT" replace />} />
          <Route path="/admin/members" element={<Navigate to="/admin/users?tab=STUDENT" replace />} />
          {/* 학생 상세는 유지 — 외부 6개 화면(분석표·OpsStation 등)이 이 라우트로 직접 링크 */}
          <Route path="/admin/students/:userId" element={A(<AdminStudentDetailPage />)} />
          <Route path="/admin/org-applications" element={A(<AdminOrgApplicationsPage />)} />
          <Route path="/orgs/apply" element={A(<OrgApplyPage />)} />
          <Route path="/admin/content" element={A(<AdminContentPage />)} />
          <Route path="/admin/content/upload" element={A(<AdminContentUploadPage />)} />
          <Route path="/admin/content/preview" element={A(<AdminContentPreviewPage />)} />
          <Route path="/admin/print-content" element={A(<AdminPrintContentPage />)} />
          <Route path="/admin/content/edit" element={A(<AdminContentEditorPage />)} />
          <Route path="/admin/study-content" element={A(<AdminStudyContentPage />)} />
          {/* 옛 에디터 라우트는 v2 로 매핑 (backward 호환). AdminStudyContentEditorPage 는 폐기 예정 */}
          <Route path="/admin/study-content/editor/:contentId" element={A(<AdminStudyContentEditorV2Page />)} />
          <Route path="/admin/study-content-v2/editor/new" element={A(<AdminStudyContentEditorV2Page />)} />
          <Route path="/admin/study-content-v2/editor/:contentId" element={A(<AdminStudyContentEditorV2Page />)} />
          <Route path="/admin/boards" element={A(<AdminBoardsPage />)} />
          <Route path="/admin/boards/chat-archives" element={A(<AdminChatArchivesPage />)} />
          {/* 과제/피드백 메뉴 폐기 — 학습 계획표로 통합됨 */}
          <Route path="/admin/assignments" element={<Navigate to="/admin/study-plans" replace />} />
          <Route path="/admin/shop" element={A(<AdminShopPage />)} />
          <Route path="/admin/shop/products" element={<Navigate to="/admin/shop?tab=products" replace />} />
          <Route path="/admin/shop/orders" element={<Navigate to="/admin/shop?tab=orders" replace />} />
          <Route path="/admin/duel" element={A(<AdminDuelPage />)} />
          <Route path="/admin/seasons" element={<Navigate to="/admin/duel?tab=seasons" replace />} />
          <Route path="/admin/payments" element={<Navigate to="/admin/orgs?tab=payments" replace />} />
          <Route path="/admin/parents" element={<Navigate to="/admin/users?tab=PARENT" replace />} />
          <Route path="/admin/inquiry" element={A(<AdminInquiryPage />)} />
          <Route path="/admin/reports" element={A(<AdminReportsPage />)} />
          <Route path="/admin/notices" element={A(<AdminNoticePage />)} />
          <Route path="/admin/org-settings" element={A(<AdminOrgSettingsPage />)} />
          <Route path="/admin/grapefruit-pricing" element={A(<AdminGrapefruitPricingPage />)} />
          <Route path="/admin/grapefruit-wallet" element={A(<AdminGrapefruitWalletPage />)} />
          <Route path="/admin/billing" element={A(<AdminOrgBillingPage />)} />
          <Route path="/admin/all-billings" element={A(<AdminAllOrgBillingPage />)} />
          <Route path="/my/grapefruit" element={P(<MyWalletPage />)} />
          <Route path="/my/grapefruit/legacy" element={P(<MyGrapefruitPage />)} />
          <Route path="/my/ai-study" element={P(<MyAiStudyPage />)} />
          <Route path="/my/tutor" element={P(<MyTutorPage />)} />
          <Route path="/admin/own-study-contents" element={A(<AdminOwnStudyContentsPage />)} />
          <Route path="/admin/wisdom" element={A(<AdminWisdomPage />)} />
          <Route path="/admin/wisdom/:postId" element={A(<AdminWisdomDetailPage />)} />
          {/* 학습 계획표 셀에서 진입하는 표준 경로 */}
          <Route path="/admin/wisdom/posts/:postId" element={A(<AdminWisdomDetailPage />)} />
          <Route path="/admin/tests" element={A(<AdminTestPage />)} />
          <Route path="/admin/textbooks" element={A(<AdminTextbookListPage />)} />
          <Route path="/admin/textbooks/new" element={A(<TextbookEditorPage />)} />
          <Route path="/admin/textbooks/:textbookId/edit" element={A(<TextbookEditorPage />)} />
          <Route path="/admin/ai-usage" element={A(<AdminAiUsagePage />)} />
          <Route path="/admin/tests/:testId/edit" element={A(<AdminTestEditorPage />)} />
          <Route path="/admin/tests/:testId/statistics" element={A(<AdminTestStatisticsPage />)} />
          <Route path="/admin/tests/:testId/students/:userId/report" element={A(<AdminStudentReportPage />)} />
          <Route path="/admin/tests/offline-omr" element={A(<AdminOfflineOmrPage />)} />
          {/* 옛 /admin/tests/:testId 디테일 페이지는 통계 페이지로 통합 → 통계로 redirect (외부 링크 호환) */}
          <Route path="/admin/tests/:testId" element={A(<AdminTestStatisticsPage />)} />
          {/* 학습자료 DB — 작품·지문 corpus + 누적 항목 + 임시 체크포인트 풀 (V0107~) */}
          <Route path="/admin/learning-db" element={A(<AdminLearningDBPage />)} />
          {/* /admin/learning-corpus 는 옛 임시 라우트 — /admin/learning-db 로 통합 */}
          <Route path="/admin/learning-corpus" element={<Navigate to="/admin/learning-db" replace />} />
          <Route path="/admin/learning-db/qb-import" element={A(<AdminQBImportPage />)} />
          <Route path="/admin/learning-db/qb-records/:id" element={A(<AdminQBRecordDetailPage />)} />
          <Route path="/admin/learning-db/qb-codes" element={A(<AdminQBCodesPage />)} />
          {/* 하위 호환 리다이렉트 */}
          <Route path="/admin/question-bank" element={<Navigate to="/admin/learning-db?tab=question-bank" replace />} />
          <Route path="/admin/question-bank/import" element={<Navigate to="/admin/learning-db/qb-import" replace />} />
          <Route path="/admin/question-bank/records/:id" element={<QBRecordRedirect />} />
          <Route path="/admin/question-bank/codes" element={<Navigate to="/admin/learning-db/qb-codes" replace />} />
          <Route path="/admin/manuscripts" element={<Navigate to="/admin/learning-db?tab=manuscripts" replace />} />
          <Route path="/admin/pro" element={A(<AdminProPage />)} />
          <Route path="/admin/edit-history" element={A(<AdminEditHistoryPage />)} />
          <Route path="/admin/study-plans" element={A(<AdminStudyPlanDashboardPage />)} />
          {/* 구 상세 페이지는 dashboard 의 학생별 탭으로 통합 — 호환 redirect */}
          <Route path="/admin/study-plans/:planId" element={<Navigate to="/admin/study-plans?tab=student" replace />} />
          <Route path="/admin/duel/questions" element={<Navigate to="/admin/duel?tab=questions" replace />} />
          <Route path="/ops" element={A(<OpsStation />)} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
