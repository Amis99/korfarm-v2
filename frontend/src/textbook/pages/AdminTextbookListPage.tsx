/**
 * 교재 목록 — 다른 어드민 메뉴(반 관리·콘텐츠 관리)와 동일한 admin-detail-* 패턴.
 * 본사(HQ_ADMIN): 전체 교재. 기관(ORG_ADMIN): 본인 기관 교재만 (본사 교재 미표시).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore — JS 모듈
import AdminLayout from "../../components/AdminLayout";
import { apiGetCamel, apiPost, apiDelete } from "../../utils/adminApi";
import { parseUpload } from "../parser/upload";
import "../../styles/admin-detail.css";

const TOKEN_KEY = "korfarm_token";

async function authFetch(url: string): Promise<Response> {
  const token = sessionStorage.getItem(TOKEN_KEY) ?? "";
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

interface TextbookRow {
  textbookId?: string; textbook_id?: string;
  orgId?: string; org_id?: string;
  title: string;
  series?: string; level?: number; volume?: number;
  status: string; hq: boolean;
  studentPdfFileId?: string; student_pdf_file_id?: string;
  answerPdfFileId?: string;  answer_pdf_file_id?: string;
  createdAt?: string; created_at?: string;
  updatedAt?: string; updated_at?: string;
}
const idOf = (r: any) => r?.textbookId ?? r?.textbook_id ?? r?.id ?? "";
const studentFileIdOf = (r: TextbookRow) => r.studentPdfFileId ?? r.student_pdf_file_id ?? "";
const answerFileIdOf = (r: TextbookRow) => r.answerPdfFileId ?? r.answer_pdf_file_id ?? "";
const updatedAtOf = (r: TextbookRow) => (r.updatedAt ?? r.updated_at ?? "").slice(0, 16);

export default function AdminTextbookListPage() {
  const [rows, setRows] = useState<TextbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pdfGenId, setPdfGenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploadModal, setUploadModal] = useState<{
    file: File | null; title: string; warnings: string[]; uploading: boolean; error: string | null;
  } | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const res: any = await apiGetCamel("/v1/admin/textbooks");
      const list: TextbookRow[] = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data : [];
      setRows(list);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const title = prompt("교재 제목을 입력하세요", "새 교재");
    if (!title) return;
    setCreating(true);
    try {
      const res: any = await apiPost("/v1/admin/textbooks", { title });
      const detail = res?.data ?? res;
      const newId = detail?.textbookId ?? detail?.textbook_id;
      if (newId) navigate(`/admin/textbooks/${newId}/edit`);
      else await load();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    } finally { setCreating(false); }
  };

  const openUploadModal = () => {
    setUploadModal({ file: null, title: "", warnings: [], uploading: false, error: null });
  };

  const handleUploadFile = async (file: File) => {
    setUploadModal((m) => m ? { ...m, file, title: m.title || file.name.replace(/\.json$/i, ""), error: null } : m);
  };

  const doUpload = async () => {
    if (!uploadModal || !uploadModal.file) return;
    const { file, title } = uploadModal;
    setUploadModal((m) => m ? { ...m, uploading: true, error: null } : m);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const finalTitle = (title || file.name).trim() || "(제목 없음)";
      // 1) 빈 교재 생성 — orgId 권한 분기는 백엔드가 처리
      const created: any = await apiPost("/v1/admin/textbooks", { title: finalTitle });
      const detail = created?.data ?? created;
      const newId = detail?.textbookId ?? detail?.textbook_id;
      if (!newId) throw new Error("새 교재 ID 응답 누락");
      // 2) 파서로 Textbook 구성 (누락 0 보장 — UnknownBlock 으로 통째 보존)
      const parsed = parseUpload(json, {
        textbookId: newId,
        orgId: detail?.orgId ?? null,
        fallbackTitle: finalTitle,
      });
      // 3) payload 저장
      const { apiPut } = await import("../../utils/adminApi");
      await apiPut(`/v1/admin/textbooks/${encodeURIComponent(newId)}/payload`, {
        payload: parsed.textbook,
      });
      // 4) 에디터 진입
      if (parsed.warnings.length > 0) {
        alert("업로드 완료 — 안내:\n" + parsed.warnings.join("\n") +
              (parsed.unknownCount > 0 ? `\n\n${parsed.unknownCount}개 블록이 UnknownBlock 으로 보존됩니다.` : ""));
      }
      setUploadModal(null);
      navigate(`/admin/textbooks/${newId}/edit`);
    } catch (e: any) {
      setUploadModal((m) => m ? { ...m, uploading: false, error: e?.message ?? String(e) } : m);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!id) return;
    if (!confirm(`교재 "${title}" 을 삭제하시겠습니까?`)) return;
    try {
      await apiDelete(`/v1/admin/textbooks/${encodeURIComponent(id)}`);
      await load();
    } catch (e: any) { alert(e?.message ?? String(e)); }
  };

  const generatePdf = async (id: string) => {
    if (!id) return;
    setPdfGenId(id);
    try {
      await apiPost(`/v1/admin/textbooks/${encodeURIComponent(id)}/pdf-generate`);
      await load();
      alert("PDF 생성 완료 — 학생용 / 정답·해설 두 파일이 준비됐습니다.");
    } catch (e: any) { alert("PDF 생성 실패: " + (e?.message ?? String(e))); }
    finally { setPdfGenId(null); }
  };

  const downloadFile = async (fileId: string, filename: string) => {
    if (!fileId) return;
    try {
      const res = await authFetch(`/v1/files/${encodeURIComponent(fileId)}/download`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) { alert("다운로드 실패: " + (e?.message ?? String(e))); }
  };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.title?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>교재 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn secondary" onClick={load} disabled={loading} type="button">
              새로고침
            </button>
            <button className="admin-detail-btn secondary" onClick={openUploadModal} type="button">
              JSON 업로드
            </button>
            <button className="admin-detail-btn" onClick={create} disabled={creating} type="button">
              {creating ? "생성 중..." : "+ 새 교재"}
            </button>
          </div>
        </div>

        {err && (
          <div className="admin-detail-card" style={{ marginBottom: 12, color: "#c0392b" }}>
            오류: {err}
          </div>
        )}

        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>교재 리스트</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="교재 제목 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
                {filtered.length} / {rows.length}건
              </div>
            </div>

            {loading ? (
              <p style={{ padding: 20, textAlign: "center", color: "#888" }}>불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding: 20, textAlign: "center", color: "#888" }}>
                {rows.length === 0
                  ? "등록된 교재가 없습니다. 위의 [+ 새 교재] 로 시작하세요."
                  : "조건에 맞는 교재가 없습니다."}
              </p>
            ) : (
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>제목</th>
                    <th>시리즈/레벨/권</th>
                    <th>상태</th>
                    <th>PDF</th>
                    <th>수정일</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const id = idOf(r);
                    const sf = studentFileIdOf(r);
                    const af = answerFileIdOf(r);
                    return (
                      <tr key={id || r.title} className="clickable-row">
                        <td>
                          <span style={{
                            padding: "2px 6px", borderRadius: 3, fontSize: 11,
                            background: r.hq ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)",
                            color: r.hq ? "#1d4ed8" : "#b45309",
                          }}>{r.hq ? "본사" : "기관"}</span>
                        </td>
                        <td>
                          <a onClick={() => id && navigate(`/admin/textbooks/${id}/edit`)}
                             style={{ cursor: "pointer", color: "#1d4ed8" }}>
                            {r.title}
                          </a>
                        </td>
                        <td>{r.series ?? "—"} / L{r.level ?? "—"} / {r.volume ?? "—"}권</td>
                        <td>{r.status}</td>
                        <td>
                          {sf
                            ? <a onClick={() => downloadFile(sf, `${r.title}_학생용.pdf`)}
                                 style={{ cursor: "pointer", color: "#1d4ed8" }}>학생용</a>
                            : <span style={{ color: "#aaa" }}>—</span>}
                          {" / "}
                          {af
                            ? <a onClick={() => downloadFile(af, `${r.title}_정답해설.pdf`)}
                                 style={{ cursor: "pointer", color: "#1d4ed8" }}>정답</a>
                            : <span style={{ color: "#aaa" }}>—</span>}
                        </td>
                        <td>{updatedAtOf(r) || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            className="admin-detail-btn secondary sm"
                            onClick={() => generatePdf(id)}
                            disabled={pdfGenId === id || !id}
                            type="button"
                            style={{ marginRight: 4 }}
                          >
                            {pdfGenId === id ? "생성 중..." : "PDF"}
                          </button>
                          <button
                            className="admin-detail-btn danger sm"
                            onClick={() => remove(id, r.title)}
                            type="button"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* JSON 업로드 모달 */}
        {uploadModal && (
          <div onClick={() => !uploadModal.uploading && setUploadModal(null)}
               style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()}
                 style={{ background: "#fff", borderRadius: 6, padding: 20, minWidth: 480, maxWidth: 640 }}>
              <h3 style={{ margin: "0 0 12px" }}>JSON 업로드로 새 교재 시작</h3>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                우리 교재 스키마 / 디자인 하네스 일반 스키마({"{meta, sections}"}) / 비트 챕터 폴더 스키마 모두 자동 인식.
                알 수 없는 형식도 통째 UnknownBlock 으로 보존되어 한 글자도 잃지 않습니다.
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>JSON 파일</div>
                <input type="file" accept=".json,application/json"
                       onChange={(e) => {
                         const f = e.target.files?.[0];
                         if (f) handleUploadFile(f);
                       }} />
                {uploadModal.file && (
                  <div style={{ fontSize: 11, color: "#2d6a4f", marginTop: 4 }}>
                    선택됨: {uploadModal.file.name} ({Math.round(uploadModal.file.size / 1024)}KB)
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>교재 제목</div>
                <input type="text" value={uploadModal.title}
                       onChange={(e) => setUploadModal((m) => m ? { ...m, title: e.target.value } : m)}
                       placeholder="예: 소쉬르1 1권"
                       style={{ width: "100%", padding: "6px 8px",
                                border: "1px solid #d4d4d4", borderRadius: 4 }} />
              </div>
              {uploadModal.error && (
                <div style={{ color: "#c0392b", fontSize: 12, marginBottom: 10 }}>
                  오류: {uploadModal.error}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="admin-detail-btn secondary"
                        onClick={() => setUploadModal(null)}
                        disabled={uploadModal.uploading} type="button">취소</button>
                <button className="admin-detail-btn"
                        onClick={doUpload}
                        disabled={!uploadModal.file || uploadModal.uploading}
                        type="button">
                  {uploadModal.uploading ? "업로드 중..." : "업로드 + 에디터 열기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
