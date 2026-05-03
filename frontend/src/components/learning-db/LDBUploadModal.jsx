import { useState } from "react";
import { importBatch } from "../../utils/learningDbApi";

/**
 * JSON 파일 업로드 모달.
 *
 * props:
 *   categories: [{ key, label, storage, readOnly }]
 *   onClose()
 *   onDone({ category, result })
 */
function LDBUploadModal({ categories, onClose, onDone }) {
  const [category, setCategory] = useState(
    (categories || []).find(c => !c.readOnly)?.key || ""
  );
  const [mode, setMode] = useState("upsert");
  const [files, setFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState([]);
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const writableCategories = (categories || []).filter(c => !c.readOnly);

  const onFilesChosen = async (e) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
    setItems([]);
    setParseError("");
    if (fl.length === 0) return;
    setParsing(true);
    try {
      const parsed = [];
      for (const f of fl) {
        const text = await f.text();
        let json;
        try { json = JSON.parse(text); }
        catch (err) {
          throw new Error(`'${f.name}' JSON 파싱 실패: ${err.message}`);
        }
        // 배열이면 각 원소를 항목으로, 단일 객체면 1개 항목
        if (Array.isArray(json)) {
          json.forEach((d, i) => {
            const id = (d && typeof d === "object" && (d.id || d.contentId)) || null;
            parsed.push({ source: `${f.name}[${i}]`, id, data: d });
          });
        } else if (json && typeof json === "object") {
          const id = json.id || json.contentId || null;
          parsed.push({ source: f.name, id, data: json });
        } else {
          throw new Error(`'${f.name}' — 객체 또는 배열만 지원`);
        }
      }
      setItems(parsed);
    } catch (err) {
      setParseError(err.message || String(err));
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!category) { setParseError("카테고리 선택 필수"); return; }
    if (items.length === 0) { setParseError("파일 선택 필수"); return; }
    setSubmitting(true);
    setParseError("");
    try {
      const res = await importBatch(
        category,
        items.map(it => ({ id: it.id, data: it.data })),
        mode
      );
      setResult(res?.data);
      if (res?.data && res.data.failed === 0) {
        // 전체 성공 — 부모에 알림
        onDone?.({ category, result: res.data });
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
          <h3 style={{ margin: 0, fontSize: 16 }}>JSON 업로드</h3>
          <button type="button" className="ldb-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ldb-modal-body">
          {!result && (
            <>
              <div className="ldb-form-row">
                <label>카테고리</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  disabled={writableCategories.length === 0}>
                  {writableCategories.map(c => (
                    <option key={c.key} value={c.key}>{c.label} ({c.storage})</option>
                  ))}
                </select>
                {writableCategories.length === 0 && (
                  <span className="ldb-form-hint">쓰기 가능한 카테고리가 없습니다.</span>
                )}
              </div>
              <div className="ldb-form-row">
                <label>매칭 모드</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="upsert">upsert — id 있으면 덮어쓰기, 없으면 새로 생성</option>
                  <option value="create">create — 항상 새로 생성 (id 무시)</option>
                </select>
              </div>
              <div className="ldb-form-row">
                <label>파일 선택</label>
                <input type="file" accept=".json" multiple onChange={onFilesChosen} />
              </div>
              {parsing && <div className="ldb-form-hint">파싱 중…</div>}
              {parseError && <div className="ldb-form-error">{parseError}</div>}
              {items.length > 0 && (
                <div className="ldb-form-preview">
                  <strong>{items.length}개 항목 준비됨</strong>
                  <ul>
                    {items.slice(0, 8).map((it, i) => (
                      <li key={i}>
                        <span className="ldb-pill">{it.id || "(신규)"}</span>{" "}
                        <span style={{ color: "#666", fontSize: 12 }}>{it.source}</span>
                      </li>
                    ))}
                    {items.length > 8 && <li>…외 {items.length - 8}건</li>}
                  </ul>
                </div>
              )}
            </>
          )}
          {result && (
            <div className="ldb-form-result">
              <p>
                총 <strong>{result.total}</strong> · 성공 <strong style={{ color: "#2d6a4f" }}>{result.ok}</strong> ·
                실패 <strong style={{ color: "#c0392b" }}>{result.failed}</strong>
              </p>
              {result.failed > 0 && (
                <ul>
                  {result.results.filter(r => !r.success).slice(0, 10).map((r, i) => (
                    <li key={i} style={{ color: "#c0392b", fontSize: 13 }}>
                      [{r.index}] {r.id || "(no id)"} — {r.error}
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
              disabled={submitting || items.length === 0 || !category}
              onClick={handleSubmit}>
              {submitting ? "업로드 중…" : `업로드 (${items.length}건)`}
            </button>
          )}
          {result && (
            <button type="button" className="ldb-btn ldb-btn-primary" onClick={onClose}>
              닫기
            </button>
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
