import { Link } from "react-router-dom";
import { Truck, BarChart3, ShieldCheck, Brain, ArrowRight, CheckCircle } from "lucide-react";

const MODULES = [
  { icon: Truck, title: "Exploitation & Transport", desc: "Flotte, missions, carburant, disponibilité" },
  { icon: BarChart3, title: "Finance & Commercial", desc: "Facturation, paiements, rentabilité" },
  { icon: ShieldCheck, title: "Sous-traitance & Achats", desc: "Fournisseurs, sous-traitants, suivi paiements" },
  { icon: Brain, title: "RH & Maintenance", desc: "Paie, contrats, interventions, plans d'entretien" },
];

const FEATURES = [
  "Gestion complète de la flotte et du transport",
  "Facturation, devis et avoirs automatisés",
  "Suivi des paiements clients et fournisseurs",
  "Analyse de rentabilité en temps réel",
  "Gestion RH : paie, pointage, contrats",
  "Maintenance préventive et corrective",
  "Alertes intelligentes (véhicules, RH, maintenance)",
  "Assistant IA intégré pour l'aide à la décision",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero — CSS-only gradient backdrop, no external assets. */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/50 to-navy/80" />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary-foreground">Plateforme ERP Logistique</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
            MY Logistics
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            La solution ERP complète pour piloter votre activité logistique :
            transport, finance, achats, RH et maintenance — le tout dans une plateforme unifiée.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
            >
              Accéder à la plateforme
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-white/10 text-white font-semibold border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Une plateforme, 6 modules</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour gérer votre entreprise logistique
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULES.map((m) => (
              <div key={m.title} className="p-6 rounded-xl border bg-card shadow-enterprise hover:shadow-enterprise-lg transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <m.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités clés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à digitaliser votre logistique ?</h2>
          <p className="text-white/70 mb-8">
            Rejoignez les entreprises qui font confiance à MY Logistics pour piloter leur activité.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-navy border-t border-sidebar-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sidebar-foreground">© 2026 MY Logistics — Tous droits réservés</p>
          <div className="flex items-center gap-4 text-xs text-sidebar-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Sécurisé
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Supabase
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              IA
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}