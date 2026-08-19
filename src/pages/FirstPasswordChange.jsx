import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/api";
import { useAuth } from "@/lib/AuthContext";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FirstPasswordChange() {
  const navigate = useNavigate();
  const { user, authChecked, isLoadingAuth, checkUserAuth } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!user) navigate("/login", { replace: true });
    else if (!user.must_change_password) navigate("/", { replace: true });
  }, [user, authChecked, isLoadingAuth, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmation) return setError("Les mots de passe ne correspondent pas.");
    setSaving(true);
    try {
      await auth.completeInitialPassword(password);
      await checkUserAuth();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Modification du mot de passe impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Sécurisez votre compte"
      subtitle="Pour votre première connexion, choisissez un mot de passe personnel."
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="initial-password">Nouveau mot de passe</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="initial-password" type="password" autoComplete="new-password" autoFocus value={password}
              onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 caractères" className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="initial-password-confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="initial-password-confirm" type="password" autoComplete="new-password" value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)} placeholder="Répétez le mot de passe" className="h-12 pl-10" required />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full" disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : "Enregistrer et continuer"}
        </Button>
      </form>
    </AuthLayout>
  );
}
