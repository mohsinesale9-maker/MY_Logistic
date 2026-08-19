const statusConfig = {
  actif: { label: "Actif", cls: "bg-green-50 text-green-700 border-green-200" },
  inactif: { label: "Inactif", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  rupture: { label: "Rupture", cls: "bg-red-50 text-red-700 border-red-200" },
  en_attente: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmee: { label: "Confirmée", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  livree: { label: "Livrée", cls: "bg-green-50 text-green-700 border-green-200" },
  annulee: { label: "Annulée", cls: "bg-red-50 text-red-700 border-red-200" },
  en_cours: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  planifiee: { label: "Planifiée", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  terminee: { label: "Terminée", cls: "bg-green-50 text-green-700 border-green-200" },
  conge: { label: "Congé", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  preventive: { label: "Préventive", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  corrective: { label: "Corrective", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  prospect: { label: "Prospect", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  client: { label: "Client", cls: "bg-green-50 text-green-700 border-green-200" },
  produit: { label: "Produit", cls: "bg-green-50 text-green-700 border-green-200" },
  charge: { label: "Charge", cls: "bg-red-50 text-red-700 border-red-200" },
  valide: { label: "Validé", cls: "bg-green-50 text-green-700 border-green-200" },
  principal: { label: "Principal", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  secondaire: { label: "Secondaire", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  aere: { label: "Aéré", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  banque: { label: "Banque", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  caisse: { label: "Caisse", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  // Fuel types
  diesel: { label: "Diesel", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  essence: { label: "Essence", cls: "bg-green-50 text-green-700 border-green-200" },
  gpl: { label: "GPL", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  // Fleet types & statuses
  camion: { label: "Camion", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  fourgon: { label: "Fourgon", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  plateau: { label: "Plateau", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  frigorifique: { label: "Frigorifique", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  citerne: { label: "Citerne", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  en_panne: { label: "En panne", cls: "bg-red-50 text-red-700 border-red-200" },
  en_maintenance: { label: "En maintenance", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  // Invoice types & statuses
  facture: { label: "Facture", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  avoir: { label: "Avoir", cls: "bg-red-50 text-red-700 border-red-200" },
  devis: { label: "Devis", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  brouillon: { label: "Brouillon", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  envoyee: { label: "Envoyée", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  payee: { label: "Payée", cls: "bg-green-50 text-green-700 border-green-200" },
  partiellement_payee: { label: "Partiellement payée", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  en_retard: { label: "En retard", cls: "bg-red-50 text-red-700 border-red-200" },
  // Quality statuses
  conforme: { label: "Conforme", cls: "bg-green-50 text-green-700 border-green-200" },
  non_conforme: { label: "Non conforme", cls: "bg-red-50 text-red-700 border-red-200" },
  a_recontroler: { label: "À recontrôler", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  // Audit actions
  create: { label: "Création", cls: "bg-green-50 text-green-700 border-green-200" },
  update: { label: "Modification", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "Suppression", cls: "bg-red-50 text-red-700 border-red-200" },
  login: { label: "Connexion", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  logout: { label: "Déconnexion", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  sync: { label: "Synchronisation", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  export: { label: "Export", cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function StatusBadge({ status, customLabel }) {
  const config = statusConfig[status] || {
    label: status || "—",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${config.cls}`}
    >
      {customLabel || config.label}
    </span>
  );
}