import { useState, useEffect } from "react";
import { entities, users as userApi } from "@/api";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Power,
  Mail,
  ShieldCheck,
  Users as UsersIcon,
  UserCheck,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import KPICard from "@/components/erp/KPICard";
import DataTable from "@/components/erp/DataTable";
import EntityFormDialog from "@/components/erp/EntityFormDialog";
import { toast } from "@/components/ui/use-toast";
import PermissionsDialog from "@/components/erp/PermissionsDialog";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "Utilisateur" },
];
const STATUT_OPTIONS = [
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
];

const editFormFields = [
  { key: "first_name", label: "Prénom", type: "text", placeholder: "Prénom" },
  { key: "last_name", label: "Nom", type: "text", placeholder: "Nom" },
  { key: "email", label: "Email", type: "email" },
  { key: "telephone", label: "Téléphone", type: "text", placeholder: "+212..." },
  { key: "departement", label: "Département", type: "text", placeholder: "ex: Logistique" },
  {
    key: "role",
    label: "Rôle",
    type: "select",
    options: ROLE_OPTIONS,
  },
  {
    key: "statut",
    label: "Statut",
    type: "select",
    options: STATUT_OPTIONS,
  },
];

function RoleBadge({ role }) {
  const map = {
    admin: "bg-red-50 text-red-700 border-red-200",
    manager: "bg-blue-50 text-blue-700 border-blue-200",
    user: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const labels = { admin: "Administrateur", manager: "Manager", user: "Utilisateur" };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${map[role] || map.user}`}>
      {labels[role] || role}
    </span>
  );
}

function displayName(user) {
  if (!user) return "—";
  if (user.full_name) return user.full_name;
  if (user.first_name || user.last_name) return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return user.email?.split("@")[0] || "—";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    first_name: "", last_name: "", email: "", telephone: "",
    role: "user", statut: "actif",
  });
  const [invitePassword, setInvitePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [permUser, setPermUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetPwTarget, setResetPwTarget] = useState(null);
  const [resetPw, setResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await entities.User.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Users] loadUsers error:", err);
      setLoadError(err.message || "Erreur de chargement");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditDialog(true);
  };

  const handleSave = async (data) => {
    // Split full_name from first_name + last_name
    const { first_name, last_name, ...rest } = data;
    const full_name = [first_name, last_name].filter(Boolean).join(" ") || undefined;
    await entities.User.update(editingUser.id, { ...rest, full_name });
    toast({ title: "Utilisateur modifié" });
    setEditDialog(false);
    loadUsers();
  };

  const toggleStatut = async (user) => {
    const newStatut = user.statut === "actif" ? "inactif" : "actif";
    await entities.User.update(user.id, { statut: newStatut });
    toast({ title: `Compte ${newStatut === "actif" ? "activé" : "désactivé"}` });
    loadUsers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Prevent deleting the last admin
    const activeAdmins = users.filter((u) => u.role === "admin" && u.statut !== "inactif" && u.id !== deleteTarget.id);
    if (deleteTarget.role === "admin" && activeAdmins.length === 0) {
      toast({
        title: "Suppression impossible",
        description: "Il doit toujours rester au moins un administrateur actif.",
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await entities.User.delete(deleteTarget.id);
      toast({ title: "Utilisateur supprimé" });
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast({ title: "Erreur", description: err.message || "Suppression impossible.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteData.email || !invitePassword) {
      toast({ title: "Champs requis", description: "Email et mot de passe obligatoires.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const full_name = [inviteData.first_name, inviteData.last_name].filter(Boolean).join(" ") || inviteData.email.split("@")[0];
      await userApi.createUserWithPassword({
        ...inviteData,
        full_name,
        password: invitePassword,
      });
      toast({ title: "Compte créé", description: `${inviteData.email} a été créé avec succès.` });
      setInviteDialog(false);
      setInviteData({ first_name: "", last_name: "", email: "", telephone: "", role: "user", statut: "actif" });
      setInvitePassword("");
      loadUsers();
    } catch (err) {
      toast({ title: "Erreur", description: err.message || "Création impossible.", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwTarget || !resetPw) return;
    setResettingPw(true);
    try {
      const result = await userApi.resetUserPassword(resetPwTarget.id, resetPw, resetPwTarget.email);
      toast({
        title: result.mode === "email" ? "Email de réinitialisation envoyé" : "Mot de passe réinitialisé",
        description: result.mode === "email"
          ? `Un lien sécurisé a été envoyé à ${resetPwTarget.email}.`
          : `Un nouveau mot de passe a été défini pour ${resetPwTarget.email}.`,
      });
      setResetPwTarget(null);
      setResetPw("");
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setResettingPw(false);
    }
  };

  const activeAdmins = (Array.isArray(users) ? users : []).filter((u) => u && u.role === "admin" && u.statut !== "inactif").length;

  const filteredUsers = users.filter((u) => {
    if (search) {
      const term = search.toLowerCase();
      const name = displayName(u).toLowerCase();
      if (!name.includes(term) && !u.email?.toLowerCase().includes(term)) return false;
    }
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterStatut !== "all" && u.statut !== filterStatut) return false;
    return true;
  });

  const columns = [
    {
      key: "name",
      label: "Nom",
      className: "font-medium",
      render: (_, item) => displayName(item),
    },
    { key: "email", label: "Email" },
    { key: "departement", label: "Département" },
    { key: "telephone", label: "Téléphone" },
    {
      key: "role",
      label: "Rôle",
      render: (val) => <RoleBadge role={val} />,
    },
    {
      key: "statut",
      label: "Statut",
      render: (val) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${val === "inactif" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {val === "inactif" ? "Inactif" : "Actif"}
        </span>
      ),
    },
    {
      key: "last_login",
      label: "Dernière connexion",
      render: (val) => val ? new Date(val).toLocaleDateString("fr-FR") : "Jamais",
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      cellClassName: "text-right",
      render: (_, item) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)} title="Modifier">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPermUser(item)} title="Permissions">
            <KeyRound className="w-4 h-4" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => { setResetPwTarget(item); setResetPw(""); }}
            title="Réinitialiser mot de passe"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-8 w-8"
            onClick={() => toggleStatut(item)}
            title={item.statut === "actif" ? "Désactiver" : "Activer"}
          >
            <Power className={`w-4 h-4 ${item.statut === "inactif" ? "text-red-600" : "text-green-600"}`} />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50"
            onClick={() => setDeleteTarget(item)}
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const updateInvite = (key, val) => setInviteData((p) => ({ ...p, [key]: val }));

  return (
    <ErrorBoundary onReset={loadUsers}>
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Comptes, rôles, accès et sécurité"
        action={
          <Button onClick={() => setInviteDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Ajouter un utilisateur
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total utilisateurs" value={users.length} icon={UsersIcon} color="primary" />
        <KPICard title="Utilisateurs actifs" value={users.filter((u) => u && u.statut !== "inactif").length} icon={UserCheck} color="success" />
        <KPICard title="Administrateurs" value={activeAdmins} icon={ShieldCheck} color="destructive" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="🔍 Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-[240px]"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">Utilisateur</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadUsers} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredUsers} emptyMessage="Aucun utilisateur trouvé." />
      )}

      {/* Edit dialog */}
      <EntityFormDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        title={`Modifier — ${displayName(editingUser)}`}
        fields={editFormFields}
        initialData={editingUser}
        onSave={handleSave}
        submitLabel="Enregistrer"
      />

      {/* Invite / Create user dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Créer un compte utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-first">Prénom</Label>
                <Input id="inv-first" placeholder="Prénom" value={inviteData.first_name}
                  onChange={(e) => updateInvite("first_name", e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-last">Nom</Label>
                <Input id="inv-last" placeholder="Nom" value={inviteData.last_name}
                  onChange={(e) => updateInvite("last_name", e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="inv-email" type="email" placeholder="utilisateur@exemple.com"
                  value={inviteData.email} onChange={(e) => updateInvite("email", e.target.value)}
                  className="pl-10 h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-tel">Téléphone</Label>
                <Input id="inv-tel" placeholder="+212..." value={inviteData.telephone}
                  onChange={(e) => updateInvite("telephone", e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-dept">Département</Label>
                <Input id="inv-dept" placeholder="Logistique" value={inviteData.departement || ""}
                  onChange={(e) => updateInvite("departement", e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select value={inviteData.role} onValueChange={(v) => updateInvite("role", v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={inviteData.statut} onValueChange={(v) => updateInvite("statut", v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-pw">Mot de passe temporaire *</Label>
              <div className="relative">
                <Input
                  id="inv-pw"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="pl-10 pr-10 h-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Button
                  type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Annuler</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteData.email || !invitePassword} className="gap-2">
              {inviting ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : <><UserPlus className="w-4 h-4" />Créer le compte</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetPwTarget} onOpenChange={(v) => !v && setResetPwTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Définir un nouveau mot de passe pour <strong>{resetPwTarget?.email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-pw">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="reset-pw"
                  type={showResetPw ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  className="pr-10 h-10"
                />
                <Button type="button" variant="ghost" size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowResetPw((v) => !v)}>
                  {showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setResetPwTarget(null)}>Annuler</Button>
            <Button onClick={handleResetPassword} disabled={resettingPw || !resetPw} className="gap-2">
              {resettingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {resettingPw ? "Réinitialisation..." : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PermissionsDialog
        open={!!permUser}
        onOpenChange={(open) => !open && setPermUser(null)}
        user={permUser}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur <strong>{displayName(deleteTarget)}</strong> (
              {deleteTarget?.email}) ne pourra plus se connecter.
              {deleteTarget?.role === "admin" && activeAdmins <= 1 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ Impossible : il doit toujours rester au moins un administrateur actif.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (deleteTarget?.role === "admin" && activeAdmins <= 1)}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Suppression...</> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ErrorBoundary>
  );
}
