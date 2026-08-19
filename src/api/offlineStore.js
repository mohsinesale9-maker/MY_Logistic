// In-browser offline storage that mimics the slice of Supabase we use.
// The whole app falls back to this when VITE_SUPABASE_URL is empty, so the
// user can demo/test every page before connecting a real Supabase project.
//
// Data lives in localStorage under a single namespaced key. Methods return
// shapes compatible with @supabase/supabase-js where it makes sense so the
// rest of the codebase never needs a branch.

const STORAGE_KEY = "my_logistics_offline_v1";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[offlineStore] write failed", err);
  }
}

function uid() {
  return (
    "off_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

function nowIso() {
  return new Date().toISOString();
}

function ensureBucket(store, name) {
  if (!store[name]) store[name] = [];
  return store[name];
}

export const offlineStore = {
  isEnabled() {
    return typeof window !== "undefined";
  },

  // Insert a row. Returns { data, error } like Supabase.
  insert(table, row) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    const record = {
      id: row.id || uid(),
      created_date: row.created_date || nowIso(),
      updated_date: nowIso(),
      created_by_id: row.created_by_id || null,
      ...row,
    };
    bucket.unshift(record);
    writeAll(store);
    return { data: record, error: null };
  },

  // Select rows. Supports `order` (string column with optional leading "-"),
  // `limit`, and a simple `eq` filter object { column: value }.
  select(table, { order, limit, filters } = {}) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    let rows = [...bucket];
    if (filters) {
      Object.entries(filters).forEach(([col, val]) => {
        rows = rows.filter((r) => r[col] === val);
      });
    }
    if (order) {
      const desc = order.startsWith("-");
      const col = desc ? order.slice(1) : order;
      rows.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        return (av < bv ? -1 : 1) * (desc ? -1 : 1);
      });
    }
    if (typeof limit === "number") rows = rows.slice(0, limit);
    return { data: rows, error: null };
  },

  update(table, id, patch) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    const idx = bucket.findIndex((r) => r.id === id);
    if (idx === -1) return { data: null, error: { message: "Not found" } };
    bucket[idx] = { ...bucket[idx], ...patch, updated_date: nowIso() };
    writeAll(store);
    return { data: bucket[idx], error: null };
  },

  remove(table, id) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    const next = bucket.filter((r) => r.id !== id);
    store[table] = next;
    writeAll(store);
    return { data: { id }, error: null };
  },

  // Bulk insert (for imports).
  bulkInsert(table, rows) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    const ts = nowIso();
    const records = rows.map((r) => ({
      id: r.id || uid(),
      created_date: r.created_date || ts,
      updated_date: ts,
      created_by_id: r.created_by_id || null,
      ...r,
    }));
    bucket.unshift(...records);
    writeAll(store);
    return { data: records, error: null };
  },

  // Upsert: insert or update by id.
  upsert(table, rows) {
    const store = readAll();
    const bucket = ensureBucket(store, table);
    const ts = nowIso();
    const out = [];
    rows.forEach((r) => {
      const idx = bucket.findIndex((x) => x.id === r.id);
      if (idx === -1) {
        const rec = {
          id: r.id || uid(),
          created_date: r.created_date || ts,
          updated_date: ts,
          created_by_id: r.created_by_id || null,
          ...r,
        };
        bucket.unshift(rec);
        out.push(rec);
      } else {
        bucket[idx] = { ...bucket[idx], ...r, updated_date: ts };
        out.push(bucket[idx]);
      }
    });
    writeAll(store);
    return { data: out, error: null };
  },

  // Auth simulation: a single demo user so the app boots.
  // Stored in localStorage so reloads keep the session.
  loadAuth() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("my_logistics_offline_auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveAuth(session) {
    if (typeof window === "undefined") return;
    try {
      if (session) {
        window.localStorage.setItem(
          "my_logistics_offline_auth",
          JSON.stringify(session)
        );
      } else {
        window.localStorage.removeItem("my_logistics_offline_auth");
      }
    } catch {
      /* ignore */
    }
  },

  reset() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("my_logistics_offline_auth");
  },
};

export default offlineStore;
