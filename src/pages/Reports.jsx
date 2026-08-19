import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { entities } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Boxes,
  Wallet,
  Truck,
  Users,
  Wrench,
  BarChart3,
  Brain,
  Package,
  ShoppingCart,
  HardHat,
  Contact,
  ShieldCheck,
  FileText,
  FileType,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";
import ReportCharts from "@/components/erp/ReportCharts";
import { exportDataToPDF, exportDataToWord } from "@/lib/report-export";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const reports = [
  { title: "Rapport des ventes", description: "Chiffre d'affaires et commandes clients", icon: TrendingUp, color: "bg-blue-50 text-blue-600", path: "/commandes-clients", entity: "CustomerOrder", department: "commercial" },
  { title: "Rapport des stocks", description: "Valeur du stock, rotation et ruptures", icon: Boxes, color: "bg-green-50 text-green-600", path: "/stocks", entity: "Article", department: "stock" },
  { title: "Rapport financier", description: "Résultat net, marges et trésorerie", icon: Wallet, color: "bg-purple-50 text-purple-600", path: "/finance", entity: "FinanceTransaction", department: "finance" },
  { title: "Rapport de transport", description: "OTIF, coût/km et taux de remplissage", icon: Truck, color: "bg-amber-50 text-amber-600", path: "/transport", entity: "Transport", department: "transport" },
  { title: "Rapport RH", description: "Salaires, absentéisme et effectifs", icon: Users, color: "bg-indigo-50 text-indigo-600", path: "/rh", entity: "Employee", department: "rh" },
  { title: "Rapport maintenance", description: "MTBF, MTTR, disponibilité et coûts", icon: Wrench, color: "bg-red-50 text-red-600", path: "/maintenance", entity: "Maintenance", department: "maintenance" },
  { title: "Rapport des achats", description: "Taux de service fournisseurs et OTD", icon: ShoppingCart, color: "bg-cyan-50 text-cyan-600", path: "/fournisseurs", entity: "PurchaseOrder", department: "achats" },
  { title: "Rapport sous-traitance", description: "Coûts de prestation et contrats", icon: HardHat, color: "bg-orange-50 text-orange-600", path: "/sous-traitance", entity: "Subcontractor", department: "soustraitance" },
  { title: "Rapport CRM", description: "Conversion, pipeline et rentabilité", icon: Contact, color: "bg-pink-50 text-pink-600", path: "/crm", entity: "Client", department: "commercial" },
  { title: "Rapport articles", description: "Catalogue produits, prix et statuts", icon: Package, color: "bg-teal-50 text-teal-600", path: "/articles", entity: "Article", department: "stock" },
  { title: "Tableau de bord", description: "Vue d'ensemble globale avec KPIs", icon: BarChart3, color: "bg-blue-50 text-blue-600", path: "/", department: "direction" },
  { title: "IA & Prévoyances", description: "Prévisions de la demande et analyse", icon: Brain, color: "bg-purple-50 text-purple-600", path: "/assistant-ia", department: "direction" },
  { title: "Business Intelligence", description: "Tableaux de bord avancés ML", icon: BarChart3, color: "bg-cyan-50 text-cyan-600", path: "/bi", department: "direction" },
  { title: "Carburant", description: "Consommation, coûts et anomalies", icon: Truck, color: "bg-amber-50 text-amber-600", path: "/carburant", entity: "FuelRecord", department: "transport" },
  { title: "Factures & Avoirs", description: "Facturation, encaissements et créances", icon: Wallet, color: "bg-green-50 text-green-600", path: "/factures", entity: "Invoice", department: "finance" },
  { title: "Production", description: "Ordres de production, OEE et rendement", icon: TrendingUp, color: "bg-indigo-50 text-indigo-600", path: "/production", entity: "ProductionOrder", department: "production" },
  { title: "Contrôle Qualité", description: "Inspections, conformité et rejets", icon: BarChart3, color: "bg-red-50 text-red-600", path: "/qualite", entity: "QualityControl", department: "qualite" },
  { title: "Journaux d'Audit", description: "Traçabilité des actions et sécurité", icon: ShieldCheck, color: "bg-gray-100 text-gray-600", path: "/audit", entity: "AuditLog", department: "audit" },
];

export default function Reports() {
  const navigate = useNavigate();
  const { settings: company } = useCompanySettings();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (report, format) => {
    if (!report.entity) return;
    const key = `${report.title}-${format}`;
    setExporting(key);
    try {
      const data = await entities[report.entity].list();
      const list = Array.isArray(data) ? data : [];
      // Pass the explicit department id so the signature block uses the
      // correct department head. Falls back to REPORT_DEPARTMENT_MAP if the
      // report entry didn't declare one.
      const opts = { departmentId: report.department };
      if (format === "pdf") {
        await exportDataToPDF(report.title, list, report.description, company, opts);
      } else {
        await exportDataToWord(report.title, list, report.description, company, opts);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Erreur lors de l'export : " + (err.message || "erreur inconnue"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Rapports & BI"
        subtitle="Consultez et exportez vos rapports en PDF ou Word"
      />

      <ReportCharts />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.title}
            className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col"
          >
            <div
              className="flex items-start gap-4 cursor-pointer flex-1"
              onClick={() => navigate(report.path)}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${report.color}`}
              >
                <report.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.description}
                </p>
              </div>
            </div>

            {report.entity && (
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(report, "pdf")}
                  disabled={exporting === `${report.title}-pdf`}
                  className="gap-1.5 flex-1 text-xs"
                >
                  {exporting === `${report.title}-pdf` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(report, "word")}
                  disabled={exporting === `${report.title}-word`}
                  className="gap-1.5 flex-1 text-xs"
                >
                  {exporting === `${report.title}-word` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileType className="w-3.5 h-3.5" />
                  )}
                  Word
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
