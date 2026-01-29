import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/diagnostic.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";
const PDF_URL = "/diagnostic-test.pdf";

const blockEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

function DiagnosticPrintPage() {
  const [printed, setPrinted] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const keyEvents = ["keydown", "keypress", "keyup"];
    const blockEvents = [
      "contextmenu",
      "copy",
      "cut",
      "paste",
      "dragstart",
      "selectstart",
    ];
    keyEvents.forEach((eventName) => window.addEventListener(eventName, blockEvent, true));
    blockEvents.forEach((eventName) => window.addEventListener(eventName, blockEvent, true));

    return () => {
      keyEvents.forEach((eventName) => window.removeEventListener(eventName, blockEvent, true));
      blockEvents.forEach((eventName) => window.removeEventListener(eventName, blockEvent, true));
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      const hidden = document.hidden || !document.hasFocus();
      setIsObscured(hidden);
    };
    updateVisibility();
    window.addEventListener("blur", updateVisibility);
    window.addEventListener("focus", updateVisibility);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      window.removeEventListener("blur", updateVisibility);
      window.removeEventListener("focus", updateVisibility);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const requestFullscreen = async () => {
    const element = document.documentElement;
    if (!document.fullscreenElement && element?.requestFullscreen) {
      try {
        await element.requestFullscreen();
      } catch {
        // Ignore fullscreen request failures.
      }
    }
  };

  const submitPrintJob = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { serverPrint: false };
    }
    const fileUrl = new URL(PDF_URL, window.location.origin).toString();
    const response = await fetch(`${API_BASE}/v1/print/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        file_url: fileUrl,
        job_type: "diagnostic_print",
      }),
    });
    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      return { serverPrint: false };
    }
    return payload?.data || { serverPrint: false };
  };

  const handlePrint = async () => {
    await requestFullscreen();
    let serverPrinted = false;
    try {
      const result = await submitPrintJob();
      serverPrinted = result?.serverPrint === true;
    } catch {
      serverPrinted = false;
    }
    setPrinted(true);
    if (!serverPrinted) {
      window.print();
    }
  };

  return (
    <div
      className={`diagnostic-page minimal ${isObscured ? "obscured" : ""}`}
      onClick={requestFullscreen}
    >
      <div className="watermark" aria-hidden="true" />
      {isObscured ? <div className="screen-shield" aria-hidden="true" /> : null}
      <main className="diagnostic-panel">
        <div className="pdf-shell">
          <object className="pdf-viewer" data={PDF_URL} type="application/pdf" />
        </div>

        <div className="diagnostic-actions">
          <button className="btn primary" type="button" onClick={handlePrint}>
            출력하기
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => navigate("/omr")}
            disabled={!printed}
          >
            답안 제출하기
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate("/start")}>
            다음에 응시하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default DiagnosticPrintPage;
