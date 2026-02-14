import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/test-storage.css";

const COURSE_LEVELS = [
  { id: "saussure1", name: "소쉬르1" },
  { id: "saussure2", name: "소쉬르2" },
  { id: "saussure3", name: "소쉬르3" },
  { id: "frege1", name: "프레게1" },
  { id: "frege2", name: "프레게2" },
  { id: "frege3", name: "프레게3" },
  { id: "russell1", name: "러셀1" },
  { id: "russell2", name: "러셀2" },
  { id: "russell3", name: "러셀3" },
  { id: "wittgenstein1", name: "비트겐슈타인1" },
  { id: "wittgenstein2", name: "비트겐슈타인2" },
  { id: "wittgenstein3", name: "비트겐슈타인3" },
];

const LEVEL_NAME_MAP = Object.fromEntries(COURSE_LEVELS.map(l => [l.id, l.name]));

function TestStoragePage() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState(""); // "" | "hq" | "org"
  const [levelFilter, setLevelFilter] = useState("");   // "" | levelId
  const [userOrgName, setUserOrgName] = useState("");
  const [childName, setChildName] = useState("");

  // 유저/자녀 소속 기관 이름 가져오기
  useEffect(() => {
    if (!isLoggedIn) return;
    if (isViewingChild) {
      apiGet(`/v1/parents/children/${studentId}/profile`)
        .then(profile => {
          setChildName(profile?.name || "자녀");
          // 자녀 프로필에는 orgName이 없으므로 일단 빈 값
          setUserOrgName("");
        })
        .catch(() => {});
    } else {
      apiGet("/v1/auth/me")
        .then(profile => {
          setUserOrgName(profile.org_name || profile.orgName || "");
        })
        .catch(() => {});
    }
  }, [isLoggedIn, isViewingChild, studentId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (sourceFilter) params.set("source", sourceFilter);
    if (levelFilter) params.set("levelId", levelFilter);
    const qs = params.toString();

    const apiUrl = isViewingChild
      ? `/v1/parents/children/${studentId}/test-storage${qs ? `?${qs}` : ""}`
      : `/v1/test-storage${qs ? `?${qs}` : ""}`;

    apiGet(apiUrl)
      .then(data => setTests((data || []).filter(t => t.series !== "chapter" && t.series !== "diagnostic")))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, isViewingChild, studentId, sourceFilter, levelFilter]);

  // 소속 기관이 있는지 판단 (tests에 orgName이 있으면)
  const hasOrgTests = useMemo(() => tests.some(t => t.orgId), [tests]);
  const orgLabel = useMemo(() => {
    if (userOrgName) return userOrgName;
    const first = tests.find(t => t.orgName);
    return first?.orgName || "소속 기관";
  }, [tests, userOrgName]);

  if (!isLoggedIn) {
    return (
      <div className="ts-page ts-center">
        <p>로그인이 필요합니다.</p>
        <Link to="/login" className="ts-link">로그인</Link>
      </div>
    );
  }

  return (
    <div className="ts-page">
      <header className="ts-header">
        <div>
          <h1>{isViewingChild ? `${childName}의 테스트 창고` : "테스트 창고"}</h1>
          <p className="ts-subtitle">
            {isViewingChild
              ? "자녀의 시험 응시 현황을 확인하세요."
              : "시험을 선택하고 OMR 답안을 입력하세요."}
          </p>
        </div>
        <Link to="/start" className="ts-back-link">
          <span className="material-symbols-outlined">home</span>
          홈으로
        </Link>
      </header>

      <div className="ts-toolbar">
        <div className="ts-filters">
          {/* 출처 태그 */}
          <button
            className={`ts-filter-btn ${sourceFilter === "" ? "active" : ""}`}
            onClick={() => setSourceFilter("")}
          >
            전체
          </button>
          <button
            className={`ts-filter-btn ${sourceFilter === "hq" ? "active" : ""}`}
            onClick={() => setSourceFilter("hq")}
          >
            국어농장
          </button>
          <button
            className={`ts-filter-btn ${sourceFilter === "org" ? "active" : ""}`}
            onClick={() => setSourceFilter("org")}
          >
            {orgLabel}
          </button>
        </div>

        <div className="ts-toolbar-right">
          {/* 과정 드롭다운 */}
          <select
            className="ts-level-select"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="">전체 과정</option>
            {COURSE_LEVELS.map(lv => (
              <option key={lv.id} value={lv.id}>{lv.name}</option>
            ))}
          </select>

          <Link
            to={isViewingChild ? `/tests/history?studentId=${studentId}` : "/tests/history"}
            className="ts-history-link"
          >
            <span className="material-symbols-outlined">history</span>
            응시 이력
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="ts-center"><p>불러오는 중...</p></div>
      ) : tests.length === 0 ? (
        <div className="ts-center"><p>등록된 시험이 없습니다.</p></div>
      ) : (
        <div className="ts-grid">
          {tests.map((t, idx) => (
            <div
              key={t.testId ?? idx}
              className="ts-card"
              onClick={() => navigate(`/tests/${t.testId}`)}
            >
              <div className="ts-card-top">
                <h3 className="ts-card-title">{t.title}</h3>
                {t.hasSubmitted ? (
                  <span className="ts-badge ts-badge-done">{t.score}점</span>
                ) : (
                  <span className="ts-badge ts-badge-pending">미응시</span>
                )}
              </div>
              {t.description && <p className="ts-card-desc">{t.description}</p>}
              <div className="ts-card-meta">
                {t.orgName ? (
                  <span className="ts-meta-org">{t.orgName}</span>
                ) : (
                  <span className="ts-meta-hq">국어농장</span>
                )}
                {t.levelId && <span>{LEVEL_NAME_MAP[t.levelId] || t.levelId}</span>}
                <span>{t.totalQuestions}문항</span>
                <span>{t.totalPoints}점</span>
                {t.series && <span>{t.series}</span>}
                {t.examDate && <span>{t.examDate}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestStoragePage;
