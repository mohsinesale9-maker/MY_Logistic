import { useState, useMemo } from "react";
import { useEntity } from "@/hooks/useEntity";
import { entities } from "@/api";
import { logisticsMath } from "@/lib/logistics-math";
import PageHeader from "@/components/erp/PageHeader";
import EntityFormDialog from "@/components/erp/EntityFormDialog";
import ProductionGantt from "@/components/erp/ProductionGantt";
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
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ChartGantt,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
  X,
  Filter,
  Settings2,
  Coffee,
  Save,
} from "lucide-react";
import moment from "moment";

const planningFormFields = [
  {
    key: "production_order_id",
    label: "Ordre de production",
    type: "select",
    required: true,
  },
  { key: "machine", label: "Machine / Ligne", type: "text", required: true, placeholder: "ex: Machine 01" },
  { key: "ligne_production", label: "Ligne de production", type: "text", placeholder: "ex: Ligne A" },
  { key: "ressource", label: "Ressource", type: "text", placeholder: "ex: Opérateur 1" },
  { key: "start_datetime", label: "Date & heure de début", type: "datetime-local", required: true },
  { key: "end_datetime", label: "Date & heure de fin", type: "datetime-local", required: true },
  {
    key: "priorite",
    label: "Priorité",
    type: "select",
    required: true,
    options: [
      { value: "haute", label: "🔴 Haute" },
      { value: "normale", label: "🔵 Normale" },
      { value: "basse", label: "⚪ Basse" },
    ],
  },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: [
      { value: "planifie", label: "🟡 Planifié" },
      { value: "en_cours", label: "🔵 En cours" },
      { value: "termine", label: "🟢 Terminé" },
      { value: "annule", label: "🔴 Annulé" },
    ],
  },
  { key: "notes", label: "Notes / Commentaire", type: "textarea", placeholder: "Observations..." },
];

const VIEWS = ["semaine", "mois"];

function ConflictDialog({ conflicts, onClose }) {
  return (
    <AlertDialog open={!!conflicts} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Conflit de planification détecté
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 pt-2">
            {conflicts?.map((c, i) => (
              <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800">{c.machine}</p>
                <p className="text-amber-700">
                  {c.numero_ordre} —{" "}
                  {moment(c.start_datetime).format("DD/MM HH:mm")} →{" "}
                  {moment(c.end_datetime).format("HH:mm")}
                </p>
              </div>
            ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Compris</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PlanifyDialog({ orders, onClose, onConfirm }) {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [formData, setFormData] = useState({
    priorite: "normale",
    statut: "planifie",
    machine: "",
    ligne_production: "",
    ressource: "",
    notes: "",
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const updateField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleConfirm = async () => {
    if (!selectedOrderId || !formData.start_datetime || !formData.end_datetime) {
      toast({ title: "Champs requis", description: "Sélectionnez un ordre et les dates.", variant: "destructive" });
      return false;
    }
    await onConfirm(selectedOrder, formData);
    return true;
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Planifier une production</AlertDialogTitle>
          <AlertDialogDescription>
            Sélectionnez un ordre de production et configurez la planification.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Order selector */}
          <div className="space-y-2">
            <Label>Ordre de production *</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choisir un ordre..." />
              </SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.numero} — {o.produit} ({o.machine || "sans machine"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrder && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-1">
              <p className="font-semibold text-blue-800">{selectedOrder.numero}</p>
              <p className="text-blue-700">Produit : {selectedOrder.produit}</p>
              <p className="text-blue-700">Quantité prévue : {logisticsMath.formatNumber(selectedOrder.quantite_prevue)}</p>
              <p className="text-blue-700">Machine : {selectedOrder.machine || "—"}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & heure de début *</Label>
              <Input
                type="datetime-local"
                className="h-10"
                onChange={(e) => updateField("start_datetime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date & heure de fin *</Label>
              <Input
                type="datetime-local"
                className="h-10"
                onChange={(e) => updateField("end_datetime", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Machine</Label>
              <Input
                placeholder="ex: Machine 01"
                className="h-10"
                value={formData.machine}
                onChange={(e) => updateField("machine", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ligne de production</Label>
              <Input
                placeholder="ex: Ligne A"
                className="h-10"
                value={formData.ligne_production}
                onChange={(e) => updateField("ligne_production", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ressource</Label>
              <Input
                placeholder="ex: Opérateur 1"
                className="h-10"
                value={formData.ressource}
                onChange={(e) => updateField("ressource", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={formData.priorite} onValueChange={(v) => updateField("priorite", v)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haute">🔴 Haute</SelectItem>
                  <SelectItem value="normale">🔵 Normale</SelectItem>
                  <SelectItem value="basse">⚪ Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="Observations..."
              className="h-10"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            <Plus className="w-4 h-4 mr-1" />
            Planifier
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Shift Config Dialog ────────────────────────────────────────────────────────
function ShiftConfigDialog({ shifts, breaks, onClose, onSaveShift, onDeleteShift, onSaveBreak, onDeleteBreak }) {
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({ nom: "", heure_debut: "08:00", heure_fin: "16:00", couleur: "#3B82F6", actif: true });
  const [editingBreak, setEditingBreak] = useState(null);
  const [breakForm, setBreakForm] = useState({ shift_id: "", nom: "Pause", heure_debut: "12:00", heure_fin: "13:00", jours: [] });
  const [activeTab, setActiveTab] = useState("shifts");
  const [addShift, setAddShift] = useState(false);

  const DAYS = [
    { key: "lundi", label: "Lun" },
    { key: "mardi", label: "Mar" },
    { key: "mercredi", label: "Mer" },
    { key: "jeudi", label: "Jeu" },
    { key: "vendredi", label: "Ven" },
    { key: "samedi", label: "Sam" },
    { key: "dimanche", label: "Dim" },
  ];

  const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

  const toggleJour = (jour) => {
    setBreakForm((prev) => ({
      ...prev,
      jours: prev.jours.includes(jour) ? prev.jours.filter((d) => d !== jour) : [...prev.jours, jour],
    }));
  };

  const startEditShift = (s) => {
    setEditingShift(s.id);
    setShiftForm({ nom: s.nom, heure_debut: s.heure_debut, heure_fin: s.heure_fin, couleur: s.couleur || "#3B82F6", actif: s.actif !== false });
  };

  const startNewShift = () => { setAddShift(true); setEditingShift(null); setShiftForm({ nom: "", heure_debut: "08:00", heure_fin: "16:00", couleur: "#3B82F6", actif: true }); };

  const shiftColorDot = (c) => (
    <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
  );

  const shiftBreaks = (shiftId) => breaks.filter((b) => b.shift_id === shiftId);

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Configurer les Shifts &amp; Pauses
          </AlertDialogTitle>
          <AlertDialogDescription>
            Définissez les plages horaires de travail et les pauses associées.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {["shifts", "breaks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "shifts" ? "Shifts" : "Pauses"}
            </button>
          ))}
        </div>

        {/* ── Shifts Tab ── */}
        {activeTab === "shifts" && (
          <div className="space-y-3 py-2">
            {/* List */}
            {shifts.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                {editingShift === s.id ? (
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Input className="h-8 text-sm" value={shiftForm.nom} onChange={(e) => setShiftForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
                    <Input type="time" className="h-8 text-sm" value={shiftForm.heure_debut} onChange={(e) => setShiftForm((p) => ({ ...p, heure_debut: e.target.value }))} />
                    <Input type="time" className="h-8 text-sm" value={shiftForm.heure_fin} onChange={(e) => setShiftForm((p) => ({ ...p, heure_fin: e.target.value }))} />
                    <div className="flex gap-1">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => setShiftForm((p) => ({ ...p, couleur: c }))} className={`w-6 h-6 rounded-full border-2 ${shiftForm.couleur === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="col-span-4 flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditingShift(null)}>Annuler</Button>
                      <Button size="sm" onClick={() => { onSaveShift(shiftForm); setEditingShift(null); }}>Enregistrer</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      {shiftColorDot(s.couleur || "#3B82F6")}
                      <span className="font-medium text-sm">{s.nom}</span>
                      <span className="text-xs text-muted-foreground">{s.heure_debut} → {s.heure_fin}</span>
                      <div className="flex gap-1 ml-auto">
                        {shiftBreaks(s.id).map((b) => (
                          <span key={b.id} className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 py-0.5" title={b.nom}>
                            ☕ {b.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditShift(s)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => onDeleteShift(s.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* New shift form */}
            {addShift && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-primary bg-primary/5">
                <Input className="h-8 text-sm flex-1" value={shiftForm.nom} onChange={(e) => setShiftForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom du shift (ex: Shift 3)" />
                <Input type="time" className="h-8 text-sm w-28" value={shiftForm.heure_debut} onChange={(e) => setShiftForm((p) => ({ ...p, heure_debut: e.target.value }))} />
                <span className="text-muted-foreground text-sm">→</span>
                <Input type="time" className="h-8 text-sm w-28" value={shiftForm.heure_fin} onChange={(e) => setShiftForm((p) => ({ ...p, heure_fin: e.target.value }))} />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setShiftForm((p) => ({ ...p, couleur: c }))} className={`w-6 h-6 rounded-full border-2 ${shiftForm.couleur === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <Button size="sm" onClick={() => { onSaveShift(shiftForm); setAddShift(false); setShiftForm({ nom: "", heure_debut: "08:00", heure_fin: "16:00", couleur: "#3B82F6", actif: true }); }}><Save className="w-3 h-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => setAddShift(false)}><X className="w-3 h-3" /></Button>
              </div>
            )}

            {!addShift && (
              <Button variant="outline" size="sm" onClick={startNewShift} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Ajouter un shift
              </Button>
            )}
          </div>
        )}

        {/* ── Breaks Tab ── */}
        {activeTab === "breaks" && (
          <div className="space-y-3 py-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Shift</Label>
                <Select value={breakForm.shift_id} onValueChange={(v) => setBreakForm((p) => ({ ...p, shift_id: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Choisir un shift..." /></SelectTrigger>
                  <SelectContent>
                    {shifts.map((s) => <SelectItem key={s.id} value={s.id}>{s.nom} ({s.heure_debut}→{s.heure_fin})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-1">
                <Label className="text-xs">Nom pause</Label>
                <Input className="h-8 text-sm" value={breakForm.nom} onChange={(e) => setBreakForm((p) => ({ ...p, nom: e.target.value }))} placeholder="ex: Pause déjeuner" />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Début</Label>
                <Input type="time" className="h-8 text-sm" value={breakForm.heure_debut} onChange={(e) => setBreakForm((p) => ({ ...p, heure_debut: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin</Label>
                <Input type="time" className="h-8 text-sm" value={breakForm.heure_fin} onChange={(e) => setBreakForm((p) => ({ ...p, heure_fin: e.target.value }))} />
              </div>
              <Button size="sm" onClick={() => { if (breakForm.shift_id && breakForm.nom) onSaveBreak(breakForm); }} className="gap-1 self-end"><Save className="w-3 h-3" /> Ajouter</Button>
            </div>
            {/* Day selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Jours d'application</Label>
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => toggleJour(d.key)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      breakForm.jours.includes(d.key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-muted-foreground/20 hover:border-primary/50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing breaks */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Pauses configurées</p>
              {breaks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune pause configurée.</p>}
              {breaks.map((b) => {
                const s = shifts.find((sh) => sh.id === b.shift_id);
                return (
                  <div key={b.id} className="flex items-center gap-2 p-2 rounded border bg-muted/20 text-sm">
                    <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-medium">{b.nom}</span>
                    <span className="text-muted-foreground text-xs">{b.heure_debut}→{b.heure_fin}</span>
                    <span className="text-xs bg-muted rounded px-1">{s ? s.nom : "—"}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{((b.jours && Array.isArray(b.jours) ? b.jours : [])).join(", ")}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 flex-shrink-0" onClick={() => onDeleteBreak(b.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Fermer</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ProductionPlanning() {
  const { items: plannings, loading, reload } = useEntity("ProductionPlanning", "start_datetime", 500);
  const { items: orders } = useEntity("ProductionOrder", "created_date", 200);
  const { items: fleetItems } = useEntity("Fleet");

  const [view, setView] = useState("semaine");
  const [currentDate, setCurrentDate] = useState(moment());
  const [showPlanify, setShowPlanify] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedPlanning, setSelectedPlanning] = useState(null);

  // Available machines from fleet + orders
  const allMachines = useMemo(() => {
    const fromFleet = fleetItems.map((f) => f.nom || f.matricule).filter(Boolean);
    const fromOrders = orders.map((o) => o.machine).filter(Boolean);
    return [...new Set([...fromFleet, ...fromOrders])];
  }, [fleetItems, orders]);

  const filteredPlannings = useMemo(() => {
    return plannings.filter((p) => {
      if (search && !(p.numero_ordre || "").toLowerCase().includes(search.toLowerCase()) &&
          !(p.produit || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMachine !== "all" && p.machine !== filterMachine) return false;
      if (filterStatut !== "all" && p.statut !== filterStatut) return false;
      if (filterPriority !== "all" && p.priorite !== filterPriority) return false;
      return true;
    });
  }, [plannings, search, filterMachine, filterStatut, filterPriority]);

  // Stats
  const stats = useMemo(() => {
    const now = moment();
    return {
      total: filteredPlannings.length,
      planifies: filteredPlannings.filter((p) => p.statut === "planifie").length,
      enCours: filteredPlannings.filter((p) => p.statut === "en_cours").length,
      termes: filteredPlannings.filter((p) => p.statut === "termine").length,
      enRetard: filteredPlannings.filter((p) => p.statut === "en_retard" || (p.statut === "planifie" && moment(p.end_datetime).isBefore(now))).length,
      annules: filteredPlannings.filter((p) => p.statut === "annule").length,
    };
  }, [filteredPlannings]);

  // Detect conflicts for a new planning
  const detectConflicts = (newPlan) => {
    return plannings.filter((p) => {
      if (p.id === newPlan.id) return false;
      if (p.machine !== newPlan.machine) return false;
      if (p.statut === "annule") return false;
      const existingStart = moment(p.start_datetime);
      const existingEnd = moment(p.end_datetime);
      const newStart = moment(newPlan.start_datetime);
      const newEnd = moment(newPlan.end_datetime);
      return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
    });
  };

  const handlePlanify = async (order, formData) => {
    setSaving(true);
    try {
      const newPlan = {
        production_order_id: order.id,
        numero_ordre: order.numero,
        produit: order.produit,
        machine: formData.machine || order.machine || "",
        ligne_production: formData.ligne_production,
        ressource: formData.ressource,
        start_datetime: formData.start_datetime ? new Date(formData.start_datetime).toISOString() : null,
        end_datetime: formData.end_datetime ? new Date(formData.end_datetime).toISOString() : null,
        priorite: formData.priorite,
        statut: formData.statut,
        notes: formData.notes,
        quantite: order.quantite_prevue,
      };
      const conflictList = detectConflicts(newPlan);
      if (conflictList.length > 0) {
        setConflicts(conflictList);
        return;
      }
      await entities.ProductionPlanning.create(newPlan);
      toast({ title: "Planification créée" });
      setShowPlanify(false);
      // Reload to get data with correct Supabase timestamps
      setTimeout(() => reload(), 300);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const newPlan = { ...formData, id: editingPlan.id };
      const conflictList = detectConflicts(newPlan);
      if (conflictList.length > 0) {
        setConflicts(conflictList);
        return;
      }
      await entities.ProductionPlanning.update(editingPlan.id, {
        ...formData,
        start_datetime: formData.start_datetime ? new Date(formData.start_datetime).toISOString() : null,
        end_datetime: formData.end_datetime ? new Date(formData.end_datetime).toISOString() : null,
      });
      toast({ title: "Planification modifiée" });
      setEditingPlan(null);
      setTimeout(() => reload(), 300);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await entities.ProductionPlanning.delete(deleteTarget.id);
      toast({ title: "Planification annulée" });
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeStatut = async (planning, newStatut) => {
    try {
      await entities.ProductionPlanning.update(planning.id, { statut: newStatut });
      toast({ title: "Statut mis à jour" });
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // Navigation helpers
  const prev = () => setCurrentDate((d) => d.clone().subtract(1, view === "semaine" ? "week" : "month"));
  const next = () => setCurrentDate((d) => d.clone().add(1, view === "semaine" ? "week" : "month"));
  const today = () => setCurrentDate(moment());

  const weekDays = useMemo(() => {
    const start = currentDate.clone().startOf("week");
    return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "day"));
  }, [currentDate]);

  const ganttRange = useMemo(() => {
    if (view === "semaine") {
      return {
        start: currentDate.clone().startOf("week"),
        end: currentDate.clone().endOf("week"),
      };
    }
    return {
      start: currentDate.clone().startOf("month"),
      end: currentDate.clone().endOf("month"),
    };
  }, [currentDate, view]);

  const ganttPlannings = useMemo(() => {
    const { start, end } = ganttRange;
    return filteredPlannings.filter((p) => {
      const s = moment(p.start_datetime);
      const e = moment(p.end_datetime);
      return s.isSameOrBefore(end) && e.isSameOrAfter(start);
    });
  }, [filteredPlannings, ganttRange]);

  const labelForView = () => {
    if (view === "semaine") return `${weekDays[0].format("DD MMM")} — ${weekDays[6].format("DD MMM YYYY")}`;
    return currentDate.format("MMMM YYYY");
  };

  const statutLabels = {
    planifie: "Planifié", en_cours: "En cours", termine: "Terminé", annule: "Annulé", en_retard: "En retard"
  };
  const prioriteLabels = { haute: "Haute", normale: "Normale", basse: "Basse" };
  const editFormFields = useMemo(() => planningFormFields.map((field) => (
    field.key === "production_order_id"
      ? {
          ...field,
          options: orders.map((order) => ({
            value: order.id,
            label: `${order.numero || "Ordre"} — ${order.produit || "Sans produit"}`,
          })),
        }
      : field
  )), [orders]);

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      <PageHeader
        title="Planification de Production"
        subtitle="Diagramme de Gantt — suivez les chaînes de production et les deadlines"
        action={
          <Button onClick={() => setShowPlanify(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Planifier
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
        {[
          { label: "Total", value: stats.total, color: "text-primary" },
          { label: "Planifiés", value: stats.planifies, color: "text-amber-600" },
          { label: "En cours", value: stats.enCours, color: "text-blue-600" },
          { label: "Terminés", value: stats.termes, color: "text-green-600" },
          { label: "En retard", value: stats.enRetard, color: "text-orange-600" },
          { label: "Annulés", value: stats.annules, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center w-full">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="🔍 Rechercher un ordre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Filter className="w-4 h-4 text-muted-foreground -ml-6 flex-shrink-0" />
        <Select value={filterMachine} onValueChange={setFilterMachine}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Machine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes machines</SelectItem>
            {allMachines.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="planifie">Planifié</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
            <SelectItem value="en_retard">En retard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="haute">Haute</SelectItem>
            <SelectItem value="normale">Normale</SelectItem>
            <SelectItem value="basse">Basse</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0 ml-auto">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {v === "semaine" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={today}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gantt diagram */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ChartGantt className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{labelForView()}</span>
        </div>
        <ProductionGantt
          plannings={ganttPlannings}
          orders={orders}
          viewStart={ganttRange.start}
          viewEnd={ganttRange.end}
          scale={view}
          onSelectPlanning={setSelectedPlanning}
        />
      </div>

      {/* Selected planning detail */}
      {selectedPlanning && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Détails de la planification</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedPlanning(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <DetailItem label="Ordre" value={selectedPlanning.numero_ordre} />
            <DetailItem label="Produit" value={selectedPlanning.produit} />
            <DetailItem label="Machine" value={selectedPlanning.machine} />
            <DetailItem label="Ligne" value={selectedPlanning.ligne_production} />
            <DetailItem label="Ressource" value={selectedPlanning.ressource} />
            <DetailItem label="Quantité" value={logisticsMath.formatNumber(selectedPlanning.quantite)} />
            <DetailItem label="Début" value={moment(selectedPlanning.start_datetime).format("DD/MM/YYYY HH:mm")} />
            <DetailItem label="Fin" value={moment(selectedPlanning.end_datetime).format("DD/MM/YYYY HH:mm")} />
            <DetailItem label="Priorité" value={prioriteLabels[selectedPlanning.priorite]} />
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Statut</Label>
              <Select value={selectedPlanning.statut} onValueChange={(v) => { changeStatut(selectedPlanning, v); setSelectedPlanning({ ...selectedPlanning, statut: v }); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifie">🟡 Planifié</SelectItem>
                  <SelectItem value="en_cours">🔵 En cours</SelectItem>
                  <SelectItem value="termine">🟢 Terminé</SelectItem>
                  <SelectItem value="annule">🔴 Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPlanning.notes && (
              <div className="col-span-2 space-y-1">
                <Label className="text-muted-foreground text-xs">Notes</Label>
                <p className="text-sm bg-muted/50 rounded p-2">{selectedPlanning.notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditingPlan(selectedPlanning); setSelectedPlanning(null); }}>
              <Pencil className="w-3 h-3" /> Modifier
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:text-red-600" onClick={() => { setDeleteTarget(selectedPlanning); setSelectedPlanning(null); }}>
              <Trash2 className="w-3 h-3" /> Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Planify dialog */}
      {showPlanify && (
        <PlanifyDialog
          orders={orders}
          onClose={() => setShowPlanify(false)}
          onConfirm={handlePlanify}
        />
      )}

      {/* Edit dialog */}
      {editingPlan && (
        <EntityFormDialog
          open={!!editingPlan}
          onOpenChange={(v) => !v && setEditingPlan(null)}
          title={`Modifier — ${editingPlan.numero_ordre}`}
          fields={editFormFields}
          initialData={editingPlan}
          onSave={handleSave}
          submitLabel="Enregistrer"
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette planification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La planification de{" "}
              <strong>{deleteTarget?.numero_ordre}</strong> sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conflict dialog */}
      <ConflictDialog conflicts={conflicts} onClose={() => setConflicts(null)} />

    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value || "—"}</p>
    </div>
  );
}
