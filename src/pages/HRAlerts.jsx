import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Users, UserX, FileWarning, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";

export default function HRAlerts() {
  const { items: employees } = useEntity("Employee");
  const { items: contracts } = useEntity("Contract");
  const { items: advances } = useEntity("Advance");
  const { items: timesheets } = useEntity("Timesheet");

  const alerts = useMemo(() => {
    const list = [];
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    contracts.forEach((c) => {
      if (c.date_fin && c.type !== "cdi") {
        const fin = new Date(c.date_fin);
        if (fin < today && c.statut === "actif") {
          list.push({ type: "Contrat expiré", employe: c.employe_nom, detail: `Expiré le ${logisticsMath.formatDate(c.date_fin)}`, niveau: "critique" });
        } else if (fin < in30Days && c.statut === "actif") {
          list.push({ type: "Contrat bientôt expiré", employe: c.employe_nom, detail: `Expire le ${logisticsMath.formatDate(c.date_fin)}`, niveau: "warning" });
        }
      }
    });

    employees.forEach((e) => {
      if (e.statut === "inactif") {
        list.push({ type: "Employé inactif", employe: e.nom, detail: e.poste || "", niveau: "info" });
      }
    });

    advances.forEach((a) => {
      if (a.statut === "accorde" && a.montant > 5000) {
        list.push({ type: "Avance importante", employe: a.employe_nom, detail: logisticsMath.formatCurrency(a.montant), niveau: "warning" });
      }
    });

    const todayStr = today.toISOString().split("T")[0];
    const absentToday = timesheets.filter((t) => t.date === todayStr && (t.statut === "absent" || t.absent));
    absentToday.forEach((t) => {
      list.push({ type: "Absent aujourd'hui", employe: t.employe_nom, detail: t.motif_absence || "Non justifié", niveau: "warning" });
    });

    return list;
  }, [employees, contracts, advances, timesheets]);

  const criticalCount = alerts.filter((a) => a.niveau === "critique").length;
  const warningCount = alerts.filter((a) => a.niveau === "warning").length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Alertes RH" subtitle="Suivi des alertes ressources humaines" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total alertes" value={alerts.length} icon={AlertTriangle} color="destructive" />
        <KPICard title="Critiques" value={criticalCount} icon={UserX} color="destructive" />
        <KPICard title="Warnings" value={warningCount} icon={FileWarning} color="warning" />
        <KPICard title="Employés actifs" value={employees.filter((e) => e.statut === "actif").length} icon={Users} color="success" />
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Liste des alertes</h3>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune alerte. Tout est sous contrôle.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.niveau} />
                  <div>
                    <p className="text-sm font-medium">{a.type}</p>
                    <p className="text-xs text-muted-foreground">{a.employe} — {a.detail}</p>
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