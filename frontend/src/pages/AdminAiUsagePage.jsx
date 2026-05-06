import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useRequireRole } from "../hooks/useRequireRole";
import { apiGet } from "../utils/adminApi";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const KIND_LABELS = {
  // 콘텐츠 생성
  passage: "지문 생성",
  question: "문항 생성",
  review: "학생 페르소나 검증",
  "study-question": "학습 문항 (단일)",
  "study-questions": "학습 문항 (일괄)",
  "study-checkpoints": "학습 체크포인트",
  "file-to-markdown": "파일 → 마크다운",
  // 글쓰기·OCR
  "wisdom-feedback": "글쓰기 AI 첨삭",
  "wisdom-ocr": "글쓰기 OCR",
  // 커뮤니티 AI
  "podo-chat": "포도 AI 채팅",
  "podo-board": "포도 AI 게시판 댓글",
  // 프로 채점
  "pro-grading": "프로모드 AI 채점",
  // 운영자 AI 비서 (2026-05)
  "agent-call-free": "AI 비서 (무료 한도)",
  "agent-call-extra": "AI 비서 (자몽 차감)",
  // 학생 AI 튜터 (2026-05)
  "tutor-call": "AI 튜터 1회 대화",
};

// 백엔드 응답이 SNAKE_CASE로 올 수 있어 양쪽 지원
function normItem(it) {
  if (!it) return null;
  return {
    id: it.id,
    createdAt: it.createdAt ?? it.created_at,
    userId: it.userId ?? it.user_id,
    userName: it.userName ?? it.user_name,
    orgId: it.orgId ?? it.org_id,
    orgName: it.orgName ?? it.org_name,
    kind: it.kind,
    model: it.model,
    inputTokens: it.inputTokens ?? it.input_tokens ?? 0,
    outputTokens: it.outputTokens ?? it.output_tokens ?? 0,
    durationMs: it.durationMs ?? it.duration_ms,
    passed: it.passed,
    retryCount: it.retryCount ?? it.retry_count ?? 0,
    status: it.status,
    estimatedUsd: it.estimatedUsd ?? it.estimated_usd ?? 0,
    estimatedKrw: it.estimatedKrw ?? it.estimated_krw ?? 0,
    testId: it.testId ?? it.test_id,
  };
}
function normResponse(d) {
  if (!d) return null;
  return {
    items: (d.items ?? []).map(normItem),
    totalCalls: d.totalCalls ?? d.total_calls ?? 0,
    totalUsd: d.totalUsd ?? d.total_usd ?? 0,
    totalKrw: d.totalKrw ?? d.total_krw ?? 0,
    userOptions: (d.userOptions ?? d.user_options ?? []).map((u) => ({
      userId: u.userId ?? u.user_id,
      userName: u.userName ?? u.user_name,
    })),
    orgOptions: (d.orgOptions ?? d.org_options ?? []).map((o) => ({
      orgId: o.orgId ?? o.org_id,
      orgName: o.orgName ?? o.org_name,
    })),
  };
}

export default function AdminAiUsagePage() {
  useRequireRole("HQ_ADMIN");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 필터
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterOrg, setFilterOrg] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(200);

  const load = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filterUser) params.set("userId", filterUser);
    if (filterOrg) params.set("orgId", filterOrg);
    if (filterKind) params.set("kind", filterKind);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", String(limit));
    apiGet(`/v1/admin/ai-usage?${params.toString()}`)
      .then((d) => setData(normResponse(d)))
      .catch((e) => setError(e.message || "로드 실패"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterUser, filterOrg, filterKind, from, to, limit]);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter((it) =>
      (it.userName || "").toLowerCase().includes(q) ||
      (it.orgName || "").toLowerCase().includes(q) ||
      (it.testId || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const { page, setPage, totalPages, paged } = usePagination(filtered, 15);

  // 필터/검색 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [search, filterUser, filterOrg, filterKind, from, to, limit, setPage]);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div>
            <h1>AI 사용 내역</h1>
            <p className="admin-detail-subtitle">
              본사 관리자(HQ_ADMIN) 전용. Claude API 호출 로그(<code>ai_gen_logs</code>)에서 집계.
              비용은 추정치(Sonnet 4.6: $3/$15 per 1M, Opus 4.7: $15/$75 per 1M, 환율 1500원).
            </p>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="admin-detail-card" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14 }}>
          <input
            placeholder="이름·기관·시험ID 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inpStyle, flex: "1 1 200px" }}
          />
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={inpStyle}>
            <option value="">전체 사용자</option>
            {(data?.userOptions || []).map((u) => (
              <option key={u.userId} value={u.userId}>{u.userName} ({u.userId.slice(0, 12)}…)</option>
            ))}
          </select>
          <select value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} style={inpStyle}>
            <option value="">전체 기관</option>
            {(data?.orgOptions || []).map((o) => (
              <option key={o.orgId} value={o.orgId}>{o.orgName || o.orgId}</option>
            ))}
          </select>
          <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} style={inpStyle}>
            <option value="">전체 내역</option>
            <optgroup label="시험 출제 (AI)">
              <option value="passage">지문 생성</option>
              <option value="question">문항 생성</option>
              <option value="review">학생 페르소나 검증</option>
              <option value="file-to-markdown">파일 → 마크다운</option>
            </optgroup>
            <optgroup label="학습 모듈">
              <option value="study-question">학습 문항 (단일)</option>
              <option value="study-questions">학습 문항 (일괄)</option>
              <option value="study-checkpoints">학습 체크포인트</option>
            </optgroup>
            <optgroup label="글쓰기">
              <option value="wisdom-feedback">글쓰기 AI 첨삭</option>
              <option value="wisdom-ocr">글쓰기 OCR</option>
            </optgroup>
            <optgroup label="포도 AI">
              <option value="podo-chat">포도 AI 채팅</option>
              <option value="podo-board">포도 AI 게시판 댓글</option>
            </optgroup>
            <optgroup label="프로모드">
              <option value="pro-grading">프로모드 AI 채점</option>
            </optgroup>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--admin-muted)" }}>
            기간
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inpStyle} />
            ~
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inpStyle} />
          </label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={inpStyle}>
            <option value={100}>최근 100건</option>
            <option value={200}>최근 200건</option>
            <option value={500}>최근 500건</option>
            <option value={1000}>최근 1000건</option>
          </select>
        </div>

        {/* 합계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <SummaryCard label="총 호출" value={`${data?.totalCalls ?? 0}건`} />
          <SummaryCard label="필터 적용 후" value={`${filtered.length}건`} />
          <SummaryCard label="추정 비용 (USD)" value={`$${(data?.totalUsd ?? 0).toFixed(4)}`} />
          <SummaryCard label="추정 비용 (KRW)" value={`₩${(data?.totalKrw ?? 0).toLocaleString()}`} />
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* 표 */}
        {loading ? (
          <div className="admin-detail-card" style={{ textAlign: "center", color: "var(--admin-muted)" }}>불러오는 중...</div>
        ) : (
          <div className="admin-detail-card" style={{ padding: 8, overflowX: "auto" }}>
            <table className="admin-detail-table" style={{ width: "100%", minWidth: 1100 }}>
              <thead>
                <tr style={{ background: "var(--bg)", textAlign: "left" }}>
                  <th style={th}>일시</th>
                  <th style={th}>사용자</th>
                  <th style={th}>기관</th>
                  <th style={th}>내역</th>
                  <th style={th}>모델</th>
                  <th style={th}>입력 토큰</th>
                  <th style={th}>출력 토큰</th>
                  <th style={th}>처리 시간</th>
                  <th style={th}>상태</th>
                  <th style={th}>$</th>
                  <th style={th}>₩</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((it) => (
                  <tr key={it.id} style={{ borderTop: "1px solid var(--stroke)" }}>
                    <td style={td}>{it.createdAt ? new Date(it.createdAt).toLocaleString("ko-KR") : "-"}</td>
                    <td style={td}>{it.userName}</td>
                    <td style={td}>{it.orgName || "-"}</td>
                    <td style={td}>{KIND_LABELS[it.kind] || it.kind}</td>
                    <td style={{ ...td, color: "var(--muted)" }}>{it.model}</td>
                    <td style={td}>{it.inputTokens?.toLocaleString() || 0}</td>
                    <td style={td}>{it.outputTokens?.toLocaleString() || 0}</td>
                    <td style={td}>{it.durationMs != null ? `${(it.durationMs / 1000).toFixed(1)}s` : "-"}</td>
                    <td style={{
                      ...td,
                      color: it.status === "success" ? "#86efac" : "#fca5a5",
                    }}>
                      {it.status}
                      {it.kind === "question" && it.passed != null && (
                        <span style={{ marginLeft: 4, color: it.passed ? "#86efac" : "#fbbf24" }}>
                          {it.passed ? "✓" : `재시도×${it.retryCount}`}
                        </span>
                      )}
                    </td>
                    <td style={td}>{Number(it.estimatedUsd || 0).toFixed(4)}</td>
                    <td style={td}>₩{Number(it.estimatedKrw || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>호출 내역 없음</td></tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="admin-detail-card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--admin-ink)" }}>{value}</div>
    </div>
  );
}

const inpStyle = {
  padding: "7px 10px", fontSize: 13,
  background: "var(--admin-panel, #ffffff)", color: "var(--admin-ink, #1a2920)",
  border: "1px solid var(--admin-stroke, rgba(31,58,44,0.18))", borderRadius: 8,
  fontFamily: "inherit",
};
const th = { padding: "8px 8px", fontSize: 12, fontWeight: 700, color: "var(--admin-accent-strong, #1f4a37)" };
const td = { padding: "6px 8px", fontSize: 12, color: "var(--admin-ink, #1a2920)" };
