import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Truck, CheckCircle, Wrench, XCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import PageHeader from "@/components/erp/PageHeader";

const STATUS_COLORS = {
  actif: "hsl(var(--success))",
  en_panne: "hsl(var(--destructive))",
  en_maintenance: "hsl(var(--warning))",
  inactif: "hsl(var(--muted-foreground))",
};

export default function VehicleAvailability() {
  const { items, loading } = useEntity("Fleet");

  const stats = useMemo(() => {
    const byStatus = {};
    items.forEach((v) => {
      const s = v.statut || "actif";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    const total = items.length;
    const actifs = byStatus.actif || 0;
    const enPanne = byStatus.en_panne || 0;
    const enMaintenance = byStatus.en_maintenance || 0;
    const inactifs = byStatus.inactif || 0;
    const tauxDispo = total > 0 ? (actifs / total) * 100 : 0;

    const pieData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
    const byMarque = {};
    items.forEach((v) => {
      const m = v.marque || "N/A";
      if (!byMarque[m]) byMarque[m] = { total: 0, actifs: 0 };
      byMarque[m].total++;
      if (v.statut === "actif") byMarque[m].actifs++;
    });
    const barData = Object.entries(byMarque).map(([name, d]) => ({
      name,
      disponibles: d.actifs,
      total: d.total,
    }));

    return { total, actifs, enPanne, enMaintenance, inactifs, tauxDispo, pieData, barData };
  }, [items]);

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Disponibilité Flotte" subtitle="Taux de disponibilité et état de la flotte" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total véhicules" value={stats.total} icon={Truck} color="primary" />
        <KPICard title="Disponibles" value={stats.actifs} icon={CheckCircle} color="success" subtitle={`${stats.tauxDispo.toFixed(0)}%`} />
        <KPICard title="En maintenance" value={stats.enMaintenance} icon={Wrench} color="warning" />
        <KPICard title="En panne" value={stats.enPanne} icon={XCircle} color="destructive" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.pieData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Répartition par statut</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
        {stats.barData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Disponibilité par marque</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Bar dataKey="total" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="disponibles" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="Disponibles" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">État détaillé de la flotte</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Matricule</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Marque</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Modèle</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Kilométrage</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{v.matricule}</td>
                  <td className="py-2 px-3">{v.marque}</td>
                  <td className="py-2 px-3">{v.modele}</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatNumber(v.kilometrage)} km</td>
                  <td className="py-2 px-3 text-center"><StatusBadge status={v.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}