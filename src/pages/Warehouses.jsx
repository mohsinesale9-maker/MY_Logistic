import { useState } from "react";
import { useEntity } from "@/hooks/useEntity";
import { logisticsMath } from "@/lib/logistics-math";
import { Plus, Pencil, Trash2, Loader2, MapPin, Maximize, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import PageHeader from "@/components/erp/PageHeader";
import StatusBadge from "@/components/erp/StatusBadge";
import KPICard from "@/components/erp/KPICard";
import EntityFormDialog from "@/components/erp/EntityFormDialog";
import { Warehouse } from "lucide-react";

const formFields = [
  { key: "nom", label: "Nom de l'entrepôt", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "principal", label: "Principal" },
      { value: "secondaire", label: "Secondaire" },
      { value: "aere", label: "Aéré" },
    ],
  },
  { key: "adresse", label: "Adresse", type: "text", fullWidth: true },
  { key: "surface", label: "Surface (m²)", type: "number" },
  { key: "volume_total", label: "Volume total (m³)", type: "number" },
  { key: "volume_utilise", label: "Volume utilisé (m³)", type: "number" },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
    ],
  },
];

export default function Warehouses() {
  const { items, loading, create, update, remove } = useEntity("Warehouse");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    if (editingItem) {
      await update(editingItem.id, data);
    } else {
      await create(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    await remove(deleteId);
    setDeleteId(null);
  };

  const totalSurface = items.reduce((s, w) => s + (w.surface || 0), 0);
  const avgOccupation =
    items.length > 0
      ? items.reduce(
          (s, w) =>
            s + logisticsMath.occupation(w.volume_utilise, w.volume_total),
          0
        ) / items.length
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Entrepôts"
        subtitle="Gestion des sites de stockage"
        action={
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel entrepôt
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              title="Nombre d'entrepôts"
              value={logisticsMath.formatNumber(items.length)}
              icon={Warehouse}
              color="primary"
            />
            <KPICard
              title="Surface totale"
              value={`${logisticsMath.formatNumber(totalSurface)} m²`}
              icon={Maximize}
              color="info"
            />
            <KPICard
              title="Occupation moyenne"
              value={logisticsMath.formatPercent(avgOccupation)}
              icon={Gauge}
              color={avgOccupation > 85 ? "destructive" : "success"}
            />
          </div>

          {/* Warehouse Cards */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-xl bg-card">
              <Warehouse className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">
                Aucun entrepôt. Cliquez sur « Nouvel entrepôt » pour commencer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((wh) => {
                const occupation = logisticsMath.occupation(
                  wh.volume_utilise,
                  wh.volume_total
                );
                return (
                  <Card key={wh.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{wh.nom}</h3>
                          <StatusBadge status={wh.type || "principal"} />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEdit(wh)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-red-50"
                          onClick={() => setDeleteId(wh.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {wh.adresse && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{wh.adresse}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Maximize className="w-3.5 h-3.5" />
                        <span>{logisticsMath.formatNumber(wh.surface)} m²</span>
                      </div>
                    </div>

                    {/* Occupation bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Occupation</span>
                        <span className="font-medium">
                          {logisticsMath.formatPercent(occupation)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupation > 85
                              ? "bg-red-500"
                              : occupation > 70
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(occupation, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {logisticsMath.formatNumber(wh.volume_utilise)} /{" "}
                        {logisticsMath.formatNumber(wh.volume_total)} m³
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Modifier l'entrepôt" : "Nouvel entrepôt"}
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet entrepôt ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}