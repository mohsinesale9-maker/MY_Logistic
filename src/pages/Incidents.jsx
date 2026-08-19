import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "machine", label: "Machine", className: "font-medium" },
  { key: "type", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "description", label: "Description" },
  { key: "gravite", label: "Gravité", render: (v) => <StatusBadge status={v} /> },
  { key: "date_signalement", label: "Signalé le", render: (v) => logisticsMath.formatDate(v) },
  { key: "date_resolution", label: "Résolu le", render: (v) => v ? logisticsMath.formatDate(v) : "—" },
  { key: "temps_arret", label: "Arrêt (h)", render: (v) => v > 0 ? `${v}h` : "—", className: "text-right", cellClassName: "text-right" },
  { key: "responsable", label: "Responsable" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "machine", label: "Machine / Équipement", type: "text" },
  { key: "type", label: "Type", type: "select", options: [
    { value: "panne", label: "Panne" },
    { value: "incident", label: "Incident" },
    { value: "breakdown", label: "Breakdown" },
    { value: "electrique", label: "Électrique" },
    { value: "mecanique", label: "Mécanique" },
    { value: "hydraulique", label: "Hydraulique" },
  ]},
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "gravite", label: "Gravité", type: "select", options: [
    { value: "mineure", label: "Mineure" },
    { value: "majeure", label: "Majeure" },
    { value: "critique", label: "Critique" },
  ]},
  { key: "date_signalement", label: "Date de signalement", type: "date" },
  { key: "date_resolution", label: "Date de résolution", type: "date" },
  { key: "temps_arret", label: "Temps d'arrêt (heures)", type: "number", step: "0.5" },
  { key: "responsable", label: "Responsable", type: "text" },
  { key: "solution", label: "Solution apportée", type: "textarea", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "ouvert", label: "Ouvert" },
    { value: "en_cours", label: "En cours" },
    { value: "resolu", label: "Résolu" },
    { value: "ferme", label: "Fermé" },
  ]},
];

export default function Incidents() {
  return (
    <CrudPage
      entityName="Incident"
      title="Pannes & Incidents"
      subtitle="Suivi des incidents et pannes d'équipements"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Signaler un incident"
    />
  );
}