import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "machine", label: "Machine", className: "font-medium" },
  { key: "type", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "frequence", label: "Fréquence" },
  { key: "description", label: "Description" },
  { key: "derniere_date", label: "Dernière", render: (v) => v ? logisticsMath.formatDate(v) : "—" },
  { key: "prochaine_date", label: "Prochaine", render: (v) => logisticsMath.formatDate(v) },
  { key: "responsable", label: "Responsable" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "machine", label: "Machine / Équipement", type: "text" },
  { key: "type", label: "Type", type: "select", options: [
    { value: "preventive", label: "Préventive" },
    { value: "corrective", label: "Corrective" },
    { value: "inspection", label: "Inspection" },
  ]},
  { key: "frequence", label: "Fréquence", type: "select", options: [
    { value: "quotidien", label: "Quotidien" },
    { value: "hebdomadaire", label: "Hebdomadaire" },
    { value: "mensuel", label: "Mensuel" },
    { value: "trimestriel", label: "Trimestriel" },
    { value: "semestriel", label: "Semestriel" },
    { value: "annuel", label: "Annuel" },
  ]},
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "derniere_date", label: "Dernière intervention", type: "date" },
  { key: "prochaine_date", label: "Prochaine intervention", type: "date" },
  { key: "responsable", label: "Responsable", type: "text" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "actif", label: "Actif" },
    { value: "en_attente", label: "En attente" },
    { value: "termine", label: "Terminé" },
    { value: "en_retard", label: "En retard" },
  ]},
];

export default function MaintenancePlans() {
  return (
    <CrudPage
      entityName="MaintenancePlan"
      title="Plans d'Entretien"
      subtitle="Planning des maintenances préventives"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un plan"
    />
  );
}