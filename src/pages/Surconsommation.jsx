import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { AlertTriangle, Fuel, TrendingUp, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import PageHeader from "@/components/erp/PageHeader";

const STANDARD_CONSO = 30;

export default function Surconsommation() {
  const { items } = useEntity("FuelRecord");

  const stats = useMemo(() => {
    const byVehicle = {};
    items.forEach((f) => {
      const key = f.vehicule_matricule || "N/A";
      if (!byVehicle[key]) byVehicle[key] = { litres: 0, distance: 0, cost: 0, records: 0, chauffeur: f.chauffeur };
      byVehicle[key].litres += f.litres || 0;
      byVehicle[key].distance += f.distance_parcourue || 0;
      byVehicle[key].cost += (f.litres || 0) * (f.prix_litres || 0);
      byVehicle[key].records++;
    });

    const all = Object.entries(byVehicle).map(([mat, d]) => {
      const conso = logisticsMath.fuelConsumption(d.litres, d.distance);
      return {
        matricule: mat,
        litres: Math.round(d.litres),
        distance: Math.round(d.distance),
        cost: Math.round(d.cost),
        conso: conso,
        ecart: conso - STANDARD_CONSO,
        surconsommation: conso > STANDARD_CONSO * 1.1,
        chauffeur: d.chauffeur,
        surcout: d.distance > 0 ? (conso - STANDARD_CONSO) * d.distance / 100 * (d.cost / d.litres || 0) : 0,
      };
    });

    const anomalies = all.filter((v) => v.surconsommation);
    const totalSurcout = anomalies.reduce((s, v) => s + v.surcout, 0);

    return { all, anomalies, totalSurcout };
  }, [items]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Surconsommation Carburant" subtitle={`Détection des véhicules dépassant la consommation standard (${STANDARD_CONSO} L/100km)`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Véhicules analysés" value={stats.all.length} icon={Fuel} color="primary" />
        <KPICard title="Anomalies détectées" value={stats.anomalies.length} icon={AlertTriangle} color="destructive" />
        <KPICard title="Surcoût estimé" value={logisticsMath.formatCurrency(stats.totalSurcout)} icon={DollarSign} color="warning" />
        <KPICard title="Conso. standard" value={`${STANDARD_CONSO} L/100`} icon={TrendingUp} color="info" />
      </div>
      {stats.anomalies.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Véhicules en surconsommation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.anomalies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} unit=" L/100" />
              <YAxis type="category" dataKey="matricule" tick={{ fontSize: 12, fill: "#6B7280" }} width={80} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} formatter={(v) => `${v} L/100km`} />
              <Bar dataKey="conso" radius={[0, 6, 6, 0]} name="Consommation">
                {stats.anomalies.map((_, i) => (
                  <Cell key={i} fill="hsl(var(--destructive))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Détail des anomalies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Matricule</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Chauffeur</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Litres</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Distance</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Conso.</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Écart</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Surcoût</th>
              </tr>
            </thead>
            <tbody>
              {stats.anomalies.map((v) => (
                <tr key={v.matricule} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{v.matricule}</td>
                  <td className="py-2 px-3">{v.chauffeur || "—"}</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatNumber(v.litres)} L</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatNumber(v.distance)} km</td>
                  <td className="py-2 px-3 text-right font-bold text-destructive">{v.conso.toFixed(1)} L/100</td>
                  <td className="py-2 px-3 text-right text-destructive">+{v.ecart.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right text-warning font-medium">{logisticsMath.formatCurrency(v.surcout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}