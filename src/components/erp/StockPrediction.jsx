import { useState, useMemo } from "react";
import { useEntity } from "@/hooks/useEntity";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  Package,
  Loader2,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Wrench,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

// ─── Local forecast engine ───────────────────────────────────────────────────
function computeLocalForecast(articles) {
  if (!articles || articles.length === 0) return null;

  const withConsumption = articles.filter(
    (a) => a.consommation_moyenne > 0 && a.stock_physique > 0
  );

  const atRisk = withConsumption
    .map((a) => {
      const daysLeft = a.consommation_moyenne > 0
        ? Math.floor(a.stock_physique / a.consommation_moyenne)
        : 999;
      const critical = daysLeft <= (a.lead_time || 7);
      return {
        ...a,
        daysLeft,
        critical,
        recommendedOrder: Math.max(
          0,
          Math.ceil(a.consommation_moyenne * 30) - a.stock_physique
        ),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const ruptures = atRisk.filter((a) => a.critical);
  const stockBas = atRisk.filter((a) => !a.critical && a.daysLeft <= 30);

  const topConsumed = [...articles]
    .filter((a) => a.consommation_moyenne > 0)
    .sort((a, b) => b.consommation_moyenne - a.consommation_moyenne)
    .slice(0, 5)
    .map((a) => ({
      ...a,
      projectedStock30d: Math.max(0, a.stock_physique - a.consommation_moyenne * 30),
      projectedStock60d: Math.max(0, a.stock_physique - a.consommation_moyenne * 60),
    }));

  const withEOQ = articles
    .filter((a) => a.cout_unitaire > 0 && a.demande_annuelle > 0 && a.consommation_moyenne > 0)
    .map((a) => {
      const D = a.demande_annuelle || a.consommation_moyenne * 365;
      const S = (a.cout_unitaire || 0) * 0.1;
      const H = (a.cout_unitaire || 0) * 0.2;
      const eoq = H > 0 && S > 0 ? Math.sqrt((2 * D * S) / H) : null;
      return { ...a, eoq, annualCost: D * (a.cout_unitaire || 0) };
    })
    .filter((a) => a.eoq !== null)
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 5);

  const totalStockValue = articles.reduce(
    (sum, a) => sum + (a.stock_physique || 0) * (a.prix_vente || a.cout_unitaire || 0),
    0
  );

  const projected30d = topConsumed.reduce(
    (sum, a) => sum + a.consommation_moyenne * 30 * (a.prix_vente || 0),
    0
  );

  return {
    ruptures,
    stockBas,
    topConsumed,
    withEOQ,
    totalStockValue,
    projected30d,
    totalArticles: articles.length,
    atRiskCount: atRisk.length,
    lowStockCount: stockBas.length,
  };
}

function formatCurrency(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString("fr-FR");
}

function generateMarkdownReport(forecast) {
  if (!forecast) return "";

  const { ruptures, stockBas, topConsumed, withEOQ, totalStockValue, projected30d, totalArticles } = forecast;
  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  let md = `## 📊 Rapport Prévision Stock — ${dateStr}\n\n`;
  md += `**${totalArticles} articles** analysés · Valeur totale du stock: **${formatCurrency(totalStockValue)}**\n\n`;

  if (ruptures.length > 0) {
    md += `### 🚨 Alertes Critiques — Risque de Rupture\n\n`;
    md += `| Article | Stock | Conso/jour | Jours restants | Qté à commander |\n`;
    md += `|---------|-------|-----------|----------------|----------------|\n`;
    ruptures.slice(0, 8).forEach((a) => {
      md += `| **${a.nom || a.reference}** | ${a.stock_physique} | ${a.consommation_moyenne} | **${a.daysLeft}j** | ${a.recommendedOrder} |\n`;
    });
    md += `\n`;
  }

  if (stockBas.length > 0) {
    md += `### ⚡ Stock Bas — Surveiller\n\n`;
    md += `| Article | Stock | Seuil | Conso/jour | Jours restants |\n`;
    md += `|---------|-------|-------|-----------|----------------|\n`;
    stockBas.slice(0, 8).forEach((a) => {
      md += `| ${a.nom || a.reference} | ${a.stock_physique} | ${a.seuil_securite} | ${a.consommation_moyenne} | ~${a.daysLeft}j |\n`;
    });
    md += `\n\n`;
  }

  if (topConsumed.length > 0) {
    md += `### 📈 Top 5 Articles les Plus Consommés\n\n`;
    md += `| Article | Stock | Conso/jour | Stock -30j | Stock -60j |\n`;
    md += `|---------|-------|-----------|-----------|-----------|\n`;
    topConsumed.forEach((a) => {
      const s30 = a.projectedStock30d;
      const s60 = a.projectedStock60d;
      const badge30 = s30 <= 0 ? "⚠️" : s30 < (a.seuil_securite || 0) ? "🔴" : "";
      const badge60 = s60 <= 0 ? "⚠️" : s60 < (a.seuil_securite || 0) ? "🔴" : "";
      md += `| ${a.nom || a.reference} | ${a.stock_physique} | ${a.consommation_moyenne} | ${s30} ${badge30} | ${s60} ${badge60} |\n`;
    });
    md += `\n\n`;
  }

  if (withEOQ.length > 0) {
    md += `### 🛒 Recommandations d'Achat — Modèle EOQ\n\n`;
    md += `| Article | Coût unitaire | Demande annuelle | Qté optimale (EOQ) | Coût annuel |\n`;
    md += `|---------|---------------|----------------|-------------------|------------|\n`;
    withEOQ.forEach((a) => {
      md += `| ${a.nom || a.reference} | ${formatCurrency(a.cout_unitaire)} | ${Math.round(a.demande_annuelle || 0)} | **${Math.round(a.eoq)}** | ${formatCurrency(a.annualCost)} |\n`;
    });
    md += `\n\n`;
  }

  md += `### 📋 Résumé Exécutif\n\n`;
  md += `- 📦 **${totalArticles}** articles suivis dans le système\n`;
  md += `- 🚨 **${ruptures.length}** article(s) en risque de rupture imminente\n`;
  md += `- ⚡ **${stockBas.length}** article(s) avec stock bas (à surveiller)\n`;
  md += `- 💰 Valeur totale du stock: **${formatCurrency(totalStockValue)}**\n`;
  md += `- 📉 Consommation prévue 30j: **${formatCurrency(projected30d)}**\n`;
  md += `- ✅ Prévisions générées localement — modèle EOQ + analyse des ruptures\n\n`;

  if (ruptures.length === 0 && stockBas.length === 0) {
    md += `> ✅ **Bonne nouvelle** — Aucun article en risque de rupture. Le stock est sous contrôle.\n`;
  }

  return md;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "ventes", label: "Ventes", icon: DollarSign },
  { id: "tresorerie", label: "Trésorerie", icon: TrendingUp },
  { id: "carburant", label: "Carburant", icon: Package },
  { id: "demande", label: "Demande", icon: ShoppingCart },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

// ─── FULL component (for standalone / Prévisions tab use) ─────────────────────
export default function StockPrediction({ compact = false }) {
  const { items: articles } = useEntity("Article");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ventes");

  const ruptures = useMemo(
    () => articles.filter((a) => a.stock_physique <= (a.seuil_securite || 0) && a.seuil_securite > 0),
    [articles]
  );
  const stockBas = useMemo(
    () => articles.filter((a) => a.stock_physique > (a.seuil_securite || 0) && a.stock_physique <= (a.seuil_securite || 0) * 1.5),
    [articles]
  );

  const generatePrediction = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const forecast = computeLocalForecast(articles);
      const report = generateMarkdownReport(forecast);
      setPrediction(report);
    } catch (err) {
      setPrediction(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── COMPACT version for sidebar ──────────────────────────────────────────
  if (compact) {
    const forecast = useMemo(() => computeLocalForecast(articles), [articles]);
    const stockVal = forecast?.totalStockValue || 0;
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header with purple icon + button */}
        <div className="flex items-center gap-2.5 p-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 leading-tight">Prévisions ML</p>
            <p className="text-[10px] text-gray-400 leading-tight">EOQ + ruptures</p>
          </div>
          <button
            onClick={generatePrediction}
            disabled={loading || articles.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Générer
          </button>
        </div>

        {/* Status badges */}
        <div className="px-3 pb-2 flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            <TrendingDown className="w-3 h-3" />
            {ruptures.length}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="w-3 h-3" />
            {stockBas.length}
          </span>
          <span className="text-gray-400 ml-auto font-medium">{formatCurrency(stockVal)}</span>
        </div>

        {/* Result preview */}
        <AnimatePresence>
          {prediction && !loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pb-3"
            >
              <div className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                {prediction.split("\n").slice(0, 8).join("\n")}
              </div>
            </motion.div>
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 pb-3 flex items-center gap-1.5"
            >
              <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
              <span className="text-[10px] text-gray-400">Analyse en cours...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── FULL version ─────────────────────────────────────────────────────────
  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-800">Prévisions Machine Learning</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Modèles prédictifs basés sur les données historiques réelles
          </p>
        </div>
        <Button
          onClick={generatePrediction}
          disabled={loading || articles.length === 0}
          className="gap-1.5 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-xs h-8 px-3"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? "Analyse..." : "Générer prévision"}
        </Button>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700">
          <TrendingDown className="w-3 h-3" />
          {ruptures.length} rupture(s)
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          {stockBas.length} stock bas
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
          <Package className="w-3 h-3" />
          {articles.length} article(s)
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-lg border border-blue-100 bg-blue-50/30">
        <div className="px-4 py-2.5 border-b border-blue-100 flex items-center justify-between">
          <p className="font-semibold text-sm text-blue-900">Résumé exécutif</p>
          {prediction && !loading && (
            <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {forecast?.ruptures?.length || 0} alertes
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-10"
            >
              <div className="text-center">
                <Loader2 className="w-7 h-7 animate-spin text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Analyse de {articles.length} articles en cours...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Calcul des risques, EOQ, projections
                </p>
              </div>
            </motion.div>
          ) : prediction ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 max-h-72 overflow-y-auto"
            >
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{prediction}</ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 px-4"
            >
              <Sparkles className="w-8 h-8 text-purple-300 mb-2" />
              <p className="text-sm text-gray-500 text-center font-medium">
                Cliquez sur "Générer prévision"
              </p>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Détection de ruptures · EOQ · Projections 30/60 jours
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
