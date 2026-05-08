import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../utils/api";
import "../styles/persona-select.css";

const PERSONA_NAMES = {
  owl: "부엉이샘",
  amis: "아미스샘",
  nurungji: "누룽지샘",
};

const PERSONAS = [
  {
    key: "owl",
    tint: "tint-cream",
    art: "owl",
    face: "🦉",
    name: "부엉이샘",
    tagline: "지혜롭고 차분하게 가르쳐요",
    sample: "음, 학생. 오늘은 비문학 한 편을 천천히 살펴봅시다. 차근차근 풀어보면 답이 보일 거예요.",
  },
  {
    key: "amis",
    tint: "tint-green",
    art: "amis",
    face: "🧑‍🏫",
    name: "아미스샘",
    tagline: "친근하고 든든한 선생님",
    sample: "오! 어제 진짜 잘했어! 오늘은 어휘 보강하면 딱이지. 같이 화이팅하자 💪",
  },
  {
    key: "nurungji",
    tint: "tint-rose",
    art: "nurungji",
    face: "👩‍🏫",
    name: "누룽지샘",
    tagline: "활기차고 따뜻한 선생님",
    sample: "어머~ 이 단어 진짜 헷갈리지~? 선생님이 쉽게 알려줄게, 걱정 마! 🌻",
  },
];

function TutorPersonaSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 현재 선택된 페르소나 fetch (있으면 미리 표시)
  useEffect(() => {
    apiGet("/v1/tutor/persona")
      .then((d) => {
        const cur = d?.persona;
        if (cur && PERSONA_NAMES[cur]) setSelected(cur);
      })
      .catch(() => {});
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function selectCard(key) {
    setSelected(key);
    showToast(`${PERSONA_NAMES[key]}을 선택했어요`);
  }

  async function startWith(key) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiPut("/v1/tutor/persona", { persona: key });
      showToast(`${PERSONA_NAMES[key]}과 함께 시작해요!`);
      setTimeout(() => navigate("/start-new"), 600);
    } catch (e) {
      console.error("persona save failed", e);
      showToast("저장 실패 — 잠시 후 다시 시도해 주세요");
      setSubmitting(false);
    }
  }

  function handleCardClick(key) {
    if (selected === key) {
      startWith(key);
    } else {
      selectCard(key);
    }
  }

  function handleSkip(e) {
    e.preventDefault();
    showToast("나중에 마이페이지에서 선생님을 고를 수 있어요");
    setTimeout(() => navigate("/start-new"), 600);
  }

  return (
    <div className="page" data-od-id="character-select">
      <header className="top-bar">
        <a className="brand" href="/start" aria-label="국어농장 홈" onClick={(e) => { e.preventDefault(); navigate("/start"); }}>
          <img
            src={import.meta.env.BASE_URL + "korfarm-logo.png"}
            alt="국어농장"
            style={{ height: 36, width: "auto", display: "block" }}
          />
        </a>
        <a className="skip-link" href="#" onClick={handleSkip} aria-label="선생님 선택 건너뛰기">건너뛰기</a>
      </header>

      <main className="main">
        <section className="hero" aria-labelledby="hero-title">
          <span className="hero-deco left" aria-hidden="true">🌱</span>
          <span className="hero-deco right" aria-hidden="true">☀️</span>
          <span className="hero-eyebrow">
            <span className="spark" aria-hidden="true"></span>
            AI 선생님 고르기
          </span>
          <h1 className="hero-title" id="hero-title">
            함께 공부할 <strong>선생님</strong>을 골라 주세요
          </h1>
          <p className="hero-sub">
            선택한 선생님이 학생의 학습을 분석하고 추천해 드려요.<br />
            나중에 마이페이지에서 언제든 바꿀 수 있어요.
          </p>
        </section>

        <div className="grid" role="radiogroup" aria-labelledby="hero-title">
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              className={`character-card ${p.tint}`}
              role="radio"
              aria-pressed={selected === p.key ? "true" : "false"}
              aria-label={`${p.name} 선택하기`}
              onClick={() => handleCardClick(p.key)}
            >
              <span className="selected-tag" aria-hidden="true">선택됨</span>
              <div className={`character-art ${p.art}`} role="img" aria-label={`${p.name} — 캐릭터 일러스트 자리`}>
                <div className="stack">
                  <span className="face" aria-hidden="true">{p.face}</span>
                  <span className="ph-tag">캐릭터 일러스트</span>
                  <span className="ph-size">240 × 240 · 점토 아트</span>
                </div>
              </div>
              <h2 className="character-name">{p.name}</h2>
              <p className="character-tagline">{p.tagline}</p>
              <div className="sample">
                <p>{p.sample}</p>
                <span className="by"><strong>샘플 메시지</strong> · 어조 미리보기</span>
              </div>
              <span className="pick-btn">이 선생님과 시작하기</span>
            </button>
          ))}
        </div>

        <p className="footer-note">
          <span className="icon" aria-hidden="true">💡</span>
          선생님은 마이페이지에서 언제든 바꿀 수 있어요.
        </p>
      </main>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        <span className="ico" aria-hidden="true">✓</span>
        <span className="msg" dangerouslySetInnerHTML={{ __html: toast || "" }} />
      </div>
    </div>
  );
}

export default TutorPersonaSelectPage;
