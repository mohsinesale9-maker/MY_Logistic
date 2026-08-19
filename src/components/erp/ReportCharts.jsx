import { useState, useEffect } from "react";
import { entities } from "@/api";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#475569",
];

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function getMonth(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.getMonth();
}

function formatCurrency(val) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(val || 0) + " DH";
}

export default function ReportCharts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    ordersByStatus: [],
    stockByCategory: [],
    revenueByMonth: [],
    topClients: [],
    costsByMonth: [],
    transportByStatus: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [orders, articles, invoices, transports, clients, finance] = await Promise.all([
          entities.CustomerOrder.list().catch(() => []),
          entities.Article.list().catch(() => []),
          entities.Invoice.list().catch(() => []),
          entities.Transport.list().catch(() => []),
          entities.Client.list().catch(() => []),
          entities.FinanceTransaction.list().catch(() => []),
        ]);

        // Orders by status
        const orderStatusMap = {};
        orders.forEach((o) => {
          const s = o.statut || "inconnu";
          orderStatusMap[s] = (orderStatusMap[s] || 0) + 1;
        });
        const statusLabels = {
          en_attente: "En attente",
          confirmee: "Confirmée",
          en_cours: "En cours",
          livree: "Livrée",
          annulee: "Annulée",
        };
        const ordersByStatus = Object.entries(orderStatusMap).map(([k, v]) => ({
          name: statusLabels[k] || k,
          value: v,
        }));

        // Stock by category
        const catMap = {};
        articles.forEach((a) => {
          const c = a.categorie || "Autre";
          catMap[c] = (catMap[c] || 0) + (a.stock_physique || 0);
        });
        const stockByCategory = Object.entries(catMap)
          .map(([k, v]) => ({ name: k, value: v }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        // Revenue by month (from invoices)
        const revByMonth = new Array(12).fill(0);
        invoices.forEach((inv) => {
          const m = getMonth(inv.date);
          if (m !== null) revByMonth[m] += inv.montant_ttc || 0;
        });
        const revenueByMonth = MONTHS.map((m, i) => ({ month: m, revenue: Math.round(revByMonth[i]) }));

        // Costs by month (from finance charges)
        const costByMonth = new Array(12).fill(0);
        finance.forEach((f) => {
          if (f.type === "charge") {
            const m = getMonth(f.date);
            if (m !== null) costByMonth[m] += f.montant || 0;
          }
        });
        const costsByMonth = MONTHS.map((m, i) => ({ month: m, cout: Math.round(costByMonth[i]) }));

        // Top clients by total order amount
        const clientMap = {};
        orders.forEach((o) => {
          const c = o.client || "Inconnu";
          clientMap[c] = (clientMap[c] || 0) + (o.total || 0);
        });
        const topClients = Object.entries(clientMap)
          .map(([k, v]) => ({ name: k, montant: Math.round(v) }))
          .sort((a, b) => b.montant - a.montant)
          .slice(0, 6);

        // Transport by status
        const transStatusMap = {};
        transports.forEach((t) => {
          const s = t.statut || "inconnu";
          transStatusMap[s] = (transStatusMap[s] || 0) + 1;
        });
        const transLabels = {
          planifiee: "Planifiée",
          en_cours: "En cours",
          terminee: "Terminée",
          annulee: "Annulée",
        };
        const transportByStatus = Object.entries(transStatusMap).map(([k, v]) => ({
          name: transLabels[k] || k,
          value: v,
        }));

        setData({
          ordersByStatus,
          stockByCategory,
          revenueByMonth,
          topClients,
          costsByMonth,
          transportByStatus,
        });
      } catch (err) {
        console.error("Chart data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasRevenue = data.revenueByMonth.some((d) => d.revenue > 0);
  const hasStock = data.stockByCategory.length > 0;
  const hasOrders = data.ordersByStatus.length > 0;
  const hasClients = data.topClients.length > 0;
  const hasTransport = data.transportByStatus.length > 0;
  const hasCosts = data.costsByMonth.some((d) => d.cout > 0);

  const noData =
    !hasRevenue && !hasStock && !hasOrders && !hasClients && !hasTransport && !hasCosts;

  if (noData) {
    return (
      <Card className="p-8 text-center text-muted-foreground text-sm">
        Aucune donnée disponible pour générer des graphiques. Importez des données ou ajoutez des enregistrements.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold">Vue d'ensemble graphique</h2>
        <span className="text-xs text-muted-foreground">— indicateurs clés en temps réel</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hasRevenue && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Évolution du chiffre d'affaires</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.revenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revGrad)" strokeWidth={2} name="CA" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasCosts && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Évolution des charges</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.costsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="cout" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Charges" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasStock && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Répartition du stock par catégorie</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.stockByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={10}
                >
                  {data.stockByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasOrders && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Commandes par statut</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} name="Commandes" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasClients && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Top 6 clients par chiffre d'affaires</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topClients} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="montant" fill="#16a34a" radius={[4, 4, 0, 0]} name="CA" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasTransport && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-4">Missions de transport par statut</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.transportByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Missions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}