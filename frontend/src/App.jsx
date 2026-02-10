import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import StartPage from "./pages/StartPage";
import AdminPage from "./pages/AdminPage";
import OpsStation from "./pages/OpsStation";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ResetPage from "./pages/ResetPage";
import CommunityPage from "./pages/CommunityPage";
import PostDetailPage from "./pages/PostDetailPage";
import PostWritePage from "./pages/PostWritePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminOrgsPage from "./pages/AdminOrgsPage";
import AdminClassesPage from "./pages/AdminClassesPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminContentPage from "./pages/AdminContentPage";
import AdminAssignmentsPage from "./pages/AdminAssignmentsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminFlagsPage from "./pages/AdminFlagsPage";
import AdminSeasonsPage from "./pages/AdminSeasonsPage";
import AdminShopProductsPage from "./pages/AdminShopProductsPage";
import AdminShopOrdersPage from "./pages/AdminShopOrdersPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminParentLinksPage from "./pages/AdminParentLinksPage";
import AdminContentUploadPage from "./pages/AdminContentUploadPage";
import AdminContentPreviewPage from "./pages/AdminContentPreviewPage";
import DiagnosticPrintPage from "./pages/DiagnosticPrintPage";
import OmrEntryPage from "./pages/OmrEntryPage";
import RankingPage from "./pages/RankingPage";
import ParentLinksPage from "./pages/ParentLinksPage";
import StudentLinkConfirmPage from "./pages/StudentLinkConfirmPage";
import LearningHubPage from "./pages/LearningHubPage";
import LearningRunnerPage from "./pages/LearningRunnerPage";
import DailyQuizPage from "./pages/DailyQuizPage";
import DailyReadingPage from "./pages/DailyReadingPage";
import ProModePage from "./pages/ProModePage";
import FarmModePage from "./pages/FarmModePage";
import FarmListPage from "./pages/FarmListPage";
import WritingPage from "./pages/WritingPage";
import WisdomBoardPage from "./pages/WisdomBoardPage";
import WisdomWritePage from "./pages/WisdomWritePage";
import WisdomPostDetailPage from "./pages/WisdomPostDetailPage";
import AdminWisdomPage from "./pages/AdminWisdomPage";
import AdminWisdomDetailPage from "./pages/AdminWisdomDetailPage";
import TestStoragePage from "./pages/TestStoragePage";
import TestDetailPage from "./pages/TestDetailPage";
import TestOmrPage from "./pages/TestOmrPage";
import TestReportPage from "./pages/TestReportPage";
import TestWrongNotePage from "./pages/TestWrongNotePage";
import TestHistoryPage from "./pages/TestHistoryPage";
import AdminTestPage from "./pages/AdminTestPage";
import AdminTestDetailPage from "./pages/AdminTestDetailPage";
import HarvestLedgerPage from "./pages/HarvestLedgerPage";
import SeedLogPage from "./pages/SeedLogPage";
import DuelMainPage from "./pages/DuelMainPage";
import DuelWaitingRoomPage from "./pages/DuelWaitingRoomPage";
import DuelMatchPage from "./pages/DuelMatchPage";
import DuelResultPage from "./pages/DuelResultPage";
import DuelLobbyPage from "./pages/DuelLobbyPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import ProfilePage from "./pages/ProfilePage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import AdminDuelQuestionsPage from "./pages/AdminDuelQuestionsPage";
import AdminMembershipApprovalPage from "./pages/AdminMembershipApprovalPage";
import AdminStudentDetailPage from "./pages/AdminStudentDetailPage";

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

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalLogo />
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
        <Route path="/omr" element={<OmrEntryPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/parents/links" element={<ParentLinksPage />} />
        <Route path="/students/links/confirm" element={<StudentLinkConfirmPage />} />
        <Route path="/daily-quiz" element={<DailyQuizPage />} />
        <Route path="/daily-reading" element={<DailyReadingPage />} />
        <Route path="/learning" element={<LearningHubPage />} />
        <Route path="/learning/:learningId" element={<LearningRunnerPage />} />
        <Route path="/pro-mode" element={<ProModePage />} />
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
    </BrowserRouter>
  );
}

export default App;
