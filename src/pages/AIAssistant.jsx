import { useState, useRef, useEffect, useMemo } from "react";
import { useEntity } from "@/hooks/useEntity";
import { aiService } from "@/api/aiService";
import { logisticsMath } from "@/lib/logistics-math";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/erp/PageHeader";
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  TrendingUp,
  Package,
  Truck,
  Users,
  Wallet,
  AlertTriangle,
  Brain,
  FileText,
  BarChart3,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PieChartIcon,
  LineChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TABS = [
  { id: "chat", label: "Assistant", icon: Bot },
  { id: "analyse", label: "Analyse", icon: BarChart3 },
];

const SUGGESTED_QUESTIONS = [
  { icon: Truck, text: "Quel fournisseur a la meilleure performance ?" },
  { icon: TrendingUp, text: "Pourquoi les coûts de transport ont-ils augmenté ?" },
  { icon: Wallet, text: "Analyse le flux de trésorerie du mois en cours" },
  { icon: Package, text: "Quels articles doivent être recommandés ?" },
  { icon: AlertTriangle, text: "Détecte les consommations de carburant anormales" },
  { icon: Brain, text: "Génère un résumé exécutif de l'entreprise" },
];

// ── Chart renderer ─────────────────────────────────────────────────────────────
function ChartCard({ chart }) {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const COLORS = chart.color
    ? Array.isArray(chart.color)
      ? chart.color
      : [chart.color, "#06B6D4", "#10B981", "#F59E0B", "#EF4444"]
    : ["#3B82F6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const tooltipStyle = {
    contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "#fff" },
  };

  if (chart.type === "bar") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3">{chart.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xKey || "name"} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey={chart.yKey || "value"} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "line") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3">{chart.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <ReLineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xKey || "date"} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey={chart.yKey || "value"} stroke={COLORS[0]} strokeWidth={2} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "pie") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3">{chart.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chart.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "scatter") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3">{chart.title}</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="x" name={chart.xLabel} tick={{ fontSize: 11 }} />
            <YAxis dataKey="y" name={chart.yLabel} tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={chart.data} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

// ── Insight badge ─────────────────────────────────────────────────────────────
function InsightBadge({ insight }) {
  const map = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-800 border-red-300",
    overview: "bg-purple-50 text-purple-700 border-purple-200",
    anomaly: "bg-orange-50 text-orange-700 border-orange-200",
    quality: "bg-cyan-50 text-cyan-700 border-cyan-200",
    trend: "bg-indigo-50 text-indigo-700 border-indigo-200",
    risk: "bg-rose-50 text-rose-700 border-rose-200",
    recommendation: "bg-teal-50 text-teal-700 border-teal-200",
  };
  const icons = {
    info: <CheckCircle2 className="w-3.5 h-3.5" />,
    success: <CheckCircle2 className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    danger: <XCircle className="w-3.5 h-3.5" />,
    critical: <XCircle className="w-3.5 h-3.5" />,
    overview: <Brain className="w-3.5 h-3.5" />,
    anomaly: <AlertTriangle className="w-3.5 h-3.5" />,
    quality: <ShieldCheck className="w-3.5 h-3.5" />,
    trend: <TrendingUp className="w-3.5 h-3.5" />,
    risk: <AlertTriangle className="w-3.5 h-3.5" />,
    recommendation: <Sparkles className="w-3.5 h-3.5" />,
  };
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${map[insight.type] || map.info}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[insight.type] || icons.info}</span>
      <div>
        <p className="font-medium text-xs mb-0.5">{insight.title}</p>
        <p className="text-xs opacity-80">{insight.text}</p>
      </div>
    </div>
  );
}

// ── Data quality score ────────────────────────────────────────────────────────
function QualityScore({ quality }) {
  if (!quality) return null;
  const score = parseInt(quality.score || 0);
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  const barColor = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Qualité des données</p>
        <span className={`text-2xl font-bold ${color}`}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>Complétude: <span className="font-medium text-gray-700">{quality.completeness}%</span></div>
        <div>Doublons: <span className="font-medium text-gray-700">{quality.duplicates}</span></div>
        <div>Valeurs manquantes: <span className="font-medium text-gray-700">{quality.missingCells}</span></div>
        <div>Colonnes à problème: <span className="font-medium text-gray-700">{quality.columnsWithIssues}</span></div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const { items: articles } = useEntity("Article");
  const { items: suppliers } = useEntity("Supplier");
  const { items: purchaseOrders } = useEntity("PurchaseOrder");
  const { items: transports } = useEntity("Transport");
  const { items: fleet } = useEntity("Fleet");
  const { items: employees } = useEntity("Employee");
  const { items: orders } = useEntity("CustomerOrder");
  const { items: clients } = useEntity("Client");
  const { items: finance } = useEntity("FinanceTransaction");
  const { items: maintenance } = useEntity("Maintenance");
  const { items: fuelRecords } = useEntity("FuelRecord");
  const { items: productionOrders } = useEntity("ProductionOrder");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const entityData = useMemo(() => ({
    Article: articles,
    Supplier: suppliers,
    PurchaseOrder: purchaseOrders,
    Transport: transports,
    Fleet: fleet,
    Employee: employees,
    CustomerOrder: orders,
    Client: clients,
    FinanceTransaction: finance,
    Maintenance: maintenance,
    FuelRecord: fuelRecords,
    ProductionOrder: productionOrders,
  }), [articles, suppliers, purchaseOrders, transports, fleet, employees, orders, clients, finance, maintenance, fuelRecords, productionOrders]);

  useEffect(() => {
    if (activeTab === "analyse" && !analysis) {
      runAnalysis();
    }
  }, [activeTab]);

  const runAnalysis = () => {
    setAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      const result = aiService.analyzeERPData(entityData);
      setAnalysis(result);
      setAnalyzing(false);
    }, 100);
  };

  const buildContext = () => {
    const ca = orders.filter((o) => o.statut === "livree").reduce((s, o) => s + (o.total || 0), 0);
    const stockValue = logisticsMath.valeurStock(articles);
    const activeEmployees = employees.filter((e) => e.statut === "actif").length;
    const activeFleet = fleet.filter((f) => f.statut === "actif").length;
    const otif = logisticsMath.otif(
      transports.filter((t) => t.livraison_complete && t.livraison_a_temps).length,
      transports.length
    );
    const produits = finance.filter((f) => f.type === "produit").reduce((s, f) => s + (f.montant || 0), 0);
    const charges = finance.filter((f) => f.type === "charge").reduce((s, f) => s + (f.montant || 0), 0);
    const resultatNet = produits - charges;

    const topSuppliers = suppliers
      .map((s) => ({
        nom: s.nom,
        tauxLivraison: s.total_commandes > 0 ? (s.commandes_livrees / s.total_commandes) * 100 : 0,
        noteQualite: s.note_qualite,
        notePrix: s.note_prix,
        noteReactivite: s.note_reactivite,
        score: logisticsMath.supplierScore(
          s.total_commandes > 0 ? (s.commandes_livrees / s.total_commandes) * 100 : 0,
          s.note_qualite, s.note_prix, s.note_reactivite
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const ruptures = articles.filter((a) => a.statut === "rupture" || a.stock_physique <= 0);
    const lowStock = articles.filter((a) => {
      const rop = logisticsMath.pointCommande(a.consommation_moyenne, a.lead_time, a.seuil_securite);
      return a.stock_physique <= rop && a.stock_physique > 0;
    });

    const fuelByVehicle = {};
    fuelRecords.forEach((f) => {
      if (!fuelByVehicle[f.vehicule_matricule]) fuelByVehicle[f.vehicule_matricule] = [];
      fuelByVehicle[f.vehicule_matricule].push(f);
    });
    const fuelAnomalies = Object.entries(fuelByVehicle)
      .map(([mat, records]) => {
        const avgConsumption = records.reduce((s, r) => s + (r.distance_parcourue > 0 ? (r.litres / r.distance_parcourue) * 100 : 0), 0) / records.length;
        const standard = records[0]?.consommation_standard || 30;
        return { matricule: mat, avg: avgConsumption, standard, over: avgConsumption > standard * 1.1 };
      })
      .filter((v) => v.over);

    return `CONTEXTE ERP MY LOGISTICS (données réelles en temps réel):

=== STOCKS & ARTICLES ===
- Total articles: ${articles.length}
- Valeur du stock: ${logisticsMath.formatCurrency(stockValue)}
- Articles en rupture: ${ruptures.length} (${ruptures.map((a) => a.nom).join(", ") || "aucun"})
- Articles sous seuil de commande: ${lowStock.length} (${lowStock.map((a) => a.nom).join(", ") || "aucun"})
- Top 5 articles par valeur: ${articles.sort((a, b) => (b.stock_physique * b.cout_unitaire) - (a.stock_physique * a.cout_unitaire)).slice(0, 5).map((a) => `${a.nom} (${logisticsMath.formatCurrency(a.stock_physique * a.cout_unitaire)})`).join(", ")}

=== FOURNISSEURS ===
- Total fournisseurs: ${suppliers.length}
- Classement par score (40% délai + 30% qualité + 20% prix + 10% réactivité):
${topSuppliers.map((s, i) => `  ${i + 1}. ${s.nom} — Score: ${s.score.toFixed(1)}/100, Livraison: ${s.tauxLivraison.toFixed(0)}%, Qualité: ${s.noteQualite}/20, Prix: ${s.notePrix}/20`).join("\n")}

=== COMMANDES D'ACHAT ===
- Total: ${purchaseOrders.length}
- Confirmées: ${purchaseOrders.filter((p) => p.statut === "confirmee").length}
- Livrées: ${purchaseOrders.filter((p) => p.statut === "livree").length}
- En attente: ${purchaseOrders.filter((p) => p.statut === "en_attente").length}
- Taux de respect des délais: ${logisticsMath.otd(purchaseOrders.filter((p) => p.delai_respecte).length, purchaseOrders.length).toFixed(1)}%

=== TRANSPORT & EXPLOITATION ===
- Total missions: ${transports.length}
- Terminées: ${transports.filter((t) => t.statut === "terminee").length}
- En cours: ${transports.filter((t) => t.statut === "en_cours").length}
- Taux OTIF: ${otif.toFixed(1)}%
- Distance totale: ${logisticsMath.formatNumber(transports.reduce((s, t) => s + (t.distance || 0), 0))} km
- Coût transport total: ${logisticsMath.formatCurrency(transports.reduce((s, t) => s + (t.cout_transport || 0), 0))}

=== FLOTTE ===
- Total véhicules: ${fleet.length}
- Actifs: ${activeFleet}
- En panne: ${fleet.filter((f) => f.statut === "en_panne").length}
- En maintenance: ${fleet.filter((f) => f.statut === "en_maintenance").length}
- Taux de disponibilité: ${logisticsMath.fleetAvailability(activeFleet, fleet.length).toFixed(1)}%

=== CARBURANT ===
- Total enregistrements: ${fuelRecords.length}
- Litres consommés: ${logisticsMath.formatNumber(fuelRecords.reduce((s, f) => s + (f.litres || 0), 0))} L
- Coût carburant: ${logisticsMath.formatCurrency(fuelRecords.reduce((s, f) => s + (f.litres || 0) * (f.prix_litres || 0), 0))}
- Anomalies surconsommation: ${fuelAnomalies.length} (${fuelAnomalies.map((v) => `${v.matricule}: ${v.avg.toFixed(1)}L/100km vs standard ${v.standard}`).join(", ") || "aucune"})

=== VENTES & CLIENTS ===
- Chiffre d'affaires (livré): ${logisticsMath.formatCurrency(ca)}
- Total commandes: ${orders.length}
- En cours: ${orders.filter((o) => o.statut === "en_cours").length}
- Livrées: ${orders.filter((o) => o.statut === "livree").length}
- Clients: ${clients.filter((c) => c.type === "client").length}
- Prospects: ${clients.filter((c) => c.type === "prospect").length}
- Taux de conversion: ${logisticsMath.tauxConversion(clients.filter((c) => c.type === "client").length, clients.length).toFixed(1)}%

=== FINANCE ===
- Produits: ${logisticsMath.formatCurrency(produits)}
- Charges: ${logisticsMath.formatCurrency(charges)}
- Résultat net: ${logisticsMath.formatCurrency(resultatNet)}
- Marge nette: ${logisticsMath.netMargin(resultatNet, produits).toFixed(1)}%
- Caisse: ${logisticsMath.formatCurrency(finance.filter((f) => f.compte === "caisse" && f.type === "produit").reduce((s, f) => s + f.montant, 0) - finance.filter((f) => f.compte === "caisse" && f.type === "charge").reduce((s, f) => s + f.montant, 0))}
- Banque: ${logisticsMath.formatCurrency(finance.filter((f) => f.compte === "banque" && f.type === "produit").reduce((s, f) => s + f.montant, 0) - finance.filter((f) => f.compte === "banque" && f.type === "charge").reduce((s, f) => s + f.montant, 0))}

=== RESSOURCES HUMAINES ===
- Total employés: ${employees.length}
- Actifs: ${activeEmployees}
- Masse salariale brute: ${logisticsMath.formatCurrency(employees.reduce((s, e) => s + logisticsMath.salaireBrut(e.salaire_base, e.prime, e.heures_sup, e.indemnites), 0))}
- Taux d'absentéisme: ${logisticsMath.tauxAbsenteisme(employees.reduce((s, e) => s + (e.heures_absence || 0), 0), employees.reduce((s, e) => s + (e.heures_theoriques || 0), 0)).toFixed(1)}%

=== MAINTENANCE ===
- Total interventions: ${maintenance.length}
- Préventives: ${maintenance.filter((m) => m.type === "preventive").length}
- Correctives: ${maintenance.filter((m) => m.type === "corrective").length}
- Terminées: ${maintenance.filter((m) => m.statut === "terminee").length}
- Coût total: ${logisticsMath.formatCurrency(maintenance.reduce((s, m) => s + logisticsMath.coutMaintenance(m.cout_main_oeuvre, m.cout_pieces, m.cout_sous_traitance), 0))}
`;
  };

  const askAI = async (question) => {
    if (!question.trim() || loading) return;

    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = buildContext();
      const prompt = `Tu es l'assistant IA de MY Logistics ERP, une plateforme ERP pour la gestion logistique au Maroc.

Réponds en français de manière professionnelle, précise et structurée.

${context}

Question de l'utilisateur: "${question}"

Instructions:
- Utilise UNIQUEMENT les données réelles ci-dessus pour répondre.
- Sois précis avec des chiffres exacts, des pourcentages et des montants en MAD.
- Si tu identifies des anomalies, propose des recommandations concrètes.
- Structure ta réponse avec des titres, listes à puces et tableaux si pertinent.`;

      const response = await aiService.chat(prompt, {
        systemPrompt: "Tu es un assistant ERP qui aide à analyser des données d'entreprise. Réponds en français.",
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Erreur: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // ── KPI summary for sidebar ──────────────────────────────────────────────
  const totalCA = orders.filter((o) => o.statut === "livree").reduce((s, o) => s + (o.total || 0), 0);
  const totalStock = logisticsMath.valeurStock(articles);
  const ruptures = articles.filter((a) => a.statut === "rupture" || a.stock_physique <= 0);
  const fuelCost = fuelRecords.reduce((s, f) => s + (f.litres || 0) * (f.prix_litres || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assistant IA</h1>
            <p className="text-sm text-gray-500 mt-0.5">Analyse temps réel de vos données ERP</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">Propulsé par IA</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Chat tab ── */}
        {activeTab === "chat" && (
          <div className="flex gap-6 items-start">
            {/* Main chat canvas */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "640px" }}>
                {/* Chat messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      {/* AI icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg"
                      >
                        <Bot className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-900">Comment puis-je vous aider ?</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-md">
                        Posez vos questions sur vos données ERP. L'IA analyse en temps réel vos stocks, finances, transport et RH.
                      </p>

                      {/* Prompt suggestions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            onClick={() => askAI(q.text)}
                            className="flex items-start gap-2.5 p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all text-left text-sm group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                              <q.icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-sm leading-snug">{q.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-500">Assistant IA</span>
                            </div>
                          )}
                          <div className="text-sm prose prose-sm max-w-none prose-p:my-1">
                            {msg.role === "assistant" ? (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-500">Analyse des données ERP...</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input bar */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <form
                    onSubmit={(e) => { e.preventDefault(); askAI(input); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Posez votre question sur vos données ERP..."
                      disabled={loading}
                      className="flex-1 h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
              {/* Capabilities card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-sm text-gray-800">Capacités</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-500">
                  {[
                    { icon: FileText, color: "text-blue-600", text: "Résumés exécutifs" },
                    { icon: AlertTriangle, color: "text-amber-600", text: "Détection d'anomalies" },
                    { icon: Package, color: "text-purple-600", text: "Recommandations d'achat" },
                    { icon: Truck, color: "text-cyan-600", text: "Analyse transport" },
                    { icon: ShieldCheck, color: "text-teal-600", text: "Qualité des données" },
                  ].map(({ icon: Icon, color, text }, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-gray-800">Données analysées</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Articles", value: articles.length },
                    { label: "Commandes", value: orders.length },
                    { label: "Transports", value: transports.length },
                    { label: "Employés", value: employees.length },
                    { label: "Transactions", value: finance.length },
                    { label: "Flotte", value: fleet.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-semibold text-gray-800">{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick KPIs */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <PieChartIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-gray-800">Aperçu rapide</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Chiffre d'affaires</span>
                    <span className="text-xs font-bold text-green-600">{logisticsMath.formatCurrency(totalCA)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Valeur stock</span>
                    <span className="text-xs font-bold text-blue-600">{logisticsMath.formatCurrency(totalStock)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Coût carburant</span>
                    <span className="text-xs font-bold text-amber-600">{logisticsMath.formatCurrency(fuelCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Ruptures</span>
                    <span className={`text-xs font-bold ${ruptures.length > 0 ? "text-red-600" : "text-green-600"}`}>
                      {ruptures.length}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Analyse tab ── */}
        {activeTab === "analyse" && (
          <div className="space-y-6">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-sm text-gray-500">Analyse des données en cours...</p>
              </div>
            ) : analysis?.error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                <p className="text-sm text-gray-500">{analysis.error}</p>
                <Button onClick={runAnalysis} className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700" size="sm">
                  <RefreshCw className="w-4 h-4" /> Réessayer
                </Button>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Overview bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    {analysis.rowCount.toLocaleString()} enregistrements
                  </span>
                  <span>{analysis.columnCount} colonnes</span>
                  <span className="xl:hidden">{articles.length + orders.length + transports.length + employees.length + finance.length + fleet.length} entités</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto border-gray-300 hover:border-blue-400" onClick={runAnalysis}>
                    <RefreshCw className="w-3 h-3" />
                    Actualiser
                  </Button>
                </div>

                {/* KPI cards */}
                {analysis.kpis?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {analysis.kpis.map((kpi, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Charts grid */}
                {analysis.charts?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" /> Visualisations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.charts.map((chart, i) => (
                        <ChartCard key={i} chart={chart} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Data quality */}
                {analysis.quality && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" /> Qualité des données
                    </h3>
                    <QualityScore quality={analysis.quality} />
                  </div>
                )}

                {/* Anomalies */}
                {analysis.anomalies?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> Anomalies détectées
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium text-gray-500">Colonne</th>
                            <th className="text-right p-3 font-medium text-gray-500">Outliers</th>
                            <th className="text-right p-3 font-medium text-gray-500">%</th>
                            <th className="text-right p-3 font-medium text-gray-500">Bornes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.anomalies.map((a, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-medium text-gray-700">{a.column}</td>
                              <td className="p-3 text-right text-orange-600 font-semibold">{a.outlierCount}</td>
                              <td className="p-3 text-right text-gray-500">{a.pct}%</td>
                              <td className="p-3 text-right text-gray-500">{a.bounds?.lower} — {a.bounds?.upper}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Insights */}
                {analysis.insights?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" /> Insights générés par IA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.insights.map((insight, i) => (
                        <InsightBadge key={i} insight={insight} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}
