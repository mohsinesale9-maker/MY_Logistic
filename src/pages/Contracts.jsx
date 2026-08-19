import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "employe_nom", label: "Employé", className: "font-medium" },
  { key: "type", label: "Type", render: (v) => <StatusBadge status={v} /> },
  { key: "poste", label: "Poste" },
  { key: "departement", label: "Département" },
  { key: "date_debut", label: "Début", render: (v) => logisticsMath.formatDate(v) },
  { key: "date_fin", label: "Fin", render: (v) => v ? logisticsMath.formatDate(v) : "—" },
  { key: "salaire", label: "Salaire", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "employe_nom", label: "Nom employé", type: "text" },
  { key: "type", label: "Type de contrat", type: "select", options: [
    { value: "cdi", label: "CDI" },
    { value: "cdd", label: "CDD" },
    { value: "stage", label: "Stage" },
    { value: "saisonnier", label: "Saisonnier" },
    { value: "interim", label: "Intérim" },
  ]},
  { key: "poste", label: "Poste", type: "text" },
  { key: "departement", label: "Département", type: "text" },
  { key: "date_debut", label: "Date de début", type: "date" },
  { key: "date_fin", label: "Date de fin (si CDD)", type: "date" },
  { key: "salaire", label: "Salaire (MAD)", type: "number", step: "0.01" },
  { key: "fichier_url", label: "URL du contrat (optionnel)", type: "text", fullWidth: true },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "actif", label: "Actif" },
    { value: "expire", label: "Expiré" },
    { value: "resilie", label: "Résilié" },
    { value: "suspendu", label: "Suspendu" },
  ]},
];

export default function Contracts() {
  return (
    <CrudPage
      entityName="Contract"
      title="Contrats"
      subtitle="Gestion des contrats de travail"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un contrat"
    />
  );
}