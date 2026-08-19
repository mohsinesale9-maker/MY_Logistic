import { useState, useEffect, useCallback } from "react";
import { entities } from "@/api";

export function useEntity(entityName, sort = "-created_date", limit = 200) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await entities[entityName].list(sort, limit);
      setItems(data);
    } catch (err) {
      console.error(`Error loading ${entityName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [entityName, sort, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    const item = await entities[entityName].create(data);
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const update = async (id, data) => {
    const item = await entities[entityName].update(id, data);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...item } : i))
    );
    return item;
  };

  const remove = async (id) => {
    await entities[entityName].delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, loading, create, update, remove, reload: load };
}