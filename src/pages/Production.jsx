import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Card } from "@/components/ui/card";
import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Factory, Target, DollarSign } from "lucide-react";
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
  { key: "numero", label: "N° Ordre", className: "font-medium" },
  { key: "produit", label: "Produit" },
  { key: "machine", label: "Machine" },
  {
    key: "date_debut",
    label: "Début",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "date_fin",
    label: "Fin",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "quantite_prevue",
    label: "Prévu",
    render: (val) => logisticsMath.formatNumber(val),
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "quantite_produite",
    label: "Produit",
    render: (val) => logisticsMath.formatNumber(val),
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
  {
    key: "quantite_defectueuse",
    label: "Défets",
    render: (val) => logisticsMath.formatNumber(val),
    className: "text-right",
    cellClassName: "text-right text-red-600",
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "numero", label: "N° Ordre de production", type: "text", placeholder: "ex: OP-2024-001" },
  { key: "produit", label: "Produit", type: "text" },
  { key: "machine", label: "Machine", type: "text" },
  { key: "date_debut", label: "Date début", type: "date" },
  { key: "date_fin", label: "Date fin", type: "date" },
  { key: "quantite_prevue", label: "Quantité prévue", type: "number" },
  { key: "quantite_produite", label: "Quantité produite", type: "number" },
  { key: "quantite_defectueuse", label: "Quantité défectueuse", type: "number" },
  { key: "temps_prevu", label: "Temps prévu (h)", type: "number" },
  { key: "temps_reel", label: "Temps réel (h)", type: "number" },
  { key: "temps_arret", label: "Temps d'arrêt (h)", type: "number" },
  { key: "cout_production", label: "Coût de production (MAD)", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "planifiee", label: "Planifiée" },
      { value: "en_cours", label: "En cours" },
      { value: "terminee", label: "Terminée" },
      { value: "annulee", label: "Annulée" },
    ],
  },
];

function ProductionDashboard() {
  const { items } = useEntity("ProductionOrder");

  const stats = useMemo(() => {
    const total = items.length;
    const terminee = items.filter((p) => p.statut === "terminee").length;
    const enCours = items.filter((p) => p.statut === "en_cours").length;
    const totalProduit = items.reduce((s, p) => s + (p.quantite_produite || 0), 0);
    const totalDefect = items.reduce((s, p) => s + (p.quantite_defectueuse || 0), 0);
    const totalCout = items.reduce((s, p) => s + (p.cout_production || 0), 0);
    const qualityRate = logisticsMath.qualityRate(totalProduit - totalDefect, totalProduit);
    const completionRate = logisticsMath.maintenanceCompletionRate(terminee, total);

    const chartData = items
      .filter((p) => p.statut === "terminee")
      .map((p) => ({
        name: p.numero,
        prevu: p.quantite_prevue || 0,
        produit: p.quantite_produite || 0,
      }))
      .slice(-8);

    return { total, terminee, enCours, totalProduit, totalDefect, totalCout, qualityRate, completionRate, chartData };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Ordres de production" value={stats.total} icon={Factory} color="primary" subtitle={`${stats.enCours} en cours`} />
        <KPICard title="Taux de completion" value={logisticsMath.formatPercent(stats.completionRate)} icon={Target} color="success" />
        <KPICard title="Taux de qualité" value={logisticsMath.formatPercent(stats.qualityRate)} icon={Target} color="info" />
        <KPICard title="Coût production" value={logisticsMath.formatCurrency(stats.totalCout)} icon={DollarSign} color="warning" />
      </div>

      {stats.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Prévu vs Produit</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Bar dataKey="prevu" fill="#E5E7EB" radius={[6, 6, 0, 0]} name="Prévu" />
              <Bar dataKey="produit" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} name="Produit" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

export default function Production() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <ProductionDashboard />
      <CrudPage
        entityName="ProductionOrder"
        title="Production"
        subtitle="Ordres de production, OEE, qualité et rendement"
        columns={columns}
        formFields={formFields}
        addButtonLabel="Nouvel ordre"
      />
    </div>
  );
}