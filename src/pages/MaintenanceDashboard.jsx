import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Wrench, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import PageHeader from "@/components/erp/PageHeader";

export default function MaintenanceDashboard() {
  const { items: incidents } = useEntity("Incident");
  const { items: expenses } = useEntity("MaintenanceExpense");
  const { items: plans } = useEntity("MaintenancePlan");
  const { items: interventions } = useEntity("Maintenance");

  const stats = useMemo(() => {
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter((i) => i.statut === "ouvert" || i.statut === "en_cours").length;
    const resolvedIncidents = incidents.filter((i) => i.statut === "resolu" || i.statut === "ferme").length;
    const totalExpenses = expenses.reduce((s, e) => s + (e.montant || 0), 0);
    const totalDownTime = incidents.reduce((s, i) => s + (i.temps_arret || 0), 0);
    const activePlans = plans.filter((p) => p.statut === "actif").length;
    const latePlans = plans.filter((p) => p.statut === "en_retard").length;

    const expensesByCategory = {};
    expenses.forEach((e) => {
      const cat = e.categorie || "autre";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.montant || 0);
    });
    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value: Math.round(value) }));

    const incidentsByMachine = {};
    incidents.forEach((i) => {
      const m = i.machine || "N/A";
      incidentsByMachine[m] = (incidentsByMachine[m] || 0) + 1;
    });
    const barData = Object.entries(incidentsByMachine).map(([name, value]) => ({ name, value }));

    return { totalIncidents, openIncidents, resolvedIncidents, totalExpenses, totalDownTime, activePlans, latePlans, pieData, barData };
  }, [incidents, expenses, plans]);

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Dashboard Maintenance" subtitle="Vue d'ensemble des opérations de maintenance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Incidents ouverts" value={stats.openIncidents} icon={AlertTriangle} color="destructive" subtitle={`sur ${stats.totalIncidents} total`} />
        <KPICard title="Dépenses totales" value={logisticsMath.formatCurrency(stats.totalExpenses)} icon={DollarSign} color="warning" />
        <KPICard title="Temps d'arrêt" value={`${stats.totalDownTime}h`} icon={Clock} color="destructive" />
        <KPICard title="Plans actifs" value={stats.activePlans} icon={Wrench} color="primary" subtitle={`${stats.latePlans} en retard`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.barData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Incidents par machine</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
        {stats.pieData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Dépenses par catégorie</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Incidents récents</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Machine</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Description</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Gravité</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 10).map((i) => (
                <tr key={i.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{i.machine}</td>
                  <td className="py-2 px-3">{i.description}</td>
                  <td className="py-2 px-3 text-center"><StatusBadge status={i.gravite} /></td>
                  <td className="py-2 px-3 text-center"><StatusBadge status={i.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}