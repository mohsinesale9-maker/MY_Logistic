import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "vehicule_matricule", label: "Véhicule", className: "font-medium" },
  { key: "type_document", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "numero", label: "Numéro" },
  { key: "date_emission", label: "Émission", render: (v) => logisticsMath.formatDate(v) },
  { key: "date_expiration", label: "Expiration", render: (v) => logisticsMath.formatDate(v) },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "vehicule_matricule", label: "Matricule véhicule", type: "text", placeholder: "ex: 12345-A-6" },
  { key: "type_document", label: "Type de document", type: "select", options: [
    { value: "assurance", label: "Assurance" },
    { value: "visite_technique", label: "Visite technique" },
    { value: "carte_grise", label: "Carte grise" },
    { value: "licence_transport", label: "Licence de transport" },
    { value: "vignette", label: "Vignette" },
    { value: "autre", label: "Autre" },
  ]},
  { key: "numero", label: "Numéro du document", type: "text" },
  { key: "date_emission", label: "Date d'émission", type: "date" },
  { key: "date_expiration", label: "Date d'expiration", type: "date" },
  { key: "fichier_url", label: "URL du fichier (optionnel)", type: "text", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "valide", label: "Valide" },
    { value: "bientot_expire", label: "Bientôt expiré" },
    { value: "expire", label: "Expiré" },
  ]},
];

export default function VehicleDocuments() {
  return (
    <CrudPage
      entityName="VehicleDocument"
      title="Documents Véhicules"
      subtitle="Gestion des documents administratifs de la flotte"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un document"
    />
  );
}