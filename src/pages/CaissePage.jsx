import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "description", label: "Description", className: "font-medium" },
  { key: "type", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "categorie", label: "Catégorie" },
  { key: "montant", label: "Montant", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "type", label: "Type", type: "select", options: [
    { value: "produit", label: "Produit (recette)" },
    { value: "charge", label: "Charge (dépense)" },
  ]},
  { key: "categorie", label: "Catégorie", type: "text" },
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "montant", label: "Montant (MAD)", type: "number", step: "0.01" },
  { key: "date", label: "Date", type: "date" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "valide", label: "Validé" },
    { value: "en_attente", label: "En attente" },
  ]},
];

const filterFn = (item) => item.compte === "caisse";

export default function CaissePage() {
  return (
    <CrudPage
      entityName="FinanceTransaction"
      title="Caisse"
      subtitle="Mouvements de caisse (espèces)"
      columns={columns}
      formFields={formFields}
      filterFn={filterFn}
      onTransform={(data) => ({ ...data, compte: "caisse" })}
      addButtonLabel="Ajouter un mouvement"
    />
  );
}