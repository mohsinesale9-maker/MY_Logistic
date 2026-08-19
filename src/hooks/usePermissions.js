import { useState, useEffect, useCallback } from "react";
import { entities } from "@/api";
import { useAuth } from "@/lib/AuthContext";

// Per-user cache so switching accounts doesn't reuse another user's permissions.
const cacheByUserId = {};
let fetchPromiseByUserId = {};

export function usePermissions() {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Bust cache whenever the user changes (login / logout / switch account).
  useEffect(() => {
    cacheByUserId[userId] = undefined;
    fetchPromiseByUserId[userId] = null;
  }, [userId]);

  const fetch = useCallback(async () => {
    if (!user) {
      setPermissions({});
      setLoading(false);
      return {};
    }
    // Admins have full access — bypass DB query entirely.
    if (user.role === "admin") {
      const adminPerms = { _admin: true };
      cacheByUserId[userId] = adminPerms;
      setPermissions(adminPerms);
      setLoading(false);
      return adminPerms;
    }
    // Return cached result if we already fetched for this user.
    if (cacheByUserId[userId]) {
      setPermissions(cacheByUserId[userId]);
      setLoading(false);
      return cacheByUserId[userId];
    }
    if (!fetchPromiseByUserId[userId]) {
      fetchPromiseByUserId[userId] = entities.UserPermission.list()
        .then((records) => {
          const map = {};
          (records || []).forEach((r) => {
            if (r.user_email === user.email) {
              map[r.module] = r;
            }
          });
          cacheByUserId[userId] = map;
          return map;
        })
        .catch(() => {
          cacheByUserId[userId] = {};
          return {};
        });
    }
    const result = await fetchPromiseByUserId[userId];
    setPermissions(result);
    setLoading(false);
    return result;
  }, [user, userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(async () => {
    if (userId) {
      delete cacheByUserId[userId];
      fetchPromiseByUserId[userId] = null;
    }
    setLoading(true);
    await fetch();
  }, [fetch, userId]);

  const can = useCallback(
    (module, action) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (permissions?._admin) return true;
      const perm = permissions?.[module];
      if (!perm) return false;
      // For "view" action, check can_view; for all other actions (create, edit,
      // delete) check can_create / can_edit / can_delete explicitly.
      if (action === "view") return !!perm.can_view;
      if (action === "create") return !!perm.can_create;
      if (action === "edit") return !!perm.can_edit;
      if (action === "delete") return !!perm.can_delete;
      return !!perm[`can_${action}`];
    },
    [user, permissions]
  );

  return { permissions, loading, can, refresh };
}

export function clearPermissionsCache() {
  Object.keys(cacheByUserId).forEach((k) => delete cacheByUserId[k]);
  Object.keys(fetchPromiseByUserId).forEach((k) => delete fetchPromiseByUserId[k]);
}