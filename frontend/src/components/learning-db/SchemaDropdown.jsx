import { useState, useEffect, useRef } from "react";
import { DOWNLOADABLE_SCHEMAS } from "../../constants/manuscriptSchemas";

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(files, zipName) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach(({ name, data }) => zip.file(name, JSON.stringify(data, null, 2)));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = zipName; a.click();
  URL.revokeObjectURL(url);
}

function SchemaDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAll = async () => {
    setOpen(false);
    const files = DOWNLOADABLE_SCHEMAS.map(s => ({ name: `${s.label}.json`, data: s.schema }));
    await downloadZip(files, "전체_표준_스키마.zip");
  };

  return (
    <div className="ldb-dropdown" ref={ref}>
      <button className="ldb-btn ldb-btn-secondary" onClick={() => setOpen(v => !v)}>
        <span className="material-symbols-outlined">download</span>표준 스키마
      </button>
      {open && (
        <div className="ldb-dropdown-menu">
          {DOWNLOADABLE_SCHEMAS.map(s => (
            <button key={s.key} className="ldb-dropdown-item" onClick={() => { downloadJson(s.schema, `${s.label}.json`); setOpen(false); }}>
              {s.label}
            </button>
          ))}
          <div className="ldb-dropdown-divider" />
          <button className="ldb-dropdown-item" onClick={handleAll}>전체 스키마 (ZIP)</button>
        </div>
      )}
    </div>
  );
}

export { downloadJson, downloadZip };
export default SchemaDropdown;
