import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "machine", label: "Machine / Équipement", className: "font-medium" },
  {
    key: "type",
    label: "Type",
    render: (val) => <StatusBadge status={val} />,
  },
  { key: "technicien", label: "Technicien" },
  {
    key: "date",
    label: "Date",
    render: (val) => logisticsMath.formatDate(val),
  },
  {
    key: "cout_main_oeuvre",
    label: "Coût total",
    render: (val, item) =>
      logisticsMath.formatCurrency(
        logisticsMath.coutMaintenance(
          val,
          item.cout_pieces,
          item.cout_sous_traitance
        )
      ),
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "machine", label: "Machine / Équipement", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "preventive", label: "Préventive" },
      { value: "corrective", label: "Corrective" },
    ],
  },
  { key: "technicien", label: "Technicien", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "temps_fonctionnement", label: "Temps de fonctionnement (h)", type: "number" },
  { key: "temps_reparation", label: "Temps de réparation (h)", type: "number" },
  { key: "nombre_pannes", label: "Nombre de pannes", type: "number" },
  { key: "cout_main_oeuvre", label: "Coût main d'œuvre (MAD)", type: "number" },
  { key: "cout_pieces", label: "Coût pièces (MAD)", type: "number" },
  { key: "cout_sous_traitance", label: "Coût sous-traitance (MAD)", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "planifiee", label: "Planifiée" },
      { value: "en_cours", label: "En cours" },
      { value: "terminee", label: "Terminée" },
    ],
  },
];

export default function Maintenance() {
  return (
    <CrudPage
      entityName="Maintenance"
      title="Maintenance"
      subtitle="Gestion des maintenances préventives et correctives"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvelle maintenance"
    />
  );
}