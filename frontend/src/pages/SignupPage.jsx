import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

const GRADE_LEVELS = [
  { label: "초1", levelId: "saussure1", levelName: "소쉬르1" },
  { label: "초2", levelId: "saussure2", levelName: "소쉬르2" },
  { label: "초3", levelId: "saussure3", levelName: "소쉬르3" },
  { label: "초4", levelId: "frege1", levelName: "프레게1" },
  { label: "초5", levelId: "frege2", levelName: "프레게2" },
  { label: "초6", levelId: "frege3", levelName: "프레게3" },
  { label: "중1", levelId: "russell1", levelName: "러셀1" },
  { label: "중2", levelId: "russell2", levelName: "러셀2" },
  { label: "중3", levelId: "russell3", levelName: "러셀3" },
  { label: "고1", levelId: "wittgenstein1", levelName: "비트겐슈타인1" },
  { label: "고2", levelId: "wittgenstein2", levelName: "비트겐슈타인2" },
  { label: "고3", levelId: "wittgenstein3", levelName: "비트겐슈타인3" },
];

const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const getPhoneDigits = (value) => value.replace(/\D/g, "");

function SignupPage() {
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [school, setSchool] = useState("");
  const [levelId, setLevelId] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [accountType, setAccountType] = useState("student");
  const [diagnosticOptIn, setDiagnosticOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const response = await fetch(`${API_BASE}/v1/auth/orgs`);
        const payload = await response.json();
        if (response.ok && payload?.success) {
          setOrgs(payload.data || []);
        }
      } catch {
        setOrgs([]);
      }
    };
    loadOrgs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!orgId) {
      setError("소속 기관을 선택해 주세요.");
      return;
    }
    if (!levelId) {
      setError("학년을 선택해 주세요.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedRegion = region.trim();
    const trimmedSchool = school.trim();
    const trimmedStudentPhone = studentPhone.trim();
    const trimmedParentPhone = parentPhone.trim();
    if (!trimmedName) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!trimmedRegion) {
      setError("지역을 선택해 주세요.");
      return;
    }
    if (!trimmedSchool) {
      setError("학교를 입력해 주세요.");
      return;
    }
    if (!trimmedStudentPhone) {
      setError("학생 전화번호를 입력해 주세요.");
      return;
    }
    if (!trimmedParentPhone) {
      setError("학부모 전화번호를 입력해 주세요.");
      return;
    }
    if (getPhoneDigits(trimmedStudentPhone).length !== 11) {
      setError("학생 전화번호를 11자리로 입력해 주세요.");
      return;
    }
    if (getPhoneDigits(trimmedParentPhone).length !== 11) {
      setError("학부모 전화번호를 11자리로 입력해 주세요.");
      return;
    }
    const selectedLevel = GRADE_LEVELS.find((item) => item.levelId === levelId);
    if (!selectedLevel) {
      setError("학년 정보를 다시 선택해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login_id: loginId.trim(),
          password,
          name: trimmedName,
          org_id: orgId,
          region: trimmedRegion,
          school: trimmedSchool,
          grade_label: selectedLevel.label,
          level_id: selectedLevel.levelId,
          student_phone: trimmedStudentPhone,
          parent_phone: trimmedParentPhone,
          diagnostic_opt_in: diagnosticOptIn,
          account_type: accountType,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        const message =
          payload?.error?.message || payload?.message || "회원가입에 실패했습니다.";
        throw new Error(message);
      }
      const token = payload?.data?.access_token || payload?.data?.accessToken;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      navigate(diagnosticOptIn ? "/diagnostic/print" : "/start");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">WELCOME HOME</span>
          <h1>국어농장을 시작할 준비가 되셨나요?</h1>
          <p>
            가입 후 진단 테스트를 응시하면 학년별 12레벨 맞춤 학습이 바로 시작됩니다.
          </p>
          <div className="auth-links">
            <span>이미 계정이 있나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <h2>회원가입</h2>
            <p>기본 정보를 입력해 주세요.</p>
            <form onSubmit={handleSubmit}>
              <label>
                소속 기관
                <select value={orgId} onChange={(event) => setOrgId(event.target.value)}>
                  <option value="">기관 선택</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                회원 유형
                <select
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value)}
                >
                  <option value="student">학생</option>
                  <option value="parent">학부모</option>
                </select>
              </label>

              <label>
                학년 (레벨)
                <select value={levelId} onChange={(event) => setLevelId(event.target.value)}>
                  <option value="">학년 선택</option>
                  {GRADE_LEVELS.map((item) => (
                    <option key={item.levelId} value={item.levelId}>
                      {item.levelName} · {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                아이디
                <input
                  type="text"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                />
              </label>
              <label>
                비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </label>
              <label>
                이름
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                />
              </label>
              <label>
                지역
                <select value={region} onChange={(event) => setRegion(event.target.value)} required>
                  <option value="">지역 선택</option>
                  {REGIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                학교
                <input
                  type="text"
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  placeholder="학교명을 입력하세요"
                  required
                />
              </label>
              <label>
                학생 전화번호
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(event) => setStudentPhone(formatPhoneNumber(event.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  maxLength={13}
                  required
                />
              </label>
              <label>
                학부모 전화번호
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(event) => setParentPhone(formatPhoneNumber(event.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  maxLength={13}
                  required
                />
              </label>
              <label>
                진단 테스트 응시
                <select
                  value={diagnosticOptIn ? "yes" : "no"}
                  onChange={(event) => setDiagnosticOptIn(event.target.value === "yes")}
                >
                  <option value="yes">응시하기</option>
                  <option value="no">응시하지 않음</option>
                </select>
              </label>
              {error ? <div className="auth-error">{error}</div> : null}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={loading}>
                  {loading ? "처리 중..." : "회원가입"}
                </button>
                <Link className="auth-secondary" to="/login">
                  로그인
                </Link>
              </div>
            </form>
            <div className="auth-links">
              <Link to="/reset">비밀번호 찾기</Link>
              <Link to="/">랜딩 페이지</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SignupPage;
