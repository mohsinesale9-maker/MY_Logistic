import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  Bell,
  Plug,
  Palette,
  Globe,
} from "lucide-react";
import PageHeader from "@/components/erp/PageHeader";
import CompanySettingsForm from "@/components/erp/CompanySettingsForm";
import ImportData from "@/components/erp/ImportData";

const quickLinks = [
  { title: "Utilisateurs & Rôles", description: "Comptes, rôles et permissions", icon: Users, color: "bg-indigo-50 text-indigo-600", path: "/utilisateurs" },
  { title: "Sécurité", description: "Authentification et journaux", icon: ShieldCheck, color: "bg-red-50 text-red-600", path: "/audit" },
  { title: "Notifications", description: "Alertes et notifications système", icon: Bell, color: "bg-pink-50 text-pink-600", path: "/alertes-vehicules" },
  { title: "Intégrations", description: "APIs et services externes", icon: Plug, color: "bg-cyan-50 text-cyan-600", path: "/bi" },
  { title: "Apparence", description: "Logo, nom et branding", icon: Palette, color: "bg-orange-50 text-orange-600", path: "/parametres" },
  { title: "Localisation", description: "Fuseau horaire et région", icon: Globe, color: "bg-gray-100 text-gray-600", path: "/parametres" },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Paramètres" subtitle="Configuration du système et de l'entreprise" />

      {/* Company profile (editable) */}
      <CompanySettingsForm />

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Modules de configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Card
              key={link.title}
              className="p-5 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
              onClick={() => navigate(link.path)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm">{link.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Data import */}
      <ImportData />
    </div>
  );
}