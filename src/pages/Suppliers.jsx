import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "code", label: "Code", className: "font-medium" },
  { key: "nom", label: "Fournisseur" },
  { key: "contact", label: "Contact" },
  { key: "telephone", label: "Téléphone" },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "code", label: "Code", type: "text" },
  { key: "nom", label: "Nom du fournisseur", type: "text" },
  { key: "contact", label: "Personne de contact", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "adresse", label: "Adresse", type: "text", fullWidth: true },
  { key: "total_commandes", label: "Total commandes", type: "number" },
  { key: "commandes_livrees", label: "Commandes livrées", type: "number" },
  { key: "total_livraisons", label: "Total livraisons", type: "number" },
  { key: "livraisons_delai", label: "Livraisons dans les délais", type: "number" },
  { key: "note_qualite", label: "Note qualité (0-100)", type: "number" },
  { key: "note_prix", label: "Note prix (0-100)", type: "number" },
  { key: "note_reactivite", label: "Note réactivité (0-100)", type: "number" },
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

export default function Suppliers() {
  return (
    <CrudPage
      entityName="Supplier"
      title="Fournisseurs"
      subtitle="Gestion des fournisseurs et évaluations"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouveau fournisseur"
    />
  );
}