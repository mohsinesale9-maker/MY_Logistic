import { useMemo } from "react";
import { useEntity } from "@/hooks/useEntity";
import { logisticsMath } from "@/lib/logistics-math";
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Loader2,
} from "lucide-react";
import KPICard from "@/components/erp/KPICard";
import PageHeader from "@/components/erp/PageHeader";
import StatusBadge from "@/components/erp/StatusBadge";
import DataTable from "@/components/erp/DataTable";
import { Card } from "@/components/ui/card";
import moment from "moment";

export default function Exploitation() {
  const { items: transports, loading: loadingTransports } = useEntity("Transport");
  const { items: orders, loading: loadingOrders } = useEntity("CustomerOrder");

  const loading = loadingTransports || loadingOrders;

  const stats = useMemo(() => {
    const missions = transports.length;
    const enCours = transports.filter((t) => t.statut === "en_cours").length;
    const terminees = transports.filter((t) => t.statut === "terminee").length;
    const enRetard = transports.filter((t) => {
      return (
        t.statut !== "terminee" &&
        t.statut !== "annulee" &&
        t.date &&
        moment(t.date).isBefore(moment(), "day")
      );
    }).length;

    const commandesEnCours = orders.filter(
      (o) => o.statut === "en_cours" || o.statut === "en_attente"
    ).length;
    const commandesLivrees = orders.filter(
      (o) => o.statut === "livree"
    ).length;

    const otif = logisticsMath.otif(
      transports.filter((t) => t.livraison_complete && t.livraison_a_temps)
        .length,
      transports.length
    );

    return {
      missions,
      enCours,
      terminees,
      enRetard,
      commandesEnCours,
      commandesLivrees,
      otif,
    };
  }, [transports, orders]);

  const columns = [
    { key: "numero", label: "N° Tournée", className: "font-medium" },
    { key: "chauffeur", label: "Chauffeur" },
    { key: "vehicule", label: "Véhicule" },
    { key: "destination", label: "Destination" },
    {
      key: "date",
      label: "Date",
      render: (val) => logisticsMath.formatDate(val),
    },
    {
      key: "statut",
      label: "Statut",
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Exploitation"
        subtitle="Suivi des opérations en temps réel"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard
          title="Missions totales"
          value={logisticsMath.formatNumber(stats.missions)}
          icon={Activity}
          color="primary"
        />
        <KPICard
          title="En cours"
          value={logisticsMath.formatNumber(stats.enCours)}
          icon={Clock}
          color="info"
        />
        <KPICard
          title="Terminées"
          value={logisticsMath.formatNumber(stats.terminees)}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="En retard"
          value={logisticsMath.formatNumber(stats.enRetard)}
          icon={AlertTriangle}
          color="destructive"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Commandes en cours"
          value={logisticsMath.formatNumber(stats.commandesEnCours)}
          icon={Truck}
          color="warning"
        />
        <KPICard
          title="Commandes livrées"
          value={logisticsMath.formatNumber(stats.commandesLivrees)}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Taux OTIF"
          value={logisticsMath.formatPercent(stats.otif)}
          icon={Activity}
          color="primary"
          subtitle="Livraisons complètes et à temps"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Tournées actives</h3>
        <DataTable
          columns={columns}
          data={transports.filter(
            (t) => t.statut === "en_cours" || t.statut === "planifiee"
          )}
          emptyMessage="Aucune tournée active"
        />
      </Card>
    </div>
  );
}