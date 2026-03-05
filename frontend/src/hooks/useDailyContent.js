import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { LEVEL_FOLDER_MAP, GRADE_TO_LEVEL } from "../constants/levels";

const BASE = import.meta.env.BASE_URL || "/";

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 일일 퀴즈/독해 공통 로딩 훅
 * @param {object} config
 * @param {string} config.folder - 콘텐츠 폴더 ("daily-quiz" | "daily-reading")
 * @param {string} config.contentType - API content_type ("DAILY_QUIZ" | "DAILY_READING")
 * @param {string} config.errorLabel - 에러 메시지용 라벨 ("퀴즈" | "독해")
 */
export default function useDailyContent({ folder, contentType, errorLabel }) {
  const navigate = useNavigate();
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

        let level = profile.level_id || profile.levelId;
        if (!level || !LEVEL_FOLDER_MAP[level]) {
          const gradeLabel = (profile.grade_label || profile.gradeLabel || "")?.trim();
          const gradeNum = gradeLabel?.replace(/[^0-9]/g, "");
          level = GRADE_TO_LEVEL[gradeLabel] || GRADE_TO_LEVEL[gradeNum] || "saussure1";
        }

        const levelFolder = LEVEL_FOLDER_MAP[level] || "saussure1";
        const learningStartDate = profile.learning_start_date || profile.learningStartDate || null;
        let dayIndex;
        if (learningStartDate) {
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

        const isJson = (res) =>
          res.ok && (res.headers.get("content-type") || "").includes("application/json");

        const res = await fetch(`${BASE}${folder}/${levelFolder}/${dayStr}.json`);
        let data = null;
        if (isJson(res)) {
          data = await res.json();
          if (!cancelled) setContent(data);
        } else {
          const fallbackRes = await fetch(`${BASE}${folder}/${levelFolder}/001.json`);
          if (!isJson(fallbackRes)) throw new Error(`${errorLabel} 데이터를 불러올 수 없습니다.`);
          data = await fallbackRes.json();
          if (!cancelled) setContent(data);
        }
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
  }, [navigate, folder, contentType, errorLabel]);

  return { content, loading, error, farmLogId, dailySeedStatus };
}
