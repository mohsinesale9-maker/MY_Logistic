import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "numero", label: "Numéro", className: "font-medium" },
  { key: "payeur", label: "Sous-traitant" },
  { key: "montant", label: "Montant", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "mode_paiement", label: "Mode", render: (v) => <StatusBadge status={v} /> },
  { key: "reference", label: "Référence" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "numero", label: "Numéro paiement", type: "text" },
  { key: "payeur", label: "Sous-traitant", type: "text" },
  { key: "montant", label: "Montant (MAD)", type: "number", step: "0.01" },
  { key: "date", label: "Date", type: "date" },
  { key: "mode_paiement", label: "Mode de paiement", type: "select", options: [
    { value: "especes", label: "Espèces" },
    { value: "cheque", label: "Chèque" },
    { value: "virement", label: "Virement" },
    { value: "carte", label: "Carte" },
    { value: "effet", label: "Effet" },
  ]},
  { key: "reference", label: "Référence", type: "text" },
  { key: "compte", label: "Compte", type: "select", options: [
    { value: "caisse", label: "Caisse" },
    { value: "banque", label: "Banque" },
  ]},
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "valide", label: "Validé" },
    { value: "en_attente", label: "En attente" },
    { value: "annule", label: "Annulé" },
  ]},
];

const filterFn = (item) => item.type === "sous_traitant";

export default function SubcontractorPayments() {
  return (
    <CrudPage
      entityName="Payment"
      title="Suivi Paiements Sous-traitants"
      subtitle="Règlements des prestations sous-traitées"
      columns={columns}
      formFields={formFields}
      filterFn={filterFn}
      onTransform={(data) => ({ ...data, type: "sous_traitant" })}
      addButtonLabel="Ajouter un paiement"
    />
  );
}