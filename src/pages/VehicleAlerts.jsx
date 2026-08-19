import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "vehicule_matricule", label: "Véhicule", className: "font-medium" },
  { key: "type_alerte", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "description", label: "Description" },
  { key: "niveau", label: "Niveau", render: (v) => <StatusBadge status={v} /> },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "vehicule_matricule", label: "Matricule véhicule", type: "text", placeholder: "ex: 12345-A-6" },
  { key: "type_alerte", label: "Type d'alerte", type: "select", options: [
    { value: "assurance", label: "Assurance" },
    { value: "visite_technique", label: "Visite technique" },
    { value: "vignette", label: "Vignette" },
    { value: "licence", label: "Licence" },
    { value: "maintenance", label: "Maintenance" },
    { value: "panne", label: "Panne" },
    { value: "kilometrage", label: "Kilométrage" },
  ]},
  { key: "description", label: "Description", type: "textarea", fullWidth: true },
  { key: "niveau", label: "Niveau", type: "select", options: [
    { value: "info", label: "Info" },
    { value: "warning", label: "Warning" },
    { value: "critique", label: "Critique" },
  ]},
  { key: "date", label: "Date", type: "date" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "resolue", label: "Résolue" },
    { value: "ignoree", label: "Ignorée" },
  ]},
];

export default function VehicleAlerts() {
  return (
    <CrudPage
      entityName="VehicleAlert"
      title="Alertes Véhicules"
      subtitle="Suivi des alertes et échéances de la flotte"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter une alerte"
    />
  );
}