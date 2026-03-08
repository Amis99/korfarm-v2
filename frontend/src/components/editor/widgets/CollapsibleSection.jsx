import { useState } from "react";

export default function CollapsibleSection({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ce-collapsible">
      <div className="ce-collapsible-header" onClick={() => setOpen((v) => !v)}>
        <span className={`ce-collapsible-arrow ${open ? "open" : ""}`}>▶</span>
        <span>{title}</span>
        {count != null && <span className="ce-collapsible-count">{count}개</span>}
      </div>
      {open && <div className="ce-collapsible-body">{children}</div>}
    </div>
  );
}
