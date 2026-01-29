import { useEffect, useState } from "react";
import { apiGet } from "../utils/adminApi";

const EMPTY_ARRAY = [];

export const useAdminList = (path, initialData, mapper) => {
  const [data, setData] = useState(initialData ?? EMPTY_ARRAY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!path) {
      return () => {
        active = false;
      };
    }
    setLoading(true);
    apiGet(path)
      .then((result) => {
        if (!active) {
          return;
        }
        const mapped = mapper ? mapper(result) : result;
        setData(Array.isArray(mapped) ? mapped : initialData ?? EMPTY_ARRAY);
        setError("");
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message || "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [path, mapper, initialData]);

  return { data, loading, error };
};
