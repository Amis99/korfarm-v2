import { useEffect } from "react";

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`ldb-toast ${type}`}>{msg}</div>;
}

export default Toast;
