import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, isPaymentRequired } from "../utils/api";
import VideoModal from "../components/VideoModal";
import "../styles/pro-mode.css";
import "../styles/video-modal.css";

function ProModePage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const overrideLevel = searchParams.get("level");
  const [chapters, setChapters] = useState([]);
  const [userLevel, setUserLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [needSubscription, setNeedSubscription] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    // ?level= 가 있으면 챕터 목록도 그 레벨로 조회 (관리자 레벨 오버라이드 지원)
    const chaptersUrl = overrideLevel
      ? `/v1/pro/chapters?levelId=${encodeURIComponent(overrideLevel)}`
      : "/v1/pro/chapters";
    Promise.all([
      apiGet("/v1/auth/me"),
      apiGet(chaptersUrl),
    ])
      .then(([me, chaps]) => {
        // URL ?level= 우선, 없으면 프로필 levelId
        setUserLevel(overrideLevel || me?.levelId || "");
        setChapters(chaps || []);
      })
      .catch((e) => {
        if (isPaymentRequired(e)) {
          setNeedSubscription(true);
        } else {
          console.error(e);
        }
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, overrideLevel]);


  if (!isLoggedIn) {
    return (
      <div className="pro">
        <div className="pro-center">
          <p>로그인이 필요합니다.</p>
          <Link to="/login">로그인</Link>
        </div>
      </div>
    );
  }

  const getRowClass = (ch, idx) => {
    if (ch.isTestPassed) return "passed";
    if (ch.isAccessible) return "current";
    return "locked";
  };

  const getBadge = (ch) => {
    if (ch.isTestPassed) return <span className="pro-badge passed">통과</span>;
    if (ch.isAccessible) return <span className="pro-badge current">진행중</span>;
    return (
      <span className="pro-badge locked">
        <span className="material-symbols-outlined pro-badge-lock-icon">lock</span>
        잠김
      </span>
    );
  };

  const handleRowClick = (ch) => {
    if (!ch.isAccessible) {
      alert("이전 챕터를 먼저 통과해야 잠금이 해제됩니다.");
      return;
    }
    navigate(`/pro-mode/chapter/${ch.chapterId}`, { state: { videoUrl: ch.videoUrl, title: ch.title } });
  };

  return (
    <div className="pro">
      <div className="pro-topbar">
        <div className="pro-topbar-inner">
          <Link to="/start" className="pro-back">
            <span className="material-symbols-outlined">arrow_back</span>
            홈
          </Link>
          <h1 className="pro-topbar-title">프로 모드</h1>
        </div>
      </div>

      <div className="pro-body">
        <div className="pro-hero">
          <h2>프로 모드 학습</h2>
          <p>챕터를 순서대로 학습하고 테스트를 통과하세요.</p>
        </div>

        {loading ? (
          <div className="pro-loading">불러오는 중...</div>
        ) : needSubscription ? (
          <div className="pro-center">
            <p>프로 모드는 구독 회원 전용 기능입니다.</p>
            <Link to="/subscription" style={{ color: "#f06c24", fontWeight: 700, marginTop: 8, display: "inline-block" }}>
              구독하러 가기
            </Link>
          </div>
        ) : chapters.length === 0 ? (
          <div className="pro-center">
            <p>등록된 챕터가 없습니다.</p>
          </div>
        ) : (
          <table className="pro-table">
            <thead>
              <tr>
                <th className="pro-th-num">번호</th>
                <th>챕터</th>
                <th className="pro-th-progress">진행률</th>
                <th className="pro-th-status">상태</th>
                <th className="pro-th-video">영상</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch, idx) => (
                <tr
                  key={ch.chapterId}
                  className={`pro-row ${getRowClass(ch, idx)}`}
                  onClick={() => handleRowClick(ch)}
                >
                  <td>{ch.globalChapterNumber}</td>
                  <td>
                    <strong>{ch.title}</strong>
                    {ch.description && (
                      <span className="pro-chapter-desc">
                        {ch.description}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="pro-progress-bar">
                      <div
                        className="pro-progress-fill"
                        style={{ width: `${ch.progressPercent}%` }}
                      />
                    </div>
                    <span className="pro-progress-label">{ch.progressPercent}%</span>
                  </td>
                  <td>{getBadge(ch)}</td>
                  <td className="pro-td-video">
                    <button
                      className="video-play-btn"
                      title={ch.videoUrl ? "영상 보기" : "영상 없음"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ch.videoUrl) setVideoUrl(ch.videoUrl);
                      }}
                      disabled={!ch.videoUrl}
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {videoUrl && (
        <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />
      )}
    </div>
  );
}

export default ProModePage;
