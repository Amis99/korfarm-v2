import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiPost, apiUploadFile } from "../utils/api";
import "../styles/admin-detail.css";

/**
 * 테스트 정보 생성 (OCR) — V0149 (2026-05-21).
 *
 * 흐름 (4 step):
 *  1) 업로드: 시험지 + (선택) 정답 파일 선택
 *  2) OCR 처리: presign + upload + POST /ocr-generate (페이지당 1자몽 차감)
 *  3) 검수: payload_json textarea 편집
 *  4) 확정: POST /ocr-drafts/{draftId}/confirm → test_papers 등록 후 비주얼 에디터로 이동
 */
export default function OcrTestNewPage() {
  const navigate = useNavigate();
  const sourceRef = useRef(null);
  const answerRef = useRef(null);

  const [step, setStep] = useState("upload"); // upload / processing / review / confirming
  const [mode, setMode] = useState("file");   // O-7: 'file' (OCR) | 'text' (텍스트 직접)
  const [sourceFile, setSourceFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [sourceText, setSourceText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [draft, setDraft] = useState(null);
  const [editedPayload, setEditedPayload] = useState("");
  const [error, setError] = useState(null);

  // ─── 1) 파일 업로드 + OCR 시작 ──────────────────
  const uploadFile = async (file, purpose) => {
    const presign = await apiPost("/v1/files/presign", {
      purpose,
      filename: file.name,
      mime: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
      size: file.size,
    });
    const fileId = presign?.fileId || presign?.file_id || presign?.data?.fileId || presign?.data?.file_id;
    if (!fileId) throw new Error("presign 응답에 fileId 없음");
    await apiUploadFile(fileId, file);
    return fileId;
  };

  const handleStart = async () => {
    if (mode === "file" && !sourceFile) {
      setError("시험지 파일을 선택해 주세요.");
      return;
    }
    if (mode === "text" && !sourceText.trim()) {
      setError("시험지 본문을 입력해 주세요.");
      return;
    }
    setError(null);
    setStep("processing");
    try {
      let body;
      if (mode === "file") {
        const sourceFileId = await uploadFile(sourceFile, "test_ocr");
        const answerFileId = answerFile ? await uploadFile(answerFile, "test_ocr") : null;
        body = { source_file_id: sourceFileId, answer_file_id: answerFileId };
      } else {
        // 텍스트 모드 — OCR 자몽 차감 0, Claude API text-only 구조화
        body = { source_text: sourceText.trim(), answer_text: answerText.trim() || null };
      }
      const res = await apiPost("/v1/admin/test-papers/ocr-generate", body);
      const d = res?.data || res;
      if (d?.status === "failed") {
        setError(`처리 실패: ${d.error_message || "원인 미상"}`);
        setStep("upload");
        return;
      }
      setDraft(d);
      setEditedPayload(d?.payload_json || "");
      setStep("review");
    } catch (e) {
      setError("처리 실패: " + (e.message || ""));
      setStep("upload");
    }
  };

  // ─── 2) 검수·확정 ────────────────────────────
  const handleConfirm = async () => {
    if (!draft?.draft_id) return;
    // payload JSON 사전 검증
    try {
      JSON.parse(editedPayload);
    } catch {
      setError("payload JSON 형식이 올바르지 않습니다. 검토해 주세요.");
      return;
    }
    setError(null);
    setStep("confirming");
    try {
      const res = await apiPost(`/v1/admin/test-papers/ocr-drafts/${draft.draft_id}/confirm`, {
        payload_json: editedPayload,
      });
      const newTestId = res?.data?.test_id || res?.test_id;
      if (newTestId) {
        navigate(`/admin/tests/${newTestId}/edit`);
      } else {
        navigate("/admin/tests");
      }
    } catch (e) {
      setError("확정 실패: " + (e.message || ""));
      setStep("review");
    }
  };

  const fileLabel = (f) => f ? `${f.name} (${(f.size / 1024).toFixed(0)}KB)` : "선택되지 않음";

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>upload_file</span>
            시험지 업로드 (OCR)
          </h1>
          <button className="admin-detail-btn ghost" onClick={() => navigate("/admin/tests")}>← 테스트 관리</button>
        </div>

        <div className="admin-detail-card">
          {/* 진행 단계 표시 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, fontSize: 13, color: "var(--admin-muted)" }}>
            <span style={{ fontWeight: step === "upload" ? 700 : 400, color: step === "upload" ? "var(--admin-accent-strong)" : undefined }}>① 업로드</span>
            <span>→</span>
            <span style={{ fontWeight: step === "processing" ? 700 : 400, color: step === "processing" ? "var(--admin-accent-strong)" : undefined }}>② OCR 처리</span>
            <span>→</span>
            <span style={{ fontWeight: step === "review" ? 700 : 400, color: step === "review" ? "var(--admin-accent-strong)" : undefined }}>③ 검수</span>
            <span>→</span>
            <span style={{ fontWeight: step === "confirming" ? 700 : 400, color: step === "confirming" ? "var(--admin-accent-strong)" : undefined }}>④ 확정</span>
          </div>

          {error && (
            <div style={{
              background: "var(--warn-soft, #fdecea)",
              color: "var(--warn, #c0392b)",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}>{error}</div>
          )}

          {/* ① 업로드 — 파일/텍스트 모드 토글 */}
          {step === "upload" && (
            <div>
              {/* 모드 선택 토글 */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  className={mode === "file" ? "admin-detail-btn" : "admin-detail-btn ghost"}
                  onClick={() => setMode("file")}
                >
                  📤 파일 업로드 (OCR, 페이지당 1자몽)
                </button>
                <button
                  type="button"
                  className={mode === "text" ? "admin-detail-btn" : "admin-detail-btn ghost"}
                  onClick={() => setMode("text")}
                >
                  📝 텍스트 직접 입력 (OCR 자몽 0)
                </button>
              </div>

              <p style={{ fontSize: 14, color: "var(--admin-muted)", marginBottom: 16 }}>
                {mode === "file"
                  ? "시험지 파일(PDF · 이미지)을 업로드하면 Claude Vision OCR 이 지문·문항·선택지·정답을 자동 추출합니다. 정답·해설 파일을 함께 올리면 매칭까지 자동. 비용: 페이지당 1자몽."
                  : "이미 텍스트화된 시험지를 가지고 있다면 아래 본문에 붙여넣어 주세요. OCR 자몽 차감 없이 등록됩니다. AI 분석은 별도 (시험당 2자몽)."}
              </p>

              {mode === "file" ? (
                <>
                  <div className="admin-detail-form-row" style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                      시험지 (필수) — PDF · JPG · PNG
                    </label>
                    <input
                      ref={sourceRef}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                    />
                    <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 4 }}>{fileLabel(sourceFile)}</div>
                  </div>

                  <div className="admin-detail-form-row" style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                      정답·해설 (선택) — PDF · JPG · PNG
                    </label>
                    <input
                      ref={answerRef}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                    />
                    <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 4 }}>{fileLabel(answerFile)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="admin-detail-form-row" style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                      시험지 본문 (필수) — 텍스트
                    </label>
                    <textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="시험지의 지문·문항·선택지 텍스트를 그대로 붙여넣어 주세요. 원문자 ①②③④⑤ 그대로 OK."
                      style={{
                        width: "100%", minHeight: 240,
                        fontFamily: "inherit", fontSize: 14,
                        padding: 12, borderRadius: 6,
                        border: "1px solid var(--admin-stroke, rgba(31,58,44,0.18))",
                        background: "#fafafa",
                      }}
                    />
                  </div>
                  <div className="admin-detail-form-row" style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                      정답·해설 (선택) — 텍스트
                    </label>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="정답·해설 텍스트. 예: 1번 ① / 2번 ③ / ... 또는 자유 양식. 있으면 answer_id 와 explanation 자동 매칭."
                      style={{
                        width: "100%", minHeight: 160,
                        fontFamily: "inherit", fontSize: 14,
                        padding: 12, borderRadius: 6,
                        border: "1px solid var(--admin-stroke, rgba(31,58,44,0.18))",
                        background: "#fafafa",
                      }}
                    />
                  </div>
                </>
              )}

              <button
                className="admin-detail-btn"
                onClick={handleStart}
                disabled={mode === "file" ? !sourceFile : !sourceText.trim()}
              >
                <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 4 }}>upload</span>
                {mode === "file" ? "OCR 시작" : "구조화 시작"}
              </button>
            </div>
          )}

          {/* ② OCR 처리 중 */}
          {step === "processing" && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div className="spinner" style={{ marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>OCR 처리 중...</div>
              <div style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                Claude Vision 이 시험지를 분석하고 있습니다. 페이지 수에 따라 15~60초 소요됩니다.
              </div>
            </div>
          )}

          {/* ③ 검수 */}
          {step === "review" && draft && (
            <div>
              <div style={{
                background: "var(--accent-soft, #e9f3ec)",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                color: "var(--admin-accent-strong, #1f4a37)",
              }}>
                <strong>OCR 완료</strong> · 페이지 수 {draft.page_count} · 차감 {draft.grapefruit_deducted}자몽<br/>
                아래 JSON 을 검수하고 필요하면 수정해 주세요. 확정 시 <code>test_papers</code> 에 등록됩니다.
              </div>

              <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                payload_json (지문·문항·선택지·정답)
              </label>
              <textarea
                value={editedPayload}
                onChange={(e) => setEditedPayload(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 400,
                  fontFamily: "JetBrains Mono, Consolas, monospace",
                  fontSize: 13,
                  padding: 12,
                  borderRadius: 6,
                  border: "1px solid var(--admin-stroke, rgba(31,58,44,0.18))",
                  background: "#fafafa",
                  whiteSpace: "pre",
                }}
                spellCheck={false}
              />

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button className="admin-detail-btn" onClick={handleConfirm}>
                  <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 4 }}>check_circle</span>
                  확정 + 시험 등록
                </button>
                <button className="admin-detail-btn ghost" onClick={() => navigate("/admin/tests")}>
                  취소
                </button>
              </div>
            </div>
          )}

          {/* ④ 확정 중 */}
          {step === "confirming" && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>확정 중...</div>
              <div style={{ fontSize: 13, color: "var(--admin-muted)" }}>
                test_papers 와 test_questions 에 등록 후 비주얼 에디터로 이동합니다.
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
