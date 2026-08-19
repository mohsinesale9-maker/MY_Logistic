import { useState, useEffect, useRef } from "react";
import { entities, integrations } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  useCompanySettings,
  clearCompanySettingsCache,
} from "@/hooks/useCompanySettings";
import {
  Building2,
  Upload,
  Loader2,
  Save,
  ImageIcon,
  Trash2,
  PenLine,
} from "lucide-react";
import { DEPARTMENTS } from "@/lib/report-departments";

const EMPTY = {
  nom_entreprise: "",
  logo_url: "",
  slogan: "",
  forme_juridique: "SARL",
  capital_social: 0,
  directeur_nom: "",
  directeur_titre: "Directeur Général",
  adresse: "",
  ville: "",
  code_postal: "",
  pays: "Maroc",
  telephone: "",
  email: "",
  website: "",
  ice: "",
  rc: "",
  if_number: "",
  cnss: "",
  patente: "",
  devise: "MAD",
  tva_taux: 20,
  department_signatories: "",
};

export default function CompanySettingsForm() {
  const { settings, loading, refresh } = useCompanySettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState(EMPTY);
  const [deptSignatories, setDeptSignatories] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setFormData({ ...EMPTY, ...settings });
      // Parse department_signatories JSON blob (safe-fallback to empty)
      try {
        const parsed = settings.department_signatories
          ? JSON.parse(settings.department_signatories)
          : {};
        setDeptSignatories(parsed || {});
      } catch {
        setDeptSignatories({});
      }
    } else {
      setFormData(EMPTY);
      setDeptSignatories({});
    }
  }, [settings]);

  const updateDeptSignatory = (id, field, value) => {
    setDeptSignatories((prev) => ({
      ...prev,
      [id]: { ...(prev?.[id] || {}), [field]: value },
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await integrations.Core.UploadFile({ file });
      handleChange("logo_url", result.file_url);
      toast({ title: "Logo téléchargé", description: "N'oubliez pas d'enregistrer." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.message || "Échec du téléchargement du logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Strip built-in fields before saving
      const payload = { ...formData };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      // Serialize the department signatories as JSON (the column is TEXT).
      payload.department_signatories = JSON.stringify(
        Object.fromEntries(
          Object.entries(deptSignatories).filter(
            ([, v]) => v && (v.name || v.title)
          )
        )
      );

      if (settings?.id) {
        await entities.CompanySetting.update(settings.id, payload);
      } else {
        await entities.CompanySetting.create(payload);
      }
      clearCompanySettingsCache();
      await refresh();
      toast({ title: "Paramètres enregistrés", description: "La configuration de l'entreprise a été mise à jour." });
    } catch (err) {
      toast({
        title: "Erreur d'enregistrement",
        description: err.message || "Erreur lors de l'enregistrement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Profil de l'entreprise</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nom, logo, adresse et informations légales affichés dans l'application
          </p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="w-20 h-20 rounded-xl bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
          {formData.logo_url ? (
            <img
              src={formData.logo_url}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <Label className="text-xs">Logo de l'entreprise</Label>
          <p className="text-xs text-muted-foreground mb-2">
            PNG, JPG ou SVG. Carré recommandé (min. 128×128px).
          </p>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingLogo}
              className="gap-2"
            >
              {uploadingLogo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingLogo ? "Téléchargement..." : "Télécharger"}
            </Button>
            {formData.logo_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleChange("logo_url", "")}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Retirer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* General info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nom_entreprise">Nom de l'entreprise</Label>
          <Input
            id="nom_entreprise"
            value={formData.nom_entreprise || ""}
            onChange={(e) => handleChange("nom_entreprise", e.target.value)}
            placeholder="MY Logistics"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slogan">Slogan</Label>
          <Input
            id="slogan"
            value={formData.slogan || ""}
            onChange={(e) => handleChange("slogan", e.target.value)}
            placeholder="Manage • Optimize • Deliver"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="forme_juridique">Forme juridique</Label>
          <Input
            id="forme_juridique"
            value={formData.forme_juridique || ""}
            onChange={(e) => handleChange("forme_juridique", e.target.value)}
            placeholder="SARL, SA, SNC..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capital_social">Capital social (DH)</Label>
          <Input
            id="capital_social"
            type="number"
            value={formData.capital_social || 0}
            onChange={(e) => handleChange("capital_social", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="directeur_nom">Nom du Directeur Général</Label>
          <Input
            id="directeur_nom"
            value={formData.directeur_nom || ""}
            onChange={(e) => handleChange("directeur_nom", e.target.value)}
            placeholder="Nom complet du DG"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="directeur_titre">Titre du dirigeant</Label>
          <Input
            id="directeur_titre"
            value={formData.directeur_titre || "Directeur Général"}
            onChange={(e) => handleChange("directeur_titre", e.target.value)}
            placeholder="Directeur Général"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Adresse
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={formData.adresse || ""}
              onChange={(e) => handleChange("adresse", e.target.value)}
              placeholder="123 Rue Mohammed V"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              value={formData.ville || ""}
              onChange={(e) => handleChange("ville", e.target.value)}
              placeholder="Casablanca"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code_postal">Code postal</Label>
            <Input
              id="code_postal"
              value={formData.code_postal || ""}
              onChange={(e) => handleChange("code_postal", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pays">Pays</Label>
            <Input
              id="pays"
              value={formData.pays || ""}
              onChange={(e) => handleChange("pays", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Contact
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone || ""}
              onChange={(e) => handleChange("telephone", e.target.value)}
              placeholder="+212 5 22 00 00 00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contact@mylogistics.ma"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={formData.website || ""}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="www.mylogistics.ma"
            />
          </div>
        </div>
      </div>

      {/* Legal identifiers */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Identifiants légaux
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ice">ICE</Label>
            <Input
              id="ice"
              value={formData.ice || ""}
              onChange={(e) => handleChange("ice", e.target.value)}
              placeholder="Identifiant Commun de l'Entreprise"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rc">RC (Registre de Commerce)</Label>
            <Input
              id="rc"
              value={formData.rc || ""}
              onChange={(e) => handleChange("rc", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="if_number">IF (Identifiant Fiscal)</Label>
            <Input
              id="if_number"
              value={formData.if_number || ""}
              onChange={(e) => handleChange("if_number", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnss">CNSS</Label>
            <Input
              id="cnss"
              value={formData.cnss || ""}
              onChange={(e) => handleChange("cnss", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patente">Patente</Label>
            <Input
              id="patente"
              value={formData.patente || ""}
              onChange={(e) => handleChange("patente", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Financial */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Paramètres financiers
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="devise">Devise</Label>
            <Input
              id="devise"
              value={formData.devise || "MAD"}
              onChange={(e) => handleChange("devise", e.target.value)}
              placeholder="MAD, EUR, USD..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tva_taux">Taux de TVA (%)</Label>
            <Input
              id="tva_taux"
              type="number"
              value={formData.tva_taux || 0}
              onChange={(e) => handleChange("tva_taux", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Department signatories (for PDF / Word report footers) */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="w-3.5 h-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Signatures par département
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Noms et titres des responsables qui apparaîtront dans le bloc signature
          des rapports PDF et Word (en plus de la Direction Générale).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.values(DEPARTMENTS).map((dept) => {
            const current = deptSignatories?.[dept.id] || {};
            return (
              <div
                key={dept.id}
                className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: `rgb(${dept.color[0]}, ${dept.color[1]}, ${dept.color[2]})`,
                    }}
                  />
                  <span className="text-xs font-semibold">{dept.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Nom du responsable
                    </Label>
                    <Input
                      value={current.name || ""}
                      onChange={(e) =>
                        updateDeptSignatory(dept.id, "name", e.target.value)
                      }
                      placeholder="Nom complet"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Titre
                    </Label>
                    <Input
                      value={current.title || dept.defaultSignatory.title}
                      onChange={(e) =>
                        updateDeptSignatory(dept.id, "title", e.target.value)
                      }
                      placeholder={dept.defaultSignatory.title}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}