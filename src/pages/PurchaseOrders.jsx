import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "numero", label: "N° Commande", className: "font-medium" },
  { key: "fournisseur_nom", label: "Fournisseur" },
  { key: "article_ref", label: "Article" },
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
  {
    key: "total",
    label: "Total",
    render: (val) => logisticsMath.formatCurrency(val),
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
];

const formFields = [
  { key: "numero", label: "N° Commande", type: "text" },
  { key: "fournisseur_nom", label: "Fournisseur", type: "text" },
  { key: "article_ref", label: "Référence article", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "quantite", label: "Quantité", type: "number" },
  { key: "prix_prevu", label: "Prix prévu (MAD)", type: "number" },
  { key: "prix_reel", label: "Prix réel (MAD)", type: "number" },
  { key: "total", label: "Total (MAD)", type: "number" },
  {
    key: "delai_respecte",
    label: "Délai respecté",
    type: "boolean",
  },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "en_attente", label: "En attente" },
      { value: "confirmee", label: "Confirmée" },
      { value: "livree", label: "Livrée" },
      { value: "annulee", label: "Annulée" },
    ],
  },
];

export default function PurchaseOrders() {
  return (
    <CrudPage
      entityName="PurchaseOrder"
      title="Commandes d'achat"
      subtitle="Gestion des commandes auprès des fournisseurs"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvelle commande"
    />
  );
}