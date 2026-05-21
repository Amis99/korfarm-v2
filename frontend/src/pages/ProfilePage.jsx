import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPut, apiPost } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/auth.css";

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
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // 학부모는 학년·학교·레벨 필드 숨김 (본인 정보 수정이므로 학생용 필드 불필요)
  const isParent = (user?.roles || []).includes("PARENT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [school, setSchool] = useState("");
  const [levelId, setLevelId] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  // N-28 (2026-05-21) — 비번 변경은 별도 영역(현재 비번 + 새 비번)으로 분리. 프로필 저장과 무관.
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [learningStartMode, setLearningStartMode] = useState("calendar");
  const [loginId, setLoginId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((profile) => {
        setLoginId(profile.login_id || profile.loginId || "");
        setName(profile.name || "");
        setRegion(profile.region || "");
        setSchool(profile.school || "");
        setLevelId(profile.level_id || profile.levelId || "");
        setStudentPhone(profile.student_phone || profile.studentPhone || "");
        setParentPhone(profile.parent_phone || profile.parentPhone || "");
        setLearningStartMode(
          (profile.learning_start_date || profile.learningStartDate) ? "day1" : "calendar"
        );
        setAvatarUrl(profile.profile_image_url || profile.profileImageUrl || "");
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) { setError("이름을 입력해 주세요."); return; }
    if (!region) { setError("지역을 선택해 주세요."); return; }
    if (!isParent && !school.trim()) { setError("학교를 입력해 주세요."); return; }
    if (!isParent && !levelId) { setError("학년을 선택해 주세요."); return; }

    const selectedLevel = !isParent ? GRADE_LEVELS.find((g) => g.levelId === levelId) : null;
    const body = {
      name: name.trim(),
      region: region.trim(),
      student_phone: studentPhone.trim(),
      parent_phone: parentPhone.trim(),
      // 학습 시작 모드 변경 비활성화 (2026-05-10) — body 에 learning_start_mode 미포함
    };
    if (!isParent) {
      body.school = school.trim();
      body.grade_label = selectedLevel?.label;
      body.level_id = levelId;
    }
    if (avatarPreview || avatarUrl) {
      body.profile_image_url = avatarPreview || avatarUrl;
    }

    setSaving(true);
    try {
      await apiPut("/v1/auth/me", body);
      setSuccess("저장되었습니다.");
      if (avatarPreview) {
        setAvatarUrl(avatarPreview);
        setAvatarPreview("");
      }
    } catch (err) {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // N-28 (2026-05-21) — 별도 비밀번호 변경 흐름. 현재 비번 확인 + 새 비번 입력 → POST /v1/auth/change-password
  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPwdError("");
    setPwdMessage("");
    if (!oldPassword) { setPwdError("현재 비밀번호를 입력해 주세요."); return; }
    if (!newPassword || newPassword.length < 8) { setPwdError("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (oldPassword === newPassword) { setPwdError("새 비밀번호는 기존과 달라야 합니다."); return; }
    setPwdSaving(true);
    try {
      await apiPost("/v1/auth/change-password", { oldPassword, newPassword });
      setPwdMessage("비밀번호가 변경되었습니다.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setPwdError(err?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-body)" }}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell" style={{ gridTemplateColumns: "1fr" }}>
        <section className="auth-panel" style={{ borderLeft: "none" }}>
          <div className="auth-card" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
            <h2>내 정보 수정</h2>
            <p>아이디: <strong>{loginId}</strong></p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "12px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#ddd",
                  backgroundImage: (avatarPreview || avatarUrl) ? `url(${avatarPreview || avatarUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #eee",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {!(avatarPreview || avatarUrl) && (
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#999" }}>person</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-input"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setError("이미지는 2MB 이하만 가능합니다.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => setAvatarPreview(ev.target.result);
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("avatar-input").click()}
                  style={{
                    padding: "6px 14px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 10,
                    background: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  사진 변경
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <label>
                이름
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              {!isParent && (
                <label>
                  학년 (레벨)
                  <select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
                    <option value="">학년 선택</option>
                    {GRADE_LEVELS.map((item) => (
                      <option key={item.levelId} value={item.levelId}>
                        {item.levelName} · {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                지역
                <select value={region} onChange={(e) => setRegion(e.target.value)} required>
                  <option value="">지역 선택</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              {!isParent && (
                <label>
                  학교
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    required
                  />
                </label>
              )}
              <label>
                학생 전화번호
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(formatPhoneNumber(e.target.value))}
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
                  onChange={(e) => setParentPhone(formatPhoneNumber(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  maxLength={13}
                />
              </label>
              {/* 학습 시작일 select 비활성화 (2026-05-10) — 일괄 day1 고정 */}
              {error && <div className="auth-error">{error}</div>}
              {success && <div style={{ color: "#27ae60", fontSize: 13 }}>{success}</div>}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </button>
                <Link className="auth-secondary" to="/start">
                  돌아가기
                </Link>
              </div>
            </form>

            {/* N-28 (2026-05-21) — 비밀번호 변경 영역. 별도 form, 현재 비번 검증 후 변경. */}
            <form onSubmit={handleChangePassword} style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <h3 style={{ fontSize: "1rem", margin: "0 0 8px", color: "#5a4030" }}>비밀번호 변경</h3>
              <label>
                현재 비밀번호
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  autoComplete="current-password"
                />
              </label>
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (8자 이상)"
                  autoComplete="new-password"
                />
              </label>
              {pwdError && <div className="auth-error">{pwdError}</div>}
              {pwdMessage && <div style={{ color: "#27ae60", fontSize: 13 }}>{pwdMessage}</div>}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={pwdSaving}>
                  {pwdSaving ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
