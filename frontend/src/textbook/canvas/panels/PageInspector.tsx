/**
 * 페이지 인스펙터 — 우측 패널.
 *
 * 현재 페이지의 배경(없음/색/이미지) 변경.
 * 이미지는 교재 imagePool 에서 선택 (편집 페이지에서 이미 업로드된 자산).
 *
 * 2026-05-17 신설 (Phase 5/6/8 이후 후속).
 */
import { useState } from "react";
import type { CanvasPage } from "../types";
import type { ImageAsset } from "../../types";

export function PageInspector({
  page,
  imagePool,
  onChangeBackground,
}: {
  page: CanvasPage | null;
  imagePool: ImageAsset[];
  onChangeBackground: (bg: CanvasPage["background"]) => void;
}) {
  const [tab, setTab] = useState<"none" | "color" | "image">(() => {
    const k = page?.background?.kind;
    return k === "color" || k === "image" ? k : "none";
  });

  if (!page) {
    return (
      <div style={{ padding: 12, color: "#888", fontSize: 12 }}>페이지를 선택하세요</div>
    );
  }

  const bg = page.background as any;

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 8 }}>
        페이지 배경
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {(["none", "color", "image"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              if (k === "none") onChangeBackground({ kind: "none" });
            }}
            style={{
              flex: 1, padding: "4px 6px", fontSize: 11,
              border: tab === k ? "1px solid #2d6a4f" : "1px solid #ddd",
              background: tab === k ? "rgba(45,106,79,0.12)" : "#fff",
              color: tab === k ? "#2d6a4f" : "#444",
              borderRadius: 3, cursor: "pointer", fontWeight: 600,
            }}
          >{k === "none" ? "없음" : k === "color" ? "단색" : "이미지"}</button>
        ))}
      </div>

      {tab === "color" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="color"
            value={bg?.kind === "color" ? bg.color : "#ffffff"}
            onChange={(e) => onChangeBackground({ kind: "color", color: e.target.value } as any)}
            style={{ width: 40, height: 30, border: "1px solid #ddd", padding: 0, cursor: "pointer" }}
          />
          <input
            type="text"
            value={bg?.kind === "color" ? bg.color : ""}
            placeholder="#ffffff"
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#[0-9a-fA-F]{3,8}$/.test(v)) onChangeBackground({ kind: "color", color: v } as any);
            }}
            style={{ flex: 1, fontSize: 12, padding: "4px 6px", border: "1px solid #ddd", borderRadius: 3 }}
          />
        </div>
      )}

      {tab === "image" && (
        <div>
          {imagePool.length === 0 ? (
            <div style={{ fontSize: 11, color: "#888" }}>
              업로드된 이미지가 없습니다. 좌측 패널에서 이미지 추가 후 사용.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 8 }}>
                {imagePool.map((asset) => {
                  const selected = bg?.kind === "image" && bg.assetId === asset.assetId;
                  return (
                    <button
                      key={asset.assetId}
                      type="button"
                      onClick={() => onChangeBackground({
                        kind: "image",
                        assetId: asset.assetId,
                        url: asset.url,
                        opacity: bg?.opacity ?? 1,
                      } as any)}
                      title={asset.originalName}
                      style={{
                        padding: 0, border: selected ? "2px solid #2d6a4f" : "1px solid #ddd",
                        borderRadius: 3, cursor: "pointer", background: "#fff",
                        aspectRatio: "1/1", overflow: "hidden",
                      }}
                    >
                      <img src={asset.url} alt=""
                           style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  );
                })}
              </div>
              {bg?.kind === "image" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "#666" }}>투명도</label>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={bg.opacity ?? 1}
                    onChange={(e) => onChangeBackground({
                      ...bg, opacity: parseFloat(e.target.value),
                    } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 10, color: "#888", minWidth: 30 }}>
                    {Math.round((bg.opacity ?? 1) * 100)}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
