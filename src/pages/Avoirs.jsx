import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "numero", label: "Numéro", className: "font-medium" },
  { key: "client", label: "Client" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "montant_ttc", label: "Montant TTC", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "description", label: "Motif" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "numero", label: "Numéro de l'avoir", type: "text" },
  { key: "client", label: "Client", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "montant_ht", label: "Montant HT (MAD)", type: "number", step: "0.01" },
  { key: "tva", label: "TVA (MAD)", type: "number", step: "0.01" },
  { key: "montant_ttc", label: "Montant TTC (MAD)", type: "number", step: "0.01" },
  { key: "description", label: "Motif de l'avoir", type: "textarea", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "brouillon", label: "Brouillon" },
    { value: "envoyee", label: "Envoyé" },
    { value: "payee", label: "Compensé" },
    { value: "annulee", label: "Annulé" },
  ]},
];

const filterFn = (item) => item.type === "avoir";

export default function Avoirs() {
  return (
    <CrudPage
      entityName="Invoice"
      title="Avoirs"
      subtitle="Notes de crédit et avoirs clients"
      columns={columns}
      formFields={formFields}
      filterFn={filterFn}
      onTransform={(data) => ({ ...data, type: "avoir" })}
      addButtonLabel="Ajouter un avoir"
    />
  );
}