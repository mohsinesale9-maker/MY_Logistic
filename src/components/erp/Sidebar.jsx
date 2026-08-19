import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Car,
  Fuel,
  Gauge,
  AlertTriangle,
  FileText,
  Bell,
  CheckCircle,
  Contact,
  Package,
  FileWarning,
  DollarSign,
  Receipt,
  Wallet,
  Landmark,
  TrendingUp,
  HardHat,
  Users,
  ShoppingCart,
  ClipboardList,
  Clock,
  Banknote,
  FileSignature,
  Wrench,
  Calendar,
  CalendarDays,
  BarChart3,
  Brain,
  Settings as SettingsIcon,
  ScrollText,
  ShieldCheck,
  Factory,
  Boxes,
  Warehouse,
} from "lucide-react";
import Logo from "./Logo";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/lib/AuthContext";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const navGroups = [
  {
    title: "Dashboard",
    module: "dashboard",
    items: [
      { label: "Dashboard Global", path: "/dashboard-general", icon: BarChart3 },
    ],
  },
  {
    title: "Exploitation Transport",
    module: "exploitation",
    items: [
      { label: "Dashboard Exploitation", path: "/exploitation", icon: LayoutDashboard },
      { label: "Missions / Transport", path: "/transport", icon: Truck },
      { label: "Flotte", path: "/flotte", icon: Car },
      { label: "Gasoil", path: "/carburant", icon: Fuel },
      { label: "Consommation", path: "/consommation", icon: Gauge },
      { label: "Surconsommation", path: "/surconsommation", icon: AlertTriangle },
      { label: "Documents Véhicules", path: "/documents-vehicules", icon: FileText },
      { label: "Alertes Véhicules", path: "/alertes-vehicules", icon: Bell },
      { label: "Disponibilité", path: "/disponibilite", icon: CheckCircle },
    ],
  },
  {
    title: "Finance & Commercial",
    module: "finance",
    items: [
      { label: "Clients", path: "/crm", icon: Contact },
      { label: "Devis", path: "/devis", icon: FileText },
      { label: "Bons de Livraison", path: "/bons-livraison", icon: Package },
      { label: "Facturation", path: "/factures", icon: Receipt },
      { label: "Avoirs", path: "/avoirs", icon: FileWarning },
      { label: "Paiements", path: "/paiements", icon: DollarSign },
      { label: "Relevé Clients", path: "/releve-clients", icon: Receipt },
      { label: "Caisse", path: "/caisse", icon: Wallet },
      { label: "Banque", path: "/banque", icon: Landmark },
      { label: "Résultat / Rentabilité", path: "/rentabilite", icon: TrendingUp },
      { label: "Missions Clients", path: "/missions-clients", icon: Truck },
    ],
  },
  {
    title: "Sous-Traitance",
    module: "sous-traitance",
    items: [
      { label: "Opérations Sous-traitance", path: "/sous-traitance", icon: HardHat },
      { label: "Sous-traitants", path: "/sous-traitants", icon: Users },
      { label: "Suivi Paiements", path: "/paiements-sous-traitance", icon: DollarSign },
    ],
  },
  {
    title: "Gestion des Achats",
    module: "achats",
    items: [
      { label: "Fournisseurs", path: "/fournisseurs", icon: ShoppingCart },
      { label: "Articles / Services", path: "/articles", icon: Package },
      { label: "Achats Fournisseurs", path: "/commandes-achat", icon: ClipboardList },
      { label: "Suivi Paiements", path: "/paiements-fournisseurs", icon: DollarSign },
      { label: "Relevé des Achats", path: "/releve-achats", icon: Receipt },
    ],
  },
  {
    title: "Ressources Humaines",
    module: "rh",
    items: [
      { label: "Employés", path: "/rh", icon: Users },
      { label: "Pointage", path: "/pointage", icon: Clock },
      { label: "Avances", path: "/avances", icon: Banknote },
      { label: "Paie", path: "/paie", icon: Wallet },
      { label: "Contrats", path: "/contrats", icon: FileSignature },
      { label: "Alertes RH", path: "/alertes-rh", icon: AlertTriangle },
    ],
  },
  {
    title: "Maintenance",
    module: "maintenance",
    items: [
      { label: "Dashboard Maintenance", path: "/dashboard-maintenance", icon: LayoutDashboard },
      { label: "Interventions", path: "/maintenance", icon: Wrench },
      { label: "Plans d'Entretien", path: "/plans-entretien", icon: Calendar },
      { label: "Pannes / Incidents", path: "/pannes", icon: AlertTriangle },
      { label: "Dépenses Maintenance", path: "/depenses-maintenance", icon: DollarSign },
      { label: "Pièces & Consommables", path: "/pieces-consommation", icon: Package },
      { label: "Alertes Maintenance", path: "/alertes-maintenance", icon: Bell },
    ],
  },
  {
    title: "Production & Stock",
    module: "production",
    items: [
      { label: "Production", path: "/production", icon: Factory },
      { label: "Planification", path: "/planification", icon: Calendar },
      { label: "Contrôle Qualité", path: "/qualite", icon: ShieldCheck },
      { label: "Stocks", path: "/stocks", icon: Boxes },
      { label: "Entrepôts", path: "/entrepots", icon: Warehouse },
    ],
  },
  {
    title: "Système",
    module: "systeme",
    items: [
      { label: "Assistant IA", path: "/assistant-ia", icon: Brain },
      { label: "Business Intelligence", path: "/bi", icon: BarChart3 },
      { label: "Rapports", path: "/rapports", icon: BarChart3 },
      { label: "Journaux d'Audit", path: "/audit", icon: ScrollText },
      { label: "Utilisateurs", path: "/utilisateurs", icon: Users },
      { label: "Paramètres", path: "/parametres", icon: SettingsIcon },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const { can } = usePermissions();
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const isAdmin = user?.role === "admin";

  const visibleGroups = navGroups.filter((g) => can(g.module, "view"));

  return (
    <aside className="w-64 h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0 gap-3">
        <Logo variant="icon" size={36} light />
        <div className="flex flex-col justify-center min-w-0 py-1">
          <div className="text-sm font-extrabold tracking-tight text-white truncate leading-tight">
            {settings?.nom_entreprise || "MY Logistics"}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="h-px w-3 bg-white/30 flex-shrink-0" />
            <span
              className="text-[7px] font-semibold uppercase tracking-[0.08em] text-blue-200 leading-tight"
              style={{ wordBreak: "break-word" }}
            >
              {settings?.slogan || "Manage • Optimize • Deliver"}
            </span>
            <span className="h-px w-3 bg-white/30 flex-shrink-0" />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items
                .filter((item) => {
                  // Administration pages are visible to administrators only.
                  if (["/utilisateurs", "/parametres"].includes(item.path) && !isAdmin) return false;
                  return true;
                })
                .map((item) => {
                  const isActive =
                    item.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}

        {visibleGroups.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-sidebar-foreground/60">
              Aucun module accessible. Contactez l'administrateur.
            </p>
          </div>
        )}
      </nav>

      <div className="flex-shrink-0 px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/40 text-center">
          MYLogistic
        </p>
      </div>
    </aside>
  );
}
