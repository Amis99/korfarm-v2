/**
 * 내용 숙지 PDF 미리보기 (왼쪽 패널)
 */
export default function ContentPdfPreview({ content, onClickPath, focusPath }) {
  const pdfUrl = content?.pdfUrl;
  const questions = content?.questions || [];

  return (
    <div>
      {/* PDF URL */}
      {pdfUrl && (
        <div
          className={`ce-preview-card ${focusPath === "pdfUrl" ? "active" : ""}`}
          onClick={() => onClickPath("pdfUrl")}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6a7a6e", marginBottom: 4 }}>PDF URL</div>
          <div style={{ fontSize: 12, color: "#a6b6a9", wordBreak: "break-all" }}>{pdfUrl}</div>
        </div>
      )}

      {/* layout / requireStart */}
      <div
        className={`ce-preview-card ${focusPath === "settings" ? "active" : ""}`}
        onClick={() => onClickPath("settings")}
        style={{ padding: 10 }}
      >
        <span className="ce-preview-badge">{content?.layout || "EXAM_SHEET"}</span>
        {content?.requireStart && <span className="ce-preview-badge">시작 필요</span>}
      </div>

      {/* 문항 */}
      {questions.length === 0 && !pdfUrl && <div style={{ color: "#6a7a6e" }}>콘텐츠가 없습니다.</div>}
      {questions.map((q, i) => {
        const path = `questions[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={q.id || i}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div className="ce-preview-q-stem">
              <strong style={{ color: "#6a7a6e", marginRight: 6 }}>{i + 1}.</strong>
              <span className="ce-preview-badge">{q.type || "MCQ"}</span>
              {q.stem || "(발문 없음)"}
            </div>

            {q.type === "MULTI_CHOICE" || !q.type ? (
              (q.choices || []).map((c, ci) => (
                <div
                  key={c.id || ci}
                  className={`ce-preview-q-choice ${c.id === q.answerId ? "correct" : ""}`}
                >
                  {ci + 1}. {c.text || "(빈 선택지)"}
                  {c.id === q.answerId && " ✓"}
                </div>
              ))
            ) : q.type === "FILL_BLANKS" ? (
              <div style={{ fontSize: 12, color: "#a6b6a9", marginTop: 4 }}>
                [빈칸형] {q.template?.slice(0, 60) || ""}...
                {q.blanks?.length > 0 && ` (빈칸 ${q.blanks.length}개)`}
              </div>
            ) : q.type === "SENTENCE_BUILDING" ? (
              <div style={{ fontSize: 12, color: "#a6b6a9", marginTop: 4 }}>
                [문장 구성] 파트 {q.sentenceParts?.length || 0}개
              </div>
            ) : null}

            {q.scoring && (
              <div style={{ fontSize: 10, color: "#6a7a6e", marginTop: 4 }}>
                정답:{q.scoring.correctDeltaSec}s / 오답:{q.scoring.wrongDeltaSec}s
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
