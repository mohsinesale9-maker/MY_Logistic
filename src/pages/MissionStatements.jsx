import { useEntity } from "@/hooks/useEntity";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import KPICard from "@/components/erp/KPICard";
import { logisticsMath } from "@/lib/logistics-math";
import { Truck, DollarSign, Package, CheckCircle } from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";

export default function MissionStatements() {
  const { items: transports } = useEntity("Transport");
  const { items: orders } = useEntity("CustomerOrder");

  const stats = useMemo(() => {
    const byClient = {};
    transports.forEach((t) => {
      const c = t.destination || t.chauffeur || "N/A";
      if (!byClient[c]) byClient[c] = { missions: 0, cout: 0, distance: 0, completes: 0 };
      byClient[c].missions++;
      byClient[c].cout += t.cout_transport || 0;
      byClient[c].distance += t.distance || 0;
      if (t.statut === "terminee") byClient[c].completes++;
    });

    const byMonth = {};
    transports.forEach((t) => {
      if (t.date) {
        const m = t.date.substring(0, 7);
        if (!byMonth[m]) byMonth[m] = { missions: 0, cout: 0 };
        byMonth[m].missions++;
        byMonth[m].cout += t.cout_transport || 0;
      }
    });
    const chartData = Object.entries(byMonth).sort().map(([month, d]) => ({
      name: month,
      missions: d.missions,
      cout: Math.round(d.cout),
    }));

    const totalMissions = transports.length;
    const totalCout = transports.reduce((s, t) => s + (t.cout_transport || 0), 0);
    const totalDistance = transports.reduce((s, t) => s + (t.distance || 0), 0);
    const totalCompletes = transports.filter((t) => t.statut === "terminee").length;

    return { byClient: Object.entries(byClient).map(([client, d]) => ({ client, ...d })).sort((a, b) => b.missions - a.missions), totalMissions, totalCout, totalDistance, totalCompletes, chartData };
  }, [transports]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Relevé Missions Clients" subtitle="Synthèse des missions de transport par client" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard title="Total missions" value={stats.totalMissions} icon={Truck} color="primary" />
        <KPICard title="Coût total" value={logisticsMath.formatCurrency(stats.totalCout)} icon={DollarSign} color="warning" />
        <KPICard title="Distance totale" value={`${logisticsMath.formatNumber(stats.totalDistance)} km`} icon={Package} color="info" />
        <KPICard title="Missions terminées" value={stats.totalCompletes} icon={CheckCircle} color="success" />
      </div>
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Relevé par client / destination</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Client / Destination</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Missions</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Complétées</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Distance</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Coût</th>
              </tr>
            </thead>
            <tbody>
              {stats.byClient.map((s) => (
                <tr key={s.client} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{s.client}</td>
                  <td className="py-2 px-3 text-center">{s.missions}</td>
                  <td className="py-2 px-3 text-center">{s.completes}</td>
                  <td className="py-2 px-3 text-right">{logisticsMath.formatNumber(s.distance)} km</td>
                  <td className="py-2 px-3 text-right font-medium">{logisticsMath.formatCurrency(s.cout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}