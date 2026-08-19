import CrudPage from "@/components/erp/CrudPage";
import { logisticsMath } from "@/lib/logistics-math";
import StatusBadge from "@/components/erp/StatusBadge";

const columns = [
  { key: "employe_nom", label: "Employé", className: "font-medium" },
  { key: "periode", label: "Période" },
  { key: "salaire_base", label: "Base", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "primes", label: "Primes", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "cotisations", label: "Cotisations", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right" },
  { key: "net_paye", label: "Net à payer", render: (v) => logisticsMath.formatCurrency(v), className: "text-right", cellClassName: "text-right font-bold" },
  { key: "statut", label: "Statut", render: (v) => <StatusBadge status={v} /> },
];

const formFields = [
  { key: "employe_nom", label: "Nom employé", type: "text" },
  { key: "periode", label: "Période (ex: 07/2026)", type: "text" },
  { key: "salaire_base", label: "Salaire de base (MAD)", type: "number", step: "0.01" },
  { key: "primes", label: "Primes (MAD)", type: "number", step: "0.01" },
  { key: "indemnites", label: "Indemnités (MAD)", type: "number", step: "0.01" },
  { key: "heures_sup", label: "Heures supplémentaires", type: "number", step: "0.5" },
  { key: "cotisations", label: "Cotisations (MAD)", type: "number", step: "0.01" },
  { key: "avances_deductees", label: "Avances déductées (MAD)", type: "number", step: "0.01" },
  { key: "retenues", label: "Retenues (MAD)", type: "number", step: "0.01" },
  { key: "net_paye", label: "Net à payer (MAD)", type: "number", step: "0.01" },
  { key: "date_paiement", label: "Date de paiement", type: "date" },
  { key: "statut", label: "Statut", type: "select", options: [
    { value: "calcule", label: "Calculé" },
    { value: "valide", label: "Validé" },
    { value: "paye", label: "Payé" },
    { value: "annule", label: "Annulé" },
  ]},
];

export default function PayrollPage() {
  return (
    <CrudPage
      entityName="Payroll"
      title="Paie"
      subtitle="Gestion de la paie et bulletins de salaire"
      columns={columns}
      formFields={formFields}
      addButtonLabel="Ajouter une paie"
    />
  );
}