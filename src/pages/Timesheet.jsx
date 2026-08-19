import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "employe_nom", label: "Employé", className: "font-medium" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "heure_arrivee", label: "Arrivée" },
  { key: "heure_depart", label: "Départ" },
  { key: "heures_travaillees", label: "Heures", render: (v) => `${v || 0}h`, className: "text-right", cellClassName: "text-right" },
  { key: "heures_supplementaires", label: "Heures sup.", render: (v) => v > 0 ? `${v}h` : "—", className: "text-right", cellClassName: "text-right" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "employe_nom", label: "Nom employé", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "heure_arrivee", label: "Heure d'arrivée", type: "time" },
  { key: "heure_depart", label: "Heure de départ", type: "time" },
  { key: "heures_travaillees", label: "Heures travaillées", type: "number", step: "0.5" },
  { key: "heures_normales", label: "Heures normales", type: "number", step: "0.5" },
  { key: "heures_supplementaires", label: "Heures supplémentaires", type: "number", step: "0.5" },
  { key: "absent", label: "Absent", type: "switch" },
  { key: "motif_absence", label: "Motif d'absence", type: "textarea", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "present", label: "Présent" },
    { value: "absent", label: "Absent" },
    { value: "conge", label: "Congé" },
    { value: "mission", label: "Mission" },
  ]},
];

export default function Timesheet() {
  return (
    <CrudPage
      entityName="Timesheet"
      title="Pointage"
      subtitle="Suivi de présence et heures travaillées"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un pointage"
    />
  );
}