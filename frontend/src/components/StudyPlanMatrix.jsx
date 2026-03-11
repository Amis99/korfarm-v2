import CellStatusBadge from "./CellStatusBadge";
import "../styles/study-plan.css";

export default function StudyPlanMatrix({ scopes, assets, cells, admin, onCellClick }) {
  const cellMap = {};
  (cells || []).forEach((c) => {
    cellMap[`${c.scopeId}_${c.assetId}`] = c;
  });

  return (
    <div className="sp-matrix-wrap">
      <table className={`sp-matrix${admin ? " admin-theme" : ""}`}>
        <thead>
          <tr>
            <th>범위</th>
            {(assets || []).map((a) => (
              <th key={a.id}>{a.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(scopes || []).map((scope) => (
            <tr key={scope.id}>
              <th>{scope.label}</th>
              {(assets || []).map((asset) => {
                const cell = cellMap[`${scope.id}_${asset.id}`];
                const isRejected = cell?.status === "rejected";
                return (
                  <td
                    key={asset.id}
                    className={isRejected ? "cell-rejected" : ""}
                    onClick={() => onCellClick?.(cell, scope, asset)}
                    title={isRejected && cell?.adminNote ? `거부 사유: ${cell.adminNote}` : undefined}
                  >
                    {cell ? (
                      <CellStatusBadge status={cell.status} score={cell.score} />
                    ) : (
                      <span style={{ color: "#bbb", fontSize: "0.75rem" }}>-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
