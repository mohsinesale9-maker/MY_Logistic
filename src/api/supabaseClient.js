// Unified client. When VITE_SUPABASE_URL is set we talk to a real Supabase
// project; otherwise we fall back to a local in-browser store so the app
// stays usable for development and demos. Either way, callers use the same
// `from(table)` / `auth.*` shape.

import { createClient } from "@supabase/supabase-js";
import { offlineStore } from "./offlineStore";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn("[supabase] failed to init, falling back to offline store", err);
    supabase = null;
  }
}

// ─── Offline-mode "Supabase" facade ──────────────────────────────
// Mirrors the slice of the @supabase/supabase-js API used by the rest of
// the app. Each call delegates to offlineStore.

function makeOfflineClient() {
  const chainable = (state) => ({
    eq(col, val) {
      state.filters = { ...(state.filters || {}), [col]: val };
      return chainable(state);
    },
    order(col, opts = {}) {
      state.order = opts.ascending === false ? `-${col}` : col;
      return chainable(state);
    },
    limit(n) {
      state.limit = n;
      return chainable(state);
    },
    single() {
      const { data, error } = offlineStore.select(state.table, {
        order: state.order,
        limit: 1,
        filters: state.filters,
      });
      return Promise.resolve({ data: data?.[0] || null, error });
    },
    then(onFulfilled, onRejected) {
      const { data, error } = offlineStore.select(state.table, {
        order: state.order,
        limit: state.limit,
        filters: state.filters,
      });
      return Promise.resolve({ data, error }).then(onFulfilled, onRejected);
    },
  });

  return {
    from(table) {
      return {
        select(_cols = "*") {
          return chainable({ table, filters: null, order: null, limit: null });
        },
        insert(rows) {
          const list = Array.isArray(rows) ? rows : [rows];
          const { data: inserted, error } = offlineStore.bulkInsert(
            table,
            list
          );
          // Match real supabase: `insert(rows).select().single()` should
          // return the first inserted row.
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: inserted?.[0] || null,
                  error,
                }),
              then: (onFul, onRej) =>
                Promise.resolve({ data: inserted, error }).then(onFul, onRej),
            }),
            then: (onFul, onRej) =>
              Promise.resolve({ data: inserted, error }).then(onFul, onRej),
          };
        },
        update(patch) {
          return {
            eq: (col, val) => {
              // fetch matching, update each
              const { data } = offlineStore.select(table, { filters: { [col]: val } });
              const updated = data.map((r) =>
                offlineStore.update(table, r.id, patch).data
              );
              // Mimic the real supabase chain so the caller can append
              // .select() / .single() / await it.
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: updated[0] || null,
                      error: updated.length === 0 ? { message: "Not found" } : null,
                    }),
                  then: (onFul, onRej) =>
                    Promise.resolve({ data: updated, error: null }).then(onFul, onRej),
                }),
                then: (onFul, onRej) =>
                  Promise.resolve({ data: updated, error: null }).then(onFul, onRej),
              };
            },
          };
        },
        upsert(rows) {
          const list = Array.isArray(rows) ? rows : [rows];
          return Promise.resolve(offlineStore.upsert(table, list));
        },
        delete() {
          return {
            eq: (col, val) => {
              const { data } = offlineStore.select(table, { filters: { [col]: val } });
              data.forEach((r) => offlineStore.remove(table, r.id));
              return Promise.resolve({ data: data.map((d) => d.id), error: null });
            },
          };
        },
      };
    },
    auth: makeOfflineAuth(),
    storage: {
      from() {
        return {
          async upload(path, file) {
            // Convert to data URL so the page can display the logo / file
            const dataUrl = await new Promise((resolve) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result);
              r.readAsDataURL(file);
            });
            return { data: { path, publicUrl: dataUrl }, error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: path } };
          },
        };
      },
    },
  };
}

// ─── Offline auth ────────────────────────────────────────────────
function makeOfflineAuth() {
  const SESSION_KEY = "my_logistics_offline_auth";

  const load = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const save = (s) => {
    if (typeof window === "undefined") return;
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SESSION_KEY);
  };

  return {
    async getSession() {
      return { data: { session: load() }, error: null };
    },
    async getUser() {
      const s = load();
      return { data: { user: s?.user || null }, error: null };
    },
    async signInWithPassword({ email, password }) {
      if (!email) {
        return {
          data: null,
          error: { message: "Email requis" },
        };
      }
      const user = {
        id: "off_user_admin",
        email,
        full_name: email.split("@")[0],
        role: "admin",
      };
      const session = {
        access_token: "offline-token",
        refresh_token: "offline-refresh",
        user,
      };
      save(session);
      return { data: { user, session }, error: null };
    },
    async signUp({ email, password }) {
      // Simulate a "verify your email" step by NOT auto-signing-in.
      return {
        data: {
          user: { id: "off_user_pending", email },
          session: null,
        },
        error: null,
      };
    },
    async verifyOtp({ email, token }) {
      const user = {
        id: "off_user_admin",
        email,
        full_name: email.split("@")[0],
        role: "admin",
      };
      const session = {
        access_token: "offline-token",
        refresh_token: "offline-refresh",
        user,
      };
      save(session);
      return { data: { user, session }, error: null };
    },
    async resend({ email }) {
      return { data: { email }, error: null };
    },
    async resetPasswordForEmail(email) {
      return { data: { email }, error: null };
    },
    async updateUser({ password }) {
      return { data: { user: load()?.user }, error: null };
    },
    async signOut() {
      save(null);
      return { error: null };
    },
    onAuthStateChange(cb) {
      // No real subscription in offline mode; fire once with the current session.
      Promise.resolve().then(() => cb("INITIAL_SESSION", load()));
      return { data: { subscription: { unsubscribe() {} } } };
    },
  };
}

export const supabaseClient = isSupabaseConfigured ? supabase : makeOfflineClient();

export default supabaseClient;
