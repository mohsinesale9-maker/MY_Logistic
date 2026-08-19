import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "numero", label: "Numéro", className: "font-medium" },
  { key: "type", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "payeur", label: "Payeur" },
  { key: "montant", label: "Montant", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "mode_paiement", label: "Mode", render: (v) => <StatusBadge status={v} /> },
  { key: "reference", label: "Référence" },
  { key: "compte", label: "Compte", render: (v) => <StatusBadge status={v} /> },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "numero", label: "Numéro paiement", type: "text" },
  { key: "type", label: "Type", type: "select", options: [
    { value: "client", label: "Client" },
    { value: "fournisseur", label: "Fournisseur" },
    { value: "sous_traitant", label: "Sous-traitant" },
  ]},
  { key: "payeur", label: "Payeur", type: "text" },
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
  { key: "facture_ref", label: "Référence facture", type: "text" },
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

export default function Payments() {
  return (
    <CrudPage
      entityName="Payment"
      title="Paiements"
      subtitle="Suivi des encaissements et décaissements"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un paiement"
    />
  );
}