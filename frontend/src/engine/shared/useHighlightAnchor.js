import { useLayoutEffect, useState } from "react";

/**
 * 모듈 내 하이라이트 요소의 위치를 .engine-body 기준으로 계산하여
 * QuestionModal의 anchorRect로 사용할 수 있는 값을 반환한다.
 *
 * @param {React.RefObject} rootRef  모듈 루트 요소의 ref
 * @param {string}          selector 하이라이트 요소 CSS 선택자
 * @param {Array}           deps     재계산 트리거 의존성 배열
 */
export default function useHighlightAnchor(rootRef, selector, deps) {
  const [anchorRect, setAnchorRect] = useState(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const container = root.closest(".engine-body");
    if (!container) return;
    const highlight = root.querySelector(selector);
    if (!highlight) {
      setAnchorRect(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const scale = containerRect.width / container.offsetWidth || 1;
    const rect = highlight.getBoundingClientRect();
    setAnchorRect({
      left: (rect.left - containerRect.left) / scale,
      right: (rect.right - containerRect.left) / scale,
      top: (rect.top - containerRect.top) / scale,
      height: rect.height / scale,
    });
  }, deps);

  return anchorRect;
}
