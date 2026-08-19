import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "numero", label: "N° Commande", className: "font-medium" },
  { key: "client", label: "Client" },
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
  { key: "client", label: "Client", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "article_ref", label: "Référence article", type: "text" },
  { key: "quantite", label: "Quantité", type: "number" },
  { key: "total", label: "Total (MAD)", type: "number" },
  { key: "adresse_livraison", label: "Adresse de livraison", type: "text", fullWidth: true },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "en_attente", label: "En attente" },
      { value: "en_cours", label: "En cours" },
      { value: "livree", label: "Livrée" },
      { value: "annulee", label: "Annulée" },
    ],
  },
];

export default function CustomerOrders() {
  return (
    <CrudPage
      entityName="CustomerOrder"
      title="Commandes clients"
      subtitle="Gestion des commandes et livraisons clients"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvelle commande"
    />
  );
}