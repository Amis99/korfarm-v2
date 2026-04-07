import { forwardRef, useImperativeHandle, useRef, useState } from "react";

/**
 * 브라우저 MediaRecorder를 사용해 음성 녹음 → blob 반환.
 *
 * Props:
 *   onRecorded(blob, mime): 녹음 완료 시 호출. 부모가 업로드 처리.
 *   disabled: boolean
 *   hideButton: 자체 마이크 버튼 숨김 (외부에서 ref.start()로 트리거)
 *
 * Imperative handle:
 *   ref.start(): 녹음 시작
 */
const VoiceRecorder = forwardRef(({ onRecorded, disabled, hideButton = false }, ref) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = "audio/webm;codecs=opus";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecorded?.(blob, "audio/webm");
        // 마이크 권한 해제
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          // 60초 자동 종료
          if (s + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      alert(`마이크 권한이 필요합니다: ${e.message}`);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const cancelRecording = () => {
    if (!recording) return;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
    chunksRef.current = []; // 폐기
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
  }));

  if (recording) {
    return (
      <div className="chat-voice-recording">
        <span className="chat-voice-dot" />
        <span className="chat-voice-time">{elapsed}초 / 60초</span>
        <button type="button" className="chat-voice-stop" onClick={stopRecording}>
          전송
        </button>
        <button type="button" className="chat-voice-cancel" onClick={cancelRecording}>
          취소
        </button>
      </div>
    );
  }

  if (hideButton) return null;

  return (
    <button
      type="button"
      className="chat-icon-btn chat-voice-btn"
      onClick={startRecording}
      disabled={disabled}
      aria-label="음성 녹음"
      title="음성 메시지"
    >
      <span className="material-symbols-outlined">mic</span>
    </button>
  );
});

export default VoiceRecorder;
