import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "description", label: "Description", className: "font-medium" },
  { key: "categorie", label: "Catégorie", render: (v) => <StatusBadge status={v} /> },
  { key: "montant", label: "Montant", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "machine", label: "Machine" },
  { key: "fournisseur", label: "Fournisseur" },
  { key: "facture_ref", label: "Facture" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "categorie", label: "Catégorie", type: "select", options: [
    { value: "pieces", label: "Pièces" },
    { value: "main_oeuvre", label: "Main d'œuvre" },
    { value: "sous_traitance", label: "Sous-traitance" },
    { value: "outillage", label: "Outillage" },
    { value: "lubrifiants", label: "Lubrifiants" },
    { value: "autre", label: "Autre" },
  ]},
  { key: "montant", label: "Montant (MAD)", type: "number", step: "0.01" },
  { key: "date", label: "Date", type: "date" },
  { key: "machine", label: "Machine concernée", type: "text" },
  { key: "fournisseur", label: "Fournisseur", type: "text" },
  { key: "facture_ref", label: "Référence facture", type: "text" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "valide", label: "Validé" },
    { value: "en_attente", label: "En attente" },
    { value: "annule", label: "Annulé" },
  ]},
];

export default function MaintenanceExpenses() {
  return (
    <CrudPage
      entityName="MaintenanceExpense"
      title="Dépenses Maintenance"
      subtitle="Suivi des coûts de maintenance"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter une dépense"
    />
  );
}