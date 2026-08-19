import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { AlertTriangle, Wrench, Clock, Calendar } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";

export default function MaintenanceAlerts() {
  const { items: plans } = useEntity("MaintenancePlan");
  const { items: incidents } = useEntity("Incident");
  const { items: spareParts } = useEntity("SparePart");

  const alerts = useMemo(() => {
    const list = [];
    const today = new Date();

    plans.forEach((p) => {
      if (p.prochaine_date) {
        const next = new Date(p.prochaine_date);
        if (next < today && p.statut === "actif") {
          list.push({ type: "Plan en retard", machine: p.machine, detail: `Prévu le ${logisticsMath.formatDate(p.prochaine_date)}`, niveau: "critique", date: p.prochaine_date });
        } else if (next < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && p.statut === "actif") {
          list.push({ type: "Plan à venir", machine: p.machine, detail: `Prévu le ${logisticsMath.formatDate(p.prochaine_date)}`, niveau: "warning", date: p.prochaine_date });
        }
      }
    });

    incidents.forEach((i) => {
      if (i.statut === "ouvert") {
        list.push({ type: "Incident ouvert", machine: i.machine, detail: i.description, niveau: i.gravite === "critique" ? "critique" : "warning", date: i.date_signalement });
      }
    });

    spareParts.forEach((s) => {
      if (s.stock <= s.seuil_min) {
        list.push({ type: "Stock critique", machine: s.nom, detail: `Stock: ${s.stock} / Min: ${s.seuil_min}`, niveau: s.stock === 0 ? "critique" : "warning", date: null });
      }
    });

    return list.sort((a, b) => (b.niveau === "critique" ? 1 : -1));
  }, [plans, incidents, spareParts]);

  const criticalCount = alerts.filter((a) => a.niveau === "critique").length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Alertes Maintenance" subtitle="Plans en retard, incidents et stock critique" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total alertes" value={alerts.length} icon={AlertTriangle} color="destructive" />
        <KPICard title="Critiques" value={criticalCount} icon={Clock} color="destructive" />
        <KPICard title="Plans en retard" value={alerts.filter((a) => a.type === "Plan en retard").length} icon={Calendar} color="warning" />
        <KPICard title="Stock critique" value={alerts.filter((a) => a.type === "Stock critique").length} icon={Wrench} color="warning" />
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Liste des alertes</h3>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune alerte maintenance.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.niveau} />
                  <div>
                    <p className="text-sm font-medium">{a.type}</p>
                    <p className="text-xs text-muted-foreground">{a.machine} — {a.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}