import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminOnlyRoute from '@/components/AdminOnlyRoute';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import FirstPasswordChange from '@/pages/FirstPasswordChange';
import Landing from '@/pages/Landing';
import ERPLayout from '@/components/erp/ERPLayout';
import Dashboard from '@/pages/Dashboard';
import Articles from '@/pages/Articles';
import Suppliers from '@/pages/Suppliers';
import PurchaseOrders from '@/pages/PurchaseOrders';
import Stocks from '@/pages/Stocks';
import Warehouses from '@/pages/Warehouses';
import CustomerOrders from '@/pages/CustomerOrders';
import Transport from '@/pages/Transport';
import Employees from '@/pages/Employees';
import Maintenance from '@/pages/Maintenance';
import Finance from '@/pages/Finance';
import Subcontracting from '@/pages/Subcontracting';
import CRM from '@/pages/CRM';
import Exploitation from '@/pages/Exploitation';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Fleet from '@/pages/Fleet';
import Fuel from '@/pages/Fuel';
import Invoices from '@/pages/Invoices';
import Production from '@/pages/Production';
import Quality from '@/pages/Quality';
import AuditLogs from '@/pages/AuditLogs';
import AIAssistant from '@/pages/AIAssistant';
import BI from '@/pages/BI';
import Users from '@/pages/Users';
import VehicleDocuments from '@/pages/VehicleDocuments';
import VehicleAlerts from '@/pages/VehicleAlerts';
import VehicleAvailability from '@/pages/VehicleAvailability';
import Consommation from '@/pages/Consommation';
import Surconsommation from '@/pages/Surconsommation';
import Devis from '@/pages/Devis';
import Avoirs from '@/pages/Avoirs';
import DeliveryNotes from '@/pages/DeliveryNotes';
import Payments from '@/pages/Payments';
import ClientStatements from '@/pages/ClientStatements';
import CaissePage from '@/pages/CaissePage';
import BanquePage from '@/pages/BanquePage';
import ResultRentabilite from '@/pages/ResultRentabilite';
import MissionStatements from '@/pages/MissionStatements';
import Subcontractors from '@/pages/Subcontractors';
import SubcontractorPayments from '@/pages/SubcontractorPayments';
import SupplierPayments from '@/pages/SupplierPayments';
import PurchaseStatements from '@/pages/PurchaseStatements';
import Timesheet from '@/pages/Timesheet';
import Advances from '@/pages/Advances';
import PayrollPage from '@/pages/PayrollPage';
import Contracts from '@/pages/Contracts';
import HRAlerts from '@/pages/HRAlerts';
import MaintenanceDashboard from '@/pages/MaintenanceDashboard';
import MaintenancePlans from '@/pages/MaintenancePlans';
import Incidents from '@/pages/Incidents';
import MaintenanceExpenses from '@/pages/MaintenanceExpenses';
import SpareParts from '@/pages/SpareParts';
import MaintenanceAlerts from '@/pages/MaintenanceAlerts';
import ProductionPlanning from '@/pages/ProductionPlanning';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  if (user?.must_change_password) {
    return <Navigate to="/change-password" replace />;
  }

  // Render the main app
  return <Outlet />;
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<FirstPasswordChange />} />
            {/* Protected app routes */}
            <Route element={<AuthenticatedApp />}>
              <Route element={<ERPLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard-general" element={<Dashboard />} />
                {/* Exploitation Transport */}
                <Route path="/exploitation" element={<Exploitation />} />
                <Route path="/transport" element={<Transport />} />
                <Route path="/flotte" element={<Fleet />} />
                <Route path="/carburant" element={<Fuel />} />
                <Route path="/consommation" element={<Consommation />} />
                <Route path="/surconsommation" element={<Surconsommation />} />
                <Route path="/documents-vehicules" element={<VehicleDocuments />} />
                <Route path="/alertes-vehicules" element={<VehicleAlerts />} />
                <Route path="/disponibilite" element={<VehicleAvailability />} />
                {/* Finance & Commercial */}
                <Route path="/crm" element={<CRM />} />
                <Route path="/devis" element={<Devis />} />
                <Route path="/bons-livraison" element={<DeliveryNotes />} />
                <Route path="/factures" element={<Invoices />} />
                <Route path="/avoirs" element={<Avoirs />} />
                <Route path="/paiements" element={<Payments />} />
                <Route path="/releve-clients" element={<ClientStatements />} />
                <Route path="/caisse" element={<CaissePage />} />
                <Route path="/banque" element={<BanquePage />} />
                <Route path="/rentabilite" element={<ResultRentabilite />} />
                <Route path="/missions-clients" element={<MissionStatements />} />
                <Route path="/commandes-clients" element={<CustomerOrders />} />
                <Route path="/finance" element={<Finance />} />
                {/* Sous-traitance */}
                <Route path="/sous-traitance" element={<Subcontracting />} />
                <Route path="/sous-traitants" element={<Subcontractors />} />
                <Route path="/paiements-sous-traitance" element={<SubcontractorPayments />} />
                {/* Gestion des Achats */}
                <Route path="/fournisseurs" element={<Suppliers />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/commandes-achat" element={<PurchaseOrders />} />
                <Route path="/paiements-fournisseurs" element={<SupplierPayments />} />
                <Route path="/releve-achats" element={<PurchaseStatements />} />
                {/* Ressources Humaines */}
                <Route path="/rh" element={<Employees />} />
                <Route path="/pointage" element={<Timesheet />} />
                <Route path="/avances" element={<Advances />} />
                <Route path="/paie" element={<PayrollPage />} />
                <Route path="/contrats" element={<Contracts />} />
                <Route path="/alertes-rh" element={<HRAlerts />} />
                {/* Maintenance */}
                <Route path="/dashboard-maintenance" element={<MaintenanceDashboard />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/plans-entretien" element={<MaintenancePlans />} />
                <Route path="/pannes" element={<Incidents />} />
                <Route path="/depenses-maintenance" element={<MaintenanceExpenses />} />
                <Route path="/pieces-consommation" element={<SpareParts />} />
                <Route path="/alertes-maintenance" element={<MaintenanceAlerts />} />
                {/* Production & Stock */}
                <Route path="/production" element={<Production />} />
                <Route path="/planification" element={<ProductionPlanning />} />
                <Route path="/qualite" element={<Quality />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/entrepots" element={<Warehouses />} />
                {/* Système */}
                <Route path="/assistant-ia" element={<AIAssistant />} />
                <Route path="/bi" element={<BI />} />
                <Route path="/rapports" element={<Reports />} />
                <Route path="/audit" element={<AuditLogs />} />
                <Route element={<AdminOnlyRoute />}>
                  <Route path="/utilisateurs" element={<Users />} />
                  <Route path="/parametres" element={<Settings />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
