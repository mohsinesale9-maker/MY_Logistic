// Central API exports — Supabase-backed auth, entities, integrations, functions.

export { entities, tableFor, isSupabaseConfigured as entitiesConfigured } from "./entities";
export { auth, users } from "./auth";
export { integrations } from "./integrations";
export { functions } from "./functions";
export { supabaseClient, isSupabaseConfigured } from "./supabaseClient";
export { aiService } from "./aiService";
