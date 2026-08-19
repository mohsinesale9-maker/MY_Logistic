// Real-time data hook — wraps useEntity and adds Supabase Realtime
// subscriptions so charts and KPIs update automatically when data changes
// in the database (INSERT / UPDATE / DELETE).
//
// Falls back gracefully: if Supabase is not configured or the Realtime
// channel fails to connect, the component still works via the base
// useEntity (polling on mount).

import { useEffect, useRef } from "react";
import { supabaseClient, isSupabaseConfigured } from "@/api/supabaseClient";

// Map entity names to their Supabase table names (same logic as entities.js).
const TABLE_MAP = {
  User: "app_user",
  UserPermission: "app_user_permission",
  CompanySetting: "app_company_setting",
};

function tableFor(entityName) {
  return TABLE_MAP[entityName] || entityName.toLowerCase();
}

export function useRealtime(entityName, { onInsert, onUpdate, onDelete, enabled = true } = {}) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled) return;

    const table = tableFor(entityName);
    const channelName = `realtime-${table}-${Date.now()}`;

    const channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        (payload) => {
          if (payload.new) onInsert?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table },
        (payload) => {
          if (payload.new) onUpdate?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table },
        (payload) => {
          if (payload.old) onDelete?.(payload.old);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.debug(`[realtime] subscribed to ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          console.warn(`[realtime] channel error for ${table} — Realtime may not be enabled in Supabase`);
        }
      });

    channelRef.current = channel;

    return () => {
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
    };
  }, [entityName, enabled, onInsert, onUpdate, onDelete]);
}
