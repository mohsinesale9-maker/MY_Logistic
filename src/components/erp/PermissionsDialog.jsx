import { useState, useEffect } from "react";
import { entities } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
} from "@/lib/permissions-config";
import { clearPermissionsCache } from "@/hooks/usePermissions";

export default function PermissionsDialog({ open, onOpenChange, user }) {
  const { toast } = useToast();
  const [perms, setPerms] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadPermissions();
    }
  }, [open, user]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const all = await entities.UserPermission.list();
      const userPerms = (all || []).filter((p) => p.user_email === user.email);
      const map = {};
      userPerms.forEach((p) => {
        map[p.module] = p;
      });
      PERMISSION_MODULES.forEach((m) => {
        if (!map[m.id]) {
          map[m.id] = {
            module: m.id,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
          };
        }
      });
      setPerms(map);
    } catch (err) {
      // Initialize with defaults
      const map = {};
      PERMISSION_MODULES.forEach((m) => {
        map[m.id] = {
          module: m.id,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        };
      });
      setPerms(map);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleId, field) => {
    setPerms((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: !prev[moduleId][field],
      },
    }));
  };

  const handleToggleAll = (moduleId, value) => {
    setPerms((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        can_view: value,
        can_create: value,
        can_edit: value,
        can_delete: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const moduleId of Object.keys(perms)) {
        const perm = perms[moduleId];
        if (perm.id) {
          await entities.UserPermission.update(perm.id, {
            can_view: perm.can_view,
            can_create: perm.can_create,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
          });
        } else {
          await entities.UserPermission.create({
            user_email: user.email,
            user_name: user.full_name || user.email,
            module: moduleId,
            can_view: perm.can_view,
            can_create: perm.can_create,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
          });
        }
      }
      clearPermissionsCache();
      toast({
        title: "Permissions mises à jour",
        description: `Les permissions de ${user.full_name || user.email} ont été enregistrées.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de l'enregistrement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Permissions — {user?.full_name || user?.email}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
              <div>Module</div>
              {PERMISSION_ACTIONS.map((a) => (
                <div key={a.key} className="text-center">
                  {a.label}
                </div>
              ))}
            </div>
            {PERMISSION_MODULES.map((mod) => {
              const perm = perms[mod.id];
              if (!perm) return null;
              const allOn =
                perm.can_view && perm.can_create && perm.can_edit && perm.can_delete;
              return (
                <div
                  key={mod.id}
                  className="grid grid-cols-5 gap-2 items-center px-3 py-2.5 rounded-lg border bg-card hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{mod.label}</span>
                    <button
                      onClick={() => handleToggleAll(mod.id, !allOn)}
                      className="text-[10px] text-primary hover:underline flex-shrink-0"
                    >
                      {allOn ? "Tout retirer" : "Tout accorder"}
                    </button>
                  </div>
                  {PERMISSION_ACTIONS.map((a) => (
                    <div key={a.key} className="flex justify-center">
                      <Switch
                        checked={!!perm[a.key]}
                        onCheckedChange={() => handleToggle(mod.id, a.key)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Enregistrement..." : "Enregistrer les permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}