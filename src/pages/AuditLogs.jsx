import { useState } from "react";
import { useEntity } from "@/hooks/useEntity";
import { logisticsMath } from "@/lib/logistics-math";
import { Card } from "@/components/ui/card";
import DataTable from "@/components/erp/DataTable";
import PageHeader from "@/components/erp/PageHeader";
import StatusBadge from "@/components/erp/StatusBadge";
import EntityFormDialog from "@/components/erp/EntityFormDialog";
import { Loader2, Plus, FileText, User, Database, Trash2 } from "lucide-react";
import { entities } from "@/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
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

const actionOptions = [
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  { value: "login", label: "Connexion" },
  { value: "logout", label: "Déconnexion" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
];

const addFormFields = [
  {
    key: "action",
    label: "Action",
    type: "select",
    required: true,
    options: actionOptions,
  },
  {
    key: "entity_type",
    label: "Entité",
    type: "text",
    required: true,
    placeholder: "ex: Client, Commande, Facture...",
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Détail de l'action effectuée...",
  },
  { key: "user_name", label: "Nom utilisateur", type: "text", placeholder: "Nom complet" },
  { key: "user_email", label: "Email utilisateur", type: "text", placeholder: "email@exemple.com" },
];

export default function AuditLogs() {
  const { items, loading, reload } = useEntity("AuditLog", "-created_date", 200);
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (formData) => {
    try {
      await entities.AuditLog.create({
        ...formData,
        user_email: formData.user_email || user?.email,
        user_name: formData.user_name || user?.full_name || user?.email,
      });
      toast({ title: "Entrée d'audit ajoutée" });
      setShowAddDialog(false);
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await entities.AuditLog.delete(deleteTarget.id);
      toast({ title: "Entrée supprimée" });
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const actionCol = {
    key: "actions",
    label: "Actions",
    className: "text-right",
    render: (_, item) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteTarget(item)}
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
  };

  const columns = [
    { key: "action", label: "Action", render: (val) => <StatusBadge status={val} />, className: "font-medium" },
    { key: "entity_type", label: "Entité" },
    { key: "description", label: "Description" },
    { key: "user_name", label: "Utilisateur", render: (val, item) => val || item.user_email || "—" },
    {
      key: "created_date",
      label: "Date",
      render: (val) => logisticsMath.formatDateTime(val),
    },
    actionCol,
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Journaux d'Audit"
        subtitle="Traçabilité des actions — création, modification, suppression, connexion"
        action={
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle entrée
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">Total entrées</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{items.filter((i) => i.action === "create").length}</p>
              <p className="text-xs text-muted-foreground">Créations</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(items.map((i) => i.user_email)).size}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(items.map((i) => i.entity_type)).size}</p>
              <p className="text-xs text-muted-foreground">Entités touchées</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={items} pageSize={15} />
      )}

      {/* Add Entry Dialog */}
      <EntityFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Nouvelle entrée d'audit"
        fields={addFormFields}
        onSave={handleAdd}
        submitLabel="Ajouter"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'entrée d'audit sera définitivement supprimée.
              <br />
              <span className="font-medium mt-2 block">{deleteTarget?.description}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
