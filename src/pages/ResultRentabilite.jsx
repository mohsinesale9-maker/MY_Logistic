import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import PageHeader from "@/components/erp/PageHeader";

export default function ResultRentabilite() {
  const { items: invoices } = useEntity("Invoice");
  const { items: transactions } = useEntity("FinanceTransaction");
  const { items: payments } = useEntity("Payment");
  const { items: transports } = useEntity("Transport");

  const stats = useMemo(() => {
    const factures = invoices.filter((i) => i.type === "facture");
    const totalCA = factures.reduce((s, i) => s + (i.montant_ttc || 0), 0);
    const totalPaye = factures.reduce((s, i) => s + (i.montant_paye || 0), 0);

    const charges = transactions.filter((t) => t.type === "charge").reduce((s, t) => s + (t.montant || 0), 0);
    const produits = transactions.filter((t) => t.type === "produit").reduce((s, t) => s + (t.montant || 0), 0);

    const resultats = totalCA - charges;
    const marge = totalCA > 0 ? (resultats / totalCA) * 100 : 0;

    const paiementsClients = payments.filter((p) => p.type === "client").reduce((s, p) => s + (p.montant || 0), 0);
    const creances = totalCA - totalPaye;

    const chartData = [];
    const byMonth = {};
    factures.forEach((i) => {
      if (i.date) {
        const m = i.date.substring(0, 7);
        if (!byMonth[m]) byMonth[m] = { ca: 0, charge: 0 };
        byMonth[m].ca += i.montant_ttc || 0;
      }
    });
    transactions.forEach((t) => {
      if (t.date) {
        const m = t.date.substring(0, 7);
        if (!byMonth[m]) byMonth[m] = { ca: 0, charge: 0 };
        if (t.type === "charge") byMonth[m].charge += t.montant || 0;
      }
    });
    Object.entries(byMonth).sort().forEach(([month, d]) => {
      chartData.push({ name: month, ca: Math.round(d.ca), charges: Math.round(d.charge), resultat: Math.round(d.ca - d.charge) });
    });

    return { totalCA, totalPaye, charges, produits, resultats, marge, paiementsClients, creances, chartData };
  }, [invoices, transactions, payments]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Résultat & Rentabilité" subtitle="Analyse de la rentabilité de l'entreprise" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Chiffre d'affaires" value={logisticsMath.formatCurrency(stats.totalCA)} icon={DollarSign} color="primary" />
        <KPICard title="Charges totales" value={logisticsMath.formatCurrency(stats.charges)} icon={TrendingDown} color="destructive" />
        <KPICard title="Résultat" value={logisticsMath.formatCurrency(stats.resultats)} icon={TrendingUp} color={stats.resultats >= 0 ? "success" : "destructive"} />
        <KPICard title="Marge" value={`${stats.marge.toFixed(1)}%`} icon={Percent} color={stats.marge >= 0 ? "success" : "destructive"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Encaissé clients" value={logisticsMath.formatCurrency(stats.paiementsClients)} icon={TrendingUp} color="success" />
        <KPICard title="Créances" value={logisticsMath.formatCurrency(stats.creances)} icon={TrendingDown} color="warning" />
        <KPICard title="Produits financiers" value={logisticsMath.formatCurrency(stats.produits)} icon={DollarSign} color="info" />
      </div>
      {stats.chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Évolution CA / Charges / Résultat</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Area type="monotone" dataKey="ca" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.1} name="CA" />
              <Area type="monotone" dataKey="charges" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} name="Charges" />
              <Area type="monotone" dataKey="resultat" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.1} name="Résultat" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}