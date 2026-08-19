import { useState, useEffect, useCallback } from "react";
import { entities } from "@/api";

let cache = null;
let fetchPromise = null;

export function useCompanySettings() {
  const [settings, setSettings] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  const fetch = useCallback(async () => {
    if (cache) {
      setSettings(cache);
      setLoading(false);
      return cache;
    }
    if (!fetchPromise) {
      fetchPromise = entities.CompanySetting.list()
        .then((records) => {
          cache = records && records.length > 0 ? records[0] : null;
          return cache;
        })
        .catch(() => {
          cache = null;
          return null;
        });
    }
    const result = await fetchPromise;
    setSettings(result);
    setLoading(false);
    return result;
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(async () => {
    cache = null;
    fetchPromise = null;
    setLoading(true);
    const records = await entities.CompanySetting.list().catch(() => []);
    cache = records && records.length > 0 ? records[0] : null;
    setSettings(cache);
    setLoading(false);
    return cache;
  }, []);

  return { settings, loading, refresh };
}

export function clearCompanySettingsCache() {
  cache = null;
  fetchPromise = null;
}