import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { ShoppingCart, CheckCircle, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";

export default function PurchaseStatements() {
  const { items: orders } = useEntity("PurchaseOrder");
  const { items: payments } = useEntity("Payment");

  const statements = useMemo(() => {
    const bySupplier = {};
    orders.forEach((o) => {
      const s = o.fournisseur_nom || "N/A";
      if (!bySupplier[s]) bySupplier[s] = { commandes: 0, paye: 0, nbCommandes: 0 };
      bySupplier[s].commandes += o.total || 0;
      bySupplier[s].nbCommandes++;
    });
    const supplierPayments = payments.filter((p) => p.type === "fournisseur");
    supplierPayments.forEach((p) => {
      const s = p.payeur || "N/A";
      if (!bySupplier[s]) bySupplier[s] = { commandes: 0, paye: 0, nbCommandes: 0 };
      bySupplier[s].paye += p.montant || 0;
    });
    return Object.entries(bySupplier).map(([fournisseur, d]) => ({
      fournisseur,
      ...d,
      solde: d.commandes - d.paye,
    })).sort((a, b) => b.solde - a.solde);
  }, [orders, payments]);

  const totalCommandes = statements.reduce((s, c) => s + c.commandes, 0);
  const totalPaye = statements.reduce((s, c) => s + c.paye, 0);
  const totalSolde = statements.reduce((s, c) => s + c.solde, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Relevé des Achats" subtitle="Situation des comptes fournisseurs" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total commandes" value={logisticsMath.formatCurrency(totalCommandes)} icon={ShoppingCart} color="primary" />
        <KPICard title="Total payé" value={logisticsMath.formatCurrency(totalPaye)} icon={CheckCircle} color="success" />
        <KPICard title="Solde dû" value={logisticsMath.formatCurrency(totalSolde)} icon={AlertTriangle} color="warning" />
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Relevé par fournisseur</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fournisseur</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Nb cmdes</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Commandes</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Payé</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Solde</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((s) => (
                <tr key={s.fournisseur} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{s.fournisseur}</td>
                  <td className="py-2 px-3 text-center">{s.nbCommandes}</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatCurrency(s.commandes)}</td>
                  <td className="py-2 px-3 text-right text-success">{logisticsMath.formatCurrency(s.paye)}</td>
                  <td className={`py-2 px-3 text-right font-bold ${s.solde > 0 ? "text-warning" : "text-success"}`}>{logisticsMath.formatCurrency(s.solde)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}