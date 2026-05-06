import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../utils/api";

/**
 * 분류 마스터 카탈로그 — area / sub_area / theme 3 단계 트리.
 * 학습자료 DB v2 의 corpus.area(lowercase) → 마스터 area code(대문자) 매핑 함께 제공.
 */
export const AREA_KEY_TO_MASTER = {
  reading: "READ",
  literature: "LIT",
  grammar: "GRAM",
  vocab: null,        // 어휘는 분류 마스터에 없음
  speaking: "SPEAK",
  writing: "WRITE",
  media: "MEDIA",
};

const MASTER_TO_KEY = Object.fromEntries(
  Object.entries(AREA_KEY_TO_MASTER).filter(([, v]) => v).map(([k, v]) => [v, k])
);

function unwrap(res) { return res?.data ?? res; }

export function useClassificationCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiGet("/v1/admin/classifications/all")
      .then(r => { if (mounted) setItems(unwrap(r) || []); })
      .catch(e => { if (mounted) setError(e.message || String(e)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return useMemo(() => {
    const areas = items.filter(it => it.type === "area").sort((a, b) => a.sortOrder - b.sortOrder);
    const subAreasByArea = {};
    const themesBySubArea = {};
    for (const it of items) {
      if (it.type === "sub_area" && it.parentCode) {
        (subAreasByArea[it.parentCode] = subAreasByArea[it.parentCode] || []).push(it);
      }
      if (it.type === "theme" && it.parentCode) {
        (themesBySubArea[it.parentCode] = themesBySubArea[it.parentCode] || []).push(it);
      }
    }
    Object.values(subAreasByArea).forEach(list => list.sort((a, b) => a.sortOrder - b.sortOrder));
    Object.values(themesBySubArea).forEach(list => list.sort((a, b) => a.sortOrder - b.sortOrder));

    const subAreasFor = (areaKey) => {
      const masterCode = AREA_KEY_TO_MASTER[areaKey];
      if (!masterCode) return [];
      return subAreasByArea[masterCode] || [];
    };
    const themesFor = (areaKey, subAreaLabel) => {
      const subList = subAreasFor(areaKey);
      const sub = subList.find(s => s.labelKo === subAreaLabel);
      if (!sub) return [];
      return themesBySubArea[sub.code] || [];
    };

    return {
      loading, error,
      areas, items,
      subAreasFor,
      themesFor,
      AREA_KEY_TO_MASTER,
      MASTER_TO_KEY,
    };
  }, [items, loading, error]);
}
