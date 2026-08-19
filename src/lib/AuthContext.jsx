import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, isSupabaseConfigured } from '@/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // Boot: confirm there is a Supabase (or offline) backend reachable, then
  // resolve the current session.
  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    try {
      // We don't fetch a "public settings" record any more — the Supabase
      // client either works or it doesn't. Treat both real Supabase and the
      // offline fallback as a healthy backend.
      setAppPublicSettings({ id: "my-logistics", provider: isSupabaseConfigured ? "supabase" : "offline" });
      // Always query the client for a session — the offline client also
      // honours this and returns its localStorage-backed session.
      const { supabaseClient } = await import('@/api/supabaseClient');
      const { data: sess } = await supabaseClient.auth.getSession();
      if (sess?.session) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } catch (err) {
      console.error('App state check failed:', err);
      setAuthError({ type: 'unknown', message: err.message || 'Échec de chargement' });
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.error('User auth check failed:', err);
      setIsAuthenticated(false);
      setUser(null);
      // 401 = no session — that's a normal "logged out" state, not a hard error.
      if (err?.status === 401) {
        setAuthError({ type: 'auth_required', message: 'Authentification requise' });
      } else {
        setAuthError({ type: 'unknown', message: err.message || 'Erreur d’authentification' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    // The shim handles the redirect to /login.
    auth.logout('/login');
  };

  const navigateToLogin = () => {
    auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
