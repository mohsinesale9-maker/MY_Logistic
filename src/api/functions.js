// Server-function wrapper for Supabase Edge Functions.
// In real Supabase mode we call the matching Edge Function; in offline mode
// we no-op the sync (everything is already in local storage).

import { supabaseClient, isSupabaseConfigured } from "./supabaseClient";

export const functions = {
  async invoke(name, payload = {}) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.functions.invoke(name, {
          body: payload,
        });
        if (error) throw error;
        return { data };
      } catch (err) {
        // The Edge Function may not be deployed yet — surface a friendly
        // error rather than crashing the Settings page.
        throw new Error(
          err.message ||
            `Fonction ${name} indisponible. Déployez la Supabase Edge Function correspondante.`
        );
      }
    }

    // Offline mode: the local store is already the source of truth, so the
    // sync is effectively a no-op. Return a synthetic success payload.
    return {
      data: {
        results: [
          {
            entity: "all",
            status: "success",
            records: 0,
            note: "Mode hors-ligne : les données sont déjà synchronisées dans le navigateur.",
          },
        ],
      },
    };
  },
};

export default functions;
