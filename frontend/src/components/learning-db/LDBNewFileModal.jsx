import { useState, useMemo } from "react";
import { saveFile } from "../../utils/learningDbApi";

/**
 * 새 JSON 자료 생성 모달.
 * 영역(라디오) + 세부영역(자유 입력 또는 기존 select) + 자료종류(라디오) + 파일명 입력 → 빈 객체 PUT.
 *
 * props:
 *   meta: { areas, kinds }
 *   tree: LearningDataNodeDto (기존 세부영역 추출용)
 *   onClose()
 *   onCreated({ path, label })
 */
function LDBNewFileModal({ meta, tree, onClose, onCreated }) {
  const [area, setArea] = useState(meta?.areas?.[0]?.key || "");
  const [subArea, setSubArea] = useState("");
  const [kind, setKind] = useState(meta?.kinds?.[0]?.key || "");
  const [filename, setFilename] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 선택된 영역의 기존 세부영역들 (선택 편의)
  const existingSubAreas = useMemo(() => {
    const areaNode = (tree?.children || []).find(n => n.key === area);
    return (areaNode?.children || []).map(s => s.key);
  }, [tree, area]);

  const handleCreate = async () => {
    setError("");
    if (!area || !kind) { setError("영역·자료종류 필수"); return; }
    const sub = subArea.trim();
    if (!sub) { setError("세부영역 입력 필수"); return; }
    if (sub.includes("/") || sub.includes("..")) { setError("세부영역에 슬래시·.. 금지"); return; }
    let name = filename.trim();
    if (!name) { setError("파일명 입력 필수"); return; }
    if (name.includes("/") || name.includes("..")) { setError("파일명에 슬래시·.. 금지"); return; }
    if (!name.endsWith(".json")) name = `${name}.json`;
    const path = `${area}/${sub}/${kind}/${name}`;

    setSubmitting(true);
    try {
      // 빈 객체로 생성
      await saveFile(path, {});
      onCreated?.({ path, label: name.replace(/\.json$/, "") });
    } catch (e) {
      setError("생성 실패: " + (e.message || String(e)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ldb-modal-backdrop" onClick={onClose}>
      <div className="ldb-modal" onClick={e => e.stopPropagation()}>
        <div className="ldb-modal-header">
          <h3 style={{ margin: 0, fontSize: 16 }}>새 JSON 자료 만들기</h3>
          <button type="button" className="ldb-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ldb-modal-body">
          <div className="ldb-form-row">
            <label>영역</label>
            <div className="ldb-radio-grid">
              {(meta?.areas || []).map(a => (
                <label key={a.key} className={`ldb-radio-pill ${area === a.key ? "active" : ""}`}>
                  <input type="radio" name="area" value={a.key}
                    checked={area === a.key} onChange={() => setArea(a.key)} />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
          <div className="ldb-form-row">
            <label>세부영역</label>
            <input type="text" placeholder="예: 인문, 사회, 시, 수필, 음운, 형태소…"
              value={subArea} onChange={e => setSubArea(e.target.value)} list="subareas-list" />
            {existingSubAreas.length > 0 && (
              <datalist id="subareas-list">
                {existingSubAreas.map(s => <option key={s} value={s} />)}
              </datalist>
            )}
            {existingSubAreas.length > 0 && (
              <div className="ldb-form-hint">
                기존 세부영역: {existingSubAreas.join(", ")}
              </div>
            )}
          </div>
          <div className="ldb-form-row">
            <label>자료 종류</label>
            <div className="ldb-radio-grid">
              {(meta?.kinds || []).map(k => (
                <label key={k.key} className={`ldb-radio-pill ${kind === k.key ? "active" : ""}`}>
                  <input type="radio" name="kind" value={k.key}
                    checked={kind === k.key} onChange={() => setKind(k.key)} />
                  {k.label}
                </label>
              ))}
            </div>
          </div>
          <div className="ldb-form-row">
            <label>파일명 <span style={{ color: "#888", fontWeight: 400 }}>(.json 자동 추가)</span></label>
            <input type="text" placeholder="예: 2024_수능_홀수형, 인문_경제_001…"
              value={filename} onChange={e => setFilename(e.target.value)} />
          </div>
          {error && <div className="ldb-form-error">{error}</div>}
        </div>
        <div className="ldb-modal-footer">
          <button type="button" className="ldb-btn ldb-btn-primary"
            disabled={submitting} onClick={handleCreate}>
            {submitting ? "생성 중…" : "생성"}
          </button>
          <button type="button" className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

export default LDBNewFileModal;
