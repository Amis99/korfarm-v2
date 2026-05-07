import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPost, isPaymentRequired } from "../utils/api";
import { LEVEL_FOLDER_MAP, GRADE_TO_LEVEL } from "../constants/levels";

const BASE = import.meta.env.BASE_URL || "/";

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// 프론트의 levelFolder("saussure1") → 백엔드 levelId
// V0121 이후 DB level_id 는 소문자 통일 (saussure1, russell1 등). 그대로 사용.
const LEVEL_FOLDER_TO_BACKEND_ID = {
  saussure1: "saussure1",
  saussure2: "saussure2",
  saussure3: "saussure3",
  frege1: "frege1",
  frege2: "frege2",
  frege3: "frege3",
  russell1: "russell1",
  russell2: "russell2",
  russell3: "russell3",
  wittgenstein1: "wittgenstein1",
  wittgenstein2: "wittgenstein2",
  wittgenstein3: "wittgenstein3",
};

/**
 * 일일 퀴즈/독해 공통 로딩 훅
 * @param {object} config
 * @param {string} config.folder - 콘텐츠 폴더 ("daily-quiz" | "daily-reading")
 * @param {string} config.contentType - API content_type ("DAILY_QUIZ" | "DAILY_READING")
 * @param {string} config.errorLabel - 에러 메시지용 라벨 ("퀴즈" | "독해")
 */
export default function useDailyContent({ folder, contentType, errorLabel }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const overrideLevel = searchParams.get("level");
  const overrideDayRaw = searchParams.get("day");
  const overrideDay = (() => {
    const n = parseInt(overrideDayRaw || "", 10);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 365) return null;
    return n;
  })();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmLogId, setFarmLogId] = useState(null);
  const [dailySeedStatus, setDailySeedStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await apiGet("/v1/auth/me");
        if (!profile) {
          navigate("/login");
          return;
        }

        // URL ?level= 우선(StartPage 관리자 레벨 오버라이드 등). 없으면 프로필.
        let level = (overrideLevel && LEVEL_FOLDER_MAP[overrideLevel])
          ? overrideLevel
          : (profile.level_id || profile.levelId);
        if (!level || !LEVEL_FOLDER_MAP[level]) {
          const gradeLabel = (profile.grade_label || profile.gradeLabel || "")?.trim();
          const gradeNum = gradeLabel?.replace(/[^0-9]/g, "");
          level = GRADE_TO_LEVEL[gradeLabel] || GRADE_TO_LEVEL[gradeNum] || "saussure1";
        }

        const levelFolder = LEVEL_FOLDER_MAP[level] || "saussure1";
        const learningStartDate = profile.learning_start_date || profile.learningStartDate || null;
        let dayIndex;
        // URL ?day= 우선 (관리자 임의 날짜 미리보기). 없으면 학습시작일 또는 오늘 기반.
        if (overrideDay) {
          dayIndex = overrideDay;
        } else if (learningStartDate) {
          const start = new Date(learningStartDate);
          const now = new Date();
          start.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
          dayIndex = (diff % 365) + 1;
        } else {
          dayIndex = ((getDayOfYear() - 1) % 365) + 1;
        }
        const dayStr = String(dayIndex).padStart(3, "0");

        // DB 단일 소스 — 정적 파일 폴백은 더 이상 사용하지 않음 (학습 콘텐츠는 DB 만 권위).
        // catalog 매칭 실패 시 명확한 에러로 처리.
        let data = null;
        const backendLevelId = LEVEL_FOLDER_TO_BACKEND_ID[levelFolder];
        if (!backendLevelId) {
          throw new Error(`${errorLabel} 레벨 매핑 실패 (${levelFolder}).`);
        }
        const catalog = await apiGet(
          `/v1/learning/catalog/GENERAL?contentType=${contentType}&levelId=${backendLevelId}`
        );
        const items = Array.isArray(catalog) ? catalog : [];
        const match = items.find((it) => Number(it.dayIndex ?? it.day_index) === dayIndex);
        if (!match) {
          throw new Error(`${errorLabel} ${dayIndex}일차 콘텐츠가 DB에 없습니다.`);
        }
        const cid = match.contentId || match.content_id;
        const detail = await apiGet(`/v1/learning/content/${cid}`);
        // detail.content 가 표준양식 전체 JSON (contentId, payload 포함)
        data = detail?.content || null;
        if (!data) {
          throw new Error(`${errorLabel} 콘텐츠 본문 로드 실패 (${cid}).`);
        }
        if (!cancelled) setContent(data);
        // 일일 씨앗 현황 조회
        if (!cancelled) {
          apiGet(`/v1/learning/farm/daily-seed-status?contentType=${contentType}`)
            .then((status) => { if (!cancelled) setDailySeedStatus(status); })
            .catch(() => {});
        }

        if (data && !cancelled) {
          apiPost("/v1/learning/farm/start", {
            content_id: data.contentId || `${folder}-${levelFolder}-${dayStr}`,
            content_type: contentType,
          })
            .then((r) => { if (!cancelled) setFarmLogId(r.log_id ?? r.logId); })
            .catch((e) => {
              // 구독 필요(402) 에러는 silent — 콘텐츠 자체는 표시되며 학습 기록만 안 됨.
              // 관리자가 ?level=, ?day=로 임의 콘텐츠 미리보기 시 구독 없이도 화면 진입 가능해야 함.
              if (isPaymentRequired(e)) {
                console.warn("학습 시작 기록 생략 (구독 필요):", e.message || e);
                return;
              }
              console.error("학습 시작 기록 실패:", e);
              if (!cancelled) setError("학습 기록을 시작할 수 없습니다. 다시 시도해주세요.");
            });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [navigate, folder, contentType, errorLabel, overrideLevel, overrideDay]);

  return { content, loading, error, farmLogId, dailySeedStatus };
}
