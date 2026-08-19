import { useState, useRef } from "react";
import { entities, integrations } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, FileUp, CheckCircle, AlertCircle } from "lucide-react";

const ENTITIES = [
  { name: "Client", label: "Clients" },
  { name: "Supplier", label: "Fournisseurs" },
  { name: "Article", label: "Articles" },
  { name: "PurchaseOrder", label: "Commandes d'achat" },
  { name: "CustomerOrder", label: "Commandes clients" },
  { name: "Transport", label: "Transport" },
  { name: "Fleet", label: "Flotte" },
  { name: "FuelRecord", label: "Carburant" },
  { name: "Employee", label: "Employés" },
  { name: "Maintenance", label: "Maintenance" },
  { name: "Invoice", label: "Factures" },
  { name: "ProductionOrder", label: "Production" },
  { name: "QualityControl", label: "Contrôle qualité" },
  { name: "Subcontractor", label: "Sous-traitants" },
  { name: "DeliveryNote", label: "Bons de livraison" },
  { name: "Payment", label: "Paiements" },
  { name: "FinanceTransaction", label: "Transactions financières" },
  { name: "Warehouse", label: "Entrepôts" },
  { name: "SparePart", label: "Pièces de rechange" },
  { name: "Contract", label: "Contrats" },
  { name: "Timesheet", label: "Pointage" },
  { name: "Advance", label: "Avances" },
  { name: "Payroll", label: "Paie" },
  { name: "VehicleDocument", label: "Documents véhicules" },
  { name: "VehicleAlert", label: "Alertes véhicules" },
];

export default function ImportData() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [entityName, setEntityName] = useState("");
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!entityName || !file) {
      toast({
        title: "Information manquante",
        description: "Sélectionnez une entité et un fichier.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      // 1. Upload the file
      const { file_url } = await integrations.Core.UploadFile({ file });

      // 2. Get the entity schema
      const schema = await entities[entityName].schema();

      // 3. Extract data from the file
      const extractResult = await integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: schema.properties || {},
          required: schema.required || [],
        },
      });

      if (extractResult.status !== "success" || !extractResult.output) {
        throw new Error(extractResult.details || "Extraction échouée");
      }

      const records = Array.isArray(extractResult.output)
        ? extractResult.output
        : [extractResult.output];

      if (records.length === 0) {
        throw new Error("Aucun enregistrement trouvé dans le fichier.");
      }

      // 4. Bulk create
      await entities[entityName].bulkCreate(records);

      setResult({
        success: true,
        count: records.length,
      });

      toast({
        title: "Import réussi",
        description: `${records.length} enregistrement(s) importé(s) dans ${entityName}.`,
      });

      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setResult({
        success: false,
        error: err.message || "Erreur lors de l'import.",
      });
      toast({
        title: "Erreur d'import",
        description: err.message || "Erreur lors de l'import.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
          <FileUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Import de données</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Importez des données depuis un fichier CSV, Excel ou JSON vers une entité
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Entité de destination</Label>
          <Select value={entityName} onValueChange={setEntityName}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez une entité" />
            </SelectTrigger>
            <SelectContent>
              {ENTITIES.map((e) => (
                <SelectItem key={e.name} value={e.name}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fichier (CSV, Excel ou JSON)</Label>
          <div className="flex gap-2">
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button
              onClick={handleImport}
              disabled={importing || !entityName || !file}
              className="gap-2 whitespace-nowrap"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer
                </>
              )}
            </Button>
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              result.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {result.count} enregistrement(s) importé(s) avec succès.
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {result.error}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}