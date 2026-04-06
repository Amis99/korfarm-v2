import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

// 핵심 페이지 (정적 import - 초기 로딩 필수)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StartPage from "./pages/StartPage";
import NotFoundPage from "./pages/NotFoundPage";

// 나머지 페이지 (lazy import - 코드 분할)
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ResetPage = lazy(() => import("./pages/ResetPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));

const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const PostWritePage = lazy(() => import("./pages/PostWritePage"));

const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentFailPage = lazy(() => import("./pages/PaymentFailPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

const RankingPage = lazy(() => import("./pages/RankingPage"));
const ParentLinksPage = lazy(() => import("./pages/ParentLinksPage"));
const StudentLinkConfirmPage = lazy(() => import("./pages/StudentLinkConfirmPage"));

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
const DuelLobbyPage = lazy(() => import("./pages/DuelLobbyPage"));
const DuelWaitingRoomPage = lazy(() => import("./pages/DuelWaitingRoomPage"));
const DuelMatchPage = lazy(() => import("./pages/DuelMatchPage"));
const DuelResultPage = lazy(() => import("./pages/DuelResultPage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const DiagnosticPrintPage = lazy(() => import("./pages/DiagnosticPrintPage"));
const DiagnosticV2Page = lazy(() => import("./pages/DiagnosticV2Page"));
const DiagnosticTestPage = lazy(() => import("./pages/DiagnosticTestPage"));
const DiagnosticReportPage = lazy(() => import("./pages/DiagnosticReportPage"));
const UnifiedReportPage = lazy(() => import("./pages/UnifiedReportPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

// 관리자 페이지
const AdminPage = lazy(() => import("./pages/AdminPage"));
const OpsStation = lazy(() => import("./pages/OpsStation"));
const AdminOrgsPage = lazy(() => import("./pages/AdminOrgsPage"));
const AdminClassesPage = lazy(() => import("./pages/AdminClassesPage"));
const AdminStudentsPage = lazy(() => import("./pages/AdminStudentsPage"));
const AdminStudentDetailPage = lazy(() => import("./pages/AdminStudentDetailPage"));
const AdminContentPage = lazy(() => import("./pages/AdminContentPage"));
const AdminContentUploadPage = lazy(() => import("./pages/AdminContentUploadPage"));
const AdminContentPreviewPage = lazy(() => import("./pages/AdminContentPreviewPage"));
const AdminContentEditorPage = lazy(() => import("./pages/AdminContentEditorPage"));
const AdminAssignmentsPage = lazy(() => import("./pages/AdminAssignmentsPage"));
const AdminShopPage = lazy(() => import("./pages/AdminShopPage"));
const AdminDuelPage = lazy(() => import("./pages/AdminDuelPage"));
const AdminParentLinksPage = lazy(() => import("./pages/AdminParentLinksPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminWisdomPage = lazy(() => import("./pages/AdminWisdomPage"));
const AdminWisdomDetailPage = lazy(() => import("./pages/AdminWisdomDetailPage"));
const AdminTestPage = lazy(() => import("./pages/AdminTestPage"));
const AdminTestDetailPage = lazy(() => import("./pages/AdminTestDetailPage"));
const AdminProPage = lazy(() => import("./pages/AdminProPage"));
const AdminStudyPlansPage = lazy(() => import("./pages/AdminStudyPlansPage"));
const AdminStudyPlanDetailPage = lazy(() => import("./pages/AdminStudyPlanDetailPage"));
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
const AdminStudyContentEditorPage = lazy(() => import("./pages/AdminStudyContentEditorPage"));
const AdminBoardsPage = lazy(() => import("./pages/AdminBoardsPage"));
const AdminChatArchivesPage = lazy(() => import("./pages/AdminChatArchivesPage"));

/* 로그인 상태에서 공개 페이지 접근 시 /start로 리다이렉트 */
function PublicOnlyRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/start" replace />;
  return children;
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
    pathname === "/" || pathname.startsWith("/admin") || pathname === "/ops" || pathname.startsWith("/duel/match");
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

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalLogo />
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
          <Route path="/inquiry" element={<InquiryPage />} />

          {/* 인증 필요 페이지 */}
          <Route path="/start" element={P(<StartPage />)} />
          <Route path="/profile" element={P(<ProfilePage />)} />
          <Route path="/pending" element={P(<PendingApprovalPage />)} />
          <Route path="/community" element={P(<CommunityPage />)} />
          <Route path="/community/post/:postId" element={P(<PostDetailPage />)} />
          <Route path="/community/new" element={P(<PostWritePage />)} />
          <Route path="/shop" element={P(<ShopPage />)} />
          <Route path="/shop/products/:productId" element={P(<ProductDetailPage />)} />
          <Route path="/payment/result" element={P(<PaymentResultPage />)} />
          <Route path="/payment/success" element={P(<PaymentSuccessPage />)} />
          <Route path="/payment/fail" element={P(<PaymentFailPage />)} />
          <Route path="/subscription" element={P(<SubscriptionPage />)} />
          <Route path="/ranking" element={P(<RankingPage />)} />
          <Route path="/parents/links" element={P(<ParentLinksPage />)} />
          <Route path="/students/links/confirm" element={P(<StudentLinkConfirmPage />)} />
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
          <Route path="/duel/lobby/:serverId" element={P(<DuelLobbyPage />)} />
          <Route path="/duel/room/:roomId" element={P(<DuelWaitingRoomPage />)} />
          <Route path="/duel/match/:matchId" element={P(<DuelMatchPage />)} />
          <Route path="/duel/result/:matchId" element={P(<DuelResultPage />)} />
          <Route path="/search" element={P(<SearchResultsPage />)} />
          <Route path="/report" element={P(<UnifiedReportPage />)} />
          <Route path="/assignments" element={P(<AssignmentsPage />)} />
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
          <Route path="/admin/approvals" element={A(<AdminMembershipApprovalPage />)} />
          <Route path="/admin/orgs" element={A(<AdminOrgsPage />)} />
          <Route path="/admin/classes" element={A(<AdminClassesPage />)} />
          <Route path="/admin/students" element={A(<AdminStudentsPage />)} />
          <Route path="/admin/students/:userId" element={A(<AdminStudentDetailPage />)} />
          <Route path="/admin/content" element={A(<AdminContentPage />)} />
          <Route path="/admin/content/upload" element={A(<AdminContentUploadPage />)} />
          <Route path="/admin/content/preview" element={A(<AdminContentPreviewPage />)} />
          <Route path="/admin/content/edit" element={A(<AdminContentEditorPage />)} />
          <Route path="/admin/study-content" element={A(<AdminStudyContentPage />)} />
          <Route path="/admin/study-content/editor/:contentId" element={A(<AdminStudyContentEditorPage />)} />
          <Route path="/admin/boards" element={A(<AdminBoardsPage />)} />
          <Route path="/admin/boards/chat-archives" element={A(<AdminChatArchivesPage />)} />
          <Route path="/admin/assignments" element={A(<AdminAssignmentsPage />)} />
          <Route path="/admin/shop" element={A(<AdminShopPage />)} />
          <Route path="/admin/shop/products" element={<Navigate to="/admin/shop?tab=products" replace />} />
          <Route path="/admin/shop/orders" element={<Navigate to="/admin/shop?tab=orders" replace />} />
          <Route path="/admin/duel" element={A(<AdminDuelPage />)} />
          <Route path="/admin/seasons" element={<Navigate to="/admin/duel?tab=seasons" replace />} />
          <Route path="/admin/payments" element={<Navigate to="/admin/orgs?tab=payments" replace />} />
          <Route path="/admin/parents" element={A(<AdminParentLinksPage />)} />
          <Route path="/admin/inquiry" element={A(<AdminInquiryPage />)} />
          <Route path="/admin/reports" element={A(<AdminReportsPage />)} />
          <Route path="/admin/wisdom" element={A(<AdminWisdomPage />)} />
          <Route path="/admin/wisdom/:postId" element={A(<AdminWisdomDetailPage />)} />
          <Route path="/admin/tests" element={A(<AdminTestPage />)} />
          <Route path="/admin/tests/:testId" element={A(<AdminTestDetailPage />)} />
          {/* 학습자료 DB 통합 */}
          <Route path="/admin/learning-db" element={A(<AdminLearningDBPage />)} />
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
          <Route path="/admin/study-plans" element={A(<AdminStudyPlansPage />)} />
          <Route path="/admin/study-plans/:planId" element={A(<AdminStudyPlanDetailPage />)} />
          <Route path="/admin/duel/questions" element={<Navigate to="/admin/duel?tab=questions" replace />} />
          <Route path="/ops" element={A(<OpsStation />)} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
