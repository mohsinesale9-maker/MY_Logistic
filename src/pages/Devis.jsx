import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "numero", label: "Numéro", className: "font-medium" },
  { key: "client", label: "Client" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "montant_ht", label: "Montant HT", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "tva", label: "TVA", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "montant_ttc", label: "Montant TTC", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "numero", label: "Numéro du devis", type: "text" },
  { key: "client", label: "Client", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "echeance", label: "Validité", type: "date" },
  { key: "montant_ht", label: "Montant HT (MAD)", type: "number", step: "0.01" },
  { key: "tva", label: "TVA (MAD)", type: "number", step: "0.01" },
  { key: "montant_ttc", label: "Montant TTC (MAD)", type: "number", step: "0.01" },
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "brouillon", label: "Brouillon" },
    { value: "envoyee", label: "Envoyé" },
    { value: "payee", label: "Accepté" },
    { value: "annulee", label: "Refusé" },
  ]},
];

const filterFn = (item) => item.type === "devis";

export default function Devis() {
  return (
    <CrudPage
      entityName="Invoice"
      title="Devis"
      subtitle="Devis envoyés aux clients"
      columns={columns}
      formFields={formFields}
      filterFn={filterFn}
      onTransform={(data) => ({ ...data, type: "devis" })}
      addButtonLabel="Ajouter un devis"
    />
  );
}