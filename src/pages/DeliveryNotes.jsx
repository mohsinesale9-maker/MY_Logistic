import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "numero", label: "Numéro", className: "font-medium" },
  { key: "client", label: "Client" },
  { key: "date", label: "Date", render: (v) => logisticsMath.formatDate(v) },
  { key: "commande_ref", label: "Commande" },
  { key: "chauffeur", label: "Chauffeur" },
  { key: "vehicule", label: "Véhicule" },
  { key: "quantite", label: "Qté", className: "text-right", cellClassName: "text-right" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "numero", label: "Numéro BL", type: "text" },
  { key: "client", label: "Client", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "commande_ref", label: "Référence commande", type: "text" },
  { key: "adresse_livraison", label: "Adresse de livraison", type: "textarea", fullWidth: true },
  { key: "chauffeur", label: "Chauffeur", type: "text" },
  { key: "vehicule", label: "Véhicule", type: "text" },
  { key: "articles", label: "Articles livrés", type: "textarea", fullWidth: true },
  { key: "quantite", label: "Quantité", type: "number" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "planifie", label: "Planifié" },
    { value: "en_cours", label: "En cours" },
    { value: "livre", label: "Livré" },
    { value: "partiel", label: "Partiel" },
    { value: "annule", label: "Annulé" },
  ]},
  { key: "signature_client", label: "Signé par client", type: "switch" },
];

export default function DeliveryNotes() {
  return (
    <CrudPage
      entityName="DeliveryNote"
      title="Bons de Livraison"
      subtitle="Gestion des bons de livraison clients"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter un BL"
    />
  );
}