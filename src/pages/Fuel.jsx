import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Card } from "@/components/ui/card";
import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Fuel as FuelIcon, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import KPICard from "@/components/erp/KPICard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const columns = [
  { key: "vehicule_matricule", label: "Véhicule", className: "font-medium" },
  {
    key: "date",
    label: "Date",
    render: (val) => logisticsMath.formatDate(val),
  },
  { key: "chauffeur", label: "Chauffeur" },
  {
    key: "litres",
    label: "Litres",
    render: (val) => `${logisticsMath.formatNumber(val)} L`,
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
  {
    key: "prix_litres",
    label: "Prix/L",
    render: (val) => logisticsMath.formatCurrency(val),
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "distance_parcourue",
    label: "Distance",
    render: (val) => `${logisticsMath.formatNumber(val)} km`,
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "litres",
    label: "Conso. (L/100)",
    render: (val, item) =>
      item.distance_parcourue > 0
        ? `${logisticsMath.fuelConsumption(val, item.distance_parcourue).toFixed(1)} L/100`
        : "—",
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "type_carburant",
    label: "Type",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "vehicule_matricule", label: "Matricule véhicule", type: "text", placeholder: "ex: 12345-A-6" },
  { key: "date", label: "Date", type: "date" },
  { key: "chauffeur", label: "Chauffeur", type: "text" },
  { key: "litres", label: "Litres", type: "number", step: "0.1" },
  { key: "prix_litres", label: "Prix par litre (MAD)", type: "number", step: "0.1" },
  { key: "distance_parcourue", label: "Distance parcourue (km)", type: "number" },
  { key: "kilometrage", label: "Kilométrage total", type: "number" },
  {
    key: "type_carburant",
    label: "Type carburant",
    type: "select",
    options: [
      { value: "diesel", label: "Diesel" },
      { value: "essence", label: "Essence" },
      { value: "gpl", label: "GPL" },
    ],
  },
  { key: "station", label: "Station", type: "text", fullWidth: true },
  { key: "consommation_standard", label: "Consommation standard (L/100)", type: "number", step: "0.1" },
];

function FuelDashboard() {
  const { items } = useEntity("FuelRecord");

  const stats = useMemo(() => {
    const totalLitres = items.reduce((s, f) => s + (f.litres || 0), 0);
    const totalCost = items.reduce((s, f) => s + (f.litres || 0) * (f.prix_litres || 0), 0);
    const totalDistance = items.reduce((s, f) => s + (f.distance_parcourue || 0), 0);
    const avgConsumption = logisticsMath.fuelConsumption(totalLitres, totalDistance);

    const byVehicle = {};
    items.forEach((f) => {
      const key = f.vehicule_matricule || "N/A";
      if (!byVehicle[key]) byVehicle[key] = { litres: 0, distance: 0, cost: 0 };
      byVehicle[key].litres += f.litres || 0;
      byVehicle[key].distance += f.distance_parcourue || 0;
      byVehicle[key].cost += (f.litres || 0) * (f.prix_litres || 0);
    });

    const anomalies = Object.entries(byVehicle)
      .map(([mat, d]) => ({
        matricule: mat,
        conso: logisticsMath.fuelConsumption(d.litres, d.distance),
        standard: 30,
        over: logisticsMath.fuelConsumption(d.litres, d.distance) > 33,
      }))
      .filter((v) => v.over);

    const chartData = Object.entries(byVehicle).map(([mat, d]) => ({
      name: mat,
      litres: Math.round(d.litres),
      cost: Math.round(d.cost),
    }));

    return { totalLitres, totalCost, totalDistance, avgConsumption, anomalies, chartData };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Litres consommés" value={logisticsMath.formatNumber(stats.totalLitres)} icon={FuelIcon} color="primary" subtitle="Total" />
        <KPICard title="Coût carburant" value={logisticsMath.formatCurrency(stats.totalCost)} icon={DollarSign} color="warning" subtitle="Total" />
        <KPICard title="Conso. moyenne" value={`${stats.avgConsumption.toFixed(1)} L/100`} icon={TrendingUp} color="info" subtitle="Flotte" />
        <KPICard title="Anomalies" value={stats.anomalies.length} icon={AlertTriangle} color="destructive" subtitle="Surconsommation" />
      </div>

      {stats.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Consommation par véhicule</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Bar dataKey="litres" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Litres" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

export default function Fuel() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <FuelDashboard />
      <CrudPage
        entityName="FuelRecord"
        title="Carburant"
        subtitle="Gestion de la consommation et des coûts carburant par véhicule"
        columns={columns}
        formFields={formFields}
        addButtonLabel="Ajouter un plein"
      />
    </div>
  );
}