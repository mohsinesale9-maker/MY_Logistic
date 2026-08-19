import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "employe_nom", label: "Employé", className: "font-medium" },
  { key: "montant", label: "Montant", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "motif", label: "Motif" },
  { key: "mode_remboursement", label: "Remboursement", render: (v) => <StatusBadge status={v} /> },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "employe_nom", label: "Nom employé", type: "text" },
  { key: "montant", label: "Montant (MAD)", type: "number", step: "0.01" },
  { key: "date", label: "Date", type: "date" },
  { key: "motif", label: "Motif", type: "text", fullWidth: true },
  { key: "mode_remboursement", label: "Mode de remboursement", type: "select", options: [
    { value: "salaire", label: "Déduction salaire" },
    { value: "especes", label: "Espèces" },
    { value: "echelonné", label: "Échelonné" },
  ]},
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "accorde", label: "Accordé" },
    { value: "rembourse", label: "Remboursé" },
    { value: "partiel", label: "Partiel" },
    { value: "annule", label: "Annulé" },
  ]},
];

export default function Advances() {
  return (
    <CrudPage
      entityName="Advance"
      title="Avances"
      subtitle="Gestion des avances et prêts aux employés"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter une avance"
    />
  );
}