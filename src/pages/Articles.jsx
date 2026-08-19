import CrudPage from "@/components/erp/CrudPage";
import StatusBadge from "@/components/erp/StatusBadge";
import { logisticsMath } from "@/lib/logistics-math";

const columns = [
  { key: "reference", label: "Référence", className: "font-medium" },
  { key: "nom", label: "Nom" },
  { key: "categorie", label: "Catégorie" },
  {
    key: "stock_physique",
    label: "Stock",
    render: (val) => logisticsMath.formatNumber(val),
  },
  {
    key: "prix_vente",
    label: "Prix vente",
    render: (val) => logisticsMath.formatCurrency(val),
  },
  {
    key: "statut",
    label: "Statut",
    render: (val) => <StatusBadge status={val} />,
  },
];

const formFields = [
  { key: "reference", label: "Référence", type: "text" },
  { key: "nom", label: "Nom", type: "text" },
  { key: "categorie", label: "Catégorie", type: "text" },
  { key: "unite", label: "Unité", type: "text", placeholder: "ex: carton, pièce, kg" },
  { key: "stock_physique", label: "Stock physique", type: "number" },
  { key: "stock_reserve", label: "Stock réservé", type: "number" },
  { key: "prix_vente", label: "Prix de vente (MAD)", type: "number" },
  { key: "cout_unitaire", label: "Coût unitaire (MAD)", type: "number" },
  { key: "cout_commande", label: "Coût de commande (MAD)", type: "number" },
  { key: "cout_stockage", label: "Coût de stockage (MAD)", type: "number" },
  { key: "demande_annuelle", label: "Demande annuelle", type: "number" },
  { key: "consommation_moyenne", label: "Consommation moyenne / jour", type: "number" },
  { key: "lead_time", label: "Lead Time (jours)", type: "number" },
  { key: "ecart_type", label: "Écart-type de la demande", type: "number" },
  { key: "seuil_securite", label: "Seuil de sécurité", type: "number" },
  { key: "warehouse_nom", label: "Entrepôt", type: "text" },
  { key: "emplacement", label: "Emplacement", type: "text" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
      { value: "rupture", label: "Rupture" },
    ],
  },
];

export default function Articles() {
  return (
    <CrudPage
      entityName="Article"
      title="Articles"
      subtitle="Gestion du catalogue produits"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Nouvel article"
    />
  );
}