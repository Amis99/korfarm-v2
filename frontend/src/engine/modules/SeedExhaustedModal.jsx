function SeedExhaustedModal({ onRetry, onNextPage, isLastPage }) {
  return (
    <div className="result-overlay">
      <div className="result-card cpdf-exhausted-card">
        <h2>씨앗이 모두 소진되었습니다</h2>
        <p>시간이 초과되어 씨앗이 모두 사라졌습니다.</p>
        <div className="cpdf-exhausted-actions">
          <button type="button" className="cpdf-btn cpdf-btn-retry" onClick={onRetry}>
            이 페이지 재도전
          </button>
          {isLastPage ? (
            <button type="button" className="cpdf-btn cpdf-btn-next" onClick={onNextPage}>
              학습 종료
            </button>
          ) : (
            <button type="button" className="cpdf-btn cpdf-btn-next" onClick={onNextPage}>
              다음 페이지로
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeedExhaustedModal;
