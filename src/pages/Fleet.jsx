import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";
import moment from "moment";

const columns = [
  { key: "matricule", label: "Matricule", className: "font-medium" },
  { key: "marque", label: "Marque" },
  { key: "modele", label: "Modèle" },
  {
    key: "type",
    label: "Type",
    render: (val) => <StatusBadge status={val} />,
  },
  { key: "annee", label: "Année" },
  {
    key: "kilometrage",
    label: "Kilométrage",
    render: (val) => `${logisticsMath.formatNumber(val)} km`,
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "consommation_moyenne",
    label: "Conso.",
    render: (val) => `${val || 0} L/100`,
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "assurance_date_fin",
    label: "Assurance",
    render: (val) => {
      if (!val) return "—";
      const expired = moment(val).isBefore(moment(), "day");
      const soon = moment(val).isBefore(moment().add(30, "days"), "day");
      return (
        <span className={expired ? "text-red-600 font-medium" : soon ? "text-amber-600 font-medium" : ""}>
          {logisticsMath.formatDate(val)}
        </span>
      );
    },
  },
  {
    key: "visite_technique_prochaine",
    label: "Visite tech.",
    render: (val) => {
      if (!val) return "—";
      const expired = moment(val).isBefore(moment(), "day");
      const soon = moment(val).isBefore(moment().add(30, "days"), "day");
      return (
        <span className={expired ? "text-red-600 font-medium" : soon ? "text-amber-600 font-medium" : ""}>
          {logisticsMath.formatDate(val)}
        </span>
      );
    },
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "matricule", label: "Matricule", type: "text", placeholder: "ex: 12345-A-6" },
  { key: "marque", label: "Marque", type: "text", placeholder: "ex: Mercedes" },
  { key: "modele", label: "Modèle", type: "text", placeholder: "ex: Actros" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "camion", label: "Camion" },
      { value: "fourgon", label: "Fourgon" },
      { value: "plateau", label: "Plateau" },
      { value: "frigorifique", label: "Frigorifique" },
      { value: "citerne", label: "Citerne" },
    ],
  },
  { key: "annee", label: "Année", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "actif", label: "Actif" },
      { value: "en_panne", label: "En panne" },
      { value: "en_maintenance", label: "En maintenance" },
      { value: "inactif", label: "Inactif" },
    ],
  },
  { key: "kilometrage", label: "Kilométrage (km)", type: "number" },
  { key: "consommation_moyenne", label: "Consommation (L/100km)", type: "number", step: "0.1" },
  { key: "capacite_reservoir", label: "Capacité réservoir (L)", type: "number" },
  { key: "capacite_charge", label: "Capacité de charge (kg)", type: "number" },
  { key: "cout_acquisition", label: "Coût d'acquisition (MAD)", type: "number" },
  { key: "date_mise_circulation", label: "Mise en circulation", type: "date" },
  { key: "assurance_compagnie", label: "Compagnie d'assurance", type: "text", fullWidth: true },
  { key: "assurance_numero", label: "N° police assurance", type: "text" },
  { key: "assurance_date_debut", label: "Assurance — début", type: "date" },
  { key: "assurance_date_fin", label: "Assurance — fin", type: "date" },
  { key: "visite_technique_date", label: "Visite technique — date", type: "date" },
  { key: "visite_technique_prochaine", label: "Visite technique — prochaine", type: "date" },
];

export default function Fleet() {
  return (
    <CrudPage
      entityName="Fleet"
      title="Flotte"
      subtitle="Gestion des véhicules: statut, consommation, assurance, visite technique"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un véhicule"
    />
  );
}