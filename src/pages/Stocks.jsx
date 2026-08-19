import { useMemo } from "react";
import { useEntity } from "@/hooks/useEntity";
import { logisticsMath } from "@/lib/logistics-math";
import {
  Boxes,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import KPICard from "@/components/erp/KPICard";
import PageHeader from "@/components/erp/PageHeader";
import StatusBadge from "@/components/erp/StatusBadge";
import DataTable from "@/components/erp/DataTable";
import { Card } from "@/components/ui/card";

export default function Stocks() {
  const { items, loading } = useEntity("Article");

  const articles = useMemo(() => {
    return items.map((a) => {
      const stockDispo = logisticsMath.stockDisponible(
        a.stock_physique,
        a.stock_reserve
      );
      const rop = logisticsMath.pointCommande(
        a.consommation_moyenne,
        a.lead_time,
        a.seuil_securite
      );
      const eoq = logisticsMath.eoq(
        a.demande_annuelle,
        a.cout_commande,
        a.cout_stockage
      );
      const valeur =
        (a.stock_physique || 0) * (a.cout_unitaire || 0);
      const rotation = logisticsMath.rotation(
        (a.consommation_moyenne || 0) * 30,
        a.stock_physique
      );
      const couverture = logisticsMath.couverture(
        stockDispo,
        a.consommation_moyenne
      );
      return {
        ...a,
        _stockDispo: stockDispo,
        _rop: rop,
        _eoq: eoq,
        _valeur: valeur,
        _rotation: rotation,
        _couverture: couverture,
      };
    });
  }, [items]);

  const totalValeur = articles.reduce((s, a) => s + a._valeur, 0);
  const totalDispo = articles.reduce((s, a) => s + a._stockDispo, 0);
  const enRupture = articles.filter(
    (a) => a.statut === "rupture" || a._stockDispo <= 0
  ).length;
  const aCommander = articles.filter((a) => a._stockDispo <= a._rop).length;

  const columns = [
    { key: "reference", label: "Référence", className: "font-medium" },
    { key: "nom", label: "Article" },
    { key: "warehouse_nom", label: "Entrepôt" },
    {
      key: "_stockDispo",
      label: "Disponible",
      render: (val) => (
        <span
          className={val <= 0 ? "text-red-600 font-semibold" : ""}
        >
          {logisticsMath.formatNumber(val)}
        </span>
      ),
    },
    {
      key: "_rop",
      label: "Point cmd.",
      render: (val) => logisticsMath.formatNumber(Math.round(val)),
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "_eoq",
      label: "Qté écon. (EOQ)",
      render: (val) => logisticsMath.formatNumber(Math.round(val)),
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "_rotation",
      label: "Rotation",
      render: (val) => `${(val || 0).toFixed(1)}x`,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "_couverture",
      label: "Couverture",
      render: (val) => `${(val || 0).toFixed(0)} j`,
      className: "text-right",
      cellClassName: "text-right",
    },
    {
      key: "_valeur",
      label: "Valeur",
      render: (val) => logisticsMath.formatCurrency(val),
      className: "text-right",
      cellClassName: "text-right font-medium",
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
        title="Stocks"
        subtitle="Gestion et analyse des stocks avec calculs automatiques"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <KPICard
          title="Valeur du stock"
          value={logisticsMath.formatCurrency(totalValeur)}
          icon={DollarSign}
          color="primary"
        />
        <KPICard
          title="Stock disponible"
          value={logisticsMath.formatNumber(totalDispo)}
          icon={Boxes}
          color="info"
          subtitle="unités totales"
        />
        <KPICard
          title="Articles en rupture"
          value={logisticsMath.formatNumber(enRupture)}
          icon={AlertTriangle}
          color="destructive"
        />
        <KPICard
          title="À commander"
          value={logisticsMath.formatNumber(aCommander)}
          icon={ShoppingCart}
          color="warning"
          subtitle="stock ≤ point de commande"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Inventaire détaillé</h3>
        <DataTable
          columns={columns}
          data={articles}
          emptyMessage="Aucun article. Ajoutez des articles depuis la page Articles."
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-3">Formules appliquées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div>
            <strong>Stock disponible</strong> = Stock physique − Stock réservé
          </div>
          <div>
            <strong>Point de commande (ROP)</strong> = (Consommation × Lead
            Time) + Stock de sécurité
          </div>
          <div>
            <strong>Quantité économique (EOQ)</strong> = √(2 × Demande × Coût
            commande / Coût stockage)
          </div>
          <div>
            <strong>Rotation</strong> = Consommation mensuelle / Stock moyen
          </div>
          <div>
            <strong>Couverture</strong> = Stock disponible / Consommation
            moyenne
          </div>
          <div>
            <strong>Valeur du stock</strong> = Σ(Quantité × Coût unitaire)
          </div>
        </div>
      </Card>
    </div>
  );
}