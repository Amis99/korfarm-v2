import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

function PdfPageViewer({ pdfUrl, pageNo, onReady }) {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const renderTaskRef = useRef(null);

  // PDF 문서 로드
  useEffect(() => {
    if (!pdfUrl) return;
    setLoading(true);
    setError(null);
    pdfjsLib
      .getDocument(pdfUrl)
      .promise.then((doc) => {
        setPdfDoc(doc);
        setLoading(false);
        onReady?.(doc.numPages);
      })
      .catch((err) => {
        setError("PDF를 불러올 수 없습니다: " + err.message);
        setLoading(false);
      });
  }, [pdfUrl]);

  // 페이지 렌더링
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdfDoc.getPage(pageNo).then((page) => {
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const task = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;
      task.promise
        .then(() => { renderTaskRef.current = null; })
        .catch(() => {});
    });
  }, [pdfDoc, pageNo]);

  if (error) {
    return <div className="cpdf-error">{error}</div>;
  }

  if (loading) {
    return (
      <div className="cpdf-loading">
        <div className="cpdf-spinner" />
        <p>PDF 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="cpdf-viewer">
      <canvas ref={canvasRef} className="cpdf-canvas" />
    </div>
  );
}

export default PdfPageViewer;
