import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "reference", label: "Référence", className: "font-medium" },
  { key: "nom", label: "Désignation" },
  { key: "categorie", label: "Catégorie" },
  { key: "machine", label: "Machine" },
  { key: "stock", label: "Stock", render: (v) => logisticsMath.formatNumber(v), className: "text-right", cellClassName: "text-right" },
  { key: "seuil_min", label: "Seuil min", render: (v) => logisticsMath.formatNumber(v), className: "text-right", cellClassName: "text-right" },
  { key: "prix_unitaire", label: "Prix unitaire", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "fournisseur", label: "Fournisseur" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "reference", label: "Référence", type: "text" },
  { key: "nom", label: "Désignation", type: "text" },
  { key: "categorie", label: "Catégorie", type: "text" },
  { key: "machine", label: "Machine associée", type: "text" },
  { key: "stock", label: "Stock actuel", type: "number" },
  { key: "seuil_min", label: "Seuil minimum", type: "number" },
  { key: "prix_unitaire", label: "Prix unitaire (MAD)", type: "number", step: "0.01" },
  { key: "fournisseur", label: "Fournisseur", type: "text" },
  { key: "emplacement", label: "Emplacement", type: "text" },
  { key: "unite", label: "Unité", type: "text", placeholder: "ex: pièce, litre, mètre" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "en_stock", label: "En stock" },
    { value: "rupture", label: "Rupture" },
    { value: "commande", label: "En commande" },
  ]},
];

export default function SpareParts() {
  return (
    <CrudPage
      entityName="SparePart"
      title="Pièces & Consommables"
      subtitle="Gestion du stock de pièces de rechange"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter une pièce"
    />
  );
}