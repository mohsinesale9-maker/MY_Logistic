import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Card } from "@/components/ui/card";
import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { ShieldCheck, Target, AlertCircle, CheckCircle } from "lucide-react";
import KPICard from "@/components/erp/KPICard";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  conforme: "#16A34A",
  non_conforme: "#DC2626",
  a_recontroler: "#F59E0B",
};

const columns = [
  { key: "numero", label: "N° Contrôle", className: "font-medium" },
  { key: "produit", label: "Produit" },
  { key: "lot", label: "Lot" },
  {
    key: "date",
    label: "Date",
    render: (val) => logisticsMath.formatDate(val),
  },
  { key: "controleur", label: "Contrôleur" },
  {
    key: "quantite_controlee",
    label: "Contrôlé",
    render: (val) => logisticsMath.formatNumber(val),
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "quantite_conforme",
    label: "Conforme",
    render: (val) => logisticsMath.formatNumber(val),
    className: "text-right",
    cellClassName: "text-right text-green-600 font-medium",
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
  { key: "numero", label: "N° Contrôle", type: "text", placeholder: "ex: QC-2024-001" },
  { key: "produit", label: "Produit", type: "text" },
  { key: "lot", label: "Lot", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "quantite_controlee", label: "Quantité contrôlée", type: "number" },
  { key: "quantite_conforme", label: "Quantité conforme", type: "number" },
  { key: "quantite_defectueuse", label: "Quantité défectueuse", type: "number" },
  { key: "type_defaut", label: "Type de défaut", type: "text" },
  { key: "controleur", label: "Contrôleur", type: "text" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "conforme", label: "Conforme" },
      { value: "non_conforme", label: "Non conforme" },
      { value: "a_recontroler", label: "À recontrôler" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

function QualityDashboard() {
  const { items } = useEntity("QualityControl");

  const stats = useMemo(() => {
    const total = items.length;
    const conforme = items.filter((q) => q.statut === "conforme").length;
    const nonConforme = items.filter((q) => q.statut === "non_conforme").length;
    const totalControle = items.reduce((s, q) => s + (q.quantite_controlee || 0), 0);
    const totalConforme = items.reduce((s, q) => s + (q.quantite_conforme || 0), 0);
    const totalDefect = items.reduce((s, q) => s + (q.quantite_defectueuse || 0), 0);
    const qualityRate = logisticsMath.qualityRate(totalConforme, totalControle);
    const rejectionRate = logisticsMath.rejectionRate(totalDefect, totalControle);

    const statusCounts = {};
    items.forEach((q) => {
      statusCounts[q.statut] = (statusCounts[q.statut] || 0) + 1;
    });
    const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { total, conforme, nonConforme, qualityRate, rejectionRate, chartData };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Contrôles qualité" value={stats.total} icon={ShieldCheck} color="primary" />
        <KPICard title="Taux de qualité" value={logisticsMath.formatPercent(stats.qualityRate)} icon={Target} color="success" />
        <KPICard title="Taux de rejet" value={logisticsMath.formatPercent(stats.rejectionRate)} icon={AlertCircle} color="destructive" />
        <KPICard title="Conformes" value={stats.conforme} icon={CheckCircle} color="info" />
      </div>

      {stats.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Répartition des contrôles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.chartData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {stats.chartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6B7280"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

export default function Quality() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <QualityDashboard />
      <CrudPage
        entityName="QualityControl"
        title="Contrôle Qualité"
        subtitle="Inspections, taux de conformité, défauts et rejets"
        columns={columns}
        formFields={formFields}
        addButtonLabel="Nouveau contrôle"
      />
    </div>
  );
}