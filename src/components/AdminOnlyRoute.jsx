// Route wrapper that only allows admin users to access the wrapped route.
// Non-admin users are redirected to "/" with an access denied message.
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AdminOnlyRoute() {
  const { user, isLoadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!user || user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, isLoadingAuth, authChecked, navigate]);

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Redirecting
  }

  return <Outlet />;
}
