import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrgSelect from "../components/OrgSelect";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";
const ORG_HQ_ID = "org_hq";

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
  const [learningStartMode, setLearningStartMode] = useState("calendar");
  const [diagnosticOptIn, setDiagnosticOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // 학부모 전용 필드
  const [linkedStudentName, setLinkedStudentName] = useState("");
  const [linkedStudentPhone, setLinkedStudentPhone] = useState("");
  const [linkedParentPhone, setLinkedParentPhone] = useState("");

  const isAutoApprove = orgId === ORG_HQ_ID;

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const response = await fetch(`${API_BASE}/v1/auth/orgs`);
        const payload = await response.json();
        if (response.ok && payload?.success) {
          const orgList = payload.data || [];
          setOrgs(orgList);
          // 기본값: 국어농장(org_hq)
          const hqOrg = orgList.find((o) => o.id === "org_hq");
          if (hqOrg && !orgId) {
            setOrgId(hqOrg.id);
          }
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
    setSuccessMessage("");

    if (!orgId) {
      setError("소속 기관을 선택해 주세요.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("이름을 입력해 주세요.");
      return;
    }

    // 학생 유형 검증
    if (accountType === "student") {
      if (!levelId) {
        setError("학년을 선택해 주세요.");
        return;
      }
      const trimmedRegion = region.trim();
      const trimmedSchool = school.trim();
      const trimmedStudentPhone = studentPhone.trim();
      const trimmedParentPhone = parentPhone.trim();

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
    }

    // 학부모 유형 검증
    if (accountType === "parent") {
      if (!linkedStudentName.trim()) {
        setError("연결할 학생 이름을 입력해 주세요.");
        return;
      }
      if (!linkedStudentPhone.trim()) {
        setError("학생 전화번호를 입력해 주세요.");
        return;
      }
      if (!linkedParentPhone.trim()) {
        setError("학부모 전화번호를 입력해 주세요.");
        return;
      }
      if (getPhoneDigits(linkedStudentPhone).length !== 11) {
        setError("학생 전화번호를 11자리로 입력해 주세요.");
        return;
      }
      if (getPhoneDigits(linkedParentPhone).length !== 11) {
        setError("학부모 전화번호를 11자리로 입력해 주세요.");
        return;
      }
    }

    const selectedLevel = accountType === "student" ? GRADE_LEVELS.find((item) => item.levelId === levelId) : null;
    if (accountType === "student" && !selectedLevel) {
      setError("학년 정보를 다시 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        login_id: loginId.trim(),
        password,
        name: trimmedName,
        org_id: orgId,
        account_type: accountType,
      };

      // 학생 유형인 경우 추가 필드
      if (accountType === "student") {
        requestBody.region = region.trim();
        requestBody.school = school.trim();
        requestBody.grade_label = selectedLevel.label;
        requestBody.level_id = selectedLevel.levelId;
        requestBody.student_phone = studentPhone.trim();
        requestBody.parent_phone = parentPhone.trim();
        requestBody.diagnostic_opt_in = diagnosticOptIn;
        requestBody.learning_start_mode = learningStartMode;
      }

      // 학부모 유형인 경우 추가 필드
      if (accountType === "parent") {
        requestBody.linked_student_name = linkedStudentName.trim();
        requestBody.linked_student_phone = linkedStudentPhone.trim();
        requestBody.linked_parent_phone = linkedParentPhone.trim();
      }

      const response = await fetch(`${API_BASE}/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        const message =
          payload?.error?.message || payload?.message || "회원가입에 실패했습니다.";
        throw new Error(message);
      }
      const token = payload?.data?.access_token || payload?.data?.accessToken;
      const pendingApproval = payload?.data?.user?.pending_approval || payload?.data?.user?.pendingApproval;

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }

      // 승인이 필요한 경우 (국어농장 외 기관) 메시지 표시 후 pending 페이지로 이동
      if (pendingApproval) {
        setSuccessMessage("가입 요청이 완료되었습니다. 소속 기관의 승인 후 이용 가능합니다.");
        setTimeout(() => {
          navigate("/pending");
        }, 2000);
      } else {
        // 국어농장인 경우 바로 진행
        navigate(diagnosticOptIn && accountType === "student" ? "/diagnostic/print" : "/start");
      }
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
                <OrgSelect
                  orgs={orgs}
                  value={orgId}
                  onChange={setOrgId}
                  placeholder="기관 선택"
                />
              </label>
              <label>
                회원 유형
                <select
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value)}
                >
                  <option value="student">학생</option>
                  <option value="parent">학부모</option>
                  <option value="org_admin">기관 관리자 (선생님)</option>
                </select>
              </label>

              {!isAutoApprove && (
                <div className="auth-notice">
                  {accountType === "student" && "제휴 기관 소속 학생은 기관 관리자의 승인 후 이용 가능합니다."}
                  {accountType === "parent" && "학부모님은 기관 관리자의 승인 후 학생 정보를 연결할 수 있습니다."}
                  {accountType === "org_admin" && "기관 관리자는 본사 승인 후 권한이 활성화됩니다."}
                </div>
              )}

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
                  placeholder="비밀번호를 입력하세요 (8자 이상)"
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

              {/* 학생 전용 필드 */}
              {accountType === "student" && (
                <>
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
                    지역
                    <select value={region} onChange={(event) => setRegion(event.target.value)}>
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
                    />
                  </label>
                  <label>
                    학습 시작일
                    <select
                      value={learningStartMode}
                      onChange={(event) => setLearningStartMode(event.target.value)}
                    >
                      <option value="day1">1일 차부터 시작</option>
                      <option value="calendar">오늘 날짜 기준</option>
                    </select>
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
                </>
              )}

              {/* 학부모 전용 필드 */}
              {accountType === "parent" && (
                <>
                  <div className="auth-info">
                    기존에 등록된 학생 정보와 일치해야 연결됩니다.
                    정보가 일치하지 않아도 가입은 가능하며, 관리자가 확인 후 연결해 드립니다.
                  </div>
                  <label>
                    연결할 학생 이름
                    <input
                      type="text"
                      value={linkedStudentName}
                      onChange={(event) => setLinkedStudentName(event.target.value)}
                      placeholder="학생 이름을 입력하세요"
                    />
                  </label>
                  <label>
                    학생 전화번호
                    <input
                      type="tel"
                      value={linkedStudentPhone}
                      onChange={(event) => setLinkedStudentPhone(formatPhoneNumber(event.target.value))}
                      placeholder="010-0000-0000"
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </label>
                  <label>
                    학부모 본인 전화번호
                    <input
                      type="tel"
                      value={linkedParentPhone}
                      onChange={(event) => setLinkedParentPhone(formatPhoneNumber(event.target.value))}
                      placeholder="010-0000-0000"
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </label>
                </>
              )}

              {/* 기관 관리자 안내 */}
              {accountType === "org_admin" && (
                <div className="auth-info">
                  기관 관리자로 가입하시면 학생 관리, 과제 출제, 성적 확인 등의 기능을 이용하실 수 있습니다.
                  가입 후 본사 승인이 완료되면 관리자 권한이 활성화됩니다.
                </div>
              )}

              {successMessage ? <div className="auth-success">{successMessage}</div> : null}
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
