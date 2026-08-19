import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function EntityFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialData,
  onSave,
}) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initial = {};
      fields.forEach((f) => {
        let val = initialData?.[f.key] ?? f.default ?? "";
        // Convert ISO datetime strings to datetime-local format
        if ((f.type === "datetime-local") && val && typeof val === "string") {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              const pad = (n) => String(n).padStart(2, "0");
              val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            }
          } catch {}
        }
        initial[f.key] =
          f.type === "boolean" || f.type === "switch"
            ? !!val
            : f.type === "number"
            ? 0
            : val;
      });
      setFormData(initial);
      setSaving(false);
    }
  }, [open, initialData, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(formData);
    } catch {
      // error handled by parent (toast)
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.fullWidth ? "sm:col-span-2" : ""}
              >
                <Label
                  htmlFor={field.key}
                  className="text-sm font-medium mb-1.5 block"
                >
                  {field.label}
                  {field.required !== false && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={String(formData[field.key] ?? "")}
                    onValueChange={(v) => updateField(field.key, v)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={String(opt.value)}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "boolean" || field.type === "switch" ? (
                  <div className="flex items-center h-10">
                    <Switch
                      id={field.key}
                      checked={!!formData[field.key]}
                      onCheckedChange={(v) => updateField(field.key, v)}
                    />
                  </div>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="min-h-[80px]"
                    placeholder={field.placeholder || ""}
                    disabled={saving}
                    required={field.required !== false}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "date"
                        ? "date"
                        : field.type === "time"
                        ? "time"
                        : field.type === "datetime-local"
                        ? "datetime-local"
                        : field.type === "email"
                        ? "email"
                        : field.type === "tel"
                        ? "tel"
                        : "text"
                    }
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      updateField(
                        field.key,
                        field.type === "number"
                          ? (e.target.value === "" ? 0 : Number(e.target.value))
                          : e.target.value
                      )
                    }
                    step={field.step || "any"}
                    className="h-10"
                    placeholder={field.placeholder || ""}
                    disabled={saving}
                    required={field.required !== false}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}