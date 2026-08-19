import { useState } from "react";
import { useEntity } from "@/hooks/useEntity";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import PageHeader from "./PageHeader";
import DataTable from "./DataTable";
import EntityFormDialog from "./EntityFormDialog";
import ImportButton from "./ImportButton";
import { exportToCSV } from "@/lib/export-utils";

export default function CrudPage({
  entityName,
  title,
  subtitle,
  columns,
  formFields,
  onTransform,
  addButtonLabel = "Ajouter",
  filterFn,
}) {
  const { toast } = useToast();
  const { items: allItems, loading, create, update, remove, reload } = useEntity(entityName);
  const items = filterFn ? allItems.filter(filterFn) : allItems;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    const transformed = onTransform ? onTransform(data) : data;

    // Strip empty strings for optional fields to avoid validation errors
    const cleaned = {};
    Object.entries(transformed).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined) {
        // keep 0 for numbers, skip empty strings
        if (typeof v === "string" && v === "") return;
      }
      cleaned[k] = v;
    });

    try {
      if (editingItem) {
        await update(editingItem.id, cleaned);
        toast({ title: "Succès", description: "Enregistrement modifié." });
      } else {
        await create(cleaned);
        toast({ title: "Succès", description: "Enregistrement créé." });
      }
      setDialogOpen(false);
      reload();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Erreur lors de l'enregistrement.";
      toast({
        title: "Erreur d'enregistrement",
        description: msg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(deleteId);
      toast({ title: "Supprimé", description: "Enregistrement supprimé." });
      reload();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Erreur lors de la suppression.";
      toast({
        title: "Erreur de suppression",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      cellClassName: "text-right",
      render: (_, item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleEdit(item)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-red-50"
            onClick={() => setDeleteId(item.id)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            <ImportButton entityName={entityName} onImported={reload} />
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const exportCols = columns.filter((c) => c.key && c.key !== "actions");
                  const headers = exportCols.map((c) => c.label);
                  const rows = items.map((item) =>
                    exportCols.map((c) => item[c.key] ?? "")
                  );
                  exportToCSV(title, headers, rows);
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            )}
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              {addButtonLabel}
            </Button>
          </div>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={tableColumns}
          data={items}
          emptyMessage={`Aucun élément. Cliquez sur « ${addButtonLabel} » pour commencer.`}
        />
      )}
      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? `Modifier — ${title}` : `Ajouter — ${title}`}
        fields={formFields}
        initialData={editingItem}
        onSave={handleSave}
      />
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}