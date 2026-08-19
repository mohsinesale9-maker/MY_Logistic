import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Boxes,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Email ou mot de passe invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — video background + full structure */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/login-video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/65 to-slate-900/80" />

        {/* Logo — creative, using user's logo PNG */}
        <div className="relative z-10">
          <img src="/logo.png" alt="MYLogistic" className="h-14 object-contain" />
          <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-blue-200/70 mt-0.5">
            Manage &middot; Optimize &middot; Deliver
          </p>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Gérez votre logistique
              <br />
              en toute simplicité
            </h1>
            <p className="text-blue-100 mt-4 text-lg">
              La plateforme ERP complète pour piloter votre supply chain.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: "Tableaux de bord et KPIs en temps réel" },
              { icon: Boxes, text: "Gestion complète des stocks et entrepôts" },
              { icon: ShieldCheck, text: "Sécurisé et disponible 24/7" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span className="text-blue-50">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-blue-200">
          MYLogistic &mdash; Manage &middot; Optimize &middot; Deliver
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="MYLogistic" className="h-10 object-contain" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Connectez-vous à votre compte
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 text-xs">
            Uniquement accessible aux administrateurs.
            <br />
            Contactez votre administrateur pour créer un compte.
          </p>
        </div>
      </div>
    </div>
  );
}
