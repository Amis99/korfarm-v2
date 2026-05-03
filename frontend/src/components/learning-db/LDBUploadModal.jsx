import { useState, useMemo } from "react";
import { importBatch } from "../../utils/learningDbApi";

/**
 * 다중 JSON 파일 업로드 모달.
 * 영역·세부영역·자료종류 한 번 선택 → 선택된 모든 파일을 그 폴더에 저장.
 * 파일명은 원본 그대로 사용 (덮어쓰기 모드).
 *
 * props:
 *   meta: { areas, kinds }
 *   tree: 기존 세부영역 select 편의용
 *   onClose()
 *   onDone()
 */
function LDBUploadModal({ meta, tree, onClose, onDone }) {
  const [area, setArea] = useState(meta?.areas?.[0]?.key || "");
  const [subArea, setSubArea] = useState("");
  const [kind, setKind] = useState(meta?.kinds?.[0]?.key || "");
  const [files, setFiles] = useState([]);
  const [parsed, setParsed] = useState([]);
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const existingSubAreas = useMemo(() => {
    const areaNode = (tree?.children || []).find(n => n.key === area);
    return (areaNode?.children || []).map(s => s.key);
  }, [tree, area]);

  const onFilesChosen = async (e) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
    setParsed([]);
    setParseError("");
    if (fl.length === 0) return;
    try {
      const results = [];
      for (const f of fl) {
        const text = await f.text();
        let data;
        try { data = JSON.parse(text); }
        catch (err) { throw new Error(`'${f.name}' JSON 파싱 실패: ${err.message}`); }
        results.push({ filename: f.name, data });
      }
      setParsed(results);
    } catch (err) {
      setParseError(err.message || String(err));
    }
  };

  const handleSubmit = async () => {
    setParseError("");
    if (!area || !kind) { setParseError("영역·자료종류 필수"); return; }
    const sub = subArea.trim();
    if (!sub) { setParseError("세부영역 입력 필수"); return; }
    if (parsed.length === 0) { setParseError("파일 선택 필수"); return; }
    setSubmitting(true);
    try {
      const items = parsed.map(p => ({
        area, subArea: sub, kind, filename: p.filename, data: p.data
      }));
      const res = await importBatch(items);
      const r = res?.total !== undefined ? res : res?.data;
      setResult(r);
      if (r && r.failed === 0) {
        onDone?.();
      }
    } catch (err) {
      setParseError("업로드 실패: " + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ldb-modal-backdrop" onClick={onClose}>
      <div className="ldb-modal" onClick={e => e.stopPropagation()}>
        <div className="ldb-modal-header">
          <h3 style={{ margin: 0, fontSize: 16 }}>JSON 파일 업로드</h3>
          <button type="button" className="ldb-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ldb-modal-body">
          {!result && (
            <>
              <div className="ldb-form-row">
                <label>영역</label>
                <div className="ldb-radio-grid">
                  {(meta?.areas || []).map(a => (
                    <label key={a.key} className={`ldb-radio-pill ${area === a.key ? "active" : ""}`}>
                      <input type="radio" name="upload-area" value={a.key}
                        checked={area === a.key} onChange={() => setArea(a.key)} />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="ldb-form-row">
                <label>세부영역</label>
                <input type="text" placeholder="예: 인문, 사회, 음운…"
                  value={subArea} onChange={e => setSubArea(e.target.value)} list="upload-sub-list" />
                {existingSubAreas.length > 0 && (
                  <datalist id="upload-sub-list">
                    {existingSubAreas.map(s => <option key={s} value={s} />)}
                  </datalist>
                )}
              </div>
              <div className="ldb-form-row">
                <label>자료 종류</label>
                <div className="ldb-radio-grid">
                  {(meta?.kinds || []).map(k => (
                    <label key={k.key} className={`ldb-radio-pill ${kind === k.key ? "active" : ""}`}>
                      <input type="radio" name="upload-kind" value={k.key}
                        checked={kind === k.key} onChange={() => setKind(k.key)} />
                      {k.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="ldb-form-row">
                <label>파일 선택 <span style={{ color: "#888", fontWeight: 400 }}>(다중 선택 가능)</span></label>
                <input type="file" accept=".json" multiple onChange={onFilesChosen} />
                {parsed.length > 0 && (
                  <div className="ldb-form-preview">
                    <strong>{parsed.length}개 파일 준비됨</strong>
                    <ul>
                      {parsed.slice(0, 8).map((p, i) => (
                        <li key={i}>{p.filename}</li>
                      ))}
                      {parsed.length > 8 && <li>…외 {parsed.length - 8}건</li>}
                    </ul>
                  </div>
                )}
              </div>
              {parseError && <div className="ldb-form-error">{parseError}</div>}
            </>
          )}
          {result && (
            <div className="ldb-form-result">
              <p>
                총 <strong>{result.total}</strong> · 성공{" "}
                <strong style={{ color: "#2d6a4f" }}>{result.ok}</strong> · 실패{" "}
                <strong style={{ color: "#c0392b" }}>{result.failed}</strong>
              </p>
              {result.failed > 0 && (
                <ul>
                  {result.errors.slice(0, 10).map((r, i) => (
                    <li key={i} style={{ color: "#c0392b", fontSize: 13 }}>
                      [{r.index}] {r.filename} — {r.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="ldb-modal-footer">
          {!result && (
            <button type="button" className="ldb-btn ldb-btn-primary"
              disabled={submitting || parsed.length === 0}
              onClick={handleSubmit}>
              {submitting ? "업로드 중…" : `업로드 (${parsed.length}건)`}
            </button>
          )}
          {result && (
            <button type="button" className="ldb-btn ldb-btn-primary" onClick={onClose}>닫기</button>
          )}
          {!result && (
            <button type="button" className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LDBUploadModal;
