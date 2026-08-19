import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "nom", label: "Nom", className: "font-medium" },
  { key: "prestation", label: "Prestation" },
  { key: "telephone", label: "Téléphone" },
  { key: "nb_prestations", label: "Prestations", className: "text-right", cellClassName: "text-right" },
  {
    key: "taux_conformite",
    label: "Conformité",
    render: (_, item) => {
      const rate = item.nb_prestations > 0
        ? (item.nb_prestations_conformes / item.nb_prestations) * 100
        : 0;
      return `${rate.toFixed(0)}%`;
    },
    className: "text-right",
    cellClassName: "text-right",
  },
  {
    key: "cout_total",
    label: "Coût total",
    render: (_, item) =>
      logisticsMath.formatCurrency(
        (item.cout_main_oeuvre || 0) + (item.cout_transport || 0) + (item.cout_materiel || 0)
      ),
    className: "text-right",
    cellClassName: "text-right",
  },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "nom", label: "Nom du sous-traitant", type: "text" },
  { key: "prestation", label: "Type de prestation", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "cout_main_oeuvre", label: "Coût main d'œuvre (MAD)", type: "number", step: "0.01" },
  { key: "cout_transport", label: "Coût transport (MAD)", type: "number", step: "0.01" },
  { key: "cout_materiel", label: "Coût matériel (MAD)", type: "number", step: "0.01" },
  { key: "nb_prestations", label: "Nb prestations", type: "number" },
  { key: "nb_prestations_conformes", label: "Nb prestations conformes", type: "number" },
  { key: "conforme", label: "Conforme", type: "switch" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
  ]},
];

export default function Subcontractors() {
  return (
    <CrudPage
      entityName="Subcontractor"
      title="Sous-traitants"
      subtitle="Gestion des prestataires sous-traitants"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un sous-traitant"
    />
  );
}