// Privileged user-management endpoint. Deploy with:
// supabase functions deploy manage-users

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentification requise");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) throw new Error("Session invalide");

    const adminClient = createClient(url, serviceKey);
    const { data: profile, error: profileError } = await adminClient
      .from("app_user").select("role").eq("id", caller.id).single();
    if (profileError || profile?.role !== "admin") throw new Error("Accès réservé aux administrateurs");

    const body = await request.json();
    if (body.action === "create") {
      if (!body.email || !body.password || String(body.password).length < 8) {
        throw new Error("Email et mot de passe de 8 caractères minimum requis");
      }
      const email = String(body.email).trim().toLowerCase();
      const { data: existing } = await adminClient.from("app_user").select("id").eq("email", email).maybeSingle();
      if (existing) throw new Error("Un compte avec cet email existe déjà");

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email, password: body.password, email_confirm: true,
        user_metadata: { full_name: body.full_name || email.split("@")[0], must_change_password: true },
      });
      if (createError || !created.user) throw new Error(createError?.message || "Création du compte impossible");

      const user = {
        id: created.user.id, email, full_name: body.full_name || email.split("@")[0],
        first_name: body.first_name, last_name: body.last_name, role: body.role || "user",
        statut: body.statut || "actif", departement: body.departement, telephone: body.telephone,
        must_change_password: true,
      };
      const { data: saved, error: saveError } = await adminClient.from("app_user").insert(user).select().single();
      if (saveError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw new Error(saveError.message);
      }
      return Response.json({ user: saved }, { headers: corsHeaders });
    }

    if (body.action === "reset-password") {
      if (!body.userId || !body.password || String(body.password).length < 8) throw new Error("Mot de passe de 8 caractères minimum requis");
      const { error } = await adminClient.auth.admin.updateUserById(body.userId, { password: body.password });
      if (error) throw new Error(error.message);
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    throw new Error("Action non prise en charge");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 400, headers: corsHeaders });
  }
});
