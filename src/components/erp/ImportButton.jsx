import { useState, useRef } from "react";
import { entities, integrations } from "@/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2 } from "lucide-react";

export default function ImportButton({ entityName, onImported, label = "Importer" }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file) => {
    if (!file) return;
    setImporting(true);
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

      toast({
        title: "Import réussi",
        description: `${records.length} enregistrement(s) importé(s).`,
      });

      if (onImported) onImported();
    } catch (err) {
      toast({
        title: "Erreur d'import",
        description: err.message || "Erreur lors de l'import.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="gap-2"
      >
        {importing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {importing ? "Import..." : label}
      </Button>
    </>
  );
}