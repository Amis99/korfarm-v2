import { useMemo, useState, useRef, useEffect } from "react";
import "../styles/org-select.css";

const HQ_ORG_ID = "org_hq";

function OrgSelect({ orgs, value, onChange, placeholder = "기관 선택", disabled = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // org_hq를 맨 위로, 나머지는 이름순 정렬
  const sortedOrgs = useMemo(() => {
    if (!orgs || orgs.length === 0) return [];
    const hq = orgs.find((o) => o.id === HQ_ORG_ID);
    const others = orgs.filter((o) => o.id !== HQ_ORG_ID).sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return hq ? [hq, ...others] : others;
  }, [orgs]);

  const selectedOrg = orgs.find((o) => o.id === value);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (orgId) => {
    onChange(orgId);
    setOpen(false);
  };

  return (
    <div className="org-select" ref={containerRef}>
      <button
        type="button"
        className={`org-select-trigger ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span className={selectedOrg?.id === HQ_ORG_ID ? "org-hq-text" : ""}>
          {selectedOrg ? selectedOrg.name : placeholder}
        </span>
        <span className="org-select-arrow">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && !disabled && (
        <ul className="org-select-dropdown">
          <li
            className="org-select-item org-select-placeholder"
            onClick={() => handleSelect("")}
          >
            {placeholder}
          </li>
          {sortedOrgs.map((org) => (
            <li
              key={org.id}
              className={`org-select-item ${org.id === HQ_ORG_ID ? "org-hq-item" : ""} ${org.id === value ? "selected" : ""}`}
              onClick={() => handleSelect(org.id)}
            >
              {org.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OrgSelect;
