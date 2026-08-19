import { useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useEntity } from "@/hooks/useEntity";
import { useRealtime } from "@/hooks/useRealtime";
import { logisticsMath } from "@/lib/logistics-math";
import KPICard from "@/components/erp/KPICard";
import PageHeader from "@/components/erp/PageHeader";
import { Card } from "@/components/ui/card";
import {
  DollarSign, Truck, Users, Wrench, ShoppingCart, FileText,
  AlertTriangle, Fuel,
  Banknote, Bell, ArrowRight, HardHat,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import moment from "moment";

const STATUS_COLORS = {
  en_attente: "#D97706",
  en_cours: "#2563EB",
  livree: "#16A34A",
  annulee: "#DC2626",
  planifie: "#D97706",
  livre: "#16A34A",
  partiel: "#F59E0B",
  annule: "#DC2626",
};
const PIE_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#06B6D4"];

export default function Dashboard() {
  const { items: orders, reload: reloadOrders } = useEntity("CustomerOrder");
  const { items: invoices, reload: reloadInvoices } = useEntity("Invoice");
  const { items: payments, reload: reloadPayments } = useEntity("Payment");
  const { items: transports, reload: reloadTransports } = useEntity("Transport");
  const { items: fleet, reload: reloadFleet } = useEntity("Fleet");
  const { items: employees, reload: reloadEmployees } = useEntity("Employee");
  const { items: incidents, reload: reloadIncidents } = useEntity("Incident");
  const { items: maintenancePlans, reload: reloadPlans } = useEntity("MaintenancePlan");
  const { items: fuelRecords, reload: reloadFuel } = useEntity("FuelRecord");
  const { items: vehicleAlerts, reload: reloadAlerts } = useEntity("VehicleAlert");
  const { items: suppliers, reload: reloadSuppliers } = useEntity("Supplier");

  // Real-time subscriptions — reload the relevant entity whenever data changes.
  useRealtime("CustomerOrder", { onInsert: reloadOrders, onUpdate: reloadOrders, onDelete: reloadOrders });
  useRealtime("Invoice", { onInsert: reloadInvoices, onUpdate: reloadInvoices, onDelete: reloadInvoices });
  useRealtime("Payment", { onInsert: reloadPayments, onUpdate: reloadPayments, onDelete: reloadPayments });
  useRealtime("Transport", { onInsert: reloadTransports, onUpdate: reloadTransports, onDelete: reloadTransports });
  useRealtime("Fleet", { onInsert: reloadFleet, onUpdate: reloadFleet, onDelete: reloadFleet });
  useRealtime("Employee", { onInsert: reloadEmployees, onUpdate: reloadEmployees, onDelete: reloadEmployees });
  useRealtime("Incident", { onInsert: reloadIncidents, onUpdate: reloadIncidents, onDelete: reloadIncidents });
  useRealtime("MaintenancePlan", { onInsert: reloadPlans, onUpdate: reloadPlans, onDelete: reloadPlans });
  useRealtime("FuelRecord", { onInsert: reloadFuel, onUpdate: reloadFuel, onDelete: reloadFuel });
  useRealtime("VehicleAlert", { onInsert: reloadAlerts, onUpdate: reloadAlerts, onDelete: reloadAlerts });
  useRealtime("Supplier", { onInsert: reloadSuppliers, onUpdate: reloadSuppliers, onDelete: reloadSuppliers });

  const loading = false;

  const stats = useMemo(() => {
    const ca = invoices.filter((i) => i.type === "facture").reduce((s, i) => s + (i.montant_ttc || 0), 0);
    const encaisse = payments.filter((p) => p.type === "client" && p.statut === "valide").reduce((s, p) => s + (p.montant || 0), 0);
    const impayes = ca - encaisse;
    const facturesRetard = invoices.filter((i) => i.statut === "en_retard").length;
    const missionsActives = transports.filter((t) => t.statut === "en_cours" || t.statut === "planifie").length;
    const vehiculesActifs = fleet.filter((v) => v.statut === "actif").length;
    const vehiculesPanne = fleet.filter((v) => v.statut === "en_panne" || v.statut === "en_maintenance").length;
    const employesActifs = employees.filter((e) => e.statut === "actif").length;
    const pannesOuvertes = incidents.filter((i) => i.statut === "ouvert" || i.statut === "en_cours").length;
    const plansRetard = maintenancePlans.filter((m) => m.statut === "en_retard").length;
    const alertesActives = vehicleAlerts.filter((a) => a.statut === "active").length;
    const totalFuel = fuelRecords.reduce((s, f) => s + (f.litres || 0), 0);
    const fuelCost = fuelRecords.reduce((s, f) => s + (f.litres || 0) * (f.prix_litres || 0), 0);

    return { ca, encaisse, impayes, facturesRetard, missionsActives, vehiculesActifs, vehiculesPanne, employesActifs, pannesOuvertes, plansRetard, alertesActives, totalFuel, fuelCost };
  }, [invoices, payments, transports, fleet, employees, incidents, maintenancePlans, vehicleAlerts, fuelRecords]);

  const salesData = useMemo(() => {
    const grouped = {};
    invoices.filter((i) => i.type === "facture").forEach((i) => {
      const date = i.date ? moment(i.date).format("DD/MM") : "N/A";
      if (!grouped[date]) grouped[date] = 0;
      grouped[date] += i.montant_ttc || 0;
    });
    return Object.entries(grouped).map(([date, total]) => ({ date, total })).slice(-12);
  }, [invoices]);

  const paymentData = useMemo(() => {
    const byType = {};
    payments.forEach((p) => {
      if (!byType[p.type]) byType[p.type] = 0;
      byType[p.type] += p.montant || 0;
    });
    const labels = { client: "Clients", fournisseur: "Fournisseurs", sous_traitant: "Sous-traitants" };
    return Object.entries(byType).map(([type, value]) => ({ name: labels[type] || type, value: Math.round(value) }));
  }, [payments]);

  const fleetData = useMemo(() => {
    const counts = {};
    fleet.forEach((v) => { counts[v.statut] = (counts[v.statut] || 0) + 1; });
    const labels = { actif: "Actifs", en_panne: "En panne", en_maintenance: "En maintenance", inactif: "Inactifs" };
    return Object.entries(counts).map(([key, value]) => ({ name: labels[key] || key, value, key }));
  }, [fleet]);

  const moduleCards = [
    { title: "Exploitation Transport", path: "/exploitation", icon: Truck, color: "primary",
      kpis: [
        { label: "Missions actives", value: stats.missionsActives },
        { label: "Véhicules actifs", value: stats.vehiculesActifs },
        { label: "Alertes", value: stats.alertesActives },
      ] },
    { title: "Finance & Commercial", path: "/factures", icon: DollarSign, color: "success",
      kpis: [
        { label: "Chiffre d'affaires", value: logisticsMath.formatCurrency(stats.ca) },
        { label: "Encaissé", value: logisticsMath.formatCurrency(stats.encaisse) },
        { label: "Impayés", value: logisticsMath.formatCurrency(stats.impayes) },
      ] },
    { title: "Sous-traitance", path: "/sous-traitance", icon: HardHat, color: "warning",
      kpis: [
        { label: "Fournisseurs", value: suppliers.length },
      ] },
    { title: "Gestion des Achats", path: "/fournisseurs", icon: ShoppingCart, color: "info",
      kpis: [
        { label: "Fournisseurs", value: suppliers.length },
      ] },
    { title: "Ressources Humaines", path: "/rh", icon: Users, color: "purple",
      kpis: [
        { label: "Employés actifs", value: stats.employesActifs },
      ] },
    { title: "Maintenance", path: "/dashboard-maintenance", icon: Wrench, color: "destructive",
      kpis: [
        { label: "Pannes ouvertes", value: stats.pannesOuvertes },
        { label: "Plans en retard", value: stats.plansRetard },
      ] },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Dashboard Global" subtitle="Vue d'ensemble consolidée — 6 modules" />

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <KPICard title="Chiffre d'affaires" value={logisticsMath.formatCurrency(stats.ca)} icon={DollarSign} color="success" trend={12.5} trendLabel="vs mois dernier" />
        <KPICard title="Impayés" value={logisticsMath.formatCurrency(stats.impayes)} icon={AlertTriangle} color="warning" subtitle={`${stats.facturesRetard} factures en retard`} />
        <KPICard title="Missions actives" value={stats.missionsActives} icon={Truck} color="primary" subtitle={`${stats.vehiculesActifs} véhicules actifs`} />
        <KPICard title="Alertes" value={stats.alertesActives + stats.pannesOuvertes} icon={Bell} color="destructive" subtitle="Véhicules + Maintenance" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <KPICard title="Encaissé" value={logisticsMath.formatCurrency(stats.encaisse)} icon={Banknote} color="success" />
        <KPICard title="Employés actifs" value={stats.employesActifs} icon={Users} color="info" />
        <KPICard title="Carburant (L)" value={logisticsMath.formatNumber(stats.totalFuel)} icon={Fuel} color="warning" subtitle={logisticsMath.formatCurrency(stats.fuelCost)} />
        <KPICard title="Véhicules en panne" value={stats.vehiculesPanne} icon={AlertTriangle} color="destructive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-base font-semibold mb-4">Évolution du chiffre d'affaires</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip formatter={(val) => logisticsMath.formatCurrency(val)} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={2} fill="url(#colorCA)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Aucune donnée disponible</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Paiements par type</h3>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => logisticsMath.formatCurrency(val)} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Aucun paiement disponible</div>
          )}
        </Card>
      </div>

      {/* Fleet status + Fuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">État de la flotte</h3>
          {fleetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fleetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {fleetData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.key] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Aucune donnée flotte</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Alertes & Pannes</h3>
          <div className="space-y-3">
            <AlertRow icon={Bell} label="Alertes véhicules actives" value={stats.alertesActives} path="/alertes-vehicules" color="text-amber-600" />
            <AlertRow icon={AlertTriangle} label="Pannes ouvertes" value={stats.pannesOuvertes} path="/pannes" color="text-red-600" />
            <AlertRow icon={Wrench} label="Plans d'entretien en retard" value={stats.plansRetard} path="/plans-entretien" color="text-orange-600" />
            <AlertRow icon={FileText} label="Factures en retard" value={stats.facturesRetard} path="/factures" color="text-red-600" />
          </div>
        </Card>
      </div>

      {/* Module Summary Cards */}
      <div>
        <h3 className="text-base font-semibold mb-4">Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((m) => (
            <Link key={m.title} to={m.path}>
              <Card className="p-5 hover:shadow-enterprise-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <m.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{m.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  {m.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{kpi.label}</span>
                      <span className="font-semibold">{kpi.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertRow({ icon: Icon, label, value, path, color }) {
  return (
    <Link to={path} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </Link>
  );
}