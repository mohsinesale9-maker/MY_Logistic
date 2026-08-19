import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";

export default function ClientStatements() {
  const { items: invoices } = useEntity("Invoice");
  const { items: payments } = useEntity("Payment");

  const statements = useMemo(() => {
    const byClient = {};
    const factures = invoices.filter((i) => i.type === "facture");
    factures.forEach((i) => {
      const c = i.client || "N/A";
      if (!byClient[c]) byClient[c] = { factures: 0, paye: 0, enRetard: 0, nbFactures: 0 };
      byClient[c].factures += i.montant_ttc || 0;
      byClient[c].paye += i.montant_paye || 0;
      byClient[c].nbFactures++;
      if (i.statut === "en_retard") byClient[c].enRetard += i.montant_ttc - (i.montant_paye || 0);
    });
    const clientPayments = payments.filter((p) => p.type === "client");
    clientPayments.forEach((p) => {
      const c = p.payeur || "N/A";
      if (!byClient[c]) byClient[c] = { factures: 0, paye: 0, enRetard: 0, nbFactures: 0 };
      byClient[c].paye += p.montant || 0;
    });
    return Object.entries(byClient).map(([client, d]) => ({
      client,
      ...d,
      solde: d.factures - d.paye,
    })).sort((a, b) => b.solde - a.solde);
  }, [invoices, payments]);

  const totalFacture = statements.reduce((s, c) => s + c.factures, 0);
  const totalPaye = statements.reduce((s, c) => s + c.paye, 0);
  const totalSolde = statements.reduce((s, c) => s + c.solde, 0);
  const totalRetard = statements.reduce((s, c) => s + c.enRetard, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Relevé Réglements Clients" subtitle="Situation des comptes clients" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total facturé" value={logisticsMath.formatCurrency(totalFacture)} icon={DollarSign} color="primary" />
        <KPICard title="Total encaissé" value={logisticsMath.formatCurrency(totalPaye)} icon={CheckCircle} color="success" />
        <KPICard title="Solde dû" value={logisticsMath.formatCurrency(totalSolde)} icon={AlertTriangle} color="warning" />
        <KPICard title="En retard" value={logisticsMath.formatCurrency(totalRetard)} icon={AlertTriangle} color="destructive" />
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Relevé par client</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Client</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Factures</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Encaissé</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">En retard</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Solde</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((s) => (
                <tr key={s.client} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{s.client}</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatCurrency(s.factures)}</td>
                  <td className="py-2 px-3 text-right text-success">{logisticsMath.formatCurrency(s.paye)}</td>
                  <td className="py-2 px-3 text-right text-destructive">{s.enRetard > 0 ? logisticsMath.formatCurrency(s.enRetard) : "—"}</td>
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