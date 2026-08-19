import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "nom", label: "Sous-traitant", className: "font-medium" },
  { key: "prestation", label: "Prestation" },
  { key: "telephone", label: "Téléphone" },
  {
    key: "cout_main_oeuvre",
    label: "Coût prestation",
    render: (val, item) =>
      logisticsMath.formatCurrency(
        logisticsMath.coutPrestation(
          val,
          item.cout_transport,
          item.cout_materiel
        )
      ),
    className: "text-right",
    cellClassName: "text-right font-medium",
  },
  {
    key: "conforme",
    label: "Conformité",
    render: (val) =>
      val ? (
        <StatusBadge status="valide" customLabel="Conforme" />
      ) : (
        <StatusBadge status="annulee" customLabel="Non conforme" />
      ),
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "nom", label: "Nom du sous-traitant", type: "text" },
  { key: "prestation", label: "Type de prestation", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "cout_main_oeuvre", label: "Coût main d'œuvre (MAD)", type: "number" },
  { key: "cout_transport", label: "Coût transport (MAD)", type: "number" },
  { key: "cout_materiel", label: "Coût matériel (MAD)", type: "number" },
  { key: "nb_prestations", label: "Nombre de prestations", type: "number" },
  { key: "nb_prestations_conformes", label: "Prestations conformes", type: "number" },
  {
    key: "conforme",
    label: "Conforme",
    type: "boolean",
  },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
    ],
  },
];

export default function Subcontracting() {
  return (
    <CrudPage
      entityName="Subcontractor"
      title="Sous-traitance"
      subtitle="Gestion des prestataires et sous-traitants"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouveau sous-traitant"
    />
  );
}