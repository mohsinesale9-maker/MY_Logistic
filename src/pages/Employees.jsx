import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "nom", label: "Nom", className: "font-medium" },
  { key: "poste", label: "Poste" },
  { key: "departement", label: "Département" },
  { key: "telephone", label: "Téléphone" },
  {
    key: "salaire_base",
    label: "Salaire brut",
    render: (val, item) =>
      logisticsMath.formatCurrency(
        logisticsMath.salaireBrut(
          val,
          item.prime,
          item.heures_sup,
          item.indemnites
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
  { key: "nom", label: "Nom complet", type: "text" },
  { key: "poste", label: "Poste", type: "text" },
  { key: "departement", label: "Département", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "salaire_base", label: "Salaire de base (MAD)", type: "number" },
  { key: "prime", label: "Prime (MAD)", type: "number" },
  { key: "heures_sup", label: "Heures supplémentaires (h)", type: "number" },
  { key: "indemnites", label: "Indemnités (MAD)", type: "number" },
  { key: "cotisations", label: "Cotisations (MAD)", type: "number" },
  { key: "heures_reelles", label: "Heures réelles", type: "number" },
  { key: "heures_normales", label: "Heures normales", type: "number" },
  { key: "heures_absence", label: "Heures d'absence", type: "number" },
  { key: "heures_theoriques", label: "Heures théoriques", type: "number" },
  { key: "production", label: "Production (unités)", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "actif", label: "Actif" },
      { value: "conge", label: "Congé" },
      { value: "inactif", label: "Inactif" },
    ],
  },
];

export default function Employees() {
  return (
    <CrudPage
      entityName="Employee"
      title="Ressources Humaines"
      subtitle="Gestion des employés et salaires"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvel employé"
    />
  );
}