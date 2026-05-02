import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import TestPdfPreviewModal from "../components/admin/TestPdfPreviewModal";
import "../styles/test-storage.css";

// 백엔드 응답이 SNAKE_CASE이거나 camelCase일 수 있어 양쪽 모두 지원
function normalizeTest(t) {
  if (!t) return null;
  return {
    testId: t.testId ?? t.test_id ?? null,
    title: t.title ?? "",
    description: t.description ?? "",
    levelId: t.levelId ?? t.level_id ?? "",
    totalQuestions: t.totalQuestions ?? t.total_questions ?? 0,
    totalPoints: t.totalPoints ?? t.total_points ?? 0,
    timeLimitMinutes: t.timeLimitMinutes ?? t.time_limit_minutes ?? null,
    examDate: t.examDate ?? t.exam_date ?? "",
    series: t.series ?? "",
    orgId: t.orgId ?? t.org_id ?? null,
    orgName: t.orgName ?? t.org_name ?? "",
    submissionCount: t.submissionCount ?? t.submission_count ?? 0,
    createdAt: t.createdAt ?? t.created_at ?? null,
    // 종류: diagnostic / chapter / misc — 백엔드에서 제공. 누락 시 ID/series 로 추론.
    kind: t.kind || (
      String(t.testId ?? t.test_id ?? "").startsWith("diag_paper_") ? "diagnostic"
      : (t.series === "chapter" ? "chapter" : "misc")
    ),
  };
}

const KIND_LABEL = {
  all: "전체",
  diagnostic: "진단",
  chapter: "챕터",
  misc: "기타",
};

function AdminTestPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // 필터·검색
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all / diagnostic / chapter / misc
  const [filterScope, setFilterScope] = useState("all"); // all / hq / org
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSeries, setFilterSeries] = useState("all");

  const load = () => {
    setLoading(true);
    apiGet("/v1/admin/test-papers")
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setTests(arr.map(normalizeTest));
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // 시험 추가 버튼 — 즉시 생성 후 비주얼 에디터로 이동
  // 권한: 본사 관리자(HQ_ADMIN)는 본사 시험으로(orgId=null), 기관 관리자(ORG_ADMIN)는 자기 기관 시험으로(백엔드 자동 처리)
  const handleAddTest = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const body = {
        title: "새 시험",
        description: null,
        levelId: null,
        totalQuestions: 0,
        totalPoints: 0,
        timeLimitMinutes: null,
        examDate: null,
        series: null, // 기타
      };
      const res = await apiPost("/v1/admin/test-papers", body);
      const newId = res?.testId ?? res?.test_id;
      if (newId) navigate(`/admin/tests/${newId}/edit`);
      else load();
    } catch (e) {
      alert("생성 실패: " + (e.message || ""));
    } finally {
      setCreating(false);
    }
  };

  // PDF 자동 생성 + 미리보기
  const [pdfPreview, setPdfPreview] = useState({ open: false, fileId: null, title: "" });
  const [generatingId, setGeneratingId] = useState(null);

  const handleGeneratePdf = async (t) => {
    if (!t?.testId || generatingId) return;
    setGeneratingId(t.testId);
    try {
      const res = await apiPost(`/v1/admin/test-papers/${t.testId}/pdf-generate`);
      setPdfPreview({ open: true, fileId: res.fileId, title: res.title });
      load();
    } catch (e) {
      alert("PDF 생성 실패:\n" + (e?.message || "알 수 없는 오류"));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (t) => {
    if (!t?.testId) return;
    const kindLabel = KIND_LABEL[t.kind] || "기타";
    let warn = `"${t.title || t.testId}" 시험을 삭제할까요?\n\n`;
    if (t.kind === "diagnostic") {
      warn += "⚠ 진단 시험입니다. 삭제하면 진단 시스템에 영향이 있을 수 있습니다.\n\n";
    } else if (t.kind === "chapter") {
      warn += "⚠ 챕터 테스트입니다. 삭제하면 학습 챕터의 테스트 연결이 끊어집니다.\n\n";
    }
    warn += "시험지 + 모든 문항 + 응시 기록이 함께 삭제됩니다. 되돌릴 수 없습니다.";
    if (!window.confirm(warn)) return;
    try {
      await apiDelete(`/v1/admin/test-papers/${t.testId}`);
      load();
    } catch (e) {
      alert("삭제 실패: " + (e.message || ""));
    }
  };

  // 레벨·시리즈 옵션 추출
  const levelOptions = useMemo(() => {
    const set = new Set();
    tests.forEach((t) => t.levelId && set.add(t.levelId));
    return Array.from(set).sort();
  }, [tests]);
  const seriesOptions = useMemo(() => {
    const set = new Set();
    tests.forEach((t) => t.series && set.add(t.series));
    return Array.from(set).sort();
  }, [tests]);

  // 탭별 카운트 (종류 필터 적용 전 전체 기준)
  const kindCounts = useMemo(() => {
    const counts = { all: tests.length, diagnostic: 0, chapter: 0, misc: 0 };
    tests.forEach((t) => {
      if (counts[t.kind] !== undefined) counts[t.kind]++;
    });
    return counts;
  }, [tests]);

  // 필터 적용 (탭 + 추가 필터)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      if (activeTab !== "all" && t.kind !== activeTab) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (filterScope === "hq" && t.orgId) return false;
      if (filterScope === "org" && !t.orgId) return false;
      if (filterLevel !== "all" && t.levelId !== filterLevel) return false;
      if (filterSeries !== "all" && t.series !== filterSeries) return false;
      return true;
    });
  }, [tests, activeTab, search, filterScope, filterLevel, filterSeries]);

  const { page, setPage, totalPages, paged } = usePagination(filtered, 15);
  useEffect(() => { setPage(1); }, [activeTab, search, filterScope, filterLevel, filterSeries, setPage]);

  return (
    <AdminLayout>
    <div className="ts-page ts-admin">
      <header className="ts-header">
        <h1>테스트 관리</h1>
        <button
          className="ts-btn ts-btn-primary"
          onClick={handleAddTest}
          disabled={creating}
          title="기타 테스트 신규 생성 — 비주얼 에디터로 이동"
        >
          <span className="material-symbols-outlined">add</span> {creating ? "생성 중..." : "시험 추가"}
        </button>
      </header>

      {/* 종류 탭 */}
      <div className="ts-kind-tabs" style={{
        display: "flex", gap: 4, marginBottom: 10,
        borderBottom: "2px solid var(--stroke)",
      }}>
        {["all", "diagnostic", "chapter", "misc"].map((k) => {
          const isActive = activeTab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setActiveTab(k)}
              style={{
                padding: "8px 18px",
                fontSize: 14,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "var(--accent)" : "var(--muted)",
                background: "transparent",
                border: 0,
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
              }}
            >
              {KIND_LABEL[k]} <span style={{ fontSize: 12, opacity: 0.7 }}>({kindCounts[k] || 0})</span>
            </button>
          );
        })}
      </div>

      {/* 필터/검색 바 */}
      <div className="ts-filter-bar" style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12,
        padding: "10px 12px", background: "var(--panel)",
        border: "1px solid var(--stroke)", borderRadius: 8,
      }}>
        <input
          type="text"
          placeholder="제목 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px", minWidth: 160, padding: "6px 10px",
            background: "var(--bg)", color: "var(--text)",
            border: "1px solid var(--stroke)", borderRadius: 6,
          }}
        />
        <select
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 구분</option>
          <option value="hq">본사 시험</option>
          <option value="org">기관 시험</option>
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 레벨</option>
          {levelOptions.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
        </select>
        <select
          value={filterSeries}
          onChange={(e) => setFilterSeries(e.target.value)}
          style={{ padding: "6px 10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--stroke)", borderRadius: 6 }}
        >
          <option value="all">전체 시리즈</option>
          {seriesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: 13 }}>
          {filtered.length} / {tests.length}
        </span>
      </div>

      {loading ? (
        <div className="ts-center"><p>불러오는 중...</p></div>
      ) : filtered.length === 0 ? (
        <div className="ts-center"><p>{tests.length === 0 ? "등록된 시험이 없습니다." : "조건에 맞는 시험이 없습니다."}</p></div>
      ) : (
        <div className="ts-table-scroll">
        <table className="ts-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>종류</th>
              <th>구분</th>
              <th>레벨</th>
              <th>시행일</th>
              <th>문항 수</th>
              <th>배점</th>
              <th>응시자</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(t => {
              const kindBg = t.kind === "diagnostic" ? "rgba(168, 85, 247, 0.15)"
                : t.kind === "chapter" ? "rgba(34, 197, 94, 0.15)"
                : "rgba(148, 163, 184, 0.15)";
              const kindFg = t.kind === "diagnostic" ? "#c084fc"
                : t.kind === "chapter" ? "#4ade80"
                : "#cbd5e1";
              const kindBd = t.kind === "diagnostic" ? "rgba(168, 85, 247, 0.3)"
                : t.kind === "chapter" ? "rgba(34, 197, 94, 0.3)"
                : "rgba(148, 163, 184, 0.3)";
              return (
              <tr key={t.testId}>
                <td>
                  <span
                    onClick={() => t.testId && navigate(`/admin/tests/${t.testId}/edit`)}
                    title="클릭: 시험지 비주얼 편집기 열기"
                    style={{
                      cursor: t.testId ? "pointer" : "default",
                      color: "var(--accent)", fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    {t.title || "(제목 없음)"}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: kindBg, color: kindFg,
                    border: `1px solid ${kindBd}`,
                  }}>
                    {KIND_LABEL[t.kind] || "기타"}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: t.orgId ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                    color: t.orgId ? "#fbbf24" : "#60a5fa",
                    border: `1px solid ${t.orgId ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                  }}>
                    {t.orgId ? (t.orgName || "기관") : "본사"}
                  </span>
                </td>
                <td>{t.levelId || "-"}</td>
                <td>{t.examDate || "-"}</td>
                <td>{t.totalQuestions}</td>
                <td>{t.totalPoints}</td>
                <td>
                  <span
                    onClick={() => t.testId && navigate(`/admin/tests/${t.testId}/statistics`)}
                    title="클릭: 응시자 통계 보기"
                    style={{
                      cursor: t.testId ? "pointer" : "default",
                      color: "var(--accent)", fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    {t.submissionCount}명
                  </span>
                </td>
                <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleGeneratePdf(t)}
                    disabled={generatingId === t.testId}
                    title="시험지 + 정답·해설 PDF 자동 생성"
                    style={{
                      padding: "4px 10px", fontSize: 11,
                      background: "rgba(45, 106, 79, 0.15)", color: "#86efac",
                      border: "1px solid rgba(45, 106, 79, 0.35)", borderRadius: 4,
                      cursor: generatingId === t.testId ? "wait" : "pointer",
                      opacity: generatingId === t.testId ? 0.6 : 1,
                    }}
                  >{generatingId === t.testId ? "생성 중..." : "📄 PDF 생성"}</button>
                  <button
                    onClick={() => handleDelete(t)}
                    title="삭제"
                    style={{
                      padding: "4px 10px", fontSize: 11,
                      background: "rgba(239,68,68,0.12)", color: "#fca5a5",
                      border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >🗑 삭제</button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
    <TestPdfPreviewModal
      open={pdfPreview.open}
      fileId={pdfPreview.fileId}
      title={pdfPreview.title}
      onClose={() => setPdfPreview({ open: false, fileId: null, title: "" })}
    />
    </AdminLayout>
  );
}

export default AdminTestPage;
