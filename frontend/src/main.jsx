import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './styles/mobile-fixes.css'
import App from './App.jsx'

// ── 청크 로드 실패 시 자동 새로고침 ──
// 배포 직후 옛 index.html을 띄워둔 탭이 사라진 청크를 dynamic import 하면
// "Failed to fetch dynamically imported module" 또는 ChunkLoadError 발생.
// → sessionStorage 플래그로 무한 루프 방지하면서 1회 자동 새로고침.
const RELOAD_KEY = "__chunk_reload_at";
const isChunkLoadError = (err) => {
  const msg = (err?.message || err?.reason?.message || "").toLowerCase();
  return (
    err?.name === "ChunkLoadError" ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("importing a module script failed")
  );
};
const tryReloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    const now = Date.now();
    // 30초 내 재발생은 무한 루프로 보고 중단
    if (now - last < 30_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(now));
    window.location.reload();
  } catch {
    window.location.reload();
  }
};
window.addEventListener("error", (e) => {
  if (isChunkLoadError(e.error || e)) tryReloadOnce();
});
window.addEventListener("unhandledrejection", (e) => {
  if (isChunkLoadError(e.reason)) tryReloadOnce();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
