import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, FileWarning, Car, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entities } from "@/api";

export default function NotificationsCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const allAlerts = [];

    try {
      const vehicleAlerts = await entities.VehicleAlert.list("-created_date", 50);
      vehicleAlerts
        .filter((a) => a.statut === "active")
        .forEach((a) =>
          allAlerts.push({
            id: `va-${a.id}`,
            icon: Car,
            title: `${a.vehicule_matricule} — ${a.type_alerte}`,
            description: a.description,
            niveau: a.niveau,
            path: "/alertes-vehicules",
          })
        );
    } catch {}

    try {
      const incidents = await entities.Incident.list("-created_date", 50);
      incidents
        .filter((i) => i.statut === "ouvert" || i.statut === "en_cours")
        .forEach((i) =>
          allAlerts.push({
            id: `inc-${i.id}`,
            icon: Wrench,
            title: `${i.machine} — ${i.type}`,
            description: i.description,
            niveau: i.gravite === "critique" ? "critique" : i.gravite === "majeure" ? "warning" : "info",
            path: "/pannes",
          })
        );
    } catch {}

    try {
      const invoices = await entities.Invoice.list("-created_date", 50);
      invoices
        .filter((i) => i.statut === "en_retard" || (i.statut === "partiellement_payee" && i.montant_ttc > 0))
        .forEach((i) =>
          allAlerts.push({
            id: `inv-${i.id}`,
            icon: FileWarning,
            title: `Facture ${i.numero} — ${i.client}`,
            description: i.statut === "en_retard"
              ? `En retard — ${i.montant_ttc?.toLocaleString()} DH TTC`
              : `Partiellement payée — reste ${(i.montant_ttc - (i.montant_paye || 0))?.toLocaleString()} DH`,
            niveau: i.statut === "en_retard" ? "critique" : "warning",
            path: "/factures",
          })
        );
    } catch {}

    try {
      const articles = await entities.Article.list("-created_date", 100);
      articles
        .filter((a) => a.statut === "rupture" || (a.stock_physique <= (a.seuil_securite || 0) && a.seuil_securite > 0))
        .forEach((a) =>
          allAlerts.push({
            id: `art-${a.id}`,
            icon: Package,
            title: `${a.reference} — ${a.nom}`,
            description: a.statut === "rupture"
              ? "En rupture de stock"
              : `Stock faible: ${a.stock_physique} (seuil: ${a.seuil_securite})`,
            niveau: a.statut === "rupture" ? "critique" : "warning",
            path: "/articles",
          })
        );
    } catch {}

    try {
      const plans = await entities.MaintenancePlan.list("-created_date", 50);
      plans
        .filter((p) => p.statut === "en_retard")
        .forEach((p) =>
          allAlerts.push({
            id: `mp-${p.id}`,
            icon: AlertTriangle,
            title: `${p.machine} — ${p.description || "Entretien"}`,
            description: `Entretien en retard — prévu: ${p.prochaine_date}`,
            niveau: "warning",
            path: "/plans-entretien",
          })
        );
    } catch {}

    allAlerts.sort((a, b) => {
      const order = { critique: 0, warning: 1, info: 2 };
      return order[a.niveau] - order[b.niveau];
    });

    setAlerts(allAlerts);
    setLoading(false);
  };

  useEffect(() => {
    if (open && alerts.length === 0 && !loading) {
      fetchAlerts();
    }
  }, [open]);

  const count = alerts.length;
  const badgeColor =
    alerts.some((a) => a.niveau === "critique") ? "bg-red-500" : "bg-amber-500";

  const niveauStyle = {
    critique: { dot: "bg-red-500", text: "text-red-600" },
    warning: { dot: "bg-amber-500", text: "text-amber-600" },
    info: { dot: "bg-blue-500", text: "text-blue-600" },
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        title="Notifications"
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className={`absolute top-1 right-1 w-4 h-4 ${badgeColor} text-white text-[9px] font-bold rounded-full flex items-center justify-center`}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-lg border bg-popover shadow-enterprise-lg max-h-96 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <span className="text-xs text-muted-foreground">{count} alerte{count > 1 ? "s" : ""}</span>
          </div>

          {loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chargement des alertes...
            </div>
          )}

          {!loading && count === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune alerte active
            </div>
          )}

          {!loading && count > 0 && (
            <div className="py-1">
              {alerts.map((alert) => {
                const style = niveauStyle[alert.niveau] || niveauStyle.info;
                return (
                  <button
                    key={alert.id}
                    onClick={() => {
                      navigate(alert.path);
                      setOpen(false);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                      <alert.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}