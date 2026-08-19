// Auth wrapper — Supabase-backed session and profile management.
// Calls go through `supabaseClient.auth`; the offline-mode client already
// implements every method we need.

import { supabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { entities } from "./entities";
import { functions } from "./functions";

const USERS_TABLE = "app_user";

async function getUserById(userId) {
  try {
    const { data, error } = await supabaseClient
      .from(USERS_TABLE)
      .select("*")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

async function getUserByEmail(email) {
  if (!email) return null;
  try {
    const { data, error } = await supabaseClient
      .from(USERS_TABLE)
      .select("*")
      .eq("email", email)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("supabase_access_token");
}

function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("supabase_access_token", token);
  else window.localStorage.removeItem("supabase_access_token");
}

export const auth = {
  isSupabaseConfigured,

  // Get the current user and hydrate the app_user profile row
  // (role, statut, etc.).
  async me() {
    const { data: sess } = await supabaseClient.auth.getSession();
    const session = sess?.session;
    if (!session) {
      const err = new Error("Not authenticated");
      err.status = 401;
      throw err;
    }
    const authed = session.user;
    // Look up the profile row.
    let profile = await getUserById(authed.id);
    if (!profile && authed.email) {
      profile = await getUserByEmail(authed.email);
    }
    if (!profile) {
      // Create a basic profile on the fly so the rest of the app has a user.
      profile = {
        id: authed.id,
        email: authed.email,
        full_name: authed.user_metadata?.full_name || (authed.email || "").split("@")[0],
        role: "admin",
        statut: "actif",
      };
      try {
        await supabaseClient.from(USERS_TABLE).insert(profile);
      } catch {
        /* tolerate duplicates */
      }
    }
    return { ...authed, ...profile, must_change_password: Boolean(profile.must_change_password) };
  },

  // Login via email + password. In offline mode this signs in as a demo
  // admin immediately.
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      const e = new Error(error.message || "Connexion impossible");
      e.status = 401;
      throw e;
    }
    setStoredToken(data.session?.access_token);
    return data;
  },

  // Register a new account. Supabase will send a verification email by
  // default; offline mode simulates the OTP step.
  async register({ email, password }) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Verify the OTP / email token.
  async verifyOtp({ email, otpCode, token }) {
    const finalToken = token || otpCode;
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token: finalToken,
      type: isSupabaseConfigured ? "email" : "email",
    });
    if (error) throw new Error(error.message);
    setStoredToken(data.session?.access_token);
    return data;
  },

  // Resend the verification email.
  async resendOtp(email) {
    const { error } = await supabaseClient.auth.resend({ email, type: "signup" });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Set the auth token manually (used right after verifyOtp).
  setToken(token) {
    setStoredToken(token);
  },

  // Logout, then redirect.
  async logout(redirectTo = "/login") {
    await supabaseClient.auth.signOut();
    setStoredToken(null);
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  },

  // Redirect to the login page, keeping the current URL as a returnTo param.
  redirectToLogin(returnTo) {
    if (typeof window === "undefined") return;
    const url = returnTo
      ? `/login?from_url=${encodeURIComponent(returnTo)}`
      : "/login";
    window.location.href = url;
  },

  // Trigger a password-reset email.
  async resetPasswordRequest(email) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Apply the new password (used on the reset link landing page).
  async resetPassword({ resetToken, newPassword }) {
    // In real Supabase the user lands on this page authenticated via the
    // recovery link; we just call updateUser.
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Used by accounts created by an administrator. Access to the ERP remains
  // blocked until the user has replaced their temporary password.
  async completeInitialPassword(newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    }
    const currentUser = await auth.me();
    if (!currentUser?.id) throw new Error("Session utilisateur introuvable");
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    const { error: profileError } = await supabaseClient
      .from(USERS_TABLE)
      .update({ must_change_password: false })
      .eq("id", currentUser.id);
    if (profileError) throw new Error(profileError.message);
    return { ok: true };
  },
};

// Users wrapper — invite by creating a row and setting a "pending" statut.
export const users = {
  async inviteUser(email, role = "user") {
    if (!email) throw new Error("Email requis");
    const existing = await getUserByEmail(email);
    if (existing) {
      const { error } = await supabaseClient
        .from(USERS_TABLE)
        .update({ role, statut: "actif" })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return existing;
    }
    const { data, error } = await supabaseClient
      .from(USERS_TABLE)
      .insert({
        email,
        full_name: email.split("@")[0],
        role,
        statut: "actif",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async createUserWithPassword({ email, password, full_name, first_name, last_name, role, statut, departement, telephone }) {
    if (!email || !password) throw new Error("Email et mot de passe requis");
    if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères");

    const payload = {
      email: email.trim().toLowerCase(), password,
      full_name: full_name || email.split("@")[0], first_name, last_name,
      role: role || "user", statut: statut || "actif", departement, telephone,
      must_change_password: true,
    };

    // auth.admin is intentionally unavailable to a browser using the anon
    // key. The Edge Function performs this privileged operation after
    // verifying that the caller is an administrator. If it has not been
    // deployed yet, use Supabase's standard sign-up flow so account creation
    // remains available instead of showing a technical Edge Function error.
    if (isSupabaseConfigured) {
      try {
        const { data } = await functions.invoke("manage-users", { action: "create", ...payload });
        return data?.user;
      } catch (edgeError) {
        console.warn("[users] Edge Function unavailable, using sign-up fallback:", edgeError);
        return createUserWithSignup(payload);
      }
    }

    const existing = await getUserByEmail(payload.email);
    if (existing) throw new Error("Un compte avec cet email existe déjà");
    return entities.User.create(payload);
  },

  async resetUserPassword(userId, newPassword, email) {
    if (!userId || !newPassword) throw new Error("ID utilisateur et nouveau mot de passe requis");
    if (newPassword.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères");

    if (isSupabaseConfigured) {
      try {
        await functions.invoke("manage-users", {
          action: "reset-password", userId, password: newPassword,
        });
        return { ok: true, mode: "direct" };
      } catch (edgeError) {
        // A browser cannot call Supabase's admin password API directly. When
        // the optional Edge Function is unavailable, send Supabase's secure
        // recovery email rather than exposing a technical function error.
        if (!email) throw edgeError;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(error.message);
        return { ok: true, mode: "email" };
      }
    }

    // Offline mode does not persist passwords, but supports the same UI flow.
    return { ok: true, mode: "direct" };
  },
};

async function createUserWithSignup(payload) {
  const { password, ...profile } = payload;
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const previousSession = sessionData?.session;
  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email: payload.email,
    password,
    options: { data: { full_name: payload.full_name } },
  });
  if (authError || !authData?.user) {
    throw new Error(authError?.message || "Création du compte impossible");
  }

  // With email confirmation disabled, signUp may replace the administrator's
  // session. Restore it before creating the profile row under the admin RLS
  // policy, so the administrator remains connected.
  if (previousSession?.access_token && previousSession?.refresh_token) {
    const { error: restoreError } = await supabaseClient.auth.setSession({
      access_token: previousSession.access_token,
      refresh_token: previousSession.refresh_token,
    });
    if (restoreError) throw new Error("Compte créé, mais la session administrateur doit être reconnectée.");
  }

  const { data: userData, error: userError } = await supabaseClient
    .from(USERS_TABLE)
    .insert({ id: authData.user.id, ...profile })
    .select()
    .single();
  if (userError) {
    // The auth account exists, but a meaningful message is preferable to an
    // opaque database error (for example when the email already exists).
    throw new Error(userError.message || "Le compte a été créé mais son profil n'a pas pu être enregistré.");
  }
  return userData;
}

export { isSupabaseConfigured } from "./supabaseClient";

export default auth;
