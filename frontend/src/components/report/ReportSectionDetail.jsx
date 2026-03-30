import { Link } from "react-router-dom";
import ReportStudyPlanMatrix from "./ReportStudyPlanMatrix";

/**
 * 활동별 상세 섹션 — 접기/펼치기 없이 모든 섹션 항상 표시
 */

const SECTIONS = [
  {
    key: "examOmr",
    label: "테스트",
    dotClass: "ur-dot-exam",
    renderItems: (items) => (
      <div>
        {items.map((it, i) => (
          <div key={i} className="ur-test-card">
            <div className="ur-test-card-header">
              <span className="ur-test-card-title">{it.testTitle || "-"}</span>
              <span className="ur-test-card-date">{fmtDate(it.submittedAt)}</span>
            </div>
            <div className="ur-test-card-stats">
              <div className="ur-test-card-stat ur-test-card-stat--primary">
                <div className="ur-test-card-stat-value">
                  {it.score ?? "-"}<small> / {it.totalPoints ?? 100}</small>
                </div>
                <div className="ur-test-card-stat-sub">총점</div>
              </div>
              <div className="ur-test-card-stat">
                <div className="ur-test-card-stat-value">
                  {it.accuracy != null ? `${it.accuracy}%` : "-"}
                </div>
                <div className="ur-test-card-stat-sub">정답률</div>
              </div>
              <div className="ur-test-card-stat">
                <div className="ur-test-card-stat-value">
                  {it.correctCount ?? "-"}<small> / {it.totalQuestions ?? "?"}</small>
                </div>
                <div className="ur-test-card-stat-sub">정답 수</div>
              </div>
            </div>
            {it.testId && (
              <Link to={`/test-report/${it.testId}`} className="ur-test-card-link">
                상세 성적표 보기 →
              </Link>
            )}
          </div>
        ))}
      </div>
    ),
    getSummary: (s) => `${s.count}회`,
  },
  {
    key: "farmMode",
    label: "농장 모드",
    dotClass: "ur-dot-farm",
    renderItems: (items, sectionData) => (
      <>
        {sectionData?.modeSummary && sectionData.modeSummary.length > 0 && (
          <div className="ur-mode-summary">
            {sectionData.modeSummary.map((ms, i) => (
              <span key={i} className="ur-mode-chip">
                {ms.modeLabel} {ms.count}회
              </span>
            ))}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>유형</th>
              <th>정답률</th>
              <th>완료</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.contentTitle || "-"}</td>
                <td style={{ fontSize: 12 }}>{it.contentTypeLabel || "-"}</td>
                <td style={{ fontWeight: 700 }}>
                  {it.accuracy != null ? `${it.accuracy}%` : "-"}
                </td>
                <td style={{ fontSize: 12 }}>{it.completedAt ? "완료" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
    getSummary: (s) =>
      `${s.count}회, 평균 ${s.averageAccuracy?.toFixed(1) ?? "-"}%`,
  },
  {
    key: "dailyQuiz",
    label: "일일 퀴즈",
    dotClass: "ur-dot-quiz",
    renderItems: (items) => (
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>정답률</th>
            <th>제출일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>
                {it.score != null ? `${it.score}%` : "-"}
              </td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회`,
  },
  {
    key: "dailyReading",
    label: "일일 독해",
    dotClass: "ur-dot-reading",
    renderItems: (items) => (
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>정답률</th>
            <th>제출일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>
                {it.score != null ? `${it.score}%` : "-"}
              </td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회`,
  },
  {
    key: "proMode",
    label: "프로 모드",
    dotClass: "ur-dot-pro",
    renderItems: (items, sectionData) => {
      // 챕터 리스트가 있으면 챕터 뷰 렌더링
      if (sectionData?.chapters && sectionData.chapters.length > 0) {
        return <ProChapterList chapters={sectionData.chapters} />;
      }
      // 폴백: 기존 아이템 테이블
      return (
        <table>
          <thead>
            <tr>
              <th>챕터</th>
              <th>종류</th>
              <th>제목</th>
              <th>정답률</th>
              <th>통과</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ fontSize: 12 }}>{it.chapterId || "-"}</td>
                <td style={{ fontSize: 12 }}>{it.learningType || "-"}</td>
                <td>{it.contentTitle || "-"}</td>
                <td style={{ fontWeight: 700 }}>
                  {it.accuracy != null ? `${it.accuracy}%` : "-"}
                </td>
                <td>{passLabel(it.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    },
    getSummary: (s) =>
      `학습 ${s.completedItems ?? 0}건, 테스트 ${s.testCount ?? 0}회`,
  },
  {
    key: "studyPlan",
    label: "학습 계획표",
    dotClass: "ur-dot-studyplan",
    renderItems: (items, sectionData) => {
      // planIds가 있으면 매트릭스 뷰
      if (sectionData?.planIds && sectionData.planIds.length > 0) {
        return <ReportStudyPlanMatrix planIds={sectionData.planIds} />;
      }
      // 폴백: 기존 테이블
      return (
        <table>
          <thead>
            <tr>
              <th>계획표</th>
              <th>범위</th>
              <th>상태</th>
              <th>검토일</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.planTitle || "-"}</td>
                <td>{it.scopeLabel || "-"}</td>
                <td>{statusLabel(it.status)}</td>
                <td style={{ fontSize: 12 }}>{fmtDate(it.reviewedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    },
    getSummary: (s) => `${s.completedCells ?? 0}/${s.totalCells ?? 0}건 완료`,
  },
];

/** 프로 모드 챕터 리스트 */
function ProChapterList({ chapters }) {
  return (
    <table>
      <thead>
        <tr>
          <th>번호</th>
          <th>챕터</th>
          <th>진행률</th>
          <th>상태</th>
          <th>정답률</th>
        </tr>
      </thead>
      <tbody>
        {chapters.map((ch) => (
          <tr key={ch.chapterId}>
            <td style={{ textAlign: "center", fontSize: 12 }}>{ch.chapterNumber}</td>
            <td>{ch.title}</td>
            <td style={{ minWidth: 120 }}>
              <div className="ur-pro-progress-bar">
                <div
                  className="ur-pro-progress-fill"
                  style={{ width: `${ch.progressPercent}%` }}
                />
                <span className="ur-pro-progress-label">{ch.progressPercent}%</span>
              </div>
            </td>
            <td style={{ textAlign: "center" }}>
              {ch.isTestPassed ? (
                <span className="ur-pro-badge ur-pro-badge--passed">통과</span>
              ) : ch.status === "in_progress" ? (
                <span className="ur-pro-badge ur-pro-badge--progress">진행중</span>
              ) : (
                <span className="ur-pro-badge ur-pro-badge--default">미시작</span>
              )}
            </td>
            <td style={{ fontWeight: 700, textAlign: "center" }}>
              {ch.testAccuracy != null ? `${ch.testAccuracy}%` : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function fmtDate(iso) {
  if (!iso) return "-";
  return iso.replace("T", " ").slice(0, 16);
}

function statusLabel(st) {
  if (st === "passed") return "합격";
  if (st === "failed") return "불합격";
  if (st === "completed") return "완료";
  if (st === "in_progress") return "진행중";
  return st || "-";
}

function passLabel(st) {
  if (st === "passed") return "통과";
  if (st === "failed") return "미통과";
  if (st === "completed") return "완료";
  if (st === "in_progress") return "진행중";
  return st || "-";
}

export default function ReportSectionDetail({ sections }) {
  if (!sections) return null;

  return (
    <div>
      {SECTIONS.map((sec) => {
        const data = sections[sec.key];
        if (!data) return null;
        const items = data.items || [];
        return (
          <div key={sec.key} className="ur-section">
            <div className="ur-section-header">
              <div className="ur-section-title">
                <span className={`ur-dot ${sec.dotClass}`} />
                {sec.label}
                <span className="ur-section-stats">({sec.getSummary(data)})</span>
              </div>
            </div>
            <div className="ur-section-body">
              {items.length === 0 &&
                !(data.chapters?.length > 0) &&
                !(data.planIds?.length > 0) ? (
                <p style={{ color: "#888", fontSize: 13 }}>데이터가 없습니다.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>{sec.renderItems(items, data)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
