import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

// 핵심 페이지 (정적 import - 초기 로딩 필수)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StartPage from "./pages/StartPage";

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
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

const RankingPage = lazy(() => import("./pages/RankingPage"));
const ParentLinksPage = lazy(() => import("./pages/ParentLinksPage"));
const StudentLinkConfirmPage = lazy(() => import("./pages/StudentLinkConfirmPage"));

const DailyQuizPage = lazy(() => import("./pages/DailyQuizPage"));
const DailyReadingPage = lazy(() => import("./pages/DailyReadingPage"));
const LearningHubPage = lazy(() => import("./pages/LearningHubPage"));
const LearningRunnerPage = lazy(() => import("./pages/LearningRunnerPage"));

const ProModePage = lazy(() => import("./pages/ProModePage"));
const ProChapterPage = lazy(() => import("./pages/ProChapterPage"));
const ProTestPage = lazy(() => import("./pages/ProTestPage"));

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
const TestHistoryPage = lazy(() => import("./pages/TestHistoryPage"));

const HarvestLedgerPage = lazy(() => import("./pages/HarvestLedgerPage"));
const DuelMainPage = lazy(() => import("./pages/DuelMainPage"));
const DuelLobbyPage = lazy(() => import("./pages/DuelLobbyPage"));
const DuelWaitingRoomPage = lazy(() => import("./pages/DuelWaitingRoomPage"));
const DuelMatchPage = lazy(() => import("./pages/DuelMatchPage"));
const DuelResultPage = lazy(() => import("./pages/DuelResultPage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const DiagnosticPrintPage = lazy(() => import("./pages/DiagnosticPrintPage"));

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
const AdminAssignmentsPage = lazy(() => import("./pages/AdminAssignmentsPage"));
const AdminSeasonsPage = lazy(() => import("./pages/AdminSeasonsPage"));
const AdminShopProductsPage = lazy(() => import("./pages/AdminShopProductsPage"));
const AdminShopOrdersPage = lazy(() => import("./pages/AdminShopOrdersPage"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage"));
const AdminParentLinksPage = lazy(() => import("./pages/AdminParentLinksPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminFlagsPage = lazy(() => import("./pages/AdminFlagsPage"));
const AdminWisdomPage = lazy(() => import("./pages/AdminWisdomPage"));
const AdminWisdomDetailPage = lazy(() => import("./pages/AdminWisdomDetailPage"));
const AdminTestPage = lazy(() => import("./pages/AdminTestPage"));
const AdminTestDetailPage = lazy(() => import("./pages/AdminTestDetailPage"));
const AdminProPage = lazy(() => import("./pages/AdminProPage"));
const AdminDuelQuestionsPage = lazy(() => import("./pages/AdminDuelQuestionsPage"));
const AdminMembershipApprovalPage = lazy(() => import("./pages/AdminMembershipApprovalPage"));

function GlobalLogo() {
  const { pathname } = useLocation();
  const hideLogo =
    pathname === "/" || pathname.startsWith("/admin") || pathname === "/ops" || pathname === "/community" || pathname.startsWith("/duel/match");
  if (hideLogo) {
    return null;
  }
  const label = "\uAD6D\uC5B4\uB18D\uC7A5";
  return (
    <div className="global-logo-bar">
      <Link className="global-logo-link" to="/" aria-label={label}>
        <img src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt={label} />
      </Link>
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

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalLogo />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset" element={<ResetPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/post/:postId" element={<PostDetailPage />} />
          <Route path="/community/new" element={<PostWritePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/products/:productId" element={<ProductDetailPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/pending" element={<PendingApprovalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/approvals" element={<AdminMembershipApprovalPage />} />
          <Route path="/admin/orgs" element={<AdminOrgsPage />} />
          <Route path="/admin/classes" element={<AdminClassesPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/students/:userId" element={<AdminStudentDetailPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/content/upload" element={<AdminContentUploadPage />} />
          <Route path="/admin/content/preview" element={<AdminContentPreviewPage />} />
          <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
          <Route path="/admin/seasons" element={<AdminSeasonsPage />} />
          <Route path="/admin/shop/products" element={<AdminShopProductsPage />} />
          <Route path="/admin/shop/orders" element={<AdminShopOrdersPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/parents" element={<AdminParentLinksPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/flags" element={<AdminFlagsPage />} />
          <Route path="/diagnostic/print" element={<DiagnosticPrintPage />} />

          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/parents/links" element={<ParentLinksPage />} />
          <Route path="/students/links/confirm" element={<StudentLinkConfirmPage />} />
          <Route path="/daily-quiz" element={<DailyQuizPage />} />
          <Route path="/daily-reading" element={<DailyReadingPage />} />
          <Route path="/learning" element={<LearningHubPage />} />
          <Route path="/learning/:learningId" element={<LearningRunnerPage />} />
          <Route path="/pro-mode" element={<ProModePage />} />
          <Route path="/pro-mode/chapter/:chapterId" element={<ProChapterPage />} />
          <Route path="/pro-mode/chapter/:chapterId/test" element={<ProTestPage />} />
          <Route path="/farm-mode" element={<FarmModePage />} />
          <Route path="/farm-mode/:farmId" element={<FarmListPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/writing/post/:postId" element={<WisdomPostDetailPage />} />
          <Route path="/writing/:levelId/new" element={<WisdomWritePage />} />
          <Route path="/writing/:levelId" element={<WisdomBoardPage />} />
          <Route path="/admin/wisdom" element={<AdminWisdomPage />} />
          <Route path="/admin/wisdom/:postId" element={<AdminWisdomDetailPage />} />
          <Route path="/tests" element={<TestStoragePage />} />
          <Route path="/tests/history" element={<TestHistoryPage />} />
          <Route path="/tests/:testId" element={<TestDetailPage />} />
          <Route path="/tests/:testId/omr" element={<TestOmrPage />} />
          <Route path="/tests/:testId/report" element={<TestReportPage />} />
          <Route path="/tests/:testId/wrong-note" element={<TestWrongNotePage />} />
          <Route path="/admin/tests" element={<AdminTestPage />} />
          <Route path="/admin/tests/:testId" element={<AdminTestDetailPage />} />
          <Route path="/admin/pro" element={<AdminProPage />} />
          <Route path="/admin/duel/questions" element={<AdminDuelQuestionsPage />} />
          <Route path="/harvest-ledger" element={<HarvestLedgerPage />} />
          <Route path="/seed-log" element={<Navigate to="/tests/history" replace />} />
          <Route path="/duel" element={<DuelMainPage />} />
          <Route path="/duel/lobby/:serverId" element={<DuelLobbyPage />} />
          <Route path="/duel/room/:roomId" element={<DuelWaitingRoomPage />} />
          <Route path="/duel/match/:matchId" element={<DuelMatchPage />} />
          <Route path="/duel/result/:matchId" element={<DuelResultPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/ops" element={<OpsStation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
