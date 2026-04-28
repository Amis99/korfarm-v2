import InlineEditable from "../dailyquiz/InlineEditable";
import BackgroundQuestionEditor from "./BackgroundQuestionEditor";
import { apiPost } from "../../../utils/adminApi";
import { apiUploadFile } from "../../../utils/api";

/**
 * 지문(passage) 한 개 + 그 지문의 questions[] 인라인 편집.
 *
 * props:
 *   passage: { id, title, text, questions: [...] }
 *   pi: passages 배열 인덱스
 *   total: passages 총 개수
 *   editor: useContentEditor 반환
 *   onMoveUp, onMoveDown, onDelete
 */
export default function PassageGroupEditor({ passage, pi, total, editor, onMoveUp, onMoveDown, onDelete }) {
  const path = `passages[${pi}]`;
  const questions = passage?.questions || [];
  const attachments = passage?.attachments || [];

  // PDF / 이미지 등 파일 업로드 — /v1/files/presign + /v1/files/{id}/upload
  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const presign = await apiPost("/v1/files/presign", {
        purpose: "content",
        filename: file.name,
        mime: file.type,
        size: file.size,
      });
      const fileId = presign?.fileId || presign?.data?.fileId;
      if (!fileId) throw new Error("presign 응답에 fileId 없음");
      await apiUploadFile(fileId, file);
      const downloadUrl = `/v1/files/${fileId}/download`;
      editor.addItem(`${path}.attachments`, attachments.length, {
        fileId, mime: file.type, originalName: file.name, size: file.size, url: downloadUrl,
      });
    } catch (err) {
      alert("파일 업로드 실패: " + (err?.message || err));
    }
  };
  const removeAttachment = (ai) => {
    if (!window.confirm(`첨부 ${ai + 1} 삭제? (파일 자체는 서버에 남아 있습니다)`)) return;
    editor.removeItem(`${path}.attachments`, ai);
  };

  const addQuestion = (atIdx) => {
    const newId = `q${Date.now().toString(36)}`;
    editor.addItem(`${path}.questions`, atIdx, {
      id: newId,
      type: "MULTI_CHOICE",
      stem: "",
      choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" },
        { id: "c3", text: "" }, { id: "c4", text: "" },
      ],
      answerId: "",
      explanation: "",
      scoring: { correctDeltaSec: 10, wrongDeltaSec: -10 },
    });
  };
  const removeQuestion = (i) => {
    if (!window.confirm(`문제 ${i + 1} 삭제?`)) return;
    editor.removeItem(`${path}.questions`, i);
  };
  const duplicateQuestion = (i) => {
    const q = questions[i];
    const dup = JSON.parse(JSON.stringify(q));
    dup.id = `${q.id}-copy-${Date.now().toString(36).slice(-3)}`;
    editor.addItem(`${path}.questions`, i + 1, dup);
  };
  const moveQuestion = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    editor.reorderItems(`${path}.questions`, from, to);
  };

  return (
    <div className="bg-passage-group">
      <div className="bg-passage-head">
        <span className="bg-passage-num">📚 지문 {pi + 1} / {total}</span>
        <code className="bg-passage-id">{passage.id || `(id 없음)`}</code>
        <div className="dq-fb-blank-move">
          <button type="button" onClick={onMoveUp} disabled={pi === 0}>▲</button>
          <button type="button" onClick={onMoveDown} disabled={pi >= total - 1}>▼</button>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#888" }}>{questions.length}문제</span>
        <button type="button" className="dq-mc-del" onClick={onDelete}>×</button>
      </div>

      <div className="bg-passage-body">
        <div className="dq-section-label">제목</div>
        <InlineEditable
          value={passage.title || ""}
          onChange={(v) => editor.updateField(`${path}.title`, v)}
          placeholder="지문 제목"
          multiline={false}
          className="bg-passage-title"
        />
        <div className="dq-section-label">본문 (마크다운, 300~500자 권장)</div>
        <InlineEditable
          value={passage.text || ""}
          onChange={(v) => editor.updateField(`${path}.text`, v)}
          placeholder="지문 본문 (마크다운: **굵게**, ==하이라이트==, *기울이기*, <u>밑줄</u>)"
          className="bg-passage-text"
        />

        <div className="dq-section-label" style={{ marginTop: 10 }}>
          첨부 자료 (PDF · 이미지) — 옛 PDF/이미지 지문 호환
          <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 11, color: "#888" }}>
            본문이 비어 있고 첨부만 있으면 학생 화면이 첨부를 지문으로 사용
          </span>
        </div>
        <div className="bg-attachments">
          {attachments.map((a, ai) => (
            <div key={ai} className="bg-attachment-row">
              <span className="bg-attachment-icon">{a.mime?.startsWith("image/") ? "🖼️" : a.mime?.includes("pdf") ? "📄" : "📎"}</span>
              <a href={a.url || `/v1/files/${a.fileId}/download`} target="_blank" rel="noreferrer" className="bg-attachment-name">
                {a.originalName || a.fileId}
              </a>
              <span className="bg-attachment-meta">{a.mime} {a.size ? `· ${Math.round(a.size / 1024)}KB` : ""}</span>
              <button type="button" className="dq-mc-del" onClick={() => removeAttachment(ai)}>×</button>
            </div>
          ))}
          <label className="bg-attachment-add">
            <input type="file" accept="application/pdf,image/*" onChange={handleFilePick} style={{ display: "none" }} />
            + PDF / 이미지 업로드
          </label>
        </div>

        <div className="dq-section-label" style={{ marginTop: 14 }}>
          이 지문의 문제 ({questions.length}개)
        </div>
        {questions.length === 0 && (
          <div style={{ color: "#888", fontSize: 12, padding: 6 }}>
            아직 문제가 없습니다. 아래 [+] 버튼으로 추가하세요.
          </div>
        )}
        {questions.map((q, qi) => (
          <div key={q.id || qi}>
            <button
              type="button"
              className="dr-step-insert"
              onClick={() => addQuestion(qi)}
              title="여기에 문제 추가"
            >+</button>
            <BackgroundQuestionEditor
              question={q}
              idx={qi}
              total={questions.length}
              path={`${path}.questions[${qi}]`}
              editor={editor}
              onMoveUp={() => moveQuestion(qi, qi - 1)}
              onMoveDown={() => moveQuestion(qi, qi + 1)}
              onDelete={() => removeQuestion(qi)}
              onDuplicate={() => duplicateQuestion(qi)}
              compact
            />
          </div>
        ))}
        <button
          type="button"
          className="dr-step-insert dr-step-insert-end"
          onClick={() => addQuestion(questions.length)}
        >+ 마지막에 문제 추가</button>
      </div>
    </div>
  );
}
