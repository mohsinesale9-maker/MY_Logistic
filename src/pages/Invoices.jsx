import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import { Card } from "@/components/ui/card";
import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { FileText, DollarSign, TrendingUp, Clock } from "lucide-react";
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
  brouillon: "#6B7280",
  envoyee: "#2563EB",
  payee: "#16A34A",
  partiellement_payee: "#F59E0B",
  en_retard: "#DC2626",
  annulee: "#9CA3AF",
};

const columns = [
  { key: "numero", label: "N° Facture", className: "font-medium" },
  { key: "client", label: "Client" },
  { key: "type", label: "Type", render: (val) => <StatusBadge status={val} /> },
  {
    key: "date",
    label: "Date",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "echeance",
    label: "Échéance",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "montant_ttc",
    label: "Montant TTC",
    render: (val) => logisticsMath.formatCurrency(val),
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
  {
    key: "montant_paye",
    label: "Payé",
    render: (val) => logisticsMath.formatCurrency(val),
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "numero", label: "N° Facture", type: "text", placeholder: "ex: FAC-2024-001" },
  { key: "client", label: "Client", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "echeance", label: "Échéance", type: "date" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "facture", label: "Facture" },
      { value: "avoir", label: "Avoir" },
      { value: "devis", label: "Devis" },
    ],
  },
  { key: "montant_ht", label: "Montant HT (MAD)", type: "number" },
  { key: "tva", label: "TVA (MAD)", type: "number" },
  { key: "montant_ttc", label: "Montant TTC (MAD)", type: "number" },
  { key: "montant_paye", label: "Montant payé (MAD)", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "brouillon", label: "Brouillon" },
      { value: "envoyee", label: "Envoyée" },
      { value: "payee", label: "Payée" },
      { value: "partiellement_payee", label: "Partiellement payée" },
      { value: "en_retard", label: "En retard" },
      { value: "annulee", label: "Annulée" },
    ],
  },
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
];

function InvoiceDashboard() {
  const { items } = useEntity("Invoice");

  const stats = useMemo(() => {
    const totalTTC = items.filter((i) => i.type === "facture").reduce((s, i) => s + (i.montant_ttc || 0), 0);
    const totalPaye = items.reduce((s, i) => s + (i.montant_paye || 0), 0);
    const totalAvoirs = items.filter((i) => i.type === "avoir").reduce((s, i) => s + (i.montant_ttc || 0), 0);
    const enRetard = items.filter((i) => i.statut === "en_retard").length;
    const paymentRate = logisticsMath.paymentRate(totalPaye, totalTTC);

    const statusCounts = {};
    items.forEach((i) => {
      statusCounts[i.statut] = (statusCounts[i.statut] || 0) + 1;
    });
    const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalTTC, totalPaye, totalAvoirs, enRetard, paymentRate, chartData };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total factures" value={logisticsMath.formatCurrency(stats.totalTTC)} icon={FileText} color="primary" />
        <KPICard title="Total encaissé" value={logisticsMath.formatCurrency(stats.totalPaye)} icon={DollarSign} color="success" />
        <KPICard title="Taux de paiement" value={logisticsMath.formatPercent(stats.paymentRate)} icon={TrendingUp} color="info" />
        <KPICard title="En retard" value={stats.enRetard} icon={Clock} color="destructive" />
      </div>

      {stats.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Répartition par statut</h3>
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

export default function Invoices() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <InvoiceDashboard />
      <CrudPage
        entityName="Invoice"
        title="Factures & Avoirs"
        subtitle="Gestion des factures, avoirs, devis et encaissements"
        columns={columns}
        formFields={formFields}
        addButtonLabel="Nouvelle facture"
      />
    </div>
  );
}