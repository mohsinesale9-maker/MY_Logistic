import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { Fuel as FuelIcon, TrendingUp, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import PageHeader from "@/components/erp/PageHeader";

export default function Consommation() {
  const { items } = useEntity("FuelRecord");

  const stats = useMemo(() => {
    const totalLitres = items.reduce((s, f) => s + (f.litres || 0), 0);
    const totalCost = items.reduce((s, f) => s + (f.litres || 0) * (f.prix_litres || 0), 0);
    const totalDistance = items.reduce((s, f) => s + (f.distance_parcourue || 0), 0);
    const avgConsumption = logisticsMath.fuelConsumption(totalLitres, totalDistance);
    const avgPrice = totalLitres > 0 ? totalCost / totalLitres : 0;

    const byVehicle = {};
    items.forEach((f) => {
      const key = f.vehicule_matricule || "N/A";
      if (!byVehicle[key]) byVehicle[key] = { litres: 0, distance: 0, cost: 0, records: 0 };
      byVehicle[key].litres += f.litres || 0;
      byVehicle[key].distance += f.distance_parcourue || 0;
      byVehicle[key].cost += (f.litres || 0) * (f.prix_litres || 0);
      byVehicle[key].records++;
    });

    const chartData = Object.entries(byVehicle).map(([mat, d]) => ({
      name: mat,
      litres: Math.round(d.litres),
      cost: Math.round(d.cost),
      conso: logisticsMath.fuelConsumption(d.litres, d.distance).toFixed(1),
    }));

    const byMonth = {};
    items.forEach((f) => {
      if (f.date) {
        const m = f.date.substring(0, 7);
        if (!byMonth[m]) byMonth[m] = { litres: 0, cost: 0 };
        byMonth[m].litres += f.litres || 0;
        byMonth[m].cost += (f.litres || 0) * (f.prix_litres || 0);
      }
    });
    const monthData = Object.entries(byMonth).sort().map(([month, d]) => ({
      name: month,
      litres: Math.round(d.litres),
      cost: Math.round(d.cost),
    }));

    return { totalLitres, totalCost, totalDistance, avgConsumption, avgPrice, chartData, monthData };
  }, [items]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Consommation Carburant" subtitle="Analyse de la consommation de la flotte" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Litres consommés" value={logisticsMath.formatNumber(stats.totalLitres)} icon={FuelIcon} color="primary" subtitle="Total" />
        <KPICard title="Coût total" value={logisticsMath.formatCurrency(stats.totalCost)} icon={DollarSign} color="warning" />
        <KPICard title="Conso. moyenne" value={`${stats.avgConsumption.toFixed(1)} L/100`} icon={TrendingUp} color="info" subtitle="Flotte" />
        <KPICard title="Prix moyen/L" value={logisticsMath.formatCurrency(stats.avgPrice)} icon={DollarSign} color="success" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.chartData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Consommation par véhicule (L)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Bar dataKey="litres" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Litres" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
        {stats.monthData.length > 0 && (
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Évolution mensuelle</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Line type="monotone" dataKey="litres" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Litres" />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Coût (MAD)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}