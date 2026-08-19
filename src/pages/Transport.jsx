import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "numero", label: "N° Tournée", className: "font-medium" },
  { key: "chauffeur", label: "Chauffeur" },
  { key: "vehicule", label: "Véhicule" },
  { key: "destination", label: "Destination" },
  {
    key: "date",
    label: "Date",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "numero", label: "N° Tournée", type: "text" },
  { key: "chauffeur", label: "Chauffeur", type: "text" },
  { key: "vehicule", label: "Véhicule", type: "text" },
  { key: "destination", label: "Destination", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "distance", label: "Distance (km)", type: "number" },
  { key: "cout_transport", label: "Coût transport (MAD)", type: "number" },
  { key: "litres_carburant", label: "Carburant (litres)", type: "number" },
  { key: "capacite", label: "Capacité du véhicule (kg)", type: "number" },
  { key: "poids_charge", label: "Poids chargé (kg)", type: "number" },
  {
    key: "livraison_complete",
    label: "Livraison complète",
    type: "boolean",
  },
  {
    key: "livraison_a_temps",
    label: "Livraison à temps",
    type: "boolean",
  },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "planifiee", label: "Planifiée" },
      { value: "en_cours", label: "En cours" },
      { value: "terminee", label: "Terminée" },
      { value: "annulee", label: "Annulée" },
    ],
  },
];

export default function Transport() {
  return (
    <CrudPage
      entityName="Transport"
      title="Transport & Routes"
      subtitle="Gestion des tournées et livraisons"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvelle tournée"
    />
  );
}