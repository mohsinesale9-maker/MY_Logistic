import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "nom", label: "Nom", className: "font-medium" },
  { key: "telephone", label: "Téléphone" },
  { key: "email", label: "Email" },
  {
    key: "type",
    label: "Type",
    render: (val) => <StatusBadge status={val} />,
  },
  {
    key: "opportunite",
    label: "Opportunité",
    render: (val) => logisticsMath.formatCurrency(val),
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
  { key: "nom", label: "Nom / Société", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "adresse", label: "Adresse", type: "text", fullWidth: true },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "prospect", label: "Prospect" },
      { value: "client", label: "Client" },
    ],
  },
  { key: "opportunite", label: "Valeur opportunité (MAD)", type: "number" },
  { key: "cout_client", label: "Coût d'acquisition client (MAD)", type: "number" },
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

export default function CRM() {
  return (
    <CrudPage
      entityName="Client"
      title="CRM — Clients"
      subtitle="Gestion de la relation client et prospects"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouveau contact"
    />
  );
}