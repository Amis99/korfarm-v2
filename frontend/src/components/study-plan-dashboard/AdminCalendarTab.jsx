import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../utils/api";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startDow = first.getDay();
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    days.push({ date: d, otherMonth: true });
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: new Date(year, month, i), otherMonth: false });
  }
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - last.getDate() - startDow + 1);
    days.push({ date: d, otherMonth: true });
  }
  return days;
}

const TYPE_LABEL = {
  schedule: "일정",
  korfarm: "국어농장",
  activity: "학습활동",
  test: "테스트",
  writing: "글쓰기",
};

/**
 * 어드민 통합 캘린더 — 자기 권한 범위(HQ=전체/ORG=자기 기관) 모든 학생 plan 의 schedules + due_at 자산 모음.
 * Props:
 *   classId     수강반 필터 (optional)
 */
export default function AdminCalendarTab({ classId }) {
  const navigate = useNavigate();
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);

  // 두 번째 모달 상태
  const [dayModal, setDayModal] = useState(null); // { date, items: [...] }
  const [actionModal, setActionModal] = useState(null); // { item, students }
  const [actionLoading, setActionLoading] = useState(false);

  const monthDays = getMonthDays(viewYear, viewMonth);

  const load = () => {
    setLoading(true);
    const from = fmt(new Date(viewYear, viewMonth, 1));
    const to = fmt(new Date(viewYear, viewMonth + 1, 0));
    const params = new URLSearchParams({ from, to });
    if (classId) params.set("classId", classId);
    apiGet(`/v1/admin/study-plans/calendar?${params.toString()}`)
      .then((data) => setDays(Array.isArray(data?.days) ? data.days : (Array.isArray(data) ? data : [])))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [viewYear, viewMonth, classId]); // eslint-disable-line

  const dayMap = useMemo(() => {
    const m = {};
    (days || []).forEach((d) => {
      m[d.date] = d;
    });
    return m;
  }, [days]);

  const prev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else { setViewMonth(viewMonth - 1); }
  };
  const next = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else { setViewMonth(viewMonth + 1); }
  };

  const handleDateClick = (dateStr) => {
    const day = dayMap[dateStr];
    if (!day || !day.items || day.items.length === 0) return;
    setDayModal({ date: dateStr, items: day.items });
  };

  const handleActionClick = async (item) => {
    setActionLoading(true);
    try {
      // drilldown — 액션의 학생 명단
      const data = await apiGet(`/v1/admin/study-plans/calendar/${dayModal.date}`);
      const actions = Array.isArray(data?.actions) ? data.actions : [];
      const matched = actions.find((a) => (a.assetId || a.refId) === (item.assetId || item.refId));
      setActionModal({ item, students: matched?.students || matched?.students_list || [] });
    } catch (e) {
      setActionModal({ item, students: [] });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStudentClick = (item, st) => {
    const userId = st.userId || st.user_id || st.id;
    if (!userId) return;
    const type = item.assetType || item.type;
    if (type === "korfarm") {
      navigate(`/admin/students/${userId}?tab=learning&contentId=${item.refId || ""}`);
    } else if (type === "writing") {
      const postId = st.wisdomPostId || st.wisdom_post_id;
      if (postId) {
        navigate(`/admin/wisdom/posts/${postId}`);
      } else {
        navigate(`/admin/students/${userId}?tab=writing`);
      }
    } else if (type === "test") {
      const testId = item.testId || item.refId;
      if (testId) {
        navigate(`/admin/tests/${testId}/statistics?studentId=${userId}`);
      } else {
        navigate(`/admin/students/${userId}?tab=tests`);
      }
    } else {
      navigate(`/admin/students/${userId}`);
    }
  };

  return (
    <div className="admin-detail-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button className="admin-detail-btn ghost" onClick={prev}>&lt; 이전</button>
        <h2 style={{ margin: 0, color: "var(--admin-ink)" }}>
          {viewYear}년 {viewMonth + 1}월
        </h2>
        <button className="admin-detail-btn ghost" onClick={next}>다음 &gt;</button>
      </div>

      {loading && <div style={{ padding: 12, color: "var(--admin-muted)" }}>불러오는 중...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {DAY_NAMES.map((n) => (
          <div key={n} style={{
            textAlign: "center",
            padding: "6px 0",
            fontWeight: 700,
            color: "var(--admin-muted)",
            fontSize: 12,
          }}>{n}</div>
        ))}
        {monthDays.map((d, i) => {
          const ds = fmt(d.date);
          const dayInfo = dayMap[ds];
          const items = dayInfo?.items || [];
          const count = items.length;
          const total = items.reduce((s, it) => s + (it.totalAssigned || 0), 0);
          const done = items.reduce((s, it) => s + (it.completed || 0), 0);
          const pct = total > 0 ? Math.round((done * 100) / total) : 0;
          const fillColor = pct >= 100 ? "#2e7d32" : pct >= 50 ? "#f57c00" : "#9e9e9e";
          const isToday = ds === fmt(today);
          return (
            <div
              key={i}
              onClick={() => handleDateClick(ds)}
              style={{
                minHeight: 80,
                padding: 6,
                background: d.otherMonth ? "transparent" : "var(--admin-panel, #fff)",
                border: "1px solid var(--admin-stroke, rgba(31,58,44,0.12))",
                borderRadius: 6,
                cursor: count > 0 ? "pointer" : "default",
                opacity: d.otherMonth ? 0.4 : 1,
                position: "relative",
                outline: isToday ? "2px solid var(--admin-accent, #2d6a4f)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: "var(--admin-ink)" }}>
                {d.date.getDate()}
              </div>
              {count > 0 && (
                <div style={{ marginTop: "auto" }}>
                  {/* 배터리형 진행률 게이지 */}
                  <div style={{
                    height: 10,
                    background: "rgba(0,0,0,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.12)",
                    position: "relative",
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: fillColor,
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: "var(--admin-muted)",
                    marginTop: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span>{count}건</span>
                    <span>{done}/{total}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 모달 1 — 그 날 마감 액션 리스트 */}
      {dayModal && (
        <div className="admin-modal-overlay" onClick={() => setDayModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{dayModal.date} — 마감 액션</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", maxHeight: 360, overflowY: "auto" }}>
              {dayModal.items.map((it, idx) => {
                const t = it.assetType || it.type;
                return (
                  <li
                    key={idx}
                    onClick={() => handleActionClick(it)}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--admin-stroke, rgba(31,58,44,0.12))",
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                      background: "var(--admin-panel, #fff)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: "var(--admin-accent-soft)",
                        color: "var(--admin-accent-strong)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {TYPE_LABEL[t] || t}
                      </span>
                      <span style={{ color: "var(--admin-ink)", fontWeight: 600 }}>{it.label || it.title || "(제목 없음)"}</span>
                      {it.totalAssigned != null && (
                        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>
                          대상 {it.totalAssigned}명 · 미수행 {it.pending ?? "-"}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn secondary" onClick={() => setDayModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 2 — 액션 학생 명단 */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{actionModal.item.label || actionModal.item.title || "액션"} — 대상 학생</h2>
            {actionLoading ? (
              <p style={{ color: "var(--admin-muted)" }}>불러오는 중...</p>
            ) : actionModal.students.length === 0 ? (
              <p style={{ color: "var(--admin-muted)" }}>학생 정보가 없습니다.</p>
            ) : (
              <table className="admin-detail-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>학생</th>
                    <th>수강반</th>
                    <th>상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {actionModal.students.map((st, idx) => {
                    const userId = st.userId || st.user_id || st.id;
                    const status = st.status || (st.completed ? "완료" : "미수행");
                    return (
                      <tr key={userId || idx} className="clickable-row"
                        onClick={() => handleStudentClick(actionModal.item, st)}>
                        <td>{st.userName || st.user_name || st.name || userId}</td>
                        <td>{st.className || st.class_name || "-"}</td>
                        <td>
                          <span className="status-pill" data-status={status === "completed" || status === "passed" ? "completed" : "pending"}>
                            {status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", color: "var(--admin-accent)" }}>›</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="admin-modal-actions">
              <button className="admin-detail-btn secondary" onClick={() => setActionModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
